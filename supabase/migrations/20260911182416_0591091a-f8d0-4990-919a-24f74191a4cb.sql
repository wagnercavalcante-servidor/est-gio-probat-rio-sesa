
-- perfil do servidor avaliado
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS matricula text;

-- colunas de fluxo
ALTER TABLE public.formularios
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'concluido',
  ADD COLUMN IF NOT EXISTS servidor_user_id uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS prazo_resposta timestamptz,
  ADD COLUMN IF NOT EXISTS resposta_servidor text,
  ADD COLUMN IF NOT EXISTS resposta_em timestamptz,
  ADD COLUMN IF NOT EXISTS dados_revisao jsonb,
  ADD COLUMN IF NOT EXISTS revisado_em timestamptz,
  ADD COLUMN IF NOT EXISTS homologacao jsonb,
  ADD COLUMN IF NOT EXISTS homologado_em timestamptz,
  ADD COLUMN IF NOT EXISTS homologado_por uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS raep_formulario_id uuid REFERENCES public.formularios(id),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS formularios_servidor_user_idx ON public.formularios(servidor_user_id);
CREATE INDEX IF NOT EXISTS formularios_status_idx ON public.formularios(status);

-- 3 dias uteis
CREATE OR REPLACE FUNCTION public.prazo_dias_uteis(_inicio timestamptz, _dias integer)
RETURNS timestamptz
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  _data timestamptz := _inicio;
  _contador integer := 0;
BEGIN
  WHILE _contador < _dias LOOP
    _data := _data + interval '1 day';
    IF extract(isodow from _data) < 6 THEN
      _contador := _contador + 1;
    END IF;
  END LOOP;
  RETURN date_trunc('day', _data) + interval '23 hours 59 minutes';
END;
$$;
REVOKE ALL ON FUNCTION public.prazo_dias_uteis(timestamptz, integer) FROM public, anon, authenticated;

-- ao inserir uma avaliacao parcial, define fluxo
CREATE OR REPLACE FUNCTION public.preparar_fluxo_formulario()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid;
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
      NEW.prazo_resposta := public.prazo_dias_uteis(now(), 3);
    END IF;
  ELSE
    NEW.status := 'concluido';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.preparar_fluxo_formulario() FROM public, anon, authenticated;

DROP TRIGGER IF EXISTS formularios_fluxo_insert ON public.formularios;
CREATE TRIGGER formularios_fluxo_insert
BEFORE INSERT ON public.formularios
FOR EACH ROW EXECUTE FUNCTION public.preparar_fluxo_formulario();

-- substitui a imutabilidade total por imutabilidade dos dados originais
DROP TRIGGER IF EXISTS formularios_imutaveis ON public.formularios;

CREATE OR REPLACE FUNCTION public.validar_alteracao_formulario()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Formulários salvos não podem ser excluídos.';
  END IF;

  IF NEW.tipo IS DISTINCT FROM OLD.tipo
     OR NEW.dados IS DISTINCT FROM OLD.dados
     OR NEW.created_by IS DISTINCT FROM OLD.created_by
     OR NEW.created_at IS DISTINCT FROM OLD.created_at
     OR NEW.servidor_nome IS DISTINCT FROM OLD.servidor_nome
     OR NEW.servidor_matricula IS DISTINCT FROM OLD.servidor_matricula
     OR NEW.servidor_user_id IS DISTINCT FROM OLD.servidor_user_id
     OR NEW.orgao IS DISTINCT FROM OLD.orgao THEN
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
$$;
REVOKE ALL ON FUNCTION public.validar_alteracao_formulario() FROM public, anon, authenticated;

CREATE TRIGGER formularios_bloqueia_delete
BEFORE DELETE ON public.formularios
FOR EACH ROW EXECUTE FUNCTION public.validar_alteracao_formulario();

CREATE TRIGGER formularios_valida_update
BEFORE UPDATE ON public.formularios
FOR EACH ROW EXECUTE FUNCTION public.validar_alteracao_formulario();

-- expira prazos vencidos: concordancia tacita
CREATE OR REPLACE FUNCTION public.expirar_prazos_avaliacao()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.formularios
  SET status = 'aguardando_homologacao',
      resposta_servidor = COALESCE(resposta_servidor, 'concorda_tacito'),
      resposta_em = COALESCE(resposta_em, now())
  WHERE status IN ('aguardando_servidor','aguardando_servidor_revisao')
    AND prazo_resposta IS NOT NULL
    AND prazo_resposta < now();
$$;
GRANT EXECUTE ON FUNCTION public.expirar_prazos_avaliacao() TO authenticated;

-- politicas
DROP POLICY IF EXISTS "Autor e autorizados consultam formularios" ON public.formularios;
CREATE POLICY "Autor, servidor avaliado e autorizados consultam"
ON public.formularios FOR SELECT TO authenticated
USING (
  auth.uid() = created_by
  OR auth.uid() = servidor_user_id
  OR private.pode_ver_todos(auth.uid())
);

CREATE POLICY "Servidor avaliado responde a avaliacao"
ON public.formularios FOR UPDATE TO authenticated
USING (auth.uid() = servidor_user_id AND status IN ('aguardando_servidor','aguardando_servidor_revisao'))
WITH CHECK (auth.uid() = servidor_user_id);

CREATE POLICY "Chefia autora registra a revisao"
ON public.formularios FOR UPDATE TO authenticated
USING (auth.uid() = created_by AND status = 'em_revisao')
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Comissao homologa a avaliacao"
ON public.formularios FOR UPDATE TO authenticated
USING (
  (private.has_role(auth.uid(), 'comissao'::public.app_role) OR private.has_role(auth.uid(), 'admin'::public.app_role))
  AND status IN ('aguardando_homologacao','aguardando_recurso','recurso_apresentado')
)
WITH CHECK (
  private.has_role(auth.uid(), 'comissao'::public.app_role) OR private.has_role(auth.uid(), 'admin'::public.app_role)
);

GRANT UPDATE ON public.formularios TO authenticated;

-- cadastro: aceita perfil servidor e grava matricula
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role_text text := COALESCE(NEW.raw_user_meta_data ->> 'perfil', 'avaliador');
  _role public.app_role;
BEGIN
  IF _role_text NOT IN ('gestao_pessoas','comissao','avaliador','chefia_imediata','chefia_mediata','par','servidor') THEN
    _role_text := 'avaliador';
  END IF;
  _role := _role_text::public.app_role;

  INSERT INTO public.profiles (id, nome_completo, email, orgao, matricula)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'nome_completo',
    NEW.email,
    NEW.raw_user_meta_data ->> 'orgao',
    NULLIF(NEW.raw_user_meta_data ->> 'matricula', '')
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _role)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;
