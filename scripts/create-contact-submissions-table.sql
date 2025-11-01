-- Migration: Create contact_submissions table
-- Description: Stores contact form submissions from the website

-- Create the contact_submissions table
CREATE TABLE IF NOT EXISTS public.contact_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL CHECK (subject IN ('general', 'order', 'nutrition', 'partnership', 'other')),
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'closed')),
    notes TEXT,
    responded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at ON public.contact_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_status ON public.contact_submissions(status);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_email ON public.contact_submissions(email);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER set_contact_submissions_updated_at
    BEFORE UPDATE ON public.contact_submissions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Enable Row Level Security
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to insert (for public contact form)
CREATE POLICY "Allow public insert" ON public.contact_submissions
    FOR INSERT
    TO public
    WITH CHECK (true);

-- Policy: Only authenticated users with admin role can view submissions
-- Note: You'll need to adjust this based on your auth setup
-- For now, allowing authenticated users to view all
CREATE POLICY "Allow authenticated users to view" ON public.contact_submissions
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy: Only authenticated users can update submissions (for status tracking)
CREATE POLICY "Allow authenticated users to update" ON public.contact_submissions
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Grant necessary permissions
GRANT INSERT ON public.contact_submissions TO anon;
GRANT SELECT, UPDATE ON public.contact_submissions TO authenticated;

-- Add comment to table
COMMENT ON TABLE public.contact_submissions IS 'Stores contact form submissions from the website with tracking and admin management capabilities';
