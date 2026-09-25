DROP POLICY IF EXISTS "Anyone can read tracking by token" ON public.claim_tracking;

REVOKE ALL ON public.claim_tracking FROM anon;
REVOKE ALL ON public.claim_tracking FROM authenticated;
GRANT ALL ON public.claim_tracking TO service_role;

CREATE POLICY "Admins read claim tracking"
  ON public.claim_tracking FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

GRANT SELECT ON public.claim_tracking TO authenticated;