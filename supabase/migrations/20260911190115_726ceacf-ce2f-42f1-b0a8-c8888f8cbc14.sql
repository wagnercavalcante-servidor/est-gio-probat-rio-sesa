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
        'servidor_nome', (
          SELECT string_agg(
            CASE WHEN ord = 1 THEN parte ELSE upper(substr(parte, 1, 1)) || '.' END, ' ' ORDER BY ord
          )
          FROM unnest(string_to_array(btrim(f.servidor_nome), ' ')) WITH ORDINALITY AS t(parte, ord)
          WHERE parte <> ''
        ),
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