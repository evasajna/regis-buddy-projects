import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const CheckRegistration = () => {
  const [mobileNumber, setMobileNumber] = useState("");
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [clientData, setClientData] = useState<any>(null);
  const [availablePrograms, setAvailablePrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchAvailablePrograms = async (client: any) => {
    try {
      let programsQuery = supabase
        .from('programs')
        .select(`
          *,
          employment_categories (
            name,
            description
          ),
          sub_projects (
            name
          )
        `);

      // Qualification logic based on client category
      const category = client.category?.toLowerCase();
      
      if (category?.includes('job card')) {
        // Job Card holders can see all programs from all categories
        // No filter needed - show all programs
      } else if (category?.includes('foodelife')) {
        // Show only foodelife programs
        const { data: categories } = await supabase
          .from('employment_categories')
          .select('id')
          .eq('name', 'foodelife');
        
        if (categories && categories.length > 0) {
          programsQuery = programsQuery.eq('category_id', categories[0].id);
        }
      } else if (category?.includes('entrelife')) {
        // Show only entrelife programs
        const { data: categories } = await supabase
          .from('employment_categories')
          .select('id')
          .eq('name', 'entrelife');
        
        if (categories && categories.length > 0) {
          programsQuery = programsQuery.eq('category_id', categories[0].id);
        }
      } else if (category?.includes('organelife')) {
        // Show only organelife programs
        const { data: categories } = await supabase
          .from('employment_categories')
          .select('id')
          .eq('name', 'organelife');
        
        if (categories && categories.length > 0) {
          programsQuery = programsQuery.eq('category_id', categories[0].id);
        }
      } else if (category?.includes('farmelife')) {
        // Show only farmelife programs
        const { data: categories } = await supabase
          .from('employment_categories')
          .select('id')
          .eq('name', 'farmelife');
        
        if (categories && categories.length > 0) {
          programsQuery = programsQuery.eq('category_id', categories[0].id);
        }
      }

      const { data: programs, error } = await programsQuery;

      if (error) throw error;
      setAvailablePrograms(programs || []);
    } catch (error) {
      console.error('Error fetching available programs:', error);
      setAvailablePrograms([]);
    }
  };

  const checkRegistrations = async () => {
    if (!mobileNumber) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter your mobile number"
      });
      return;
    }

    setLoading(true);
    try {
      // First get client data
      const { data: client, error: clientError } = await supabase
        .from("registered_clients")
        .select("*")
        .eq("mobile_number", mobileNumber)
        .single();

      if (clientError || !client) {
        toast({
          variant: "destructive",
          title: "Not Found",
          description: "No registration found with this mobile number"
        });
        return;
      }

      setClientData(client);

      // Get employment registrations
      const { data: regs, error: regsError } = await supabase
        .from("employment_registrations")
        .select(`
          *,
          employment_categories (
            name,
            description
          )
        `)
        .eq("mobile_number", mobileNumber);

      if (regsError) throw regsError;

      setRegistrations(regs || []);

      // Check if this is a Job Card holder and enforce one registration limit
      if (client.category?.toLowerCase().includes('job card') && regs && regs.length > 0) {
        toast({
          title: "Registration Status",
          description: `Job Card holders can only have one registration at a time. You already have ${regs.length} registration(s).`
        });
      }

      // Fetch available programs based on qualification
      await fetchAvailablePrograms(client);
      
      toast({
        title: "Records Found",
        description: `Found ${regs?.length || 0} employment registration(s)`
      });
    } catch (error) {
      console.error("Error checking registrations:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to check registrations"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-500";
      case "rejected":
        return "bg-red-500";
      case "pending":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  const reset = () => {
    setMobileNumber("");
    setRegistrations([]);
    setClientData(null);
    setAvailablePrograms([]);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Check Registration Status</CardTitle>
          <CardDescription>
            Enter your mobile number to view your registration details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="mobile">Mobile Number</Label>
              <Input
                id="mobile"
                type="tel"
                placeholder="Enter your mobile number"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={checkRegistrations} disabled={loading}>
                {loading ? "Checking..." : "Check Status"}
              </Button>
              {(clientData || registrations.length > 0) && (
                <Button onClick={reset} variant="outline">
                  Reset
                </Button>
              )}
            </div>
          </div>

          {clientData && (
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Personal Details</TabsTrigger>
                <TabsTrigger value="registrations">My Registrations ({registrations.length})</TabsTrigger>
                <TabsTrigger value="programs">Available Programs ({availablePrograms.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Personal Details</CardTitle>
                    <CardDescription>
                      Your qualification: <Badge variant="outline">{clientData.category}</Badge>
                      {clientData.category?.toLowerCase().includes('job card') ? (
                        <span className="text-green-600 ml-2">✓ Can apply to all programs (Job Card holder)</span>
                      ) : (
                        <span className="text-amber-600 ml-2">⚠ Limited to category-specific programs</span>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Name</Label>
                        <p className="font-medium">{clientData.name}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Customer ID</Label>
                        <p className="font-medium">{clientData.customer_id}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Category</Label>
                        <p className="font-medium">{clientData.category}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">District</Label>
                        <p className="font-medium">{clientData.district}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Panchayath</Label>
                        <p className="font-medium">{clientData.panchayath}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Agent/PRO</Label>
                        <p className="font-medium">{clientData.agent_pro}</p>
                      </div>
                      <div className="md:col-span-2">
                        <Label className="text-sm font-medium text-muted-foreground">Address</Label>
                        <p className="font-medium">{clientData.address}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="registrations" className="space-y-4">
                {registrations.length > 0 ? (
                  <div className="space-y-4">
                    {registrations.map((reg) => (
                      <Card key={reg.id}>
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-semibold">{reg.employment_categories?.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {reg.employment_categories?.description}
                              </p>
                            </div>
                            <Badge className={getStatusColor(reg.status)}>
                              {reg.status}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <p>Registration Date: {new Date(reg.registration_date).toLocaleDateString()}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="text-center py-8">
                      <p className="text-muted-foreground">
                        No employment registrations found. Check the Available Programs tab to see what you can apply for.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="programs" className="space-y-4">
                {availablePrograms.length > 0 ? (
                  <div className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Programs You Can Apply For</CardTitle>
                        <CardDescription>
                          Based on your qualification ({clientData.category}), these programs are available to you.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {availablePrograms.map((program) => (
                            <Card key={program.id} className="border-2 border-dashed border-primary/20">
                              <CardHeader>
                                <CardTitle className="text-base">{program.name}</CardTitle>
                                <div className="flex gap-2">
                                  <Badge variant="secondary">{program.employment_categories?.name}</Badge>
                                  {program.sub_projects && (
                                    <Badge variant="outline">{program.sub_projects.name}</Badge>
                                  )}
                                </div>
                              </CardHeader>
                              <CardContent>
                                {program.description && (
                                  <p className="text-sm text-muted-foreground mb-3">
                                    {program.description}
                                  </p>
                                )}
                                {program.conditions && (
                                  <div className="mb-3">
                                    <Label className="text-sm font-medium">Conditions:</Label>
                                    <p className="text-sm text-muted-foreground">{program.conditions}</p>
                                  </div>
                                )}
                                <Button size="sm" className="w-full">
                                  Apply for this Program
                                </Button>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <Card>
                    <CardContent className="text-center py-8">
                      <p className="text-muted-foreground">
                        No programs available for your qualification ({clientData.category}).
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CheckRegistration;