import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Search, BarChart3, TableIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AdminPanel from "@/components/AdminPanel";

interface Program {
  id: string;
  name: string;
  description?: string;
  conditions?: string;
  category_id: string;
  employment_categories: {
    name: string;
  };
}

const AllProgramsList = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [programs, setPrograms] = useState<Program[]>([]);
  const [filteredPrograms, setFilteredPrograms] = useState<Program[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [totalApplications, setTotalApplications] = useState(0);

  useEffect(() => {
    fetchPrograms();
    fetchTotalApplications();
  }, []);

  useEffect(() => {
    filterPrograms();
  }, [searchTerm, programs]);

  const fetchPrograms = async () => {
    try {
      const { data, error } = await supabase
        .from('programs')
        .select(`
          *,
          employment_categories (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPrograms(data || []);
    } catch (error) {
      console.error('Error fetching programs:', error);
      toast({
        title: "Error",
        description: "Failed to load programs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTotalApplications = async () => {
    try {
      const { count, error } = await supabase
        .from('employment_registrations')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      setTotalApplications(count || 0);
    } catch (error) {
      console.error('Error fetching total applications:', error);
    }
  };

  const filterPrograms = () => {
    if (!searchTerm) {
      setFilteredPrograms(programs);
      return;
    }

    const filtered = programs.filter(program =>
      program.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      program.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      program.employment_categories?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredPrograms(filtered);
  };

  const groupedPrograms = filteredPrograms.reduce((acc, program) => {
    const categoryName = program.employment_categories?.name || 'Unknown Category';
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(program);
    return acc;
  }, {} as Record<string, Program[]>);


  if (loading) {
    return <div className="container mx-auto p-6">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={() => navigate('/')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">All Programs</h1>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search programs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs defaultValue="applications" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="applications">Total Applications</TabsTrigger>
          <TabsTrigger value="admin">Admin Panel</TabsTrigger>
          <TabsTrigger value="table">
            <TableIcon className="h-4 w-4 mr-2" />
            Table
          </TabsTrigger>
        </TabsList>

        <TabsContent value="applications" className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-2xl">Total Applications Count</CardTitle>
              <CardDescription className="text-center">
                Total number of employment registrations received
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-6xl font-bold text-primary mb-4">{totalApplications}</div>
                <p className="text-lg text-muted-foreground">Total Applications</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="admin" className="space-y-6">
          <AdminPanel />
        </TabsContent>

        <TabsContent value="table">
          <Card>
            <CardHeader>
              <CardTitle>Programs Table</CardTitle>
              <CardDescription>All programs with detailed information</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Program Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Conditions</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPrograms.map((program) => (
                    <TableRow key={program.id}>
                      <TableCell className="font-medium">{program.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {program.employment_categories?.name || 'Unknown'}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate" title={program.description}>
                          {program.description || 'No description'}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate" title={program.conditions}>
                          {program.conditions || 'No conditions'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/category/${program.category_id}`)}
                        >
                          View Category
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {filteredPrograms.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {searchTerm ? 'No programs found matching your search.' : 'No programs available.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default AllProgramsList;