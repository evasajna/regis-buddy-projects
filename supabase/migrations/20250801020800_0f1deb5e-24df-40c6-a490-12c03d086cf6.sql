-- Add experience and skills columns to employment_registrations table
ALTER TABLE public.employment_registrations 
ADD COLUMN experience TEXT,
ADD COLUMN skills TEXT;