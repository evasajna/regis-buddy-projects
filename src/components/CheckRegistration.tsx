import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const CheckRegistration = () => {
  const [mobileNumber, setMobileNumber] = useState("");
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [clientData, setClientData] = useState<any>(null);
  const [availablePrograms, setAvailablePrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showApplicationDialog, setShowApplicationDialog] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<{id: string, name: string} | null>(null);
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
      
      if (category?.includes('job card') || category?.includes('others')) {
        // Job Card holders (now called "Others") can see all programs from all categories
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

      // Get employment registrations with program details
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

      // For each registration, get the programs that match the category
      const registrationsWithPrograms = await Promise.all(
        (regs || []).map(async (reg) => {
          if (reg.category_id) {
            const { data: programs } = await supabase
              .from("programs")
              .select(`
                name,
                description,
                conditions,
                sub_projects (
                  name
                )
              `)
              .eq("category_id", reg.category_id);
            
            return {
              ...reg,
              available_programs: programs || []
            };
          }
          return reg;
        })
      );

      setRegistrations(registrationsWithPrograms || []);

      // Check if this is a special qualification holder (Job Card/Others) and enforce one registration limit
      if ((client.category?.toLowerCase().includes('job card') || 
           client.category?.toLowerCase().includes('others')) && regs && regs.length > 0) {
        toast({
          title: "Registration Status",
          description: `Special qualification holders can only have one registration at a time. You already have ${regs.length} registration(s).`
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
      case "stop_requested":
        return "bg-orange-500";
      default:
        return "bg-gray-500";
    }
  };

  const applyForProgram = async (programId: string, programName: string) => {
    if (!clientData) return;
    
    try {
      // Check for dual registration prevention using mobile number
      const { data: existingRegistrations } = await supabase
        .from("employment_registrations")
        .select("*")
        .eq("mobile_number", clientData.mobile_number)
        .not("status", "in", "(rejected,stopped)"); // Only count active registrations

      if (existingRegistrations && existingRegistrations.length > 0) {
        // Check if any existing registration has multi-program approval
        const hasMultiApproval = existingRegistrations.some(reg => reg.status === 'multi_approved');
        
        if (!hasMultiApproval) {
          // Show popup dialog instead of toast
          setSelectedProgram({ id: programId, name: programName });
          setShowApplicationDialog(true);
          return;
        }
      }

      const { error } = await supabase
        .from('employment_registrations')
        .insert({
          client_id: clientData.id,
          category_id: programId,
          mobile_number: clientData.mobile_number
        });

      if (error) throw error;

      toast({
        title: "Application Submitted",
        description: `Your application for "${programName}" has been submitted successfully.`,
      });

      // Refresh registrations to show the new application
      checkRegistrations();
    } catch (error) {
      console.error('Error applying for program:', error);
      toast({
        title: "Application Failed",
        description: "Failed to submit your application. Please try again.",
        variant: "destructive",
      });
    }
  };

  const requestStopProgram = async (registrationId: string, categoryName: string) => {
    if (!clientData) return;
    
    try {
      // For now, we'll add this as a comment to the existing registration
      // Later, admin can add the program_stop_requests table
      const { error } = await supabase
        .from('employment_registrations')
        .update({
          status: 'stop_requested' // Custom status to indicate stop request
        })
        .eq('id', registrationId);

      if (error) throw error;

      toast({
        title: "Request Submitted",
        description: "Your request to stop/allow multi-program has been submitted for admin approval.",
      });

      // Refresh registrations to show updated status
      checkRegistrations();
    } catch (error) {
      console.error('Error submitting stop request:', error);
      toast({
        title: "Request Failed",
        description: "Failed to submit your request. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDialogApplication = async () => {
    if (!selectedProgram || !clientData) return;
    
    try {
      const { error } = await supabase
        .from('employment_registrations')
        .insert({
          client_id: clientData.id,
          category_id: selectedProgram.id,
          mobile_number: clientData.mobile_number
        });

      if (error) throw error;

      toast({
        title: "Application Submitted",
        description: `Your application for "${selectedProgram.name}" has been submitted successfully.`,
      });

      setShowApplicationDialog(false);
      setSelectedProgram(null);
      checkRegistrations();
    } catch (error) {
      console.error('Error applying for program:', error);
      toast({
        title: "Application Failed",
        description: "Failed to submit your application. Please try again.",
        variant: "destructive",
      });
    }
  };

  const reset = () => {
    setMobileNumber("");
    setRegistrations([]);
    setClientData(null);
    setAvailablePrograms([]);
    setShowApplicationDialog(false);
    setSelectedProgram(null);
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
                <TabsTrigger value="programs">Available Programs ({availablePrograms.length})</TabsTrigger>
                <TabsTrigger value="registrations">My Registrations ({registrations.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Personal Details</CardTitle>
                    <CardDescription>
                      Your qualification: <Badge variant="outline">{clientData.category}</Badge>
                      {(clientData.category?.toLowerCase().includes('job card') || 
                        clientData.category?.toLowerCase().includes('others')) ? (
                        <span className="text-green-600 ml-2">✓ Can apply to all programs (Special qualification)</span>
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
                          <div className="flex justify-between items-start mb-4">
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
                          
                          <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                            <h4 className="font-medium text-sm mb-2">Registration Details:</h4>
                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground">
                                Category: {reg.employment_categories?.name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Registration ID: {reg.id}
                              </p>
                            </div>
                          </div>

                          {reg.available_programs && reg.available_programs.length > 0 && (
                            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                              <div className="flex justify-between items-center mb-2">
                                <h4 className="font-medium text-sm">Available Programs for this Category:</h4>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => requestStopProgram(reg.id, reg.employment_categories?.name || '')}
                                >
                                  Request Stop/Multi-Program
                                </Button>
                              </div>
                              <div className="space-y-2">
                                {reg.available_programs.map((program, index) => (
                                  <div key={index} className="border border-blue-200 p-2 rounded bg-white">
                                    <h5 className="font-medium text-sm text-blue-800">{program.name}</h5>
                                    {program.description && (
                                      <p className="text-xs text-muted-foreground mt-1">{program.description}</p>
                                    )}
                                    {program.conditions && (
                                      <p className="text-xs text-orange-600 mt-1">Conditions: {program.conditions}</p>
                                    )}
                                    {program.sub_projects && (
                                      <p className="text-xs text-purple-600 mt-1">Sub-project: {program.sub_projects.name}</p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
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
                        <div className="rounded-md border overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Program Name</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Sub-Project</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Conditions</TableHead>
                                <TableHead>Action</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {availablePrograms.map((program) => (
                                <TableRow key={program.id}>
                                  <TableCell className="font-medium">
                                    {program.name}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="secondary">{program.employment_categories?.name}</Badge>
                                  </TableCell>
                                  <TableCell>
                                    {program.sub_projects ? (
                                      <Badge variant="outline">{program.sub_projects.name}</Badge>
                                    ) : (
                                      "-"
                                    )}
                                  </TableCell>
                                  <TableCell className="max-w-xs">
                                    <div className="truncate" title={program.description}>
                                      {program.description || "-"}
                                    </div>
                                  </TableCell>
                                  <TableCell className="max-w-xs">
                                    <div className="truncate" title={program.conditions}>
                                      {program.conditions || "-"}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Button 
                                      size="sm" 
                                      onClick={() => applyForProgram(program.category_id, program.name)}
                                    >
                                      Apply
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
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

          {/* Application Confirmation Dialog */}
          <Dialog open={showApplicationDialog} onOpenChange={setShowApplicationDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Multiple Program Application</DialogTitle>
                <DialogDescription>
                  You can only apply for one program at a time. You currently have an active registration.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <p className="text-sm text-muted-foreground mb-4">
                  To proceed with applying for "{selectedProgram?.name}", you need to either:
                </p>
                <ul className="list-disc list-inside space-y-2 text-sm">
                  <li>Request to stop your current registration first</li>
                  <li>Request multi-program approval from admin</li>
                  <li>Or apply anyway (admin will review your case)</li>
                </ul>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setShowApplicationDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleDialogApplication}>
                  Apply Anyway
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
};

export default CheckRegistration;