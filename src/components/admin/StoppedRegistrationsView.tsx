import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Users, Download, Search, FileText, RotateCcw } from "lucide-react";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface StoppedRegistration {
  id: string;
  mobile_number: string;
  registration_date: string;
  status: string;
  experience?: string;
  skills?: string;
  registered_clients: {
    name: string;
    customer_id: string;
    district: string;
    agent_pro: string;
    panchayath?: string;
  } | null;
  employment_categories: {
    name: string;
    description: string;
  } | null;
}

const StoppedRegistrationsView = () => {
  const [stoppedRegistrations, setStoppedRegistrations] = useState<StoppedRegistration[]>([]);
  const [filteredRegistrations, setFilteredRegistrations] = useState<StoppedRegistration[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterPanchayath, setFilterPanchayath] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [categories, setCategories] = useState<any[]>([]);
  const [panchayaths, setPanchayaths] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchStoppedRegistrations();
    fetchCategories();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [stoppedRegistrations, filterCategory, filterPanchayath, searchTerm]);

  const fetchStoppedRegistrations = async () => {
    setLoading(true);
    try {
      const { data: registrations, error } = await supabase
        .from("employment_registrations")
        .select(`
          *,
          registered_clients (
            name,
            customer_id,
            district,
            agent_pro,
            panchayath
          ),
          employment_categories (
            name,
            description
          )
        `)
        .in('status', ['stopped', 'stop_requested'])
        .order("updated_at", { ascending: false });

      if (error) throw error;

      setStoppedRegistrations(registrations as StoppedRegistration[]);

      // Extract unique panchayaths
      const uniquePanchayaths = [...new Set(
        registrations
          .map(reg => reg.registered_clients?.panchayath)
          .filter(Boolean)
      )] as string[];
      setPanchayaths(uniquePanchayaths);
    } catch (error) {
      console.error("Error fetching stopped registrations:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch stopped registrations"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("employment_categories")
        .select("*")
        .eq("is_active", true);

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const applyFilters = () => {
    let filtered = stoppedRegistrations;

    if (filterCategory !== "all") {
      filtered = filtered.filter(reg => reg.employment_categories?.name === filterCategory);
    }

    if (filterPanchayath !== "all") {
      filtered = filtered.filter(reg => reg.registered_clients?.panchayath === filterPanchayath);
    }

    if (searchTerm) {
      filtered = filtered.filter(reg => 
        reg.registered_clients?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.registered_clients?.customer_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.mobile_number.includes(searchTerm) ||
        reg.employment_categories?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredRegistrations(filtered);
  };

  const restoreRegistration = async (id: string) => {
    try {
      const { error } = await supabase
        .from("employment_registrations")
        .update({ status: "pending" })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Registration restored to pending status"
      });

      fetchStoppedRegistrations();
    } catch (error) {
      console.error("Error restoring registration:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to restore registration"
      });
    }
  };

  const deleteRegistration = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this registration? This action cannot be undone.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("employment_registrations")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Registration permanently deleted"
      });

      fetchStoppedRegistrations();
    } catch (error) {
      console.error("Error deleting registration:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete registration"
      });
    }
  };

  const exportToExcel = () => {
    const exportData = filteredRegistrations.map(reg => ({
      'Name': reg.registered_clients?.name || '',
      'Customer ID': reg.registered_clients?.customer_id || '',
      'Mobile Number': reg.mobile_number || '',
      'Category': reg.employment_categories?.name || '',
      'Experience': reg.experience || 'Not provided',
      'Skills': reg.skills || 'Not provided',
      'District': reg.registered_clients?.district || '',
      'Panchayath': reg.registered_clients?.panchayath || '',
      'Agent': reg.registered_clients?.agent_pro || '',
      'Registration Date': new Date(reg.registration_date).toLocaleDateString(),
      'Status': reg.status || '',
      'Stopped Date': new Date().toLocaleDateString()
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Stopped_Registrations");
    XLSX.writeFile(wb, `stopped_registrations_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Stopped Employment Registrations Report', 14, 22);
    
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
    doc.text(`Total Records: ${filteredRegistrations.length}`, 14, 35);
    
    const tableData = filteredRegistrations.map(reg => [
      reg.registered_clients?.name || '',
      reg.registered_clients?.customer_id || '',
      reg.mobile_number || '',
      reg.employment_categories?.name || '',
      reg.registered_clients?.district || '',
      reg.registered_clients?.panchayath || '',
      new Date(reg.registration_date).toLocaleDateString(),
      reg.status || ''
    ]);

    autoTable(doc, {
      head: [['Name', 'Customer ID', 'Mobile', 'Category', 'District', 'Panchayath', 'Registration Date', 'Status']],
      body: tableData,
      startY: 45,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [220, 53, 69] },
    });
    
    doc.save(`stopped_registrations_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "stopped":
        return "bg-red-500";
      case "stop_requested":
        return "bg-orange-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Card */}
      <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
        <Card>
          <CardContent className="flex items-center p-6">
            <Users className="h-8 w-8 text-red-500 mr-3" />
            <div>
              <p className="text-2xl font-bold">{stoppedRegistrations.length}</p>
              <p className="text-xs text-muted-foreground">Total Stopped Registrations</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Stopped Employment Registrations</CardTitle>
              <CardDescription>
                View and manage all stopped employment registration applications
              </CardDescription>
            </div>
            <div className="flex gap-4 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search stopped registrations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={filterPanchayath} onValueChange={setFilterPanchayath}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by panchayath" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Panchayaths</SelectItem>
                  {panchayaths.map((panchayath) => (
                    <SelectItem key={panchayath} value={panchayath}>
                      {panchayath}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button onClick={exportToExcel} className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export Excel
              </Button>
              <Button onClick={exportToPDF} variant="outline" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Export PDF
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8">Loading stopped registrations...</p>
          ) : filteredRegistrations.length > 0 ? (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Customer ID</TableHead>
                    <TableHead>Mobile</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Experience</TableHead>
                    <TableHead>Skills</TableHead>
                    <TableHead>District</TableHead>
                    <TableHead>Panchayath</TableHead>
                    <TableHead>Agent</TableHead>
                    <TableHead>Registration Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRegistrations.map((registration) => (
                    <TableRow key={registration.id}>
                      <TableCell className="font-medium">
                        {registration.registered_clients?.name}
                      </TableCell>
                      <TableCell>{registration.registered_clients?.customer_id}</TableCell>
                      <TableCell>{registration.mobile_number}</TableCell>
                      <TableCell>{registration.employment_categories?.name}</TableCell>
                      <TableCell>{registration.experience || 'Not provided'}</TableCell>
                      <TableCell>{registration.skills || 'Not provided'}</TableCell>
                      <TableCell>{registration.registered_clients?.district}</TableCell>
                      <TableCell>{registration.registered_clients?.panchayath}</TableCell>
                      <TableCell>{registration.registered_clients?.agent_pro}</TableCell>
                      <TableCell>
                        {new Date(registration.registration_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(registration.status)} text-white`}>
                          {registration.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => restoreRegistration(registration.id)}
                            className="flex items-center gap-1"
                          >
                            <RotateCcw className="h-3 w-3" />
                            Restore
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteRegistration(registration.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No stopped registrations found.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StoppedRegistrationsView;