ALTER TABLE public.formularios
  ADD COLUMN IF NOT EXISTS codigo_verificacao text
  GENERATED ALWAYS AS (upper(substr(replace(id::text, '-', ''), 1, 4) || '-' || substr(replace(id::text, '-', ''), 5, 4) || '-' || substr(replace(id::text, '-', ''), 9, 4))) STORED;

CREATE INDEX IF NOT EXISTS formularios_codigo_verificacao_idx ON public.formularios (codigo_verificacao);

CREATE OR REPLACE FUNCTION private.pode_ver_formulario(_uid uuid, _form uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, private
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.formularios f
    WHERE f.id = _form
      AND (f.created_by = _uid OR f.servidor_user_id = _uid OR private.pode_ver_todos(_uid))
  )
$$;

CREATE TABLE IF NOT EXISTS public.assinaturas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  formulario_id uuid NOT NULL REFERENCES public.formularios(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo_assinatura text NOT NULL,
  nome text NOT NULL,
  matricula text,
  perfil text,
  email text,
  assinado_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE (formulario_id, user_id, tipo_assinatura)
);

GRANT SELECT, INSERT ON public.assinaturas TO authenticated;
GRANT ALL ON public.assinaturas TO service_role;

ALTER TABLE public.assinaturas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participantes assinam o formulario" ON public.assinaturas;
CREATE POLICY "Participantes assinam o formulario"
ON public.assinaturas FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND private.pode_ver_formulario(auth.uid(), formulario_id));

DROP POLICY IF EXISTS "Autorizados consultam assinaturas" ON public.assinaturas;
CREATE POLICY "Autorizados consultam assinaturas"
ON public.assinaturas FOR SELECT TO authenticated
USING (private.pode_ver_formulario(auth.uid(), formulario_id));

CREATE OR REPLACE FUNCTION public.bloqueia_alteracao_assinatura()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'Assinaturas eletronicas nao podem ser alteradas ou excluidas.';
END;
$$;

DROP TRIGGER IF EXISTS assinaturas_bloqueia_alteracao ON public.assinaturas;
CREATE TRIGGER assinaturas_bloqueia_alteracao
BEFORE UPDATE OR DELETE ON public.assinaturas
FOR EACH ROW EXECUTE FUNCTION public.bloqueia_alteracao_assinatura();

CREATE OR REPLACE FUNCTION public.verificar_documento(_codigo text)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT jsonb_build_object(
        'encontrado', true,
        'codigo', f.codigo_verificacao,
        'tipo', f.tipo,
        'orgao', f.orgao,
        'servidor_nome', f.servidor_nome,
        'numero_avaliacao', f.numero_avaliacao,
        'status', f.status,
        'registrado_em', f.created_at,
        'assinaturas', COALESCE((
          SELECT jsonb_agg(jsonb_build_object(
            'nome', a.nome,
            'perfil', a.perfil,
            'tipo_assinatura', a.tipo_assinatura,
            'assinado_em', a.assinado_em
          ) ORDER BY a.assinado_em)
          FROM public.assinaturas a WHERE a.formulario_id = f.id
        ), '[]'::jsonb)
      )
      FROM public.formularios f
      WHERE f.codigo_verificacao = upper(regexp_replace(coalesce(_codigo,''), '[^0-9A-Za-z-]', '', 'g'))
      LIMIT 1
    ),
    jsonb_build_object('encontrado', false)
  )
$$;

REVOKE ALL ON FUNCTION public.verificar_documento(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verificar_documento(text) TO anon, authenticated;