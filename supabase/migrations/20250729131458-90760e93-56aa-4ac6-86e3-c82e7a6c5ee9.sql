-- Create sub_projects table
CREATE TABLE public.sub_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create programs table
CREATE TABLE public.programs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  conditions TEXT,
  category_id UUID NOT NULL,
  sub_project_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.sub_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;

-- Create policies for sub_projects
CREATE POLICY "Allow public read access to sub_projects" 
ON public.sub_projects 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert for sub_projects" 
ON public.sub_projects 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update for sub_projects" 
ON public.sub_projects 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete for sub_projects" 
ON public.sub_projects 
FOR DELETE 
USING (true);

-- Create policies for programs
CREATE POLICY "Allow public read access to programs" 
ON public.programs 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert for programs" 
ON public.programs 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update for programs" 
ON public.programs 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete for programs" 
ON public.programs 
FOR DELETE 
USING (true);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_sub_projects_updated_at
BEFORE UPDATE ON public.sub_projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_programs_updated_at
BEFORE UPDATE ON public.programs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();