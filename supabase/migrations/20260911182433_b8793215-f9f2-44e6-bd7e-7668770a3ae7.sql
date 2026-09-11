REVOKE ALL ON FUNCTION public.expirar_prazos_avaliacao() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.expirar_prazos_avaliacao() TO authenticated;