import React, { useState } from 'react';
import { useTranslation } from '@/contexts/TranslationContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Edit, Check, X } from 'lucide-react';

interface TranslatedTextProps {
  id: string;
  className?: string;
  as?: 'span' | 'div' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p';
  showMalayalam?: boolean;
}

const TranslatedText: React.FC<TranslatedTextProps> = ({ 
  id, 
  className = '', 
  as: Component = 'span',
  showMalayalam = true 
}) => {
  const { getTranslation, updateTranslation, isEditMode } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [editEnglish, setEditEnglish] = useState('');
  const [editMalayalam, setEditMalayalam] = useState('');

  const translation = getTranslation(id);

  const handleEdit = () => {
    setEditEnglish(translation.english);
    setEditMalayalam(translation.malayalam);
    setIsEditing(true);
  };

  const handleSave = () => {
    updateTranslation(id, editEnglish, editMalayalam);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditEnglish('');
    setEditMalayalam('');
  };

  if (isEditMode && translation.editable && isEditing) {
    return (
      <Card className="inline-block min-w-0 max-w-md">
        <CardContent className="p-3 space-y-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground">English:</label>
            <Textarea
              value={editEnglish}
              onChange={(e) => setEditEnglish(e.target.value)}
              className="mt-1 text-sm"
              rows={2}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Malayalam:</label>
            <Textarea
              value={editMalayalam}
              onChange={(e) => setEditMalayalam(e.target.value)}
              className="mt-1 text-sm"
              rows={2}
            />
          </div>
          <div className="flex gap-1 justify-end">
            <Button size="sm" variant="ghost" onClick={handleCancel}>
              <X className="h-3 w-3" />
            </Button>
            <Button size="sm" onClick={handleSave}>
              <Check className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const content = showMalayalam ? (
    <span className="inline-flex flex-col">
      <span className="text-xs leading-tight opacity-75 cursor-pointer">{translation.malayalam}</span>
      <span className="font-medium cursor-pointer">{translation.english}</span>
    </span>
  ) : (
    <span className="cursor-pointer">{translation.english}</span>
  );

  return (
    <Component className={`${className} ${isEditMode && translation.editable ? 'relative group cursor-pointer border border-dashed border-transparent hover:border-primary/50 hover:bg-primary/5 p-1 rounded' : ''}`}>
      {content}
      {isEditMode && translation.editable && (
        <Button
          size="sm"
          variant="ghost"
          className="absolute -top-2 -right-2 h-5 w-5 p-0 opacity-70 hover:opacity-100 transition-opacity bg-primary text-primary-foreground rounded-full"
          onClick={handleEdit}
        >
          <Edit className="h-3 w-3" />
        </Button>
      )}
    </Component>
  );
};

export default TranslatedText;