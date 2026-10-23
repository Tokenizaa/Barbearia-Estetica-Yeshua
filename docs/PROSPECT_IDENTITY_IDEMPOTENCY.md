# Critério de Identidade e Idempotência dos Prospects

## 1. Critério de Identidade Adotado

Um estabelecimento é reconhecido de forma consistente usando a seguinte hierarquia de identificadores confiáveis:

```
1. website (URL normalizada)  →  identity = "website:<normalized_url>"
2. phone (telefone normalizado) →  identity = "phone:<digits_com_55>"
3. name + city + region + country →  identity = "name-location:<normalized_name>|city:<normalized_city>|region:<normalized_region>|country:<normalized_country>"
```

**Não se deduplica exclusivamente pelo nome comercial.** O nome sozinho é suscetível a falsos positivos (ex: "Barbearia São João" em diferentes cidades).

### Prioridade dos Identificadores

| Prioridade | Identificador | Confiabilidade | Uso |
|---|---|---|---|
| 1 | Website normalizado | Alta (único por negócio) | `website:<url>` |
| 2 | Telefone normalizado | Alta (único por contato) | `phone:<55DDDxxxxxxx>` |
| 3 | Nome + Localização | Média (pode haver duplicatas) | `name-location:...` |
| 4 | (nenhum) | Baixa | Retorna `null` — não cria chave |

### Normalizações Aplicadas

- **Website:** Remove `www.`, parâmetros de query (`utm_source`, `fbclid`), âncoras (`#`), trailing slashes, credenciais embutidas, esquemas não-HTTP. Retorna `null` para URLs inválidas.
- **Telefone:** Extrai apenas dígitos. Para números brasileiros de 10 ou 11 dígitos, adiciona o código do país `55`. Retorna `null` para números com menos de 8 ou mais de 15 dígitos.
- **Nome/Localização:** Remove acentos (NFKD), converte para minúsculo, substitui `&` por "e", remove caracteres não alfanuméricos, colapsa espaços.

## 2. Implementação da Deduplicação

### No Banco de Dados (`supabase/migrations/`)

**Tabela `prospects`:**
- `dedupe_key text` com índice UNIQUE parcial: `CREATE UNIQUE INDEX prospects_dedupe_key_uidx ON prospects (dedupe_key) WHERE dedupe_key IS NOT NULL;`
- `normalized_website text` com índice parcial
- `normalized_phone text` com índice parcial

**Tabela `prospecting_candidates`:**
- `dedupe_key text NOT NULL UNIQUE`
- `unique (campaign_id, provider, provider_record_id)` — evita duplicatas do mesmo provedor

**Função `promote_prospecting_candidate`:**
- Se `prospect_id` já está preenchido → retorna `alreadyPromoted: true` (idempotente)
- Usa `INSERT ... ON CONFLICT (dedupe_key) DO NOTHING` — se o dedupe_key já existir, não duplica
- Se o INSERT não retornar linha (conflito), faz `SELECT` para encontrar o prospect existente

**Função `ensure_prospect_site_project`:**
- Usa `pg_advisory_xact_lock(hashtext(prospect_id))` para evitar race conditions
- Se já existe `site_project` para o prospect → retorna `created: false` (idempotente)
- Caso contrário, cria novo projeto

### No Worker (`workers/prospecting-scheduler/src/index.ts`)

- `createDedupeKey()` implementa a mesma lógica de `createProspectDedupeKey()` da lib
- Tarefas de captura usam `idempotency_key: candidate:<dedupeKey>:capture`
- Tarefas de qualificação usam `idempotency_key: prospect:<prospectId>:qualify:v1`
- Tarefas de geração de demo usam `idempotency_key: site-project:<projectId>:publish-demo:v1`
- Tarefas de publicação usam `on_conflict=idempotency_key` com `resolution=ignore-duplicates`

## 3. Comportamento de Reprocessamento

| Cenário | Comportamento | Resultado |
|---|---|---|
| Reexecutar captura do mesmo estabelecimento | `dedupe_key` já existe → `ON CONFLICT DO NOTHING` | Sem duplicação; `duplicates` contador incrementa |
| Reprocessar prospect já promovido | `alreadyPromoted: true` → não cria novo prospect | Sem duplicação |
| Reexecutar geração de demo para mesma task | `generation_task_id` único → reusa versão existente | Sem versão duplicada |
| Reexecutar publicação para mesma task | `publish_task_id` único → reusa link existente | Sem link duplicado |
| Atualizar dados de prospect existente | Não sobrescreve com valores vazios/inferidos | Apenas campos presentes são atualizados |

## 4. Casos Ambíguos Exigindo Revisão

| Caso | Descrição | Decisão |
|---|---|---|
| Dois estabelecimentos com mesmo telefone, websites diferentes | Pode ser franquia com telefone compartilhado | Deduplica por telefone (prioridade 2). Requer revisão manual se websites divergirem. |
| Mesmo website, nomes diferentes | Pode ser rebranding | Deduplica por website (prioridade 1). Nome é atualizado se diferente. |
| Sem website, sem telefone, mesmo nome em cidades diferentes | Não há identificador confiável suficiente | `dedupe_key` = null → não é deduplicado. Cada um cria seu próprio prospect. |
| Nome + cidade + região iguais, websites diferentes | Provável duplicata com dados de contato ausentes | Deduplica por name-location (prioridade 3). |

## 5. Validações de Integridade

- Chaves únicas validadas no nível do banco (índices UNIQUE)
- Relacionamentos FK respeitados (`prospects` → `site_projects`, `prospecting_candidates` → `prospects`)
- Reprocessamento não cria prospects, projetos ou demonstrações duplicados
- Atualizações não sobrescrevem informações válidas com valores vazios ou inferidos (apenas campos presentes no payload são gravados)
