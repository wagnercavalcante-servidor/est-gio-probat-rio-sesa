DROP POLICY IF EXISTS "Servidor avaliado responde a avaliacao" ON public.formularios;
CREATE POLICY "Servidor avaliado responde a avaliacao"
ON public.formularios FOR UPDATE TO authenticated
USING (auth.uid() = servidor_user_id AND status IN ('aguardando_servidor','aguardando_servidor_revisao','aguardando_recurso'))
WITH CHECK (auth.uid() = servidor_user_id);