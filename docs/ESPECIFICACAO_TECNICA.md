# CADERNO DE ESPECIFICAÇÃO TÉCNICA E FUNCIONAL
**Sistema Informatizado de Avaliação Especial de Desempenho em Estágio Probatório**
*Em conformidade com o Decreto Estadual nº 36.773/2025 – Governo do Estado do Ceará*

---

## SUMÁRIO

1. Apresentação e Objetivo
2. Arquitetura Tecnológica e Requisitos Não Funcionais
3. Matriz de Perfis e Controle de Acesso (RBAC)
4. Módulo do Cronograma de Etapas (Motor de Prazos)
5. Formulários Oficiais do Decreto nº 36.773/2025
6. Fluxo de Trabalho, Tramitação e Regras de Negócio
7. Assinatura Eletrônica e Autenticidade Pública
8. Módulo de Inteligência Gerencial (BI)
9. Ambiente de Homologação e Simulação
10. Modelagem Orientada a Domínio (DDD)
11. Recomendações para Implantação (Equipe de TI)

---

## 1. APRESENTAÇÃO E OBJETIVO

### 1.1 Finalidade
Consolidar a especificação funcional e a arquitetura técnica para implementação, sustentação e implantação do sistema nos órgãos e entidades da Administração Pública Estadual Direta, Autárquica e Fundacional do Ceará, substituindo a tramitação em papel e garantindo celeridade, integridade, transparência e observância dos prazos legais.

### 1.2 Base Normativa
* Decreto Estadual nº 36.773/2025 – avaliação especial de desempenho para aquisição de estabilidade.
* Lei Estadual nº 9.826/1974 – Estatuto dos Funcionários Públicos Civis do Estado do Ceará.
* Lei Federal nº 13.709/2018 (LGPD).
* Lei Federal nº 14.063/2020 – assinaturas eletrônicas na administração pública.

---

## 2. ARQUITETURA TECNOLÓGICA E REQUISITOS NÃO FUNCIONAIS

```text
┌─────────────────────────────────────────────────────────────┐
│                    CAMADA DE APRESENTAÇÃO                   │
│      React 19 | TypeScript | Tailwind CSS | TanStack Router │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / RPC
┌──────────────────────────────▼──────────────────────────────┐
│               CAMADA DE APLICAÇÃO E DOMÍNIO                 │
│  Server Functions | Validação Zod | Domínio DDD (src/domain)│
└──────────────────────────────┬──────────────────────────────┘
                               │ Conexão segura / RLS
┌──────────────────────────────▼──────────────────────────────┐
│                       CAMADA DE DADOS                       │
│     PostgreSQL | Row-Level Security | Trilha de Auditoria   │
└─────────────────────────────────────────────────────────────┘
```

* **Frontend**: React 19 + TypeScript, TanStack Start/Router, Tailwind CSS; geração de PDF em página A4 única (794 × 1123 px) fiel ao formulário preenchido.
* **Backend**: funções de servidor tipadas com validação Zod e autenticação por token Bearer.
* **Banco de dados**: PostgreSQL com Row-Level Security; um órgão nunca acessa registros de outro (exceto administração, Gestão de Pessoas central e comissões).
* **Requisitos não funcionais**: disponibilidade de 99,5% em expediente; não repúdio e rastreabilidade das assinaturas; compatível com navegadores modernos e dispositivos móveis.

---

## 3. MATRIZ DE PERFIS E CONTROLE DE ACESSO (RBAC)

Os papéis ficam em tabela própria (`user_roles`), nunca no cadastro do usuário, e são verificados no servidor por função `SECURITY DEFINER`.

| Papel | Atribuições | Escopo |
| :--- | :--- | :--- |
| Administrador Geral | Cadastro de órgãos, cronogramas, acessos e ambiente de testes | Todos os órgãos |
| Gestão de Pessoas (COGEP/RH) | Cronogramas locais, monitoramento de prazos, consulta somente leitura do FAPEP 1/2 | Próprio órgão |
| Avaliador – Chefia Imediata | Notas do FAPEP 1, feedback, assinatura, decisão sobre reconsideração | Subordinados diretos |
| Avaliador – Chefia Mediata | Acompanhamento gerencial e validação complementar | Subunidade |
| Avaliador – Par | Notas do FAPEP 2 | Servidores designados |
| Servidor Avaliado | Ciência, concordância, reconsideração, RAEP | Própria avaliação |
| Comissão Setorial | Julgamento em 1ª instância, parecer e homologação | Órgão de atuação |
| Comissão Central | Julgamento em 2ª e última instância | Processos em recurso central |

No cadastro, o usuário escolhe perfil e órgão; a busca de servidores só retorna nomes do órgão escolhido.

---

## 4. MÓDULO DO CRONOGRAMA DE ETAPAS (MOTOR DE PRAZOS)

