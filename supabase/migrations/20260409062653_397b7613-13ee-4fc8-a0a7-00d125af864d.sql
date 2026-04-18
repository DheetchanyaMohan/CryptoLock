
-- Create storage bucket for steganography images
INSERT INTO storage.buckets (id, name, public) VALUES ('stego-images', 'stego-images', true);

-- Allow authenticated users to upload stego images
CREATE POLICY "Authenticated users can upload stego images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'stego-images');

-- Allow public read access to stego images
CREATE POLICY "Public read access for stego images"
ON storage.objects FOR SELECT
USING (bucket_id = 'stego-images');

-- Allow users to delete their own uploaded stego images
CREATE POLICY "Users can delete own stego images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'stego-images' AND auth.uid()::text = (storage.foldername(name))[1]);
