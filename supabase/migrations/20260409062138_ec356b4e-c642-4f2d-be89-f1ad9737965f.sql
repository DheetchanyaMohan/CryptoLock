
-- Create security definer function to check if user is a recipient of a message
CREATE OR REPLACE FUNCTION public.is_message_recipient(_message_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.message_recipients
    WHERE message_id = _message_id AND recipient_id = _user_id
  );
$$;

-- Create security definer function to check if user is sender of a message
CREATE OR REPLACE FUNCTION public.is_message_sender(_message_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.messages
    WHERE id = _message_id AND sender_id = _user_id
  );
$$;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Recipients can view messages" ON public.messages;
DROP POLICY IF EXISTS "Senders can view own sent messages" ON public.messages;
DROP POLICY IF EXISTS "Senders can insert messages" ON public.messages;

DROP POLICY IF EXISTS "Recipients can view own entries" ON public.message_recipients;
DROP POLICY IF EXISTS "Recipients can update own entries" ON public.message_recipients;
DROP POLICY IF EXISTS "Senders can add recipients" ON public.message_recipients;
DROP POLICY IF EXISTS "Senders can view recipients of own messages" ON public.message_recipients;

-- Recreate messages policies using security definer function
CREATE POLICY "Recipients can view messages"
ON public.messages FOR SELECT TO authenticated
USING (public.is_message_recipient(id, auth.uid()));

CREATE POLICY "Senders can view own sent messages"
ON public.messages FOR SELECT TO authenticated
USING (sender_id = auth.uid());

CREATE POLICY "Senders can insert messages"
ON public.messages FOR INSERT TO authenticated
WITH CHECK (sender_id = auth.uid());

-- Recreate message_recipients policies using security definer function
CREATE POLICY "Recipients can view own entries"
ON public.message_recipients FOR SELECT TO authenticated
USING (recipient_id = auth.uid());

CREATE POLICY "Recipients can update own entries"
ON public.message_recipients FOR UPDATE TO authenticated
USING (recipient_id = auth.uid());

CREATE POLICY "Senders can add recipients"
ON public.message_recipients FOR INSERT TO authenticated
WITH CHECK (public.is_message_sender(message_id, auth.uid()));

CREATE POLICY "Senders can view recipients of own messages"
ON public.message_recipients FOR SELECT TO authenticated
USING (public.is_message_sender(message_id, auth.uid()));