### 4.1 Papel Centralizador
Gerido pela Gestão de Pessoas ou pelo Administrador, define as janelas de abertura e encerramento de cada etapa. Nenhuma ação é aceita fora do período vigente.

### 4.2 Etapas Parametrizáveis

| # | Identificador | Descrição | Executor |
| :---: | :--- | :--- | :--- |
| 1 | `avaliacao_chefia` | Preenchimento e assinatura do FAPEP 1 | Chefia Imediata |
| 2 | `avaliacao_pares` | Preenchimento e assinatura do FAPEP 2 | Pares |
| 3 | `ciencia_servidor` | Ciência da avaliação | Servidor |
| 4 | `pedido_reconsideracao` | Pedido fundamentado de revisão | Servidor |
| 5 | `resposta_chefia` | Análise e decisão da reconsideração | Chefia / Pares |
| 6 | `ciencia_resposta_chefia` | Ciência da decisão da chefia | Servidor |
| 7 | `recurso_comissao_setorial` | RAEP em 1ª instância | Servidor |
| 8 | `resposta_comissao_setorial` | Julgamento colegiado setorial | Comissão Setorial |
| 9 | `ciencia_resposta_setorial` | Ciência da decisão setorial | Servidor |
| 10 | `recurso_comissao_central` | Recurso à Comissão Central | Servidor |

### 4.3 Regras de Operação
1. **Hierarquia de calendários**: cronograma específico do órgão/número da avaliação prevalece; sem ele, aplica-se o cronograma geral; sem datas, aplicam-se os prazos legais em dias úteis.
2. **Bloqueio**: antes do início, *"Etapa não iniciada"*; após o fim, *"Prazo regulamentar encerrado"* (somente leitura).
3. **Rotina automática**: verificação periódica de prazos expirados, disparando concordância tácita e preclusão.
4. **Linha do tempo visual**: etapa vigente, etapas futuras e etapas encerradas identificadas por cor.

---

## 5. FORMULÁRIOS OFICIAIS

* **FAPEP 1 – Chefia Imediata**: identificação (nome, matrícula, cargo, órgão, lotação, período); requisitos, critérios, descrição legal do critério, nota; campo opcional *Considerações/Justificativa/Feedback*; total e percentual automáticos; assinatura no campo "Assinatura do Chefe Imediato". Salvar, baixar e assinar ficam bloqueados até que todos os campos obrigatórios estejam preenchidos. O PDF não traz a parte da comissão antes da homologação.
* **FAPEP 2 – Pares**: mesma estrutura, com número do par avaliador.
* **FAFEP – Avaliação Final**: consolida as avaliações do período e emite parecer *Aprovado* ou *Não Aprovado*.
* **RAEP – Recurso**: razões do servidor, critérios contestados, anexos, deliberação fundamentada da comissão.
* **FADA – Acompanhamento e Desenvolvimento**: ocorrências, orientações, planos de alinhamento e capacitações.

---

## 6. FLUXO DE TRABALHO E REGRAS DE NEGÓCIO

### 6.1 Diagrama Sequencial

```text
       [0. Configuração do Cronograma do Ciclo]
 (Gestão de Pessoas / COGEP define datas e prazos no sistema)
                        │
                        ▼
             [1. Avaliação Inicial]
  (Chefia Imediata - FAPEP 1 / Pares - FAPEP 2)
                        │
                        ▼
       [2. Notificação e Ciência do Servidor]
                        │
            ┌───────────┴───────────┐
            ▼                       ▼
  [Concordância com a Nota]   [Pedido de Reconsideração]
  (Expressa ou Tácita)        (Prazo: 3 dias úteis)
            │                       │
            │                       ▼
            │         [Análise da Reconsideração]
            │         (Chefia e Pares: até 5 dias úteis)
            │         (Alterações em destaque visual âmbar)
            │                       │
            │           ┌───────────┴───────────┐
            │           ▼                       ▼
            │     [Concordância]         [Recurso RAEP]
            │           │          (Comissão Setorial: até 5 dias úteis)
            │           │                       │
            │           │                       ▼
            │           │            [Julgamento Setorial]
            │           │            (10 dias úteis + 10 prorrogáveis)
            │           │                       │
            │           │           ┌───────────┴───────────┐
            │           │           ▼                       ▼
            │           │     [Concordância]     [Recurso 2ª Instância]
            │           │           │     (Comissão Central: até 5 dias úteis)
            │           │           │                       │
            │           │           │                       ▼
            │           │           │            [Julgamento Central]
            │           │           │         (10 dias úteis + 10 prorrogáveis)
            │           │           │                       │
            └───────────┼───────────┴───────────────────────┘
                        ▼
             [Homologação Final do Ciclo]
```

### 6.2 Prazos Regulamentares

