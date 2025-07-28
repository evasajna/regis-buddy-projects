import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, FileSpreadsheet, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from 'xlsx';

const DataUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Fetch clients on component mount
  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("registered_clients")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error("Error fetching clients:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch client data"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv') && !file.name.endsWith('.xlsx')) {
      toast({
        variant: "destructive",
        title: "Invalid File",
        description: "Please upload a CSV or Excel file"
      });
      return;
    }

    setUploading(true);
    try {
      let data: any[][] = [];
      
      // Handle different file types
      if (file.name.endsWith('.csv')) {
        const text = await file.text();
        const lines = text.split('\n').filter(line => line.trim());
        data = lines.map(line => line.split(',').map(cell => cell.trim().replace(/"/g, '')));
      } else {
        // Handle Excel files (.xlsx, .xls)
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      }
      
      if (data.length < 2) {
        toast({
          variant: "destructive",
          title: "Invalid File",
          description: "File must contain header and data rows"
        });
        return;
      }

      const headers = data[0].map((h: any) => String(h || '').trim());
      const dataRows = data.slice(1);

      const clientsData = dataRows.map(row => {
        const client: any = {};
        
        headers.forEach((header, index) => {
          const value = String(row[index] || '').trim();
          switch (header.toLowerCase()) {
            case 'customer id':
              client.customer_id = value;
              break;
            case 'name':
              client.name = value;
              break;
            case 'mobile number':
              client.mobile_number = value;
              break;
            case 'address':
              client.address = value;
              break;
            case 'category':
              client.category = value;
              break;
            case 'panchayath':
              client.panchayath = value;
              break;
            case 'district':
              client.district = value;
              break;
            case 'ward':
              client.ward = value;
              break;
            case 'agent/pro':
              client.agent_pro = value;
              break;
            case 'preference':
              client.preference = value;
              break;
            case 'status':
              client.status = value;
              break;
          }
        });
        
        return client;
      }).filter(client => client.customer_id && client.name && client.mobile_number);

      if (clientsData.length === 0) {
        toast({
          variant: "destructive",
          title: "No Valid Data",
          description: "No valid client records found in the file"
        });
        return;
      }

      // Insert data in batches
      const { error } = await supabase
        .from("registered_clients")
        .upsert(clientsData, { 
          onConflict: 'customer_id',
          ignoreDuplicates: false 
        });

      if (error) throw error;

      toast({
        title: "Upload Successful",
        description: `Successfully uploaded ${clientsData.length} client records`
      });

      fetchClients();
    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: "Failed to upload client data"
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const deleteClient = async (id: string) => {
    try {
      const { error } = await supabase
        .from("registered_clients")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Deleted",
        description: "Client record deleted successfully"
      });

      fetchClients();
    } catch (error) {
      console.error("Error deleting client:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete client record"
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Data Upload
          </CardTitle>
          <CardDescription>
            Upload client registration data from Excel/CSV files
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="file">Excel/CSV File</Label>
            <Input
              ref={fileInputRef}
              id="file"
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileUpload}
              disabled={uploading}
            />
          </div>
          
          <div className="flex gap-4">
            <Button 
              onClick={() => fileInputRef.current?.click()} 
              disabled={uploading}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              {uploading ? "Uploading..." : "Upload File"}
            </Button>
            
            <Button 
              onClick={fetchClients} 
              variant="outline"
              disabled={loading}
            >
              {loading ? "Loading..." : "Refresh Data"}
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>Expected columns: Customer ID, Name, Mobile Number, Address, Category, Panchayath, District, Ward, Agent/PRO, Preference, Status</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Uploaded Client Data ({clients.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {clients.length > 0 ? (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Mobile</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>District</TableHead>
                    <TableHead>Agent/PRO</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell>{client.customer_id}</TableCell>
                      <TableCell>{client.name}</TableCell>
                      <TableCell>{client.mobile_number}</TableCell>
                      <TableCell>{client.category}</TableCell>
                      <TableCell>{client.district}</TableCell>
                      <TableCell>{client.agent_pro}</TableCell>
                      <TableCell>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteClient(client.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No client data uploaded yet. Upload an Excel/CSV file to get started.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DataUpload;