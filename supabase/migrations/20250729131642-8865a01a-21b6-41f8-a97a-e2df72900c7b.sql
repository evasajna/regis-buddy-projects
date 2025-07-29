-- Add foreign key constraints that were missing
ALTER TABLE public.sub_projects 
ADD CONSTRAINT fk_sub_projects_category 
FOREIGN KEY (category_id) REFERENCES public.employment_categories(id) ON DELETE CASCADE;

ALTER TABLE public.programs 
ADD CONSTRAINT fk_programs_category 
FOREIGN KEY (category_id) REFERENCES public.employment_categories(id) ON DELETE CASCADE;

ALTER TABLE public.programs 
ADD CONSTRAINT fk_programs_sub_project 
FOREIGN KEY (sub_project_id) REFERENCES public.sub_projects(id) ON DELETE SET NULL;