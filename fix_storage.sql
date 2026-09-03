CREATE POLICY "Admins Upload Service Images" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'service-images' AND 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