| Procedimento | Responsável | Prazo | Prorrogação | Efeito da omissão |
| :--- | :--- | :--- | :--- | :--- |
| Pedido de reconsideração | Servidor | 3 dias úteis após a ciência | Vedada | Concordância tácita |
| Decisão da reconsideração | Chefia e Pares | Até 5 dias úteis | Vedada | Servidor notificado do resultado |
| Recurso à Comissão Setorial (RAEP) | Servidor | Até 5 dias úteis | Vedada | Preclusão |
| Julgamento setorial | Comissão Setorial | Até 10 dias úteis | Uma vez, +10 dias úteis, justificada | Decisão registrada no RAEP |
| Recurso à Comissão Central | Servidor | Até 5 dias úteis | Vedada | Decisão setorial definitiva |
| Julgamento central | Comissão Central | Até 10 dias úteis | Uma vez, +10 dias úteis, justificada | Encerramento da via recursal |

### 6.3 Regras Críticas
1. **Dias úteis**: excluem sábados, domingos e feriados cadastrados; contagem inicia no dia útil seguinte à ciência.
2. **Concordância tácita**: vencidos 3 dias úteis sem manifestação, o sistema muda o status automaticamente.
3. **Auditoria visual**: nota alterada na revisão aparece com valor anterior riscado e novo valor em âmbar.
4. **Fluxo único de reconsideração**: após a revisão, a discordância segue apenas por RAEP.
5. **Prorrogação única**: comissões só prorrogam uma vez, com justificativa obrigatória.
6. **Preclusão**: após o prazo, novos recursos são bloqueados.
7. **Imutabilidade**: documentos assinados/homologados não podem ser editados.

---

## 7. ASSINATURA ELETRÔNICA E AUTENTICIDADE PÚBLICA

* **Assinatura**: confirmação da mesma senha de acesso no ato da assinatura; registra nome, matrícula, perfil, e-mail, data/hora e código de verificação exclusivo.
* **Validador público (`/verificar`)**: sem login, qualquer pessoa ou órgão de controle (CGE, PGE, TCE) informa o código impresso no PDF e confirma autenticidade, signatários, datas e situação, sem acesso às notas (LGPD).

---

## 8. MÓDULO DE INTELIGÊNCIA GERENCIAL (BI)

* Aba **Gerenciamento Estágio Probatório** com dados por órgão.
* Cartões: total de servidores em estágio probatório e quantidade por data de efetivo exercício.
* Filtros: órgão, data de efetivo exercício e busca por nome, matrícula ou cargo; painel *Detalhamento* com os servidores filtrados.
* Integração atual com planilha consolidada; recomendada futura integração com o sistema oficial de RH do Estado.

---

## 9. AMBIENTE DE HOMOLOGAÇÃO E SIMULAÇÃO

* Exclusivo do Administrador.
* Registros marcados como teste, com selo *"DOCUMENTO DE TESTE – SEM VALIDADE"*.
* Recurso "Encerrar prazo" para simular vencimentos e concordância tácita.
* Registros de teste ocultos das consultas oficiais (exibidos apenas quando o filtro de testes é marcado).

---

## 10. MODELAGEM ORIENTADA A DOMÍNIO (DDD)

### 10.1 Linguagem Ubíqua
Os termos do decreto são usados literalmente no código, nas tabelas e nas reuniões:

| Termo | Significado |
| :--- | :--- |
| `ServidorAvaliado` | Ocupante de cargo efetivo em estágio probatório |
| `ChefiaImediata` | Autoridade que avalia no FAPEP 1 |
| `ParAvaliador` | Colega designado para o FAPEP 2 |
| `Reconsideracao` | Pedido justificado de revisão em 3 dias úteis |
| `ConcordanciaTacita` | Efeito da inércia do servidor no prazo legal |
| `RAEP` | Recurso à Comissão Setorial ou Central |
| `Preclusao` | Perda do direito de recorrer por decurso de prazo |
| `Homologacao` | Ato colegiado que convalida o resultado |

### 10.2 Contextos Delimitados (Bounded Contexts)

```text
┌──────────────────────────────────────────────────────────┐
│        GESTÃO FUNCIONAL E LOTAÇÃO (Suporte)              │
│        Servidor, Órgão, Cargo, Data de exercício         │
└────────────────────────────┬─────────────────────────────┘
                             ▼
┌──────────────────────────────────────────────────────────┐
│     CICLO AVALIATIVO E TRAMITAÇÃO (Domínio Principal)    │
│   FAPEP 1/2, notas, reconsideração, RAEP, homologação    │
└──────────────┬──────────────────────────────┬────────────┘
               ▼                              ▼
┌──────────────────────────┐   ┌──────────────────────────────┐
│ MOTOR DE PRAZOS (Genérico)│   │ ASSINATURA E AUDITORIA (Gen.)│
│ Dias úteis, cronograma    │   │ Código, /verificar           │
└──────────────────────────┘   └──────────────────────────────┘
```

