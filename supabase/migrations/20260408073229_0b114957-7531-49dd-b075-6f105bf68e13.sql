
-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles viewable by authenticated users" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Create messages table (policies that reference message_recipients added later)
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  lock_type TEXT NOT NULL CHECK (lock_type IN ('time_lock', 'color_sequence', 'secret_code', 'math_quiz')),
  lock_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_encrypted BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Senders can insert messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Senders can view own sent messages" ON public.messages FOR SELECT TO authenticated USING (auth.uid() = sender_id);

-- Create message_recipients table
CREATE TABLE public.message_recipients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_unlocked BOOLEAN NOT NULL DEFAULT false,
  unlocked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(message_id, recipient_id)
);

ALTER TABLE public.message_recipients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Senders can add recipients" ON public.message_recipients FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.messages WHERE id = message_id AND sender_id = auth.uid())
);
CREATE POLICY "Recipients can view own entries" ON public.message_recipients FOR SELECT TO authenticated USING (recipient_id = auth.uid());
CREATE POLICY "Senders can view recipients of own messages" ON public.message_recipients FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.messages WHERE id = message_id AND sender_id = auth.uid())
);
CREATE POLICY "Recipients can update own entries" ON public.message_recipients FOR UPDATE TO authenticated USING (recipient_id = auth.uid());

-- NOW add the messages policy that references message_recipients
CREATE POLICY "Recipients can view messages" ON public.messages FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.message_recipients WHERE message_id = messages.id AND recipient_id = auth.uid())
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON public.messages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
