-- Create registered clients table for uploaded data
CREATE TABLE public.registered_clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  mobile_number TEXT UNIQUE NOT NULL,
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

-- Create employment categories table
CREATE TABLE public.employment_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create employment registrations table
CREATE TABLE public.employment_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.registered_clients(id) NOT NULL,
  category_id UUID REFERENCES public.employment_categories(id) NOT NULL,
  mobile_number TEXT NOT NULL,
  registration_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(client_id, category_id) -- Prevent duplicate applications
);

-- Enable Row Level Security
ALTER TABLE public.registered_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employment_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employment_registrations ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (will be restricted later with admin auth)
CREATE POLICY "Allow public read access to employment categories" 
ON public.employment_categories 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Allow public read access to check registration eligibility" 
ON public.registered_clients 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert for employment registrations" 
ON public.employment_registrations 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public read for own registrations" 
ON public.employment_registrations 
FOR SELECT 
USING (true);

-- Insert default employment categories
INSERT INTO public.employment_categories (name, description) VALUES 
('farmelife', 'Farming and Agriculture related employment'),
('organelife', 'Organic farming and sustainable agriculture'),
('foodelife', 'Food processing and related services'),
('entrelife', 'Entrepreneurship and business development'),
('jobcard', 'General employment for job card holders');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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