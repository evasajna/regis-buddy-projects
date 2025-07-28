-- Create registered_clients table for storing client data
CREATE TABLE public.registered_clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id TEXT NOT NULL,
  name TEXT NOT NULL,
  mobile_number TEXT NOT NULL,
  address TEXT,
  category TEXT,
  panchayath TEXT,
  district TEXT,
  ward TEXT,
  agent_pro TEXT,
  preference TEXT,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create employment_categories table
CREATE TABLE public.employment_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create employment_registrations table
CREATE TABLE public.employment_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  category_id UUID NOT NULL,
  mobile_number TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  registration_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Foreign key constraints
  CONSTRAINT fk_employment_registrations_client_id 
    FOREIGN KEY (client_id) REFERENCES public.registered_clients(id),
  CONSTRAINT fk_employment_registrations_category_id 
    FOREIGN KEY (category_id) REFERENCES public.employment_categories(id)
);

-- Enable Row Level Security
ALTER TABLE public.registered_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employment_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employment_registrations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for registered_clients (public read access for registration checks)
CREATE POLICY "Allow public read access to check registration eligibility" 
ON public.registered_clients 
FOR SELECT 
USING (true);

-- Create RLS policies for employment_categories (public read access for active categories)
CREATE POLICY "Allow public read access to employment categories" 
ON public.employment_categories 
FOR SELECT 
USING (is_active = true);

-- Create RLS policies for employment_registrations
CREATE POLICY "Allow public read for own registrations" 
ON public.employment_registrations 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert for employment registrations" 
ON public.employment_registrations 
FOR INSERT 
WITH CHECK (true);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_registered_clients_updated_at
  BEFORE UPDATE ON public.registered_clients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employment_categories_updated_at
  BEFORE UPDATE ON public.employment_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employment_registrations_updated_at
  BEFORE UPDATE ON public.employment_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();