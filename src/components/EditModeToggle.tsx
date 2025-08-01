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
      className="fixed top-4 right-4 z-50 shadow-lg"
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