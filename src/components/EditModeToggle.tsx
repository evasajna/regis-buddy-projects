import React from 'react';
import { Button } from '@/components/ui/button';
import { Edit, Check } from 'lucide-react';
import { useTranslation } from '@/contexts/TranslationContext';

const EditModeToggle: React.FC = () => {
  const { isEditMode, setEditMode } = useTranslation();

  return (
    <Button
      variant={isEditMode ? "default" : "outline"}
      size="sm"
      onClick={() => setEditMode(!isEditMode)}
      className="fixed top-20 right-4 z-50 shadow-lg bg-primary text-primary-foreground hover:bg-primary/90"
    >
      {isEditMode ? (
        <>
          <Check className="h-4 w-4 mr-2" />
          Exit Edit
        </>
      ) : (
        <>
          <Edit className="h-4 w-4 mr-2" />
          Edit Text
        </>
      )}
    </Button>
  );
};

export default EditModeToggle;