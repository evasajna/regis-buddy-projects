-- Add INSERT policy for registered_clients to allow admin uploads
CREATE POLICY "Allow public insert for admin uploads" 
ON public.registered_clients 
FOR INSERT 
WITH CHECK (true);

-- Also add UPDATE policy for admin operations
CREATE POLICY "Allow public update for admin operations" 
ON public.registered_clients 
FOR UPDATE 
USING (true);

-- Add DELETE policy for admin operations  
CREATE POLICY "Allow public delete for admin operations" 
ON public.registered_clients 
FOR DELETE 
USING (true);

-- Add admin policies for employment_categories
CREATE POLICY "Allow public insert for employment categories" 
ON public.employment_categories 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update for employment categories" 
ON public.employment_categories 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete for employment categories" 
ON public.employment_categories 
FOR DELETE 
USING (true);

-- Add admin policies for employment_registrations
CREATE POLICY "Allow public update for employment registrations" 
ON public.employment_registrations 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete for employment registrations" 
ON public.employment_registrations 
FOR DELETE 
USING (true);