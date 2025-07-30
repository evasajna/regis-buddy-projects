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

  // Generate different color combinations for each card based on category ID
  const getCardColors = (categoryId: string) => {
    const colors = [
      {
        border: "border-l-blue-500",
        hoverBorder: "hover:border-l-blue-600",
        background: "hover:from-blue-50 hover:to-blue-100",
        programsBadge: "bg-blue-100 text-blue-800",
        subProjectsBadge: "bg-blue-50 border-blue-200"
      },
      {
        border: "border-l-green-500",
        hoverBorder: "hover:border-l-green-600",
        background: "hover:from-green-50 hover:to-green-100",
        programsBadge: "bg-green-100 text-green-800",
        subProjectsBadge: "bg-green-50 border-green-200"
      },
      {
        border: "border-l-purple-500",
        hoverBorder: "hover:border-l-purple-600",
        background: "hover:from-purple-50 hover:to-purple-100",
        programsBadge: "bg-purple-100 text-purple-800",
        subProjectsBadge: "bg-purple-50 border-purple-200"
      },
      {
        border: "border-l-orange-500",
        hoverBorder: "hover:border-l-orange-600",
        background: "hover:from-orange-50 hover:to-orange-100",
        programsBadge: "bg-orange-100 text-orange-800",
        subProjectsBadge: "bg-orange-50 border-orange-200"
      },
      {
        border: "border-l-red-500",
        hoverBorder: "hover:border-l-red-600",
        background: "hover:from-red-50 hover:to-red-100",
        programsBadge: "bg-red-100 text-red-800",
        subProjectsBadge: "bg-red-50 border-red-200"
      },
      {
        border: "border-l-teal-500",
        hoverBorder: "hover:border-l-teal-600",
        background: "hover:from-teal-50 hover:to-teal-100",
        programsBadge: "bg-teal-100 text-teal-800",
        subProjectsBadge: "bg-teal-50 border-teal-200"
      }
    ];
    
    // Use category ID to consistently assign colors
    const hash = categoryId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const cardColors = getCardColors(category.id);
  const handleViewDetails = () => {
    navigate(`/category/${category.id}`);
  };
  return <Card className={`w-full transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border-l-4 ${cardColors.border} ${cardColors.hoverBorder} bg-gradient-to-r from-card to-card/50 ${cardColors.background}`}>
      <CardHeader className="pb-3 bg-gray-50/50">
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
            <Badge variant="secondary" className={cardColors.programsBadge}>{programs.length} Programs</Badge>
            <Badge variant="outline" className={cardColors.subProjectsBadge}>{subProjects.length} Sub-projects</Badge>
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