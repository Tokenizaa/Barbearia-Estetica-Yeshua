# Matriz de Rastreabilidade — Contrato de Dados da Prospecção

Este documento mapeia cada campo desde a captura (origem) até a publicação final, diferenciando campos disponíveis, extraídos, normalizados, persistidos, consumidos e exibidos.

## 1. Campos de Origem (Coletor — Google Maps via Playwright)

| Campo | Disponível na Origem | Efetivamente Extraído | Opcional/Ausente | Normalizado | Persistido | Consumido pelo Gerador | Exibido Publicamente | Descartado |
|---|---|---|---|---|---|---|---|---|
| Nome comercial | ✅ Sim | ✅ `name` → `business_name` | Não | Sim (`normalizeName`) | Sim (`business_name`, `name`, `company_name`) | Sim (`businessData.name`) | ✅ Sim | Não |
| Categoria | ✅ Sim | ✅ `category` (JSON-LD @type) | Sim | Sim | Sim (`category`, `business_category`) | Sim (`businessData.category`) | ✅ Sim | Não |
| Endereço | ✅ Sim | ✅ `address` (<address>, og:street-address) | Sim | Sim | Sim (`address`, `captured_data.address`) | Sim (`businessData.address`) | ✅ Sim | Não |
| Telefone | ✅ Sim | ✅ `phone` (tel:, wa.me, JSON-LD telephone) | Sim | Sim (`normalizePhone`) | Sim (`phone`, `normalized_phone`) | Sim (`businessData.phone`, `businessData.whatsapp`) | ✅ Sim | Não |
| Site/Website | ✅ Sim | ✅ `website` (canonical, [data-tooltip="Abrir site"]) | Sim | Sim (`normalizeWebsite`) | Sim (`website_url`, `normalized_website`) | Não (apenas interno) | Não | Não |
| E-mail | ✅ Sim | ✅ `email` (mailto:, JSON-LD email) | Sim | Sim | Sim (`email`) | Não | Não | Não |
| Descrição | ✅ Sim | ✅ `description` (meta, JSON-LD) | Sim | Sim | Sim (`description`, `captured_data.description`) | Sim (`businessData.description`) | ✅ Sim | Não |
| URL da ficha (source) | ✅ Sim | ✅ `sourceUrl` (canonical URL) | Sim | Sim (`normalizeWebsite`) | Sim (`source_url`, `captured_data.source_url`) | Não | Não | Não |
| Imagem/Logo | ✅ Sim | ✅ `logoUrl` (og:image, JSON-LD logo) | Sim | Não | Não (apenas `captured_data` se armazenado) | Não | Não | ✅ Sim (não há coluna dedicada) |
| Avaliação | ⚠️ Parcial | ⚠️ `rating` (aria-label, texto) | Sim | Não | Não (apenas `captured_data` ou `raw_evidence`) | Não | Não | ✅ Sim (não consumido) |
| Qtd. Avaliações | ⚠️ Parcial | ⚠️ `reviews` (texto) | Sim | Não | Não | Não | Não | ✅ Sim (não consumido) |
| Horário funcionamento | ❌ Não | ❌ Não extraído | ✅ Ausente | Não | Não | Não | Não | ✅ Sim (não disponível na origem) |
| Identificador origem | ⚠️ Parcial | ✅ `provider_record_id` (placeId) | Sim | Não | Sim (`provider_record_id` em `prospecting_candidates`) | Não | Não | Não |

**Nota:** Nem todos os campos listados acima são coletáveis, autorizados ou suportados pelo sistema atual. Campos como avaliação, quantidade de avaliações e horário de funcionamento são extraídos seletivamente pelo coletor (seletores CSS específicos do Google Maps) e podem não estar disponíveis em todas as páginas.

## 2. Matriz de Rastreabilidade por Etapa

| Campo | Captura (Nome Original) | Normalização | Modelo de Domínio (TypeScript) | Persistência (Tabela/Coluna) | Relacionamentos | Testes (Fixtures/Synthetics) | Geração do Site | Publicação |
|---|---|---|---|---|---|---|---|---|
| business_name | `name` | `normalizeName()` | `ProspectIdentity.businessName` | `prospects.business_name` (NOT NULL) | — | `prospecting_automation.test.ts` | `generated_content.businessName` | `site_projects.name` |
| category | `category` | — | `ProspectQualificationInput.category` | `prospects.category` | — | `prospecting_automation.test.ts` | `generated_content.category` | — |
| website_url | `website` | `normalizeWebsite()` | `ProspectIdentity.websiteUrl` | `prospects.website_url`, `normalized_website` | — | `prospecting_worker.test.ts` | `generated_content.website` | — |
| phone | `phone` | `normalizePhone()` | `ProspectIdentity.phone` | `prospects.phone`, `normalized_phone` | — | `prospecting_automation.test.ts` | `generated_content.phone` | — |
| email | `email` | — | `ProspectQualificationInput.email` | `prospects.email` | — | `prospecting_automation.test.ts` | — | — |
| address | `address` | — | `ProspectQualificationInput.address` | `prospects.address`, `captured_data.address` | — | `end_to_end_pipeline_certification.test.ts` | `generated_content.address` | — |
| city | `address` (parsed) | — | `ProspectIdentity.city` | `prospects.city` | — | — | `generated_content.city` | — |
| region | `address` (parsed) | — | `ProspectIdentity.region` | `prospects.region` | — | — | `generated_content.region` | — |
| country_code | — | — | `ProspectIdentity.countryCode` | `prospects.country_code` (default 'BR') | — | — | — | — |
| description | `description` | — | `ProspectQualificationInput.description` | `prospects.description`, `captured_data.description` | — | `end_to_end_pipeline_certification.test.ts` | `generated_content.description` | — |
| source_url | `sourceUrl` | `normalizeWebsite()` | `ProspectQualificationInput.sourceUrl` | `prospects.source_url`, `public_source_urls[]`, `captured_data.source_url` | — | — | `generated_content.sourceUrl` | — |
| dedupe_key | Computado (SHA-256) | `createProspectDedupeKey()` | — | `prospects.dedupe_key` (UNIQUE where not null) | — | `prospecting_automation.test.ts`, `prospecting_worker.test.ts` | — | — |
| qualification_score | Computado | `qualify()` | `ProspectQualification.score` | `prospects.qualification_score`, `qualification_reasons` | — | `prospecting_automation.test.ts` | — | — |
| outreach_eligibility | — | — | — | `prospects.outreach_eligibility` | — | `prospecting_automation.test.ts` | — | — |
| whatsapp_opt_in_at | — | — | `OutreachEligibilityInput.whatsappOptInAt` | `prospects.whatsapp_opt_in_at` | — | `prospecting_automation.test.ts` | — | — |
| provider_record_id | `placeId` | — | — | `prospecting_candidates.provider_record_id` | FK to provider | — | — | — |

## 3. Modelos Reconciliados

### 3.1 Payload Bruto do Coletor (`functions/api/capture.ts` → `extractHtmlMetadata`)

```json
{
  "requestedUrl": "string",
  "finalUrl": "string",
  "sourceUrl": "string",
  "capturedAt": "ISO string",
  "businessName": "string",
  "category": "string",
  "description": "string",
  "phone": "string",
  "email": "string",
  "address": "string",
  "logoUrl": "string",
  "evidence": { "name": bool, "description": bool, "phone": bool, "email": bool, "address": bool },
  "notice": "string"
}
```

### 3.2 Modelo de Domínio (`src/lib/prospecting.ts`)

- `ProspectIdentity`: businessName?, websiteUrl?, phone?, city?, region?, countryCode?
- `ProspectQualificationInput`: extends ProspectIdentity + category?, email?, address?, description?, sourceUrl?
- `ProspectQualification`: score, reasons[], missingFields[]
- `OutreachEligibilityInput`: eligibility?, whatsappOptInAt?, optInEvidenceUrl?, optedOutAt?

### 3.3 Schema do Banco (`supabase/migrations/`)

**Tabela `prospects`:**
- id (uuid, PK), business_name (text, NOT NULL), slug, category, city, region, country_code (default 'BR'), website_url, phone, email, social_links (jsonb), public_source_urls (text[]), source_name, captured_data (jsonb), qualification (jsonb), status, captured_by (uuid FK), converted_establishment_id (uuid FK), created_at, updated_at
- Colunas adicionais (migration prospecting_automation_foundation): dedupe_key (text, unique), normalized_website (text), normalized_phone (text), qualification_score (int), qualification_reasons (jsonb), source_captured_at (timestamptz), last_seen_at (timestamptz), outreach_eligibility (text, check constraint)
- Colunas adicionais (migration prospecting_whatsapp_consent): whatsapp_opt_in_at, whatsapp_opt_in_evidence_url, whatsapp_opted_out_at, whatsapp_opt_in_source, whatsapp_consent_updated_at

**Tabela `prospecting_candidates`:**
- id (uuid, PK), campaign_id (uuid FK), provider, provider_record_id, dedupe_key (text, UNIQUE), business_name (text, NOT NULL), category, website_url, normalized_website, phone, normalized_phone, email, address, city, region, country_code, description, source_url, qualification_score, qualification_reasons (jsonb), missing_fields (jsonb), status, prospect_id (uuid FK), raw_evidence (jsonb), created_at, updated_at

**Tabela `site_projects`:**
- id (uuid, PK), prospect_id (uuid FK), establishment_id (uuid FK), template_version_id (uuid FK), name, status, generated_content (jsonb), design_overrides (jsonb), public_slug, published_url, created_at, updated_at
- Constraint: (prospect_id XOR establishment_id) — um projeto é de prospect OU de establishment, nunca ambos

**Tabela `site_project_versions`:**
- id (uuid, PK), site_project_id (uuid FK), version (int), template_version_id (uuid FK), generated_content (jsonb), design_overrides (jsonb), selected_by_prospect, selection_source, created_at
- generation_task_id (uuid FK, unique where not null) — para idempotência de geração

**Tabela `site_demo_public_links`:**
- id (uuid, PK), site_project_id (uuid FK), token_hash (text, UNIQUE), status, expires_at (timestamptz), selected_version_id (uuid FK), publish_task_id (bigint FK, unique)

### 3.4 Contrato do Gerador de Sites (`src/types/templates.ts` → `SiteBusinessData`)

```typescript
export interface SiteBusinessData {
  name: string;           // ← prospect.business_name
  category: string;       // ← prospect.category
  tagline?: string;       // ← prospect.captured_data.description ou vazio
  description: string;    // ← prospect.description
  phone: string;          // ← prospect.normalized_phone ou prospect.phone
  whatsapp: string;       // ← prospect.phone (fallback) ou vazio
  address: string;        // ← prospect.address
  city: string;           // ← prospect.city
  state?: string;         // ← prospect.region
  logoUrl?: string;       // ← NÃO vem do prospect (vazio)
  coverUrl?: string;      // ← NÃO vem do prospect (vazio)
  instagramHandle?: string; // ← NÃO vem do prospect (vazio)
  instagramUrl?: string;    // ← NÃO vem do prospect (vazio)
  services?: ServiceItem[]; // ← NÃO vem do prospect (vazio)
  products?: ProductItem[]; // ← NÃO vem do prospect (vazio)
  media?: MediaItem[];      // ← NÃO vem do prospect (vazio)
}
```

**Divergência nota:** `logoUrl`, `coverUrl`, `instagramHandle`, `instagramUrl`, `services`, `products`, `media` são campos de `SiteBusinessData` que NÃO têm origem no prospect. Eles vêm do estabelecimento (quando convertido) ou ficam vazios na demonstração. Isso é intencional: a demonstração de prospect não deve inventar dados de branding.

## 4. Decisões por Divergência

| Campo | Decisão | Justificativa |
|---|---|---|
| `logoUrl` | Descartado (do prospect) | Não há coluna dedicada no schema; dados de branding vêm do establishment após conversão |
| `coverUrl` | Descartado (do prospect) | Mesmo motivo acima |
| `instagramHandle/Url` | Descartado (do prospect) | Dados de rede social vêm do establishment |
| `services/products/media` | Descartado (do prospect) | Catálogo operacional pertence ao establishment convertido |
| `avaliação/reviews` | Descartado | Não consumido por nenhum componente; não inventar avaliações |
| `horário funcionamento` | Descartado | Não disponível na origem (Google Maps HTML não expõe de forma confiável) |
| `whatsapp` vs `phone` | Derivado | `SiteBusinessData.whatsapp` usa fallback para `phone`; não criar campo duplicado |
| `state` vs `region` | Derivado | `SiteBusinessData.state` mapeia para `prospect.region` |
| `dedupe_key` | Persistido | Chave única para deduplicação; índice UNIQUE onde not null |
| `normalized_website` | Persistido | Coluna dedicada para busca eficiente; derivada de `website_url` |
| `normalized_phone` | Persistido | Coluna dedicada para busca eficiente; derivada de `phone` |
| `captured_data` | Persistido | JSONB flexível para evidências brutas (logoUrl, rating, etc.) sem alterar schema |
| `qualification` | Persistido | JSONB com score, razões, campos ausentes — trilha de auditoria |

## 5. Campos sem Consumidor Identificado (Não Adicionados)

Nenhum campo foi adicionado ao schema sem consumidor identificado. Todos os campos do `prospects` são consumidos por: qualificação, geração de demonstração, deduplicação, ou auditoria.
