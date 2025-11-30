-- Add phone column to asesoras table
ALTER TABLE public.asesoras 
ADD COLUMN IF NOT EXISTS phone text;

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'asesoras';
