-- Add avatar column to characters
ALTER TABLE public.characters ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Create storage bucket for character avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('character-avatars', 'character-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view avatars (public bucket)
CREATE POLICY "Anyone can view character avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'character-avatars');

-- Allow anyone to upload avatars (since we don't have auth yet)
CREATE POLICY "Anyone can upload character avatars"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'character-avatars');

-- Allow anyone to update avatars
CREATE POLICY "Anyone can update character avatars"
ON storage.objects FOR UPDATE
USING (bucket_id = 'character-avatars');

-- Allow anyone to delete avatars
CREATE POLICY "Anyone can delete character avatars"
ON storage.objects FOR DELETE
USING (bucket_id = 'character-avatars');