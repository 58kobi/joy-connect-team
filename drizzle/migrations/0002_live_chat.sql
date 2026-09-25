CREATE TYPE public.chat_status AS ENUM ('ai','waiting','active','handled');
CREATE TYPE public.chat_sender AS ENUM ('customer','ai','staff','system','note');

CREATE TABLE public.chat_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  customer_name text,
  email text,
  phone text,
  order_number text,
  issue text,
  status public.chat_status NOT NULL DEFAULT 'ai',
  mode text NOT NULL DEFAULT 'ai' CHECK (mode IN ('ai','human')),
  assigned_to uuid,
  unread_staff integer NOT NULL DEFAULT 0,
  last_message text,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.chat_conversations TO authenticated;
GRANT ALL ON public.chat_conversations TO service_role;
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read chats" ON public.chat_conversations FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update chats" ON public.chat_conversations FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  sender public.chat_sender NOT NULL,
  body text NOT NULL,
  staff_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX chat_messages_conv_idx ON public.chat_messages(conversation_id, created_at);
GRANT SELECT ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_messages TO service_role;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read chat messages" ON public.chat_messages FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;