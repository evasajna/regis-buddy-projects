import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

  useEffect(() => {
    fetchPrograms();
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