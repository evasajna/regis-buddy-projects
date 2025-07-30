import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import DataUpload from "./admin/DataUpload";
import CategoriesManagement from "./admin/CategoriesManagement";
import RegistrationsView from "./admin/RegistrationsView";
import StopRequestsManagement from "./admin/StopRequestsManagement";

const ApplicationsOverview = () => {
  const [totalApplications, setTotalApplications] = useState(0);
  const [categoryBreakdown, setCategoryBreakdown] = useState<Array<{
    id: string;
    name: string;
    description: string;
    count: number;
    is_active: boolean;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchApplicationsData();
  }, []);

  const fetchApplicationsData = async () => {
    try {
      // Get total applications count
      const { count, error: countError } = await supabase
        .from('employment_registrations')
        .select('*', { count: 'exact', head: true });

      if (countError) throw countError;
      setTotalApplications(count || 0);

      // Get category breakdown
      const { data: categories, error: categoriesError } = await supabase
        .from('employment_categories')
        .select('*')
        .eq('is_active', true);

      if (categoriesError) throw categoriesError;

      // For each category, count registrations
      const categoryWithCounts = await Promise.all(
        (categories || []).map(async (category) => {
          const { count: categoryCount, error: categoryCountError } = await supabase
            .from('employment_registrations')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', category.id);

          if (categoryCountError) {
            console.error('Error fetching category count:', categoryCountError);
            return { ...category, count: 0 };
          }

          return { ...category, count: categoryCount || 0 };
        })
      );

      setCategoryBreakdown(categoryWithCounts);
    } catch (error) {
      console.error('Error fetching applications data:', error);
      toast({
        title: "Error",
        description: "Failed to load applications data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading applications overview...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Total Applications Card */}
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

      {/* Category Breakdown */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Registrations by Employment Category</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categoryBreakdown.map((category) => (
            <Card key={category.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{category.name}</CardTitle>
                <CardDescription className="text-sm">
                  {category.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">{category.count}</div>
                  <p className="text-sm text-muted-foreground">Registrations</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

const AdminPanel = () => {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-primary">Admin Panel</h2>
        <p className="text-muted-foreground">Manage the self-employment registration system</p>
      </div>

      <Tabs defaultValue="applications" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="applications">Applications Overview</TabsTrigger>
          <TabsTrigger value="uploads">Registered Data Uploads</TabsTrigger>
          <TabsTrigger value="categories">Employment Categories</TabsTrigger>
          <TabsTrigger value="registrations">Registrations</TabsTrigger>
          <TabsTrigger value="stop-requests">Stop Requests</TabsTrigger>
        </TabsList>
        
        <TabsContent value="applications" className="space-y-4">
          <ApplicationsOverview />
        </TabsContent>
        
        <TabsContent value="uploads" className="space-y-4">
          <DataUpload />
        </TabsContent>
        
        <TabsContent value="categories" className="space-y-4">
          <CategoriesManagement />
        </TabsContent>
        
        <TabsContent value="registrations" className="space-y-4">
          <RegistrationsView />
        </TabsContent>
        
        <TabsContent value="stop-requests" className="space-y-4">
          <StopRequestsManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPanel;