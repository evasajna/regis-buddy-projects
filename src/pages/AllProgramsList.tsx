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

  const getCategoryColor = (categoryName: string) => {
    const colors = [
      "bg-blue-100 text-blue-800 border-blue-200",
      "bg-green-100 text-green-800 border-green-200", 
      "bg-purple-100 text-purple-800 border-purple-200",
      "bg-orange-100 text-orange-800 border-orange-200",
      "bg-pink-100 text-pink-800 border-pink-200",
      "bg-indigo-100 text-indigo-800 border-indigo-200",
      "bg-yellow-100 text-yellow-800 border-yellow-200",
      "bg-red-100 text-red-800 border-red-200"
    ];
    
    // Create a simple hash function to consistently assign colors
    let hash = 0;
    for (let i = 0; i < categoryName.length; i++) {
      hash = categoryName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };



  if (loading) {
    return <div className="container mx-auto p-6">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-6">
        <Button variant="outline" onClick={() => navigate('/')} size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl sm:text-3xl font-bold">All Programs</h1>
      </div>

      <div className="mb-6">
        <div className="relative max-w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search programs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 text-sm sm:text-base"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Programs Table</CardTitle>
          <CardDescription className="text-sm sm:text-base">All programs with detailed information</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs sm:text-sm">Program Name</TableHead>
                <TableHead className="text-xs sm:text-sm">Category</TableHead>
                <TableHead className="text-xs sm:text-sm hidden md:table-cell">Description</TableHead>
                <TableHead className="text-xs sm:text-sm hidden lg:table-cell">Conditions</TableHead>
                <TableHead className="text-xs sm:text-sm">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPrograms.map((program, index) => (
                <TableRow key={program.id} className={index % 2 === 0 ? "bg-muted/20" : "bg-background"}>
                  <TableCell className="font-medium text-xs sm:text-sm">{program.name}</TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={`${getCategoryColor(program.employment_categories?.name || 'Unknown')} text-xs`}
                    >
                      {program.employment_categories?.name || 'Unknown'}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs hidden md:table-cell">
                    <div className="truncate text-xs sm:text-sm" title={program.description}>
                      {program.description || 'No description'}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs hidden lg:table-cell">
                    <div className="truncate text-xs sm:text-sm" title={program.conditions}>
                      {program.conditions || 'No conditions'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/category/${program.category_id}`)}
                      className="text-xs sm:text-sm"
                    >
                      View
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