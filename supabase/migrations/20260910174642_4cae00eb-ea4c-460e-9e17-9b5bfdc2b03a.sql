CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION private.pode_ver_todos(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','gestao_pessoas','comissao'))
$$;

GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION private.pode_ver_todos(uuid) TO authenticated;

DROP POLICY "Usuario ve os proprios papeis" ON public.user_roles;
DROP POLICY "Admin gerencia papeis" ON public.user_roles;
DROP POLICY "Autor e autorizados consultam formularios" ON public.formularios;

CREATE POLICY "Usuario ve os proprios papeis" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id OR private.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin gerencia papeis" ON public.user_roles FOR ALL TO authenticated USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));
CREATE POLICY "Autor e autorizados consultam formularios" ON public.formularios FOR SELECT TO authenticated USING (auth.uid() = created_by OR private.pode_ver_todos(auth.uid()));

DROP FUNCTION public.has_role(uuid, public.app_role);
DROP FUNCTION public.pode_ver_todos(uuid);