### 10.3 Design Tático (implementado em `src/domain/`)

| Elemento | Tipo | Arquivo | Invariantes |
| :--- | :--- | :--- | :--- |
| `AvaliacaoFapep` | Raiz de agregação | `avaliacao/AvaliacaoFapep.ts` | Assina só com todos os critérios pontuados; notas mudam só em rascunho ou na revisão (com histórico anterior/novo); concordância tácita só após 3 dias úteis; reconsideração única; homologação imutável |
| `RecursoRaep` | Raiz de agregação | `recurso/RecursoRaep.ts` | Protocolo em até 5 dias úteis (senão preclusão); razões obrigatórias; julgamento em 10 dias úteis; uma única prorrogação justificada; decisão fundamentada |
| `Nota` | Objeto de valor | `avaliacao/Nota.ts` | Valor entre 0 e o máximo do critério |
| `PontuacaoTotal` | Objeto de valor | `avaliacao/Nota.ts` | Soma e percentual derivados das notas |
| `PrazoDiasUteis` | Objeto de valor / serviço | `prazos/PrazoDiasUteis.ts` | Exclui fins de semana e feriados; `PRAZOS_LEGAIS` centraliza 3/5/5/10/5/10 dias |
| `RaizAgregado`, `ErroDominio` | Base compartilhada | `shared/base.ts` | Eventos de domínio e erros de regra |

**Eventos de domínio emitidos**: `AvaliacaoAssinada`, `NotificacaoCienciaDisparada`, `ConcordanciaRegistrada`, `ReconsideracaoSolicitada`, `RevisaoConcluida`, `ConcordanciaTacitaRegistrada`, `AvaliacaoHomologada`, `RecursoRaepProtocolado`, `PrazoJulgamentoProrrogado`, `RecursoJulgado`.

### 10.4 Organização em Camadas

```text
src/
├── domain/          Regras puras do decreto (sem tela, sem banco) + testes
├── lib/             Casos de uso e funções de servidor (*.functions.ts)
├── integrations/    Banco de dados e autenticação (infraestrutura)
├── components/      Formulários e painéis (apresentação)
└── routes/          Páginas e rotas públicas (/verificar)
```

A camada `domain` não importa nada das demais. Telas e funções de servidor usam o domínio; o banco reforça as mesmas regras com RLS e funções.

### 10.5 Testes Automatizados
`src/domain/domain.test.ts` (Vitest) cobre: contagem de dias úteis com feriado, bloqueio de assinatura incompleta, escala de notas, concordância tácita e homologação, histórico de alterações na reconsideração, preclusão e prorrogação única. Executar: `bunx vitest run src/domain`.

### 10.6 Benefícios
* **Segurança jurídica**: o código usa os termos e prazos do decreto, facilitando auditoria.
* **Manutenção**: mudança de prazo ou regra altera um único ponto (`PRAZOS_LEGAIS` ou o agregado).
* **Testabilidade**: regras verificáveis sem banco ou navegador.

---

## 11. RECOMENDAÇÕES PARA IMPLANTAÇÃO (EQUIPE DE TI)

1. **Infraestrutura**: contêineres Docker no Data Center da ETICE; PostgreSQL gerenciado com backup diário e réplica de leitura.
2. **Domínio e certificados**: publicação em domínio oficial (ex.: `estagioprobatorio.seplag.ce.gov.br`) com TLS.
3. **E-mail institucional**: configurar domínio de envio (registros DNS) para notificações do fluxo, hoje desativadas.
4. **Identidade**: possibilidade de login unificado do Estado (Ceará Digital / Gov.br) via OAuth 2.0 / OpenID Connect.
5. **Pendências antes da produção**: reativar o login obrigatório (acesso provisório atual deve ser removido), habilitar proteção contra senhas vazadas e revisar avisos de segurança do banco.
6. **Código-fonte**: disponível por sincronização com GitHub ou download do projeto.

---

*Documento técnico para instrução de planejamento e implantação pelas equipes de Tecnologia da Informação e Gestão de Pessoas do Estado do Ceará.*

### Integração do domínio com as telas
- Notas do FAPEP 1/2: soma e validação pela classe `Nota`/`PontuacaoTotal` (escala 0–10 por critério); nota fora da escala bloqueia salvar, assinar e baixar.
- Fluxo: toda ação (concordar, pedir reconsideração, revisar, protocolar RAEP, homologar) passa por `decidirTransicao` (`src/domain/fluxo/FluxoAvaliacao.ts`), que confere o estado atual e o prazo legal em dias úteis (`PRAZOS_LEGAIS`) antes de gravar; ação fora do estado ou do prazo é recusada com mensagem.
- O prazo de manifestação do servidor é calculado por `PrazoDiasUteis`.
