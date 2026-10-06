ALTER TABLE public.servidores ADD COLUMN IF NOT EXISTS datas_avaliacoes date[];
CREATE UNIQUE INDEX IF NOT EXISTS servidores_orgao_matricula_key ON public.servidores (orgao, matricula);
GRANT ALL ON public.servidores TO service_role;
GRANT SELECT ON public.servidores TO authenticated;