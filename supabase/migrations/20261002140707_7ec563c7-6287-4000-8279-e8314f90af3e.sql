INSERT INTO public.user_roles (user_id, role) VALUES ('9c4da119-cf3a-4cd9-aac4-d779c483a4d6','admin') ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.usuario_tem_papel(_uid uuid, _papeis public.app_role[]) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _uid AND role = ANY(_papeis)) $$;
CREATE OR REPLACE FUNCTION public.orgao_do_usuario(_uid uuid) RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT orgao FROM public.profiles WHERE id = _uid $$;

DROP POLICY IF EXISTS "Autenticados podem consultar servidores" ON public.servidores;
CREATE POLICY "Servidores do próprio órgão ou perfis amplos" ON public.servidores FOR SELECT TO authenticated
USING (public.usuario_tem_papel(auth.uid(), ARRAY['admin','gestao_pessoas','comissao']::public.app_role[]) OR orgao = public.orgao_do_usuario(auth.uid()));

DROP POLICY IF EXISTS "Autenticados consultam ciclos" ON public.ciclos_avaliacao;
CREATE POLICY "Ciclos gerais ou do próprio órgão" ON public.ciclos_avaliacao FOR SELECT TO authenticated
USING (public.usuario_tem_papel(auth.uid(), ARRAY['admin']::public.app_role[]) OR (teste = false AND (orgao IS NULL OR orgao = public.orgao_do_usuario(auth.uid()))));

DROP POLICY IF EXISTS "Autenticados consultam etapas" ON public.ciclo_etapas;
CREATE POLICY "Etapas de ciclos visíveis" ON public.ciclo_etapas FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.ciclos_avaliacao c WHERE c.id = ciclo_etapas.ciclo_id));