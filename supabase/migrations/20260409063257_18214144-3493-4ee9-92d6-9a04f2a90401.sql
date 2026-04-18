
ALTER TABLE public.messages DROP CONSTRAINT messages_lock_type_check;
ALTER TABLE public.messages ADD CONSTRAINT messages_lock_type_check CHECK (lock_type = ANY (ARRAY['time_lock'::text, 'color_sequence'::text, 'secret_code'::text, 'math_quiz'::text, 'steganography'::text]));
