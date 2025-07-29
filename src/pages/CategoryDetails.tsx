import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, ArrowLeft, Edit, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Category {
  id: string;
  name: string;
  description?: string;
}

interface Program {
  id: string;
  name: string;
  description?: string;
  conditions?: string;
  sub_project_id?: string;
  sub_projects?: {
    name: string;
  };
}

interface SubProject {
  id: string;
  name: string;
}

const CategoryDetails = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [category, setCategory] = useState<Category | null>(null);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [subProjects, setSubProjects] = useState<SubProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategoryData();
  }, [categoryId]);

  const fetchCategoryData = async () => {
    if (!categoryId) return;

    try {
      // Fetch category details
      const { data: categoryData, error: categoryError } = await supabase
        .from('employment_categories')
        .select('*')
        .eq('id', categoryId)
        .single();

      if (categoryError) throw categoryError;
      setCategory(categoryData);

      // Fetch programs for this category
      const { data: programsData, error: programsError } = await supabase
        .from('programs')
        .select(`
          *,
          sub_projects (
            name
          )
        `)
        .eq('category_id', categoryId);

      if (programsError) throw programsError;
      setPrograms(programsData || []);

      // Fetch sub-projects for this category
      const { data: subProjectsData, error: subProjectsError } = await supabase
        .from('sub_projects')
        .select('*')
        .eq('category_id', categoryId);

      if (subProjectsError) throw subProjectsError;
      setSubProjects(subProjectsData || []);

    } catch (error) {
      console.error('Error fetching category data:', error);
      toast({
        title: "Error",
        description: "Failed to load category details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteProgram = async (programId: string) => {
    try {
      const { error } = await supabase
        .from('programs')
        .delete()
        .eq('id', programId);

      if (error) throw error;

      setPrograms(programs.filter(p => p.id !== programId));
      toast({
        title: "Success",
        description: "Program deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting program:', error);
      toast({
        title: "Error",
        description: "Failed to delete program",
        variant: "destructive",
      });
    }
  };

  const deleteSubProject = async (subProjectId: string) => {
    try {
      const { error } = await supabase
        .from('sub_projects')
        .delete()
        .eq('id', subProjectId);

      if (error) throw error;

      setSubProjects(subProjects.filter(sp => sp.id !== subProjectId));
      toast({
        title: "Success",
        description: "Sub-project deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting sub-project:', error);
      toast({
        title: "Error",
        description: "Failed to delete sub-project",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="container mx-auto p-6">Loading...</div>;
  }

  if (!category) {
    return <div className="container mx-auto p-6">Category not found</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={() => navigate('/')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{category.name}</h1>
          {category.description && (
            <p className="text-muted-foreground mt-1">{category.description}</p>
          )}
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <Button onClick={() => navigate(`/add-program?category=${category.id}`)}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Program
        </Button>
        <Button variant="outline" onClick={() => navigate(`/add-sub-project?category=${category.id}`)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Sub-project
        </Button>
      </div>

      <Tabs defaultValue="programs" className="w-full">
        <TabsList>
          <TabsTrigger value="programs">Programs ({programs.length})</TabsTrigger>
          <TabsTrigger value="subprojects">Sub-projects ({subProjects.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="programs" className="space-y-4">
          {programs.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">No programs found</p>
              </CardContent>
            </Card>
          ) : (
            programs.map((program) => (
              <Card key={program.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{program.name}</CardTitle>
                      {program.description && (
                        <CardDescription className="mt-1">{program.description}</CardDescription>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/add-program?category=${category.id}&edit=${program.id}`)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteProgram(program.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {program.conditions && (
                    <div className="mt-2">
                      <Badge variant="outline">Conditions: {program.conditions}</Badge>
                    </div>
                  )}
                  {program.sub_projects && (
                    <div className="mt-2">
                      <Badge variant="secondary">Sub-project: {program.sub_projects.name}</Badge>
                    </div>
                  )}
                </CardHeader>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="subprojects" className="space-y-4">
          {subProjects.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">No sub-projects found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subProjects.map((subProject) => (
                <Card key={subProject.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{subProject.name}</CardTitle>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/add-sub-project?category=${category.id}&edit=${subProject.id}`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteSubProject(subProject.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CategoryDetails;