CREATE TABLE public.servidores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  orgao text NOT NULL,
  nome text NOT NULL,
  matricula text NOT NULL UNIQUE,
  ano_admissao integer,
  mes_admissao text,
  data_inicio_exercicio date,
  cargo text,
  vinculo text,
  subtipo_vinculo text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_servidores_nome ON public.servidores (nome);
GRANT SELECT ON public.servidores TO authenticated;
GRANT ALL ON public.servidores TO service_role;
ALTER TABLE public.servidores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Autenticados podem consultar servidores" ON public.servidores FOR SELECT TO authenticated USING (true);

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_completo text,
  email text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuario ve o proprio perfil" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Usuario atualiza o proprio perfil" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Usuario cria o proprio perfil" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE TYPE public.app_role AS ENUM ('admin', 'gestao_pessoas', 'comissao', 'avaliador');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.pode_ver_todos(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin','gestao_pessoas','comissao')
  )
$$;

CREATE POLICY "Usuario ve os proprios papeis" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin gerencia papeis" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.formularios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL CHECK (tipo IN ('FAPEP1','FAPEP2','FAFEP','RAEP','FADA')),
  servidor_nome text NOT NULL,
  servidor_matricula text,
  orgao text,
  numero_avaliacao integer,
  dados jsonb NOT NULL,
  pontuacao numeric,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_formularios_created_by ON public.formularios (created_by);
CREATE INDEX idx_formularios_matricula ON public.formularios (servidor_matricula);
GRANT SELECT, INSERT ON public.formularios TO authenticated;
GRANT ALL ON public.formularios TO service_role;
ALTER TABLE public.formularios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Autor e autorizados consultam formularios" ON public.formularios FOR SELECT TO authenticated USING (auth.uid() = created_by OR public.pode_ver_todos(auth.uid()));
CREATE POLICY "Autenticados registram formularios" ON public.formularios FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE OR REPLACE FUNCTION public.bloqueia_alteracao_formulario()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'Formulários salvos não podem ser alterados ou excluídos.';
END;
$$;
CREATE TRIGGER formularios_imutaveis
BEFORE UPDATE OR DELETE ON public.formularios
FOR EACH ROW EXECUTE FUNCTION public.bloqueia_alteracao_formulario();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome_completo, email)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'nome_completo', NEW.email)
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'avaliador')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();