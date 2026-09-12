ALTER TABLE public.formularios ADD COLUMN IF NOT EXISTS teste boolean NOT NULL DEFAULT false;
ALTER TABLE public.ciclos_avaliacao ADD COLUMN IF NOT EXISTS teste boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.preparar_fluxo_formulario()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _uid uuid;
  _prazo timestamptz;
BEGIN
  IF NEW.tipo IN ('FAPEP1','FAPEP2') THEN
    IF NEW.teste THEN
      NEW.servidor_user_id := NEW.created_by;
      NEW.status := 'aguardando_servidor';
      NEW.prazo_resposta := public.prazo_dias_uteis(now(), 3);
      NEW.updated_at := now();
      RETURN NEW;
    END IF;

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

CREATE OR REPLACE FUNCTION public.validar_alteracao_formulario()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.teste AND private.has_role(auth.uid(), 'admin'::public.app_role) THEN
      RETURN OLD;
    END IF;
    RAISE EXCEPTION 'Formulários salvos não podem ser excluídos.';
  END IF;

  IF NEW.tipo IS DISTINCT FROM OLD.tipo
     OR NEW.dados IS DISTINCT FROM OLD.dados
     OR NEW.created_by IS DISTINCT FROM OLD.created_by
     OR NEW.created_at IS DISTINCT FROM OLD.created_at
     OR NEW.servidor_nome IS DISTINCT FROM OLD.servidor_nome
     OR NEW.servidor_matricula IS DISTINCT FROM OLD.servidor_matricula
     OR NEW.servidor_user_id IS DISTINCT FROM OLD.servidor_user_id
     OR NEW.orgao IS DISTINCT FROM OLD.orgao
     OR NEW.teste IS DISTINCT FROM OLD.teste THEN
    RAISE EXCEPTION 'A avaliação registrada não pode ser alterada.';
  END IF;

  IF OLD.status = 'homologado' THEN
    RAISE EXCEPTION 'Avaliação já homologada.';
  END IF;

  IF OLD.dados_revisao IS NOT NULL AND NEW.dados_revisao IS DISTINCT FROM OLD.dados_revisao THEN
    RAISE EXCEPTION 'A revisão registrada não pode ser alterada.';
  END IF;

  IF OLD.homologacao IS NOT NULL AND NEW.homologacao IS DISTINCT FROM OLD.homologacao THEN
    RAISE EXCEPTION 'A homologação registrada não pode ser alterada.';
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.bloqueia_alteracao_assinatura()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'DELETE'
     AND private.has_role(auth.uid(), 'admin'::public.app_role)
     AND EXISTS (SELECT 1 FROM public.formularios f WHERE f.id = OLD.formulario_id AND f.teste) THEN
    RETURN OLD;
  END IF;
  RAISE EXCEPTION 'Assinaturas eletronicas nao podem ser alteradas ou excluidas.';
END;
$function$;

DROP POLICY IF EXISTS "Admin apaga formularios de teste" ON public.formularios;
CREATE POLICY "Admin apaga formularios de teste"
ON public.formularios FOR DELETE TO authenticated
USING (teste AND private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admin apaga assinaturas de teste" ON public.assinaturas;
CREATE POLICY "Admin apaga assinaturas de teste"
ON public.assinaturas FOR DELETE TO authenticated
USING (
  private.has_role(auth.uid(), 'admin'::public.app_role)
  AND EXISTS (SELECT 1 FROM public.formularios f WHERE f.id = formulario_id AND f.teste)
);

CREATE OR REPLACE FUNCTION public.encerrar_prazo_teste(_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT private.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Apenas administradores podem encerrar prazos de teste.';
  END IF;

  UPDATE public.formularios
  SET prazo_resposta = now() - interval '1 minute'
  WHERE id = _id AND teste
    AND status IN ('aguardando_servidor','aguardando_servidor_revisao');

  PERFORM public.expirar_prazos_avaliacao();
END;
$function$;

REVOKE ALL ON FUNCTION public.encerrar_prazo_teste(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.encerrar_prazo_teste(uuid) TO authenticated;