# Roadmap de Implementação White Label Multiestabelecimento
**Projeto:** Tokenizaa / Barbearia Estética Yeshua -> Plataforma White Label Multiestabelecimento  
**Data:** 2026-10-19  
**Status:** Em Implementação Ativa  

---

## 1. Arquitetura Existente (Diagnóstico Inicial)

### 1.1 Stack e Execução
- **Frontend / Aplicação:** React 19 + TypeScript + Vite + Tailwind CSS v4.
- **Armazenamento e Estado:** LocalStorage reativo com cache em memória no módulo `src/data/store.ts`, com listener pattern e hook `useStore()`.
- **Servidor / Deploy:** Configuração para SPA estático (Cloudflare Pages com `wrangler`, Vite Preview, dev server local na porta 3000).
- **Entidades atuais:**
  - `CompanyInfo`: Nome, contatos, Instagram, endereço, PIN do administrador, logotipo.
  - `ServiceItem`: Serviços de barbearia, estética, valores, durações e destaque.
  - `ProductItem`: Produtos para venda, estoque, categoria, imagens e preços.
  - `MediaItem`: Fotos e vídeos da galeria categorizados.
  - `Appointment`: Agendamentos com prevenção de conflitos de horários e integração com WhatsApp.
  - `InstagramEmbedItem`: Publicações e reels incorporados.

### 1.2 Limitações do Modelo Anterior
- Monotenant implícito: todas as chaves de storage (`yeshua_company_info_v4`, `yeshua_services_v1`, etc.) e os seletores pressupunham apenas 1 estabelecimento (Barbearia & Estética Yeshua).
- Área administrativa única protegida apenas por PIN único de 4 dígitos armazenado no objeto da empresa.
- Sem distinção entre o Super Administrador da Plataforma (SaaS / White Label Owner) e o Administrador Local do Estabelecimento.
- Sem suporte a múltiplos estabelecimentos com identidades visuais distintas (cores, logotipos, slugs de URL, WhatsApps, endereços).

---

## 2. Arquitetura Multiestabelecimento Proposta

### 2.1 Modelo Multitenancy Baseado em Isolamento Lógico Rigoroso
- **Entidade Central `Establishment`:**
  - `id`: Identificador único (ex: `est-yeshua-01`, `est-xyz-02`).
  - `slug`: Identificador amigável de rota/URL (ex: `yeshua`, `barbearia-imperio`).
  - `name`: Nome comercial do estabelecimento.
  - `tagline`: Subtítulo / especialidade (ex: `Barbearia & Estética • Manaus`).
  - `status`: `'active' | 'inactive' | 'suspended'`.
  - `branding`: Identidade visual completa:
    - `logoUrl`: URL ou imagem base64 do logotipo.
    - `coverUrl`: Imagem de capa / hero banner.
    - `primaryColor`: Cor de destaque primária (ex: `#f59e0b` para âmbar Yeshua).
    - `secondaryColor`: Cor secundária de suporte.
    - `accentColor`: Cor de acento para botões e detalhes.
    - `theme`: `'dark' | 'light' | 'luxury-gold' | 'emerald' | 'sapphire'`.
  - `contact`:
    - `whatsapp`: Número formatado e link.
    - `whatsappClean`: Dígitos puros para API do WhatsApp.
    - `phone`: Telefone fixo ou alternativo.
    - `address`: Logradouro e número.
    - `cityState`: Cidade e Estado.
    - `googleMapsUrl`: Link opcional do Google Maps.
  - `instagram`:
    - `handle`: Ex: `@barbearia_estetica_yeshua`.
    - `url`: Link oficial do perfil.
    - `bio`: Descrição oficial do perfil.
    - `followers`: Número aproximado de seguidores.
    - `postsCount`: Contagem de publicações.
    - `showGallery`: Opção para exibir ou ocultar provisoriamente a galeria de embeds.
  - `settings`:
    - `openingHoursNote`: Mensagem sobre horários de atendimento.
    - `adminPin`: PIN criptografado/protegido do administrador do estabelecimento.
    - `slotIntervalMinutes`: Intervalo padrão entre agendamentos (ex: 45 min).
    - `allowOnlineBooking`: Habilita/desabilita agendamentos pelo cliente.
  - `createdAt` e `updatedAt`: Carimbos de auditoria.

### 2.2 Isolamento de Dados das Entidades Operacionais
Todas as entidades filhas passam a conter o campo obrigatório `establishmentId`:
- `ServiceItem`: `establishmentId: string`
- `ProductItem`: `establishmentId: string`
- `MediaItem`: `establishmentId: string`
- `Appointment`: `establishmentId: string`
- `InstagramEmbedItem`: `establishmentId: string`
- `AuditLogEntry`: Registro de logs de auditoria administrativa vinculados ou não a um estabelecimento.

