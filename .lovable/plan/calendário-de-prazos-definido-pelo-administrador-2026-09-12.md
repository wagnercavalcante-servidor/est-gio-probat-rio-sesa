# Calendário de prazos definido pelo administrador

Hoje o sistema calcula sozinho um prazo fixo de 3 dias úteis para o servidor se manifestar. A mudança cria um calendário oficial, definido exclusivamente por administradores, que passa a comandar todas as etapas da avaliação.

## O que o administrador poderá fazer

Nova aba **Calendário**, visível somente para o perfil Administrador. Nela ele cria um **ciclo de avaliação** (por exemplo "1ª Avaliação — 2026", com o número da avaliação de 1 a 6 e, se quiser, restrito a um órgão) e define data de início e data final para cada etapa:

1. Avaliação pela chefia imediata (FAPEP 1)
2. Avaliação pelos pares (FAPEP 2)
3. Ciência do servidor avaliado
4. Pedido de reconsideração
5. Resposta da chefia ao pedido de reconsideração
6. Ciência da resposta ao pedido de reconsideração
7. Recurso à comissão setorial
8. Resposta da comissão setorial
9. Ciência da resposta da comissão setorial
10. Recurso à comissão central

O administrador pode manter vários ciclos, marcar um como ativo, editar datas e encerrar ciclos. Só administradores enxergam e alteram essa aba; os demais perfis apenas sofrem os efeitos das datas.

## Como as datas passam a valer

- Ao salvar um FAPEP 1 ou 2, o prazo de manifestação do servidor deixa de ser "3 dias úteis" e passa a ser a data final da etapa "Ciência do servidor" do ciclo ativo correspondente. Sem ciclo definido, o sistema mantém a regra atual de 3 dias úteis, para nada parar de funcionar.
- Cada painel (servidor, revisão da chefia, comissão) mostra a etapa vigente e a data limite, e avisa quando o prazo está encerrado.
- Quando a data final de uma etapa passa sem manifestação, vale a regra já existente: concordância tácita e envio para a etapa seguinte.
- Fora da janela de avaliação da chefia/pares, os formulários FAPEP 1 e 2 aparecem bloqueados para preenchimento, com aviso da data em que abrem.

## Detalhes técnicos

- Novas tabelas: `ciclos_avaliacao` (nome, numero_avaliacao, orgao, ativo) e `ciclo_etapas` (ciclo, etapa, data_inicio, data_fim), com GRANTs, RLS de leitura para autenticados e escrita restrita a `has_role(auth.uid(),'admin')`.
- Função `etapa_vigente(orgao, numero_avaliacao, etapa)` para consultar a janela aplicável.
- `preparar_fluxo_formulario()` passa a buscar o prazo da etapa "ciência do servidor" no ciclo ativo e só recorre a `prazo_dias_uteis(now(), 3)` quando não houver ciclo.
- `expirar_prazos_avaliacao()` permanece como está: continua usando `prazo_resposta`, que agora vem do calendário.
- Novo componente `PainelCalendario.tsx` (CRUD de ciclos e etapas) e nova aba em `src/routes/index.tsx` sob condição `ehAdmin`.
- Bloqueio de preenchimento fora de janela implementado em `FormFapep` via consulta às etapas do ciclo ativo.
