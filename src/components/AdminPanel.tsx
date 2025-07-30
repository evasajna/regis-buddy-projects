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
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchTotalApplications();
  }, []);

  const fetchTotalApplications = async () => {
    try {
      const { count, error } = await supabase
        .from('employment_registrations')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      setTotalApplications(count || 0);
    } catch (error) {
      console.error('Error fetching total applications:', error);
      toast({
        title: "Error",
        description: "Failed to load applications count",
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