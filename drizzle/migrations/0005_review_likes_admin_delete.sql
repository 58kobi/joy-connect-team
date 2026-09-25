ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS likes integer NOT NULL DEFAULT 0;
GRANT SELECT, INSERT ON public.reviews TO anon, authenticated;
GRANT UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
DROP POLICY IF EXISTS "Signed-in can read approved reviews" ON public.reviews;
CREATE POLICY "Signed-in can read approved reviews" ON public.reviews FOR SELECT TO authenticated USING (approved = true);
DROP POLICY IF EXISTS "Signed-in can submit a review" ON public.reviews;
CREATE POLICY "Signed-in can submit a review" ON public.reviews FOR INSERT TO authenticated
  WITH CHECK (likes = 0 AND rating BETWEEN 1 AND 5 AND char_length(name) BETWEEN 2 AND 80 AND char_length(body) BETWEEN 10 AND 1000 AND (title IS NULL OR char_length(title) <= 120));

CREATE OR REPLACE FUNCTION public.like_review(_id uuid, _delta integer)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer;
BEGIN
  IF _delta NOT IN (-1, 1) THEN RAISE EXCEPTION 'invalid delta'; END IF;
  UPDATE public.reviews SET likes = GREATEST(0, likes + _delta) WHERE id = _id AND approved = true RETURNING likes INTO n;
  RETURN n;
END $$;
REVOKE ALL ON FUNCTION public.like_review(uuid, integer) FROM public;
GRANT EXECUTE ON FUNCTION public.like_review(uuid, integer) TO anon, authenticated;

ALTER TABLE public.reviews REPLICA IDENTITY FULL;
ALTER TABLE public.review_replies REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reviews;