CREATE TABLE public.review_emails (
  review_id uuid PRIMARY KEY REFERENCES public.reviews(id) ON DELETE CASCADE,
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.review_emails TO anon, authenticated;
GRANT SELECT ON public.review_emails TO authenticated;
GRANT ALL ON public.review_emails TO service_role;
ALTER TABLE public.review_emails ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Visitors attach email to a new review" ON public.review_emails FOR INSERT TO anon, authenticated
  WITH CHECK (
    char_length(email) BETWEEN 5 AND 255
    AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND EXISTS (SELECT 1 FROM public.reviews r WHERE r.id = review_id AND r.created_at > now() - interval '5 minutes')
  );
CREATE POLICY "Admins read review emails" ON public.review_emails FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));