O `store.ts` garante que qualquer operação (`getServices`, `getProducts`, `addAppointment`, etc.) seja estritamente escopada ao estabelecimento ativo selecionado. Nunca dados de um estabelecimento vazam para outro.

---

## 3. Modelo de Permissões e Perfis de Acesso

### 3.1 Níveis de Acesso
1. **Público / Cliente (`role: 'client'`):**
   - Acesso apenas de leitura aos dados do estabelecimento ativo (serviços ativos, produtos disponíveis, galeria, horários).
   - Pode solicitar agendamentos vinculados exclusivamente ao estabelecimento que está visitando.
   - Não possui acesso a nenhuma interface administrativa.
2. **Administrador do Estabelecimento (`role: 'establishment_admin'`):**
   - Autenticado através de PIN/Credenciais exclusivas daquele estabelecimento.
   - Pode visualizar e editar apenas os dados do próprio estabelecimento (catálogo, preços, produtos, fotos, agenda, agendamentos, dados de contato e cores).
   - Totalmente bloqueado de visualizar ou editar outros estabelecimentos ou a administração geral da plataforma.
   - Não pode se autopromover para Administrador Geral da Plataforma.
3. **Administrador Geral da Plataforma (`role: 'super_admin'`):**
   - Autenticado através de chave mestre/PIN exclusivo da plataforma (`PLATFORM_MASTER_PIN`).
   - Visão holística da plataforma (todos os estabelecimentos, métricas globais, novos cadastros, bloqueio/desativação).
   - Capacidade de "Entrar como estabelecimento" em modo de auditoria/suporte com banner de aviso explícito.
   - Acesso aos logs de auditoria da plataforma.

---

## 4. Alterações Necessárias no Armazenamento / Banco

- **Chaves de Storage Multitenant:**
  - `wl_establishments_v1`: Registro central de todos os estabelecimentos da plataforma.
  - `wl_current_tenant_id`: Estabelecimento ativo na navegação pública/admin.
  - `wl_services_v1`: Array com todos os serviços particionados por `establishmentId`.
  - `wl_products_v1`: Array com todos os produtos particionados por `establishmentId`.
  - `wl_media_v1`: Array com fotos/vídeos particionados por `establishmentId`.
  - `wl_appointments_v1`: Array com agendamentos particionados por `establishmentId`.
  - `wl_instagram_v1`: Array com posts do Instagram particionados por `establishmentId`.
  - `wl_audit_logs_v1`: Registro cronológico de ações administrativas privilegiadas.
  - `wl_super_admin_config_v1`: Credenciais protegidas do Super Admin e configurações globais.

---

## 5. Plano de Migração do Yeshua sem Perda de Dados

- **Preservação Integral:**
  - Criação automática do estabelecimento `est-yeshua` com slug `yeshua` como primeiro tenant da plataforma.
  - Migração transparente dos dados legados (`yeshua_company_info_v4`, `yeshua_services_v1`, etc.) caso já existam no navegador do usuário, associando-os com `establishmentId: 'est-yeshua'`.
  - Se não houver dados no localStorage, inicializa com `INITIAL_ESTABLISHMENT_YESHUA` e o catálogo completo da Barbearia Yeshua.
  - Fallback padrão: se nenhuma rota ou query param indicar outro estabelecimento, a plataforma seleciona automaticamente o Yeshua.

---

## 6. Fases de Implementação e Critérios Objetivos de Validação

- **Fase 1:** Diagnóstico e Documentação (concluído nesta etapa).
- **Fase 2:** Estruturas de Tipos, Migração de Dados e Modelo White Label no `store.ts`.
- **Fase 3:** Área do Administrador Geral da Plataforma (Super Admin Dashboard, Gerenciador de Estabelecimentos, Métricas Globais, Logs).
- **Fase 4:** Área do Administrador do Estabelecimento (Isolamento local, personalização de branding, catálogo e agenda).
- **Fase 5:** Camada de Segurança, Verificação de Permissões e Auditoria.
- **Fase 6:** Testes Automatizados de Isolamento, Verificação de Tipos e Build de Produção.

---

## 7. Riscos de Segurança e Mitigações

| Risco | Impacto | Mitigação |
|---|---|---|
| Vazamento de dados entre estabelecimentos | Alto | Filtro obrigatório por `establishmentId` no núcleo da camada de dados. Nenhuma consulta global sem papel explícito de `super_admin`. |
| Auto-promoção de Admin Local para Super Admin | Crítico | Validação criptográfica/token de sessão independente com chave mestre armazenada em namespace restrito e verificação em cada ação. |
| Inativação acidental do estabelecimento Yeshua | Médio | Flag de proteção `isDefault: true` impedindo a exclusão acidental do tenant raiz. |
| Perda de dados durante atualização de versão | Alto | Script de migração reversível que lê chaves legadas e só as migra sem apagá-las. |
