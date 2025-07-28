import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const EmploymentRegistration = () => {
  const [mobileNumber, setMobileNumber] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [clientData, setClientData] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [step, setStep] = useState<"verify" | "select" | "confirm">("verify");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const verifyMobileNumber = async () => {
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
      const { data, error } = await supabase
        .from("registered_clients")
        .select("*")
        .eq("mobile_number", mobileNumber)
        .single();

      if (error || !data) {
        toast({
          variant: "destructive",
          title: "Not Registered",
          description: "You are not registered. Please contact your agent."
        });
        return;
      }

      setClientData(data);
      
      // Fetch available categories
      const { data: categoriesData } = await supabase
        .from("employment_categories")
        .select("*")
        .eq("is_active", true);

      setCategories(categoriesData || []);
      setStep("select");
      
      toast({
        title: "Verification Successful",
        description: `Welcome ${data.name}! Please select a category.`
      });
    } catch (error) {
      console.error("Error verifying mobile number:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to verify mobile number"
      });
    } finally {
      setLoading(false);
    }
  };

  const submitRegistration = async () => {
    if (!clientData || !selectedCategory) return;

    setLoading(true);
    try {
      // Check if already registered
      const { data: existingReg } = await supabase
        .from("employment_registrations")
        .select("*")
        .eq("client_id", clientData.id)
        .eq("category_id", selectedCategory);

      if (existingReg && existingReg.length > 0) {
        toast({
          variant: "destructive",
          title: "Already Registered",
          description: "You have already registered for this category."
        });
        return;
      }

      const { error } = await supabase
        .from("employment_registrations")
        .insert({
          client_id: clientData.id,
          category_id: selectedCategory,
          mobile_number: mobileNumber,
          status: "pending"
        });

      if (error) throw error;

      toast({
        title: "Registration Successful",
        description: "Your employment registration has been submitted successfully!"
      });
      
      setStep("confirm");
    } catch (error) {
      console.error("Error submitting registration:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit registration"
      });
    } finally {
      setLoading(false);
    }
  };

  const canApplyForCategory = (categoryName: string) => {
    if (!clientData) return false;
    
    // Job card holders can apply for any category
    if (clientData.category === "jobcard") return true;
    
    // Others can only apply for their specific category
    return clientData.category === categoryName;
  };

  const resetForm = () => {
    setMobileNumber("");
    setSelectedCategory("");
    setClientData(null);
    setStep("verify");
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Employment Registration</CardTitle>
          <CardDescription>
            Register for employment opportunities with E-Life Society
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === "verify" && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="mobile">Mobile Number</Label>
                <Input
                  id="mobile"
                  type="tel"
                  placeholder="Enter your mobile number"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                />
              </div>
              <Button onClick={verifyMobileNumber} disabled={loading} className="w-full">
                {loading ? "Verifying..." : "Verify Mobile Number"}
              </Button>
            </div>
          )}

          {step === "select" && clientData && (
            <div className="space-y-6">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Welcome {clientData.name}! Your details have been verified.
                </AlertDescription>
              </Alert>

              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Your Details:</h3>
                <p><strong>Name:</strong> {clientData.name}</p>
                <p><strong>Address:</strong> {clientData.address}</p>
                <p><strong>Category:</strong> {clientData.category}</p>
                <p><strong>District:</strong> {clientData.district}</p>
                <p><strong>Agent:</strong> {clientData.agent_pro}</p>
              </div>

              <div>
                <Label>Select Employment Category</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem
                        key={category.id}
                        value={category.id}
                        disabled={!canApplyForCategory(category.name)}
                      >
                        {category.name} - {category.description}
                        {!canApplyForCategory(category.name) && " (Not eligible)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-4">
                <Button onClick={resetForm} variant="outline" className="flex-1">
                  Back
                </Button>
                <Button 
                  onClick={submitRegistration} 
                  disabled={!selectedCategory || loading}
                  className="flex-1"
                >
                  {loading ? "Submitting..." : "Submit Registration"}
                </Button>
              </div>
            </div>
          )}

          {step === "confirm" && (
            <div className="text-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <h3 className="text-xl font-semibold">Registration Successful!</h3>
              <p className="text-muted-foreground">
                Your employment registration has been submitted. You will be contacted soon.
              </p>
              <Button onClick={resetForm} className="w-full">
                Register Another Person
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmploymentRegistration;
