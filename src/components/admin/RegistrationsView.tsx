import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Users, Clock, CheckCircle, XCircle, Download, Search } from "lucide-react";
import * as XLSX from 'xlsx';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Registration {
  id: string;
  mobile_number: string;
  registration_date: string;
  status: string;
  panchayath?: string;
  programs?: {
    name: string;
    description?: string;
    conditions?: string;
  } | null;
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

const RegistrationsView = () => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [filteredRegistrations, setFilteredRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPanchayath, setFilterPanchayath] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [categories, setCategories] = useState<any[]>([]);
  const [panchayaths, setPanchayaths] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchRegistrations();
    fetchCategories();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [registrations, filterCategory, filterStatus, filterPanchayath, searchTerm]);

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
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
          ),
          programs (
            name,
            description,
            conditions
          )
        `)
        .order("registration_date", { ascending: false });

      if (error) throw error;
      setRegistrations((data as unknown as Registration[]) || []);
      
      // Extract unique panchayaths
      const uniquePanchayaths = [...new Set(
        (data || [])
          .map(reg => reg.registered_clients?.panchayath)
          .filter(Boolean)
      )] as string[];
      setPanchayaths(uniquePanchayaths);
    } catch (error) {
      console.error("Error fetching registrations:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch registrations"
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
    let filtered = registrations;

    if (filterCategory !== "all") {
      filtered = filtered.filter(reg => reg.employment_categories?.name === filterCategory);
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter(reg => reg.status === filterStatus);
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

  const exportToExcel = () => {
    const exportData = filteredRegistrations.map(reg => ({
      'Name': reg.registered_clients?.name || '',
      'Customer ID': reg.registered_clients?.customer_id || '',
      'Mobile Number': reg.mobile_number || '',
      'Category': reg.employment_categories?.name || '',
      'Program': reg.programs?.name || '',
      'Program Description': reg.programs?.description || '',
      'Program Conditions': reg.programs?.conditions || '',
      'District': reg.registered_clients?.district || '',
      'Panchayath': reg.registered_clients?.panchayath || '',
      'Agent': reg.registered_clients?.agent_pro || '',
      'Registration Date': new Date(reg.registration_date).toLocaleDateString(),
      'Status': reg.status || ''
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Registrations");
    XLSX.writeFile(wb, `employment_registrations_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const updateRegistrationStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("employment_registrations")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Registration status updated to ${newStatus}`
      });

      fetchRegistrations();
    } catch (error) {
      console.error("Error updating registration status:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update registration status"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-500";
      case "rejected":
        return "bg-red-500";
      case "pending":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4" />;
      case "rejected":
        return <XCircle className="h-4 w-4" />;
      case "pending":
        return <Clock className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusStats = () => {
    const total = registrations.length;
    const pending = registrations.filter(r => r.status === "pending").length;
    const approved = registrations.filter(r => r.status === "approved").length;
    const rejected = registrations.filter(r => r.status === "rejected").length;

    return { total, pending, approved, rejected };
  };

  const stats = getStatusStats();

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center p-6">
            <Users className="h-8 w-8 text-primary mr-3" />
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total Registrations</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <Clock className="h-8 w-8 text-yellow-500 mr-3" />
            <div>
              <p className="text-2xl font-bold">{stats.pending}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
            <div>
              <p className="text-2xl font-bold">{stats.approved}</p>
              <p className="text-xs text-muted-foreground">Approved</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <XCircle className="h-8 w-8 text-red-500 mr-3" />
            <div>
              <p className="text-2xl font-bold">{stats.rejected}</p>
              <p className="text-xs text-muted-foreground">Rejected</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Employment Registrations</CardTitle>
              <CardDescription>
                View and manage all employment registration applications
              </CardDescription>
            </div>
            <div className="flex gap-4 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search registrations..."
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
              
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={exportToExcel} className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8">Loading registrations...</p>
          ) : filteredRegistrations.length > 0 ? (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Customer ID</TableHead>
                    <TableHead>Mobile</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Program</TableHead>
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
                      <TableCell>
                        <div>
                          <div className="font-medium">{registration.programs?.name || 'N/A'}</div>
                          {registration.programs?.description && (
                            <div className="text-sm text-muted-foreground truncate max-w-xs" title={registration.programs.description}>
                              {registration.programs.description}
                            </div>
                          )}
                          {registration.programs?.conditions && (
                            <div className="text-xs text-muted-foreground mt-1">
                              <Badge variant="outline" className="text-xs">
                                Conditions: {registration.programs.conditions}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{registration.registered_clients?.district}</TableCell>
                      <TableCell>{registration.registered_clients?.panchayath || 'N/A'}</TableCell>
                      <TableCell>{registration.registered_clients?.agent_pro}</TableCell>
                      <TableCell>
                        {new Date(registration.registration_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(registration.status)} text-white`}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(registration.status)}
                            {registration.status}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {registration.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 border-green-600 hover:bg-green-50"
                                onClick={() => updateRegistrationStatus(registration.id, "approved")}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 border-red-600 hover:bg-red-50"
                                onClick={() => updateRegistrationStatus(registration.id, "rejected")}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                          {registration.status !== "pending" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateRegistrationStatus(registration.id, "pending")}
                            >
                              Reset
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No registrations found with the selected filters.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RegistrationsView;