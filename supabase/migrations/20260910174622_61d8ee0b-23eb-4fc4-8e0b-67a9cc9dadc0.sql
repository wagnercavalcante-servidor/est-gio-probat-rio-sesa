REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.pode_ver_todos(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.bloqueia_alteracao_formulario() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;