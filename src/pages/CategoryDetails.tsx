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
        .select('*')
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
    <div className="container mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-6">
        <Button variant="outline" onClick={() => navigate('/')} size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold">{category.name}</h1>
          {category.description && (
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">{category.description}</p>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-6">
        <Button onClick={() => navigate(`/add-program?category=${category.id}`)} className="text-sm sm:text-base">
          <Plus className="h-4 w-4 mr-2" />
          Add New Program
        </Button>
        <Button variant="outline" onClick={() => navigate(`/add-sub-project?category=${category.id}`)} className="text-sm sm:text-base">
          <Plus className="h-4 w-4 mr-2" />
          Add Sub-Project
        </Button>
      </div>

      <Tabs defaultValue="programs" className="w-full">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="programs" className="text-xs sm:text-sm">Programs ({programs.length})</TabsTrigger>
          <TabsTrigger value="subprojects" className="text-xs sm:text-sm">Sub-projects ({subProjects.length})</TabsTrigger>
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
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex-1">
                      <CardTitle className="text-base sm:text-lg">{program.name}</CardTitle>
                      {program.description && (
                        <CardDescription className="mt-1 text-sm">{program.description}</CardDescription>
                      )}
                    </div>
                    <div className="flex gap-2 self-end sm:self-center">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {subProjects.map((subProject) => (
                <Card key={subProject.id}>
                  <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <CardTitle className="text-sm sm:text-base flex-1">{subProject.name}</CardTitle>
                      <div className="flex gap-2 self-end sm:self-center">
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