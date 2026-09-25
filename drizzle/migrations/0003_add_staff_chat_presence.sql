CREATE TABLE public.staff_chat_presence (
  user_id uuid PRIMARY KEY,
  last_seen_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.staff_chat_presence TO authenticated;
GRANT ALL ON public.staff_chat_presence TO service_role;
ALTER TABLE public.staff_chat_presence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read chat presence"
ON public.staff_chat_presence
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins create own chat presence"
ON public.staff_chat_presence
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update own chat presence"
ON public.staff_chat_presence
FOR UPDATE
TO authenticated
USING (user_id = auth.uid() AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (user_id = auth.uid() AND public.has_role(auth.uid(), 'admin'));
CREATE INDEX staff_chat_presence_last_seen_idx ON public.staff_chat_presence(last_seen_at);