import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileSpreadsheet, Briefcase, Shield } from "lucide-react";
import AdminPanel from "@/components/AdminPanel";
import EmploymentRegistration from "@/components/EmploymentRegistration";
import CheckRegistration from "@/components/CheckRegistration";

const Index = () => {
  const [activeTab, setActiveTab] = useState<"home" | "admin" | "register" | "check">("home");

  const renderContent = () => {
    switch (activeTab) {
      case "admin":
        return <AdminPanel />;
      case "register":
        return <EmploymentRegistration />;
      case "check":
        return <CheckRegistration />;
      default:
        return (
          <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10">
            <div className="container mx-auto px-4 py-8">
              <div className="text-center mb-12">
                <h1 className="text-4xl font-bold text-primary mb-4">E-Life Society</h1>
                <p className="text-xl text-muted-foreground">Self Employment Registration Portal</p>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab("register")}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <Briefcase className="h-6 w-6 text-primary" />
                      Employment Registration
                    </CardTitle>
                    <CardDescription>
                      Register for employment opportunities based on your category
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full">Start Registration</Button>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab("check")}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <Users className="h-6 w-6 text-primary" />
                      Check Registration
                    </CardTitle>
                    <CardDescription>
                      Verify your registration status and details
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full">Check Status</Button>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab("admin")}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <Shield className="h-6 w-6 text-primary" />
                      Admin Panel
                    </CardTitle>
                    <CardDescription>
                      Manage registrations, uploads, and categories
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="secondary" className="w-full">Admin Access</Button>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-12 text-center">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
                  <div className="bg-card p-4 rounded-lg">
                    <FileSpreadsheet className="h-8 w-8 text-primary mx-auto mb-2" />
                    <h3 className="font-semibold">Data Upload</h3>
                    <p className="text-sm text-muted-foreground">Excel file imports</p>
                  </div>
                  <div className="bg-card p-4 rounded-lg">
                    <Users className="h-8 w-8 text-primary mx-auto mb-2" />
                    <h3 className="font-semibold">Mobile Verification</h3>
                    <p className="text-sm text-muted-foreground">Secure registration</p>
                  </div>
                  <div className="bg-card p-4 rounded-lg">
                    <Briefcase className="h-8 w-8 text-primary mx-auto mb-2" />
                    <h3 className="font-semibold">Category Based</h3>
                    <p className="text-sm text-muted-foreground">Targeted opportunities</p>
                  </div>
                  <div className="bg-card p-4 rounded-lg">
                    <Shield className="h-8 w-8 text-primary mx-auto mb-2" />
                    <h3 className="font-semibold">Duplicate Prevention</h3>
                    <p className="text-sm text-muted-foreground">One-time registration</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {activeTab !== "home" && (
        <div className="bg-card border-b p-4">
          <div className="container mx-auto flex items-center justify-between">
            <h1 className="text-2xl font-bold text-primary">E-Life Society</h1>
            <Button variant="outline" onClick={() => setActiveTab("home")}>
              Back to Home
            </Button>
          </div>
        </div>
      )}
      {renderContent()}
    </div>
  );
};

export default Index;
