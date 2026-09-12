CREATE TYPE public.etapa_avaliacao AS ENUM (
  'avaliacao_chefia',
  'avaliacao_pares',
  'ciencia_servidor',
  'pedido_reconsideracao',
  'resposta_chefia',
  'ciencia_resposta_chefia',
  'recurso_comissao_setorial',
  'resposta_comissao_setorial',
  'ciencia_resposta_setorial',
  'recurso_comissao_central'
);

CREATE TABLE public.ciclos_avaliacao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  numero_avaliacao integer,
  orgao text,
  ativo boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ciclos_avaliacao TO authenticated;
GRANT ALL ON public.ciclos_avaliacao TO service_role;
ALTER TABLE public.ciclos_avaliacao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados consultam ciclos" ON public.ciclos_avaliacao
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin gerencia ciclos" ON public.ciclos_avaliacao
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TABLE public.ciclo_etapas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ciclo_id uuid NOT NULL REFERENCES public.ciclos_avaliacao(id) ON DELETE CASCADE,
  etapa public.etapa_avaliacao NOT NULL,
  data_inicio date,
  data_fim date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (ciclo_id, etapa)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ciclo_etapas TO authenticated;
GRANT ALL ON public.ciclo_etapas TO service_role;
ALTER TABLE public.ciclo_etapas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados consultam etapas" ON public.ciclo_etapas
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin gerencia etapas" ON public.ciclo_etapas
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER ciclos_avaliacao_updated_at BEFORE UPDATE ON public.ciclos_avaliacao
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER ciclo_etapas_updated_at BEFORE UPDATE ON public.ciclo_etapas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.prazo_etapa(_orgao text, _numero integer, _etapa public.etapa_avaliacao)
RETURNS timestamptz
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (e.data_fim + interval '23 hours 59 minutes')::timestamptz
  FROM public.ciclo_etapas e
  JOIN public.ciclos_avaliacao c ON c.id = e.ciclo_id
  WHERE e.etapa = _etapa
    AND e.data_fim IS NOT NULL
    AND c.ativo
    AND (c.orgao IS NULL OR c.orgao = _orgao)
    AND (c.numero_avaliacao IS NULL OR c.numero_avaliacao = _numero)
  ORDER BY (c.orgao IS NOT NULL) DESC, (c.numero_avaliacao IS NOT NULL) DESC, c.created_at DESC
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.preparar_fluxo_formulario()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  _uid uuid;
  _prazo timestamptz;
BEGIN
  IF NEW.tipo IN ('FAPEP1','FAPEP2') THEN
    SELECT p.id INTO _uid
    FROM public.profiles p
    JOIN public.user_roles ur ON ur.user_id = p.id AND ur.role = 'servidor'::public.app_role
    WHERE p.matricula IS NOT NULL
      AND p.matricula = NEW.servidor_matricula
    LIMIT 1;

    NEW.servidor_user_id := _uid;
    IF _uid IS NULL THEN
      NEW.status := 'aguardando_homologacao';
      NEW.prazo_resposta := NULL;
    ELSE
      NEW.status := 'aguardando_servidor';
      _prazo := public.prazo_etapa(NEW.orgao, NEW.numero_avaliacao, 'ciencia_servidor'::public.etapa_avaliacao);
      NEW.prazo_resposta := COALESCE(_prazo, public.prazo_dias_uteis(now(), 3));
    END IF;
  ELSE
    NEW.status := 'concluido';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$function$;
