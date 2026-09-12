# Ambiente de teste para administradores

Um espaço onde o administrador percorre todo o fluxo real da avaliação — preenchimento, ciência do servidor, pedido de reconsideração, revisão da chefia, recurso e homologação — usando as mesmas telas e regras do sistema, mas com registros marcados como teste, que não se misturam aos oficiais e podem ser apagados.

## Como funciona para o administrador

Nova aba **Ambiente de teste**, visível apenas para o perfil Administrador:

- Botão **Criar avaliação de teste**: gera um FAPEP 1 ou FAPEP 2 de teste já preenchido, com servidor fictício, e coloca o administrador como servidor avaliado desse registro. Assim ele consegue, na própria conta, responder, pedir reconsideração, revisar, recorrer e homologar — exercitando todos os papéis do fluxo.
- Lista dos registros de teste com o estado atual de cada um (aguardando ciência, em revisão, homologado etc.), prazo e atalhos para o painel correspondente.
- Botão **Encerrar prazo agora** em cada registro de teste, para conferir a concordância tácita sem esperar dias.
- Botão **Apagar** por registro e **Limpar tudo**, removendo os registros de teste e suas assinaturas.
- Roteiro de verificação na tela, com os passos esperados de ponta a ponta e o que observar em cada um.

## Separação entre teste e produção

- Todo registro criado no ambiente de teste fica marcado como teste e exibe um selo **TESTE** na tela e no documento em PDF.
- Painéis normais (Minhas avaliações, Revisões pendentes, Homologações, Consultar salvos) escondem os registros de teste; cada painel ganha uma opção "incluir registros de teste" para o administrador.
- O calendário de prazos pode ter ciclos marcados como teste, que não afetam a avaliação real.
- Dentro do ambiente de teste, o bloqueio por janela de datas não impede o preenchimento — o objetivo é justamente exercitar o fluxo.

## Detalhes técnicos

- Migração: coluna `teste boolean not null default false` em `formularios` e `ciclos_avaliacao`.
- `preparar_fluxo_formulario()`: quando `teste` é verdadeiro, define `servidor_user_id = created_by` e `status = 'aguardando_servidor'` para FAPEP 1/2, ignorando o vínculo por matrícula.
- `validar_alteracao_formulario()`: permite `DELETE` quando `teste` é verdadeiro e o autor é administrador; `bloqueia_alteracao_assinatura()` idem para assinaturas de formulários de teste.
- Novas policies de `DELETE` em `formularios` e `assinaturas` restritas a `private.has_role(auth.uid(),'admin')` com `teste = true`.
- RPC `encerrar_prazo_teste(_id uuid)` (security definer, admin + `teste = true`) que recua `prazo_resposta` e aplica `expirar_prazos_avaliacao()`.
- Frontend: `src/components/PainelTeste.tsx` (criação, lista, encerrar prazo, apagar, roteiro), `src/lib/teste.ts` (dados fictícios de exemplo), nova aba em `src/routes/index.tsx` sob `ehAdmin`, filtro `teste` nas consultas de `PainelServidor`, `PainelRevisao`, `PainelComissao` e `Consulta`, selo TESTE em `DocumentoFormulario`.
