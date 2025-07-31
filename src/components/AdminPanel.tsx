import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/AuthContext";
import { useNavigate } from "react-router-dom";
import { X, Home, LogOut } from "lucide-react";
import DataUpload from "./admin/DataUpload";
import CategoriesManagement from "./admin/CategoriesManagement";
import RegistrationsView from "./admin/RegistrationsView";
import StopRequestsManagement from "./admin/StopRequestsManagement";
import NotificationManager from "./admin/NotificationManager";
import AdminManagement from "./admin/AdminManagement";
import PermissionManager from "./admin/PermissionManager";

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
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-4xl font-bold text-primary mb-2">Admin Panel</h2>
            <p className="text-lg text-muted-foreground">Comprehensive management system for self-employment registration</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/')}>
              <Home className="h-4 w-4 mr-2" />
              Home
            </Button>
            <Button variant="destructive" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
        {admin && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              Logged in as: <span className="font-medium text-foreground">{admin.username}</span>
            </p>
          </div>
        )}
      </div>

      <Tabs defaultValue="applications" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 mb-6">
          <TabsTrigger value="applications" className="text-sm">
            📊 Applications
          </TabsTrigger>
          <TabsTrigger value="registrations" className="text-sm">
            👥 Registrations
          </TabsTrigger>
          <TabsTrigger value="categories" className="text-sm">
            🏷️ Categories
          </TabsTrigger>
          <TabsTrigger value="uploads" className="text-sm">
            📁 Data Upload
          </TabsTrigger>
          <TabsTrigger value="stop-requests" className="text-sm">
            ⏹️ Stop Requests
          </TabsTrigger>
          <TabsTrigger value="notifications" className="text-sm">
            🔔 Notifications
          </TabsTrigger>
          <TabsTrigger value="admin-mgmt" className="text-sm">
            🔧 Admin Mgmt
          </TabsTrigger>
          <TabsTrigger value="permissions" className="text-sm">
            🔐 Permissions
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="applications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📊 Applications Overview
              </CardTitle>
              <CardDescription>
                Monitor and analyze all employment registration applications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ApplicationsOverview />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="registrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                👥 Registration Management
              </CardTitle>
              <CardDescription>
                View and manage all employment registrations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RegistrationsView />
            </CardContent>
          </Card>
        </TabsContent>

        
        <TabsContent value="categories" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🏷️ Employment Categories
              </CardTitle>
              <CardDescription>
                Manage employment categories and their configurations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CategoriesManagement />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="uploads" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📁 Data Management
              </CardTitle>
              <CardDescription>
                Upload and manage registered client data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataUpload />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="stop-requests" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                ⏹️ Stop Request Management
              </CardTitle>
              <CardDescription>
                Review and process stop requests from clients
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StopRequestsManagement />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🔔 Notification Center
              </CardTitle>
              <CardDescription>
                Create and manage notifications for categories, programs, and sub-projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NotificationManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="admin-mgmt" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🔧 Admin Management
              </CardTitle>
              <CardDescription>
                Add, edit, and delete administrator accounts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AdminManagement />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🔐 Permission Manager
              </CardTitle>
              <CardDescription>
                Manage user roles and access permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PermissionManager />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPanel;