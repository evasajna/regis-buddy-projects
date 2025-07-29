import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Users, Briefcase, Shield } from "lucide-react";
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
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-card border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-2xl font-bold text-primary">E-Life Society</h1>
            <div className="flex space-x-4">
              <Button
                variant={activeTab === "register" ? "default" : "ghost"}
                onClick={() => setActiveTab("register")}
                className="flex items-center gap-2"
              >
                <Briefcase className="h-4 w-4" />
                Register
              </Button>
              <Button
                variant={activeTab === "check" ? "default" : "ghost"}
                onClick={() => setActiveTab("check")}
                className="flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                Check Status
              </Button>
              <Button
                variant={activeTab === "admin" ? "default" : "ghost"}
                onClick={() => setActiveTab("admin")}
                className="flex items-center gap-2"
              >
                <Shield className="h-4 w-4" />
                Admin
              </Button>
            </div>
          </div>
        </div>
      </nav>
      {renderContent()}
    </div>
  );
};

export default Index;
