import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { X } from "lucide-react";
import DataUpload from "./admin/DataUpload";
import CategoriesManagement from "./admin/CategoriesManagement";
import RegistrationsView from "./admin/RegistrationsView";
import StopRequestsManagement from "./admin/StopRequestsManagement";
import NotificationManager from "./admin/NotificationManager";

const ApplicationsOverview = () => {
  const [totalApplications, setTotalApplications] = useState(0);
  const [categoryBreakdown, setCategoryBreakdown] = useState<Array<{
    id: string;
    name: string;
    description: string;
    count: number;
    is_active: boolean;
  }>>([]);
  const [selectedCategory, setSelectedCategory] = useState<{
    id: string;
    name: string;
    description: string;
    count: number;
    is_active: boolean;
  } | null>(null);
  const [categoryRegistrations, setCategoryRegistrations] = useState<Array<{
    id: string;
    client_id: string;
    mobile_number: string;
    registration_date: string;
    status: string | null;
    client_name: string;
    customer_id: string;
  }>>([]);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);
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

  const fetchCategoryRegistrations = async (categoryId: string) => {
    setLoadingRegistrations(true);
    try {
      const { data, error } = await supabase
        .from('employment_registrations')
        .select(`
          id,
          client_id,
          mobile_number,
          registration_date,
          status,
          registered_clients!inner (
            name,
            customer_id
          )
        `)
        .eq('category_id', categoryId);

      if (error) throw error;

      const formattedData = data?.map(registration => ({
        id: registration.id,
        client_id: registration.client_id,
        mobile_number: registration.mobile_number,
        registration_date: registration.registration_date,
        status: registration.status,
        client_name: registration.registered_clients?.name || 'N/A',
        customer_id: registration.registered_clients?.customer_id || 'N/A'
      })) || [];

      setCategoryRegistrations(formattedData);
    } catch (error) {
      console.error('Error fetching category registrations:', error);
      toast({
        title: "Error",
        description: "Failed to load category registrations",
        variant: "destructive",
      });
    } finally {
      setLoadingRegistrations(false);
    }
  };

  const handleCategoryClick = (category: typeof categoryBreakdown[0]) => {
    setSelectedCategory(category);
    fetchCategoryRegistrations(category.id);
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
            <Card 
              key={category.id} 
              className="hover:shadow-md transition-shadow cursor-pointer hover:bg-muted/50"
              onClick={() => handleCategoryClick(category)}
            >
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

      {/* Category Registrations Modal */}
      <Dialog open={!!selectedCategory} onOpenChange={() => setSelectedCategory(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Registrations for {selectedCategory?.name}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedCategory(null)}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          {loadingRegistrations ? (
            <div className="text-center py-8">Loading registrations...</div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Total registrations: {categoryRegistrations.length}
              </div>
              
              {categoryRegistrations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No registrations found for this category.
                </div>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client Name</TableHead>
                        <TableHead>Customer ID</TableHead>
                        <TableHead>Mobile Number</TableHead>
                        <TableHead>Registration Date</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categoryRegistrations.map((registration) => (
                        <TableRow key={registration.id}>
                          <TableCell className="font-medium">
                            {registration.client_name}
                          </TableCell>
                          <TableCell>{registration.customer_id}</TableCell>
                          <TableCell>{registration.mobile_number}</TableCell>
                          <TableCell>
                            {new Date(registration.registration_date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                registration.status === 'active' ? 'default' :
                                registration.status === 'stop_requested' ? 'destructive' :
                                'secondary'
                              }
                            >
                              {registration.status || 'active'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
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
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="applications">Applications Overview</TabsTrigger>
          <TabsTrigger value="uploads">Registered Data Uploads</TabsTrigger>
          <TabsTrigger value="categories">Employment Categories</TabsTrigger>
          <TabsTrigger value="registrations">Registrations</TabsTrigger>
          <TabsTrigger value="stop-requests">Stop Requests</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
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
        
        <TabsContent value="notifications" className="space-y-4">
          <NotificationManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPanel;