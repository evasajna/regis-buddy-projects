import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Users, Briefcase, Shield, Home, List, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AdminPanel from "@/components/AdminPanel";
import EmploymentRegistration from "@/components/EmploymentRegistration";
import CheckRegistration from "@/components/CheckRegistration";
import CategoryCard from "@/components/CategoryCard";
interface Category {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
}
interface Program {
  id: string;
  name: string;
  description?: string;
  conditions?: string;
}
interface SubProject {
  id: string;
  name: string;
}
const Index = () => {
  const [activeTab, setActiveTab] = useState<"home" | "admin" | "register" | "check">("home");
  const [categories, setCategories] = useState<Category[]>([]);
  const [programs, setPrograms] = useState<Record<string, Program[]>>({});
  const [subProjects, setSubProjects] = useState<Record<string, SubProject[]>>({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  useEffect(() => {
    if (activeTab === "home") {
      fetchCategoriesData();
    }
  }, [activeTab]);
  const fetchCategoriesData = async () => {
    setLoading(true);
    try {
      // Fetch categories
      const {
        data: categoriesData,
        error: categoriesError
      } = await supabase.from('employment_categories').select('*').eq('is_active', true).order('name');
      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

      // Fetch programs for each category
      const {
        data: programsData,
        error: programsError
      } = await supabase.from('programs').select('*').order('created_at', {
        ascending: false
      });
      if (programsError) throw programsError;

      // Group programs by category
      const programsByCategory: Record<string, Program[]> = {};
      (programsData || []).forEach(program => {
        if (!programsByCategory[program.category_id]) {
          programsByCategory[program.category_id] = [];
        }
        programsByCategory[program.category_id].push(program);
      });
      setPrograms(programsByCategory);

      // Fetch sub-projects for each category
      const {
        data: subProjectsData,
        error: subProjectsError
      } = await supabase.from('sub_projects').select('*').order('name');
      if (subProjectsError) throw subProjectsError;

      // Group sub-projects by category
      const subProjectsByCategory: Record<string, SubProject[]> = {};
      (subProjectsData || []).forEach(subProject => {
        if (!subProjectsByCategory[subProject.category_id]) {
          subProjectsByCategory[subProject.category_id] = [];
        }
        subProjectsByCategory[subProject.category_id].push(subProject);
      });
      setSubProjects(subProjectsByCategory);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load categories data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const renderHomeContent = () => {
    if (loading) {
      return <div className="container mx-auto p-6">
          <div className="text-center">Loading categories...</div>
        </div>;
    }
    return <div className="container mx-auto p-4 sm:p-6">
        <div className="mb-6 sm:mb-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">Employment Categories</h2>
          <p className="text-muted-foreground mb-4 sm:mb-6 text-sm sm:text-base">
            Explore our employment programs and opportunities
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-4 mb-6 sm:mb-8">
            <Button onClick={() => navigate('/add-program')} className="flex items-center gap-2 text-sm sm:text-base">
              <Plus className="h-4 w-4" />
              Add New Program
            </Button>
            <Button variant="outline" onClick={() => setActiveTab("check")} className="flex items-center gap-2 text-sm sm:text-base bg-green-600 hover:bg-green-500 text-slate-50">
              <Users className="h-4 w-4" />
              Check Status
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map(category => <CategoryCard key={category.id} category={category} programs={programs[category.id] || []} subProjects={subProjects[category.id] || []} isAdmin={activeTab === "admin"} />)}
        </div>

        {categories.length === 0 && !loading && <div className="text-center py-12">
            <p className="text-muted-foreground">No employment categories available.</p>
          </div>}
      </div>;
  };
  const renderContent = () => {
    switch (activeTab) {
      case "admin":
        return <AdminPanel />;
      case "register":
        return <EmploymentRegistration />;
      case "check":
        return <CheckRegistration />;
      default:
        return renderHomeContent();
    }
  };
  return <div className="min-h-screen bg-background">
      <nav className="bg-card border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl sm:text-2xl font-bold text-primary">E-Life Society</h1>
            <div className="hidden md:flex space-x-4">
              <Button variant={activeTab === "home" ? "default" : "ghost"} onClick={() => setActiveTab("home")} className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Home
              </Button>
              <Button variant="ghost" onClick={() => navigate('/all-programs')} className="flex items-center gap-2">
                <List className="h-4 w-4" />
                All Programs
              </Button>
              <Button variant={activeTab === "register" ? "default" : "ghost"} onClick={() => setActiveTab("register")} className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Register
              </Button>
              <Button variant={activeTab === "check" ? "default" : "ghost"} onClick={() => setActiveTab("check")} className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Check Status
              </Button>
              <Button variant={activeTab === "admin" ? "default" : "ghost"} onClick={() => setActiveTab("admin")} className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Admin
              </Button>
            </div>
            
            {/* Mobile Navigation */}
            <div className="flex md:hidden space-x-1">
              <Button variant={activeTab === "home" ? "default" : "ghost"} onClick={() => setActiveTab("home")} size="sm">
                <Home className="h-4 w-4" />
              </Button>
              <Button variant="ghost" onClick={() => navigate('/all-programs')} size="sm">
                <List className="h-4 w-4" />
              </Button>
              <Button variant={activeTab === "register" ? "default" : "ghost"} onClick={() => setActiveTab("register")} size="sm">
                <Briefcase className="h-4 w-4" />
              </Button>
              <Button variant={activeTab === "check" ? "default" : "ghost"} onClick={() => setActiveTab("check")} size="sm">
                <Users className="h-4 w-4" />
              </Button>
              <Button variant={activeTab === "admin" ? "default" : "ghost"} onClick={() => setActiveTab("admin")} size="sm">
                <Shield className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>
      {renderContent()}
    </div>;
};
export default Index;