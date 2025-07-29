import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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

      <div className="space-y-8">
        {Object.entries(groupedPrograms).map(([categoryName, categoryPrograms]) => (
          <div key={categoryName}>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-xl font-semibold">{categoryName}</h2>
              <Badge variant="secondary">{categoryPrograms.length} programs</Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryPrograms.map((program) => (
                <Card key={program.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{program.name}</CardTitle>
                    {program.description && (
                      <CardDescription className="line-clamp-2">
                        {program.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    {program.conditions && (
                      <div className="mb-3">
                        <p className="text-sm font-medium mb-1">Conditions:</p>
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {program.conditions}
                        </p>
                      </div>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/category/${program.category_id}`)}
                      className="w-full"
                    >
                      View Category
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

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