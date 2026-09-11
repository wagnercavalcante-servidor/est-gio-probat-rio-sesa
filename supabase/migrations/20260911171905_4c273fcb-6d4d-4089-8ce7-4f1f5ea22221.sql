ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'chefia_imediata';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'chefia_mediata';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'par';

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS orgao text;

CREATE OR REPLACE FUNCTION public.listar_orgaos()
RETURNS TABLE (orgao text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT s.orgao FROM public.servidores s ORDER BY 1
$$;

GRANT EXECUTE ON FUNCTION public.listar_orgaos() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role_text text := COALESCE(NEW.raw_user_meta_data ->> 'perfil', 'avaliador');
  _role public.app_role;
BEGIN
  IF _role_text NOT IN ('gestao_pessoas','comissao','avaliador','chefia_imediata','chefia_mediata','par') THEN
    _role_text := 'avaliador';
  END IF;
  _role := _role_text::public.app_role;

  INSERT INTO public.profiles (id, nome_completo, email, orgao)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'nome_completo', NEW.email, NEW.raw_user_meta_data ->> 'orgao')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _role)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;