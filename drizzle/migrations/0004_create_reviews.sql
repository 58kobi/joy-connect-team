CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  rating integer NOT NULL,
  title text,
  body text NOT NULL,
  approved boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read approved reviews"
ON public.reviews FOR SELECT TO anon
USING (approved = true);

CREATE POLICY "Anyone can submit a review"
ON public.reviews FOR INSERT TO anon
WITH CHECK (
  rating BETWEEN 1 AND 5
  AND char_length(name) BETWEEN 2 AND 80
  AND char_length(body) BETWEEN 10 AND 1000
  AND (title IS NULL OR char_length(title) <= 120)
);

CREATE POLICY "Admins read all reviews"
ON public.reviews FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins moderate reviews"
ON public.reviews FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete reviews"
ON public.reviews FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));