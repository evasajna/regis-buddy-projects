-- Create table to track file uploads
CREATE TABLE public.file_uploads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  filename TEXT NOT NULL,
  upload_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  records_count INTEGER NOT NULL DEFAULT 0,
  file_type TEXT NOT NULL,
  uploaded_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.file_uploads ENABLE ROW LEVEL SECURITY;

-- Create policies for file_uploads
CREATE POLICY "Allow public read for file uploads" 
ON public.file_uploads 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert for file uploads" 
ON public.file_uploads 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update for file uploads" 
ON public.file_uploads 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete for file uploads" 
ON public.file_uploads 
FOR DELETE 
USING (true);

-- Add file_upload_id to registered_clients to track which file each record came from
ALTER TABLE public.registered_clients 
ADD COLUMN file_upload_id UUID REFERENCES public.file_uploads(id) ON DELETE CASCADE;

-- Create trigger for updated_at on file_uploads
CREATE TRIGGER update_file_uploads_updated_at
BEFORE UPDATE ON public.file_uploads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();