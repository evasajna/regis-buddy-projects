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
      return <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <div className="text-foreground font-medium">Loading categories...</div>
          </div>
        </div>;
    }
    return <div className="min-h-screen bg-gradient-to-br from-background via-primary-light/20 to-background">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-hero">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/5"></div>
          <div className="relative container mx-auto px-4 py-16 sm:py-24 bg-cyan-200">
            <div className="text-center animate-fade-in">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-poppins font-bold mb-6">
                <span className="text-gradient">Transform Your Career</span>
                <br />
                <span className="text-foreground">with E-Life Society</span>
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
                Discover exclusive employment opportunities, professional development programs, and career advancement resources tailored to your success.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12 animate-slide-up">
                <Button onClick={() => navigate('/add-program')} className="text-lg px-8 py-4 h-auto bg-gradient-primary hover:shadow-glow transition-all duration-300 transform hover:scale-105">
                  <Plus className="h-5 w-5 mr-2" />
                  Add New Program
                </Button>
                <Button variant="outline" onClick={() => setActiveTab("check")} className="text-lg px-8 py-4 h-auto border-2 hover:bg-primary hover:text-primary-foreground transition-all duration-300">
                  <Users className="h-5 w-5 mr-2" />
                  Check Status
                </Button>
              </div>
            </div>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute top-10 left-10 w-20 h-20 bg-primary/10 rounded-full blur-xl"></div>
          <div className="absolute bottom-10 right-10 w-32 h-32 bg-accent/20 rounded-full blur-2xl"></div>
        </div>

        {/* Employment Categories Section */}
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-12 animate-fade-in">
            <h2 className="text-3xl sm:text-4xl font-poppins font-bold mb-4 text-foreground">
              Employment <span className="text-gradient">Categories</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
              Explore our comprehensive range of employment programs designed to match your skills and aspirations
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-scale-in">
            {categories.map((category, index) => <div key={category.id} className="animate-fade-in" style={{
            animationDelay: `${index * 0.1}s`
          }}>
                <CategoryCard category={category} programs={programs[category.id] || []} subProjects={subProjects[category.id] || []} isAdmin={activeTab === "admin"} />
              </div>)}
          </div>

          {categories.length === 0 && !loading && <div className="text-center py-20 animate-fade-in">
              <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                <Briefcase className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No Categories Available</h3>
              <p className="text-muted-foreground mb-6">Start by creating your first employment category</p>
              <Button onClick={() => setActiveTab("admin")} className="bg-gradient-primary hover:shadow-glow">
                <Plus className="h-4 w-4 mr-2" />
                Create Category
              </Button>
            </div>}
        </div>
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
      <nav className="bg-card/80 backdrop-blur-md border-b border-border/50 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl sm:text-2xl font-poppins font-bold bg-gradient-primary bg-clip-text text-transparent">
              E-Life Society
            </h1>
            <div className="hidden md:flex space-x-2">
              <Button variant={activeTab === "home" ? "default" : "ghost"} onClick={() => setActiveTab("home")} className={`flex items-center gap-2 transition-all duration-200 ${activeTab === "home" ? "bg-gradient-primary text-primary-foreground shadow-md" : "hover:bg-primary/10"}`}>
                <Home className="h-4 w-4" />
                Home
              </Button>
              <Button variant="ghost" onClick={() => navigate('/all-programs')} className="flex items-center gap-2 hover:bg-primary/10 transition-all duration-200">
                <List className="h-4 w-4" />
                All Programs
              </Button>
              <Button variant={activeTab === "register" ? "default" : "ghost"} onClick={() => setActiveTab("register")} className={`flex items-center gap-2 transition-all duration-200 ${activeTab === "register" ? "bg-gradient-primary text-primary-foreground shadow-md" : "hover:bg-primary/10"}`}>
                <Briefcase className="h-4 w-4" />
                Register
              </Button>
              <Button variant={activeTab === "check" ? "default" : "ghost"} onClick={() => setActiveTab("check")} className={`flex items-center gap-2 transition-all duration-200 ${activeTab === "check" ? "bg-gradient-primary text-primary-foreground shadow-md" : "hover:bg-primary/10"}`}>
                <Users className="h-4 w-4" />
                Check Status
              </Button>
              <Button variant={activeTab === "admin" ? "default" : "ghost"} onClick={() => setActiveTab("admin")} className={`flex items-center gap-2 transition-all duration-200 ${activeTab === "admin" ? "bg-gradient-primary text-primary-foreground shadow-md" : "hover:bg-primary/10"}`}>
                <Shield className="h-4 w-4" />
                Admin
              </Button>
            </div>
            
            {/* Mobile Navigation */}
            <div className="flex md:hidden space-x-1">
              <Button variant={activeTab === "home" ? "default" : "ghost"} onClick={() => setActiveTab("home")} size="sm" className={activeTab === "home" ? "bg-gradient-primary" : "hover:bg-primary/10"}>
                <Home className="h-4 w-4" />
              </Button>
              <Button variant="ghost" onClick={() => navigate('/all-programs')} size="sm" className="hover:bg-primary/10">
                <List className="h-4 w-4" />
              </Button>
              <Button variant={activeTab === "register" ? "default" : "ghost"} onClick={() => setActiveTab("register")} size="sm" className={activeTab === "register" ? "bg-gradient-primary" : "hover:bg-primary/10"}>
                <Briefcase className="h-4 w-4" />
              </Button>
              <Button variant={activeTab === "check" ? "default" : "ghost"} onClick={() => setActiveTab("check")} size="sm" className={activeTab === "check" ? "bg-gradient-primary" : "hover:bg-primary/10"}>
                <Users className="h-4 w-4" />
              </Button>
              <Button variant={activeTab === "admin" ? "default" : "ghost"} onClick={() => setActiveTab("admin")} size="sm" className={activeTab === "admin" ? "bg-gradient-primary" : "hover:bg-primary/10"}>
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