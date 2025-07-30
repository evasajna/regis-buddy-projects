import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Category {
  id: string;
  name: string;
}

interface SubProjectForm {
  name: string;
  categoryId: string;
}

const AddSubProject = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const categoryParam = searchParams.get('category');
  const editId = searchParams.get('edit');
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<SubProjectForm>({
    name: '',
    categoryId: categoryParam || '',
  });

  useEffect(() => {
    fetchCategories();
    if (editId) {
      fetchSubProjectData();
    }
  }, [editId]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('employment_categories')
        .select('id, name')
        .eq('is_active', true);

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: "Error",
        description: "Failed to load categories",
        variant: "destructive",
      });
    }
  };

  const fetchSubProjectData = async () => {
    if (!editId) return;

    try {
      const { data, error } = await supabase
        .from('sub_projects')
        .select('*')
        .eq('id', editId)
        .single();

      if (error) throw error;

      setFormData({
        name: data.name || '',
        categoryId: data.category_id || '',
      });
    } catch (error) {
      console.error('Error fetching sub-project data:', error);
      toast({
        title: "Error",
        description: "Failed to load sub-project data",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const subProjectData = {
        name: formData.name,
        category_id: formData.categoryId,
      };

      if (editId) {
        const { error } = await supabase
          .from('sub_projects')
          .update(subProjectData)
          .eq('id', editId);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Sub-project updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('sub_projects')
          .insert([subProjectData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Sub-project created successfully",
        });
      }

      navigate(formData.categoryId ? `/category/${formData.categoryId}` : '/');
    } catch (error) {
      console.error('Error saving sub-project:', error);
      toast({
        title: "Error",
        description: `Failed to ${editId ? 'update' : 'create'} sub-project`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof SubProjectForm, value: string) => {
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
          {editId ? 'Edit Sub-project' : 'Add New Sub-project'}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sub-project Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Sub-project Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
                placeholder="Enter sub-project name"
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

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 pt-4">
              <Button type="submit" disabled={loading} className="flex-1 text-sm sm:text-base">
                {loading ? 'Saving...' : editId ? 'Update Sub-project' : 'Create Sub-project'}
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

export default AddSubProject;