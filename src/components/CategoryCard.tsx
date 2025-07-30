import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Plus, Edit, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
interface CategoryCardProps {
  category: {
    id: string;
    name: string;
    description?: string;
    is_active: boolean;
  };
  programs: Program[];
  subProjects: SubProject[];
  isAdmin?: boolean;
  onEditCategory?: (category: any) => void;
  onDeleteCategory?: (categoryId: string) => void;
}
const CategoryCard = ({
  category,
  programs,
  subProjects,
  isAdmin = false,
  onEditCategory,
  onDeleteCategory
}: CategoryCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();
  const handleViewDetails = () => {
    navigate(`/category/${category.id}`);
  };
  return <Card className="w-full transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border-l-4 border-l-primary/20 hover:border-l-primary bg-gradient-to-r from-card to-card/50 hover:from-primary/5 hover:to-accent/5">
      <CardHeader className="pb-3 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{category.name}</CardTitle>
            {category.description && <CardDescription className="mt-1">{category.description}</CardDescription>}
          </div>
          {isAdmin && <div className="flex gap-2 ml-4">
              <Button variant="ghost" size="sm" onClick={() => onEditCategory?.(category)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onDeleteCategory?.(category.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>}
        </div>
        
        <div className="flex items-center justify-between mt-3">
          <div className="flex gap-2">
            <Badge variant="secondary">{programs.length} Programs</Badge>
            <Badge variant="outline">{subProjects.length} Sub-projects</Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && <CardContent className="pt-0">
          <div className="space-y-4">
            {programs.length > 0 && <div>
                <h4 className="font-medium text-sm mb-2">Recent Programs:</h4>
                <div className="space-y-2">
                  {programs.slice(0, 3).map(program => <div key={program.id} className="p-2 bg-muted rounded text-sm">
                      <div className="font-medium">{program.name}</div>
                      {program.description && <div className="text-muted-foreground text-xs mt-1">
                          {program.description.substring(0, 100)}...
                        </div>}
                    </div>)}
                </div>
              </div>}

            {subProjects.length > 0 && <div>
                <h4 className="font-medium text-sm mb-2">Sub-projects:</h4>
                <div className="flex flex-wrap gap-1">
                  {subProjects.slice(0, 5).map(subProject => <Badge key={subProject.id} variant="outline" className="text-xs">
                      {subProject.name}
                    </Badge>)}
                  {subProjects.length > 5 && <Badge variant="outline" className="text-xs">
                      +{subProjects.length - 5} more
                    </Badge>}
                </div>
              </div>}

            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={handleViewDetails} className="flex-1">
                View Details
              </Button>
              {isAdmin && <>
                  <Button variant="outline" size="sm" onClick={() => navigate(`/add-program?category=${category.id}`)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Program
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => navigate(`/add-sub-project?category=${category.id}`)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Sub-project
                  </Button>
                </>}
            </div>
          </div>
        </CardContent>}
    </Card>;
};
export default CategoryCard;