import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const CheckRegistration = () => {
  const [mobileNumber, setMobileNumber] = useState("");
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [clientData, setClientData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

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
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Personal Details</CardTitle>
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
          )}

          {registrations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Employment Registrations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {registrations.map((reg) => (
                    <div key={reg.id} className="border rounded-lg p-4">
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
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {clientData && registrations.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">
                  No employment registrations found. You can register for employment opportunities.
                </p>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CheckRegistration;