-- Add avatar_url column to dogs table for storing dog profile photos
ALTER TABLE dogs ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Create storage bucket for profile photos if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for dog photos if it doesn't exist  
INSERT INTO storage.buckets (id, name, public) 
VALUES ('dog-photos', 'dog-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for profile photos
CREATE POLICY "Users can upload their own profile photos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'profile-photos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own profile photos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'profile-photos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own profile photos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'profile-photos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Profile photos are publicly viewable" ON storage.objects
FOR SELECT USING (bucket_id = 'profile-photos');

-- Create storage policies for dog photos
CREATE POLICY "Users can upload photos for their own dogs" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'dog-photos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update photos for their own dogs" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'dog-photos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete photos for their own dogs" ON storage.objects
FOR DELETE USING (
  bucket_id = 'dog-photos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Dog photos are publicly viewable" ON storage.objects
FOR SELECT USING (bucket_id = 'dog-photos');
