import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Translation {
  id: string;
  english: string;
  malayalam: string;
  editable?: boolean;
}

interface TranslationContextType {
  translations: Record<string, Translation>;
  updateTranslation: (id: string, english: string, malayalam: string) => void;
  getTranslation: (id: string) => Translation;
  isEditMode: boolean;
  setEditMode: (mode: boolean) => void;
}

const defaultTranslations: Record<string, Translation> = {
  // Navigation
  'nav.home': {
    id: 'nav.home',
    english: 'Home',
    malayalam: 'ഹോം',
    editable: true
  },
  'nav.allPrograms': {
    id: 'nav.allPrograms',
    english: 'All Programs',
    malayalam: 'എല്ലാ പ്രോഗ്രാമുകൾ',
    editable: true
  },
  'nav.checkStatus': {
    id: 'nav.checkStatus',
    english: 'Check Status',
    malayalam: 'സ്റ്റാറ്റസ് പരിശോധിക്കുക',
    editable: true
  },
  'nav.admin': {
    id: 'nav.admin',
    english: 'Admin',
    malayalam: 'അഡ്മിൻ',
    editable: true
  },
  'nav.logout': {
    id: 'nav.logout',
    english: 'Logout',
    malayalam: 'ലോഗൗട്ട്',
    editable: true
  },
  'nav.adminLogin': {
    id: 'nav.adminLogin',
    english: 'Admin Login',
    malayalam: 'അഡ്മിൻ ലോഗിൻ',
    editable: true
  },

  // Hero Section
  'hero.title1': {
    id: 'hero.title1',
    english: 'Transform Your Career',
    malayalam: 'നിങ്ങളുടെ കരിയർ മാറ്റിമറിക്കുക',
    editable: true
  },
  'hero.title2': {
    id: 'hero.title2',
    english: 'with E-Life Society',
    malayalam: 'ഇ-ലൈഫ് സൊസൈറ്റിയുമായി',
    editable: true
  },
  'hero.subtitle': {
    id: 'hero.subtitle',
    english: 'Discover exclusive employment opportunities, professional development programs, and career advancement resources tailored to your success.',
    malayalam: 'നിങ്ങളുടെ വിജയത്തിനായി രൂപകൽപ്പന ചെയ്ത എക്സ്ക്ലൂസീവ് തൊഴിൽ അവസരങ്ങൾ, പ്രൊഫഷണൽ വികസന പ്രോഗ്രാമുകൾ, കരിയർ പുരോഗതി വിഭവങ്ങൾ എന്നിവ കണ്ടെത്തുക.',
    editable: true
  },
  'hero.addNewProgram': {
    id: 'hero.addNewProgram',
    english: 'Add New Program',
    malayalam: 'പുതിയ പ്രോഗ്രാം ചേർക്കുക',
    editable: true
  },
  'hero.viewAllPrograms': {
    id: 'hero.viewAllPrograms',
    english: 'View All Programs',
    malayalam: 'എല്ലാ പ്രോഗ്രാമുകളും കാണുക',
    editable: true
  },
  'hero.checkStatus': {
    id: 'hero.checkStatus',
    english: 'Check Status',
    malayalam: 'സ്റ്റാറ്റസ് പരിശോധിക്കുക',
    editable: true
  },

  // Categories Section
  'categories.title': {
    id: 'categories.title',
    english: 'Employment Categories',
    malayalam: 'തൊഴിൽ വിഭാഗങ്ങൾ',
    editable: true
  },
  'categories.subtitle': {
    id: 'categories.subtitle',
    english: 'Explore our comprehensive range of employment programs designed to match your skills and aspirations',
    malayalam: 'നിങ്ങളുടെ കഴിവുകളും അഭിലാഷങ്ങളും പൊരുത്തപ്പെടുത്തുന്നതിനായി രൂപകൽപ്പന ചെയ്ത ഞങ്ങളുടെ സമഗ്രമായ തൊഴിൽ പ്രോഗ്രാമുകൾ പര്യവേക്ഷണം ചെയ്യുക',
    editable: true
  },
  'categories.noCategories': {
    id: 'categories.noCategories',
    english: 'No Categories Available',
    malayalam: 'വിഭാഗങ്ങൾ ലഭ്യമല്ല',
    editable: true
  },
  'categories.noCategoriesDesc': {
    id: 'categories.noCategoriesDesc',
    english: 'Start by creating your first employment category',
    malayalam: 'നിങ്ങളുടെ ആദ്യത്തെ തൊഴിൽ വിഭാഗം സൃഷ്ടിക്കുന്നതിലൂടെ ആരംഭിക്കുക',
    editable: true
  },
  'categories.createCategory': {
    id: 'categories.createCategory',
    english: 'Create Category',
    malayalam: 'വിഭാഗം സൃഷ്ടിക്കുക',
    editable: true
  },

  // Card Actions
  'card.programs': {
    id: 'card.programs',
    english: 'Programs',
    malayalam: 'പ്രോഗ്രാമുകൾ',
    editable: true
  },
  'card.subProjects': {
    id: 'card.subProjects',
    english: 'Sub-projects',
    malayalam: 'ഉപ-പദ്ധതികൾ',
    editable: true
  },
  'card.recentPrograms': {
    id: 'card.recentPrograms',
    english: 'Recent Programs:',
    malayalam: 'സമീപകാല പ്രോഗ്രാമുകൾ:',
    editable: true
  },
  'card.viewDetails': {
    id: 'card.viewDetails',
    english: 'View Details',
    malayalam: 'വിശദാംശങ്ങൾ കാണുക',
    editable: true
  },
  'card.program': {
    id: 'card.program',
    english: 'Program',
    malayalam: 'പ്രോഗ്രാം',
    editable: true
  },
  'card.subProject': {
    id: 'card.subProject',
    english: 'Sub-project',
    malayalam: 'ഉപ-പദ്ധതി',
    editable: true
  },

  // Common Actions
  'common.back': {
    id: 'common.back',
    english: 'Back',
    malayalam: 'തിരിച്ച്',
    editable: true
  },
  'common.edit': {
    id: 'common.edit',
    english: 'Edit',
    malayalam: 'എഡിറ്റ്',
    editable: true
  },
  'common.delete': {
    id: 'common.delete',
    english: 'Delete',
    malayalam: 'ഇല്ലാതാക്കുക',
    editable: true
  },
  'common.loading': {
    id: 'common.loading',
    english: 'Loading...',
    malayalam: 'ലോഡിംഗ്...',
    editable: true
  },
  'common.error': {
    id: 'common.error',
    english: 'Error',
    malayalam: 'പിശക്',
    editable: true
  },
  'common.success': {
    id: 'common.success',
    english: 'Success',
    malayalam: 'വിജയം',
    editable: true
  },

  // Employment Registration
  'employment.title': {
    id: 'employment.title',
    english: 'Employment Registration',
    malayalam: 'തൊഴിൽ രജിസ്ട്രേഷൻ',
    editable: true
  },
  'employment.description': {
    id: 'employment.description',
    english: 'Register for employment opportunities with E-Life Society',
    malayalam: 'ഇ-ലൈഫ് സൊസൈറ്റിയുമായി തൊഴിൽ അവസരങ്ങൾക്കായി രജിസ്റ്റർ ചെയ്യുക',
    editable: true
  },
  'employment.mobileNumber': {
    id: 'employment.mobileNumber',
    english: 'Mobile Number',
    malayalam: 'മൊബൈൽ നമ്പർ',
    editable: true
  },
  'employment.verifyMobile': {
    id: 'employment.verifyMobile',
    english: 'Verify Mobile Number',
    malayalam: 'മൊബൈൽ നമ്പർ സാധൂകരിക്കുക',
    editable: true
  },
  'employment.selectCategory': {
    id: 'employment.selectCategory',
    english: 'Select Employment Category',
    malayalam: 'തൊഴിൽ വിഭാഗം തിരഞ്ഞെടുക്കുക',
    editable: true
  },
  'employment.submitRegistration': {
    id: 'employment.submitRegistration',
    english: 'Submit Registration',
    malayalam: 'രജിസ്ട്രേഷൻ സമർപ്പിക്കുക',
    editable: true
  },

  // Brand
  'brand.name': {
    id: 'brand.name',
    english: 'E-Life Society',
    malayalam: 'ഇ-ലൈഫ് സൊസൈറ്റി',
    editable: true
  }
};

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export const TranslationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [translations, setTranslations] = useState<Record<string, Translation>>(defaultTranslations);
  const [isEditMode, setEditMode] = useState(false);

  const updateTranslation = (id: string, english: string, malayalam: string) => {
    setTranslations(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        english,
        malayalam
      }
    }));
  };

  const getTranslation = (id: string): Translation => {
    return translations[id] || {
      id,
      english: id,
      malayalam: id,
      editable: true
    };
  };

  return (
    <TranslationContext.Provider value={{
      translations,
      updateTranslation,
      getTranslation,
      isEditMode,
      setEditMode
    }}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};