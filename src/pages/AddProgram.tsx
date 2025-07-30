import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Category {
  id: string;
  name: string;
}

interface SubProject {
  id: string;
  name: string;
}

interface ProgramForm {
  name: string;
  description: string;
  conditions: string;
  categoryId: string;
  subProjectId: string;
}

const AddProgram = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const categoryParam = searchParams.get('category');
  const editId = searchParams.get('edit');
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [subProjects, setSubProjects] = useState<SubProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ProgramForm>({
    name: '',
    description: '',
    conditions: '',
    categoryId: categoryParam || '',
    subProjectId: '',
  });

  useEffect(() => {
    fetchData();
    if (editId) {
      fetchProgramData();
    }
  }, [editId]);

  useEffect(() => {
    if (formData.categoryId) {
      fetchSubProjects(formData.categoryId);
    }
  }, [formData.categoryId]);

  const fetchData = async () => {
    try {
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('employment_categories')
        .select('id, name')
        .eq('is_active', true);

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    }
  };

  const fetchSubProjects = async (categoryId: string) => {
    try {
      const { data: subProjectsData, error } = await supabase
        .from('sub_projects')
        .select('id, name')
        .eq('category_id', categoryId);

      if (error) throw error;
      setSubProjects(subProjectsData || []);
    } catch (error) {
      console.error('Error fetching sub-projects:', error);
      setSubProjects([]);
    }
  };

  const fetchProgramData = async () => {
    if (!editId) return;

    try {
      const { data, error } = await supabase
        .from('programs')
        .select('*')
        .eq('id', editId)
        .single();

      if (error) throw error;

      setFormData({
        name: data.name || '',
        description: data.description || '',
        conditions: data.conditions || '',
        categoryId: data.category_id || '',
        subProjectId: data.sub_project_id || '',
      });
    } catch (error) {
      console.error('Error fetching program data:', error);
      toast({
        title: "Error",
        description: "Failed to load program data",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const programData = {
        name: formData.name,
        description: formData.description,
        conditions: formData.conditions,
        category_id: formData.categoryId,
        sub_project_id: formData.subProjectId === "none" ? null : formData.subProjectId || null,
      };

      if (editId) {
        const { error } = await supabase
          .from('programs')
          .update(programData)
          .eq('id', editId);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Program updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('programs')
          .insert([programData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Program created successfully",
        });
      }

      navigate(formData.categoryId ? `/category/${formData.categoryId}` : '/');
    } catch (error) {
      console.error('Error saving program:', error);
      toast({
        title: "Error",
        description: `Failed to ${editId ? 'update' : 'create'} program`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ProgramForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-6">
        <Button variant="outline" onClick={() => navigate(-1)} size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl sm:text-3xl font-bold">
          {editId ? 'Edit Program' : 'Add New Program'}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Program Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Program Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="conditions">Conditions</Label>
              <Textarea
                id="conditions"
                value={formData.conditions}
                onChange={(e) => handleInputChange('conditions', e.target.value)}
                rows={3}
                placeholder="Enter eligibility conditions for this program"
              />
            </div>

            <div>
              <Label htmlFor="category">Employment Category *</Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) => handleInputChange('categoryId', value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employment category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="subProject">Sub-project (Optional)</Label>
              <Select
                value={formData.subProjectId}
                onValueChange={(value) => handleInputChange('subProjectId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select sub-project (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {subProjects.map((subProject) => (
                    <SelectItem key={subProject.id} value={subProject.id}>
                      {subProject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 pt-4">
              <Button type="submit" disabled={loading} className="flex-1 text-sm sm:text-base">
                {loading ? 'Saving...' : editId ? 'Update Program' : 'Create Program'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate(-1)} className="text-sm sm:text-base">
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddProgram;