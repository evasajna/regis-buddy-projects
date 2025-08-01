import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Bell } from "lucide-react";

const CheckRegistration = () => {
  const [mobileNumber, setMobileNumber] = useState("");
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [clientData, setClientData] = useState<any>(null);
  const [availablePrograms, setAvailablePrograms] = useState<any[]>([]);
  const [userNotifications, setUserNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showApplicationDialog, setShowApplicationDialog] = useState(false);
  const [showBlockingDialog, setShowBlockingDialog] = useState(false);
  const [blockingTitle, setBlockingTitle] = useState("Dual Application Not Allowed");
  const [blockingMessage, setBlockingMessage] = useState("");
  const [selectedProgram, setSelectedProgram] = useState<{id: string, name: string} | null>(null);
  const [experience, setExperience] = useState("");
  const [skills, setSkills] = useState("");
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

  const fetchUserNotifications = async (client: any, registrations: any[]) => {
    try {
      // Get all category IDs that the user is registered for
      const categoryIds = registrations.map(reg => reg.category_id).filter(Boolean);
      
      if (categoryIds.length === 0) return;

      // Fetch notifications for these categories
      const { data: notifications, error } = await (supabase as any)
        .from('notifications')
        .select('*')
        .in('target_id', categoryIds)
        .eq('type', 'category')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching notifications:', error);
        setUserNotifications([]);
        return;
      }

      // Also fetch program-specific notifications if any
      const { data: programNotifications, error: progError } = await (supabase as any)
        .from('notifications')
        .select('*')
        .eq('type', 'program')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (progError) {
        console.error('Error fetching program notifications:', progError);
      }

      // Combine and deduplicate notifications
      const allNotifications = [...(notifications || []), ...(programNotifications || [])];
      setUserNotifications(allNotifications);
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      setUserNotifications([]);
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
      
      // Fetch user-specific notifications
      await fetchUserNotifications(client, registrationsWithPrograms || []);
      
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
    
    // Check for dual application blocking
    if (registrations.length > 0) {
      // Check if user already has any pending or approved registrations
      const activeRegistrations = registrations.filter(reg => 
        reg.status === 'pending' || reg.status === 'approved'
      );
      
      if (activeRegistrations.length > 0) {
        const message = `You already have ${activeRegistrations.length} active registration(s). According to our dual application policy, you cannot apply for additional programs until your current registration is completed.\n\nTo apply for this program, please:\n1. Complete your current registration, or\n2. Request to stop your current registration using the "Request Stop/Multi-Program" button\n\nIf you believe this is an error, please contact our support team.`;
        setBlockingMessage(message);
        setShowBlockingDialog(true);
        return;
      }
    }
    
    // Show the dialog for experience and skills collection
    setSelectedProgram({ id: programId, name: programName });
    setShowApplicationDialog(true);
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
    
    if (!experience.trim() || !skills.trim()) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please provide both experience and skills information."
      });
      return;
    }
    
    try {
      const { error } = await supabase
        .from('employment_registrations')
        .insert({
          client_id: clientData.id,
          category_id: selectedProgram.id,
          mobile_number: clientData.mobile_number,
          experience: experience.trim(),
          skills: skills.trim()
        });

      if (error) throw error;

      toast({
        title: "Application Submitted",
        description: `Your application for "${selectedProgram.name}" has been submitted successfully.`,
      });

      setShowApplicationDialog(false);
      setSelectedProgram(null);
      setExperience("");
      setSkills("");
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
    setShowBlockingDialog(false);
    setBlockingTitle("Dual Application Not Allowed");
    setBlockingMessage("");
    setSelectedProgram(null);
    setExperience("");
    setSkills("");
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl">Check Registration Status</CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Enter your mobile number to view your registration details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <div className="flex-1">
              <Label htmlFor="mobile" className="text-sm sm:text-base">Mobile Number</Label>
              <Input
                id="mobile"
                type="tel"
                placeholder="Enter your mobile number"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                className="text-sm sm:text-base"
              />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-end gap-2">
              <Button onClick={checkRegistrations} disabled={loading} className="text-sm sm:text-base">
                {loading ? "Checking..." : "Check Status"}
              </Button>
              {(clientData || registrations.length > 0) && (
                <Button onClick={reset} variant="outline" className="text-sm sm:text-base">
                  Reset
                </Button>
              )}
            </div>
          </div>

          {clientData && (
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-3 text-xs sm:text-sm">
                <TabsTrigger value="details" className="text-xs sm:text-sm px-1 sm:px-3">Details</TabsTrigger>
                <TabsTrigger value="programs" className="text-xs sm:text-sm px-1 sm:px-3">Programs ({availablePrograms.length})</TabsTrigger>
                <TabsTrigger value="registrations" className="text-xs sm:text-sm px-1 sm:px-3">Registrations ({registrations.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Personal Details</CardTitle>
                    <CardDescription>
                      <div className="space-y-2">
                        <div>
                          Your qualification: <Badge variant="outline">{clientData.category}</Badge>
                        </div>
                        <div>
                          {(clientData.category?.toLowerCase().includes('job card') || 
                            clientData.category?.toLowerCase().includes('others')) ? (
                            <span className="text-green-600">✓ Can apply to all programs (Special qualification)</span>
                          ) : (
                            <span className="text-amber-600">⚠ Limited to category-specific programs</span>
                          )}
                        </div>
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs sm:text-sm font-medium text-muted-foreground">Name</Label>
                        <p className="font-medium text-sm sm:text-base">{clientData.name}</p>
                      </div>
                      <div>
                        <Label className="text-xs sm:text-sm font-medium text-muted-foreground">Customer ID</Label>
                        <p className="font-medium text-sm sm:text-base">{clientData.customer_id}</p>
                      </div>
                      <div>
                        <Label className="text-xs sm:text-sm font-medium text-muted-foreground">Category</Label>
                        <p className="font-medium text-sm sm:text-base">{clientData.category}</p>
                      </div>
                      <div>
                        <Label className="text-xs sm:text-sm font-medium text-muted-foreground">District</Label>
                        <p className="font-medium text-sm sm:text-base">{clientData.district}</p>
                      </div>
                      <div>
                        <Label className="text-xs sm:text-sm font-medium text-muted-foreground">Panchayath</Label>
                        <p className="font-medium text-sm sm:text-base">{clientData.panchayath}</p>
                      </div>
                      <div>
                        <Label className="text-xs sm:text-sm font-medium text-muted-foreground">Agent/PRO</Label>
                        <p className="font-medium text-sm sm:text-base">{clientData.agent_pro}</p>
                      </div>
                      <div className="sm:col-span-2">
                        <Label className="text-xs sm:text-sm font-medium text-muted-foreground">Address</Label>
                        <p className="font-medium text-sm sm:text-base">{clientData.address}</p>
                      </div>
                    </div>

                    {/* Notifications Section */}
                    <Card className="mt-4">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Bell className="h-5 w-5" />
                          Notifications
                        </CardTitle>
                        <CardDescription>
                          Important updates related to your employment categories and programs
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {userNotifications.length === 0 ? (
                            <div className="text-center py-6 text-muted-foreground">
                              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                              <p>No notifications available for your categories.</p>
                              <p className="text-sm">Notifications will appear here when admins post updates for your employment categories.</p>
                            </div>
                          ) : (
                            <>
                              {userNotifications.map((notification, index) => (
                                <div key={notification.id} className="p-4 border rounded-lg bg-blue-50 border-blue-200">
                                  <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-medium text-blue-900">{notification.title}</h4>
                                    <Badge variant="outline" className="text-xs">
                                      {new Date(notification.created_at).toLocaleDateString()}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-blue-800 mb-2">
                                    {notification.message}
                                  </p>
                                  <div className="flex items-center gap-2 text-xs text-blue-600">
                                    <Badge variant="secondary" className="text-xs">
                                      {notification.type}
                                    </Badge>
                                    <span>•</span>
                                    <span>Updated: {new Date(notification.updated_at).toLocaleDateString()}</span>
                                  </div>
                                </div>
                              ))}
                              
                              <div className="text-xs text-muted-foreground mt-4 p-3 bg-muted/30 rounded">
                                <strong>📢 Stay Updated:</strong> These notifications are managed by administrators and contain important information about your employment categories, program updates, and opportunities.
                              </div>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
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
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Apply for Program</DialogTitle>
                <DialogDescription>
                  Please provide your experience and skills information to apply for "{selectedProgram?.name}".
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="experience" className="text-sm font-medium">
                    Experience *
                  </Label>
                  <Textarea
                    id="experience"
                    placeholder="Describe your relevant work experience..."
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    className="mt-1"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="skills" className="text-sm font-medium">
                    Skills *
                  </Label>
                  <Textarea
                    id="skills"
                    placeholder="List your relevant skills and capabilities..."
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    className="mt-1"
                    rows={3}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  * Both fields are required to submit your application.
                </p>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setShowApplicationDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleDialogApplication}>
                  Submit Application
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Simple Dual Application Blocking Dialog */}
          <Dialog open={showBlockingDialog} onOpenChange={setShowBlockingDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <div className="space-y-2">
                  <Label htmlFor="blockingTitle" className="text-sm font-medium">
                    Dialog Title
                  </Label>
                  <Input
                    id="blockingTitle"
                    value={blockingTitle}
                    onChange={(e) => setBlockingTitle(e.target.value)}
                    className="text-lg font-medium"
                    placeholder="Enter dialog title"
                  />
                </div>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="blockingMessage" className="text-sm font-medium">
                    Message Content
                  </Label>
                  <Textarea
                    id="blockingMessage"
                    value={blockingMessage}
                    onChange={(e) => setBlockingMessage(e.target.value)}
                    className="min-h-[120px] mt-2"
                    placeholder="Enter blocking message content"
                  />
                </div>
              </div>
              <DialogFooter className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={() => setShowBlockingDialog(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => setShowBlockingDialog(false)}
                >
                  OK
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