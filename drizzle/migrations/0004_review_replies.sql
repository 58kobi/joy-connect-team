CREATE TABLE public.review_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_key text NOT NULL,
  parent_id uuid REFERENCES public.review_replies(id) ON DELETE CASCADE,
  name text NOT NULL,
  body text NOT NULL,
  likes integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX review_replies_review_key_idx ON public.review_replies(review_key, created_at);
GRANT SELECT, INSERT ON public.review_replies TO anon, authenticated;
GRANT ALL ON public.review_replies TO service_role;
ALTER TABLE public.review_replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read replies" ON public.review_replies FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can post a reply" ON public.review_replies FOR INSERT TO anon, authenticated
  WITH CHECK (likes = 0 AND char_length(review_key) BETWEEN 1 AND 120 AND char_length(name) BETWEEN 1 AND 60 AND char_length(body) BETWEEN 1 AND 500);
CREATE POLICY "Admins delete replies" ON public.review_replies FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
GRANT DELETE ON public.review_replies TO authenticated;

CREATE OR REPLACE FUNCTION public.like_review_reply(_id uuid, _delta integer)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer;
BEGIN
  IF _delta NOT IN (-1, 1) THEN RAISE EXCEPTION 'invalid delta'; END IF;
  UPDATE public.review_replies SET likes = GREATEST(0, likes + _delta) WHERE id = _id RETURNING likes INTO n;
  RETURN n;
END $$;
REVOKE ALL ON FUNCTION public.like_review_reply(uuid, integer) FROM public;
GRANT EXECUTE ON FUNCTION public.like_review_reply(uuid, integer) TO anon, authenticated;
ALTER PUBLICATION supabase_realtime ADD TABLE public.review_replies;