# Roadmap — Plataforma de prospecção e sites personalizados

## Escopo vigente — atualizado em 2026-10-20

**Fonte de verdade funcional:** [Base funcional oficial e prontidão da Fase 1](./PRODUCT_FLOW_BASELINE_AND_PHASE1_READINESS.md).

O fluxo vigente é: descoberta/captura de leads → mapeamento e revisão → geração de demonstração personalizada → abordagem por WhatsApp → landing page comercial com escolha de modelos → cadastro e pagamento → ativação → plataforma privada do salão e publicação, com acompanhamento pelo Admin Geral.

O produto não é um marketplace nem um diretório público. A demonstração, a landing page comercial, a contratação e a plataforma privada do salão são experiências distintas.

**Nota sobre o histórico abaixo:** as seções e fases existentes neste documento foram escritas antes da definição funcional de 2026-10-20. São preservadas como histórico da implementação anterior, mas instruções antigas como “não integrar Supabase nesta fase”, “não enviar WhatsApp” e a antiga divisão das fases não prevalecem sobre o escopo vigente no documento de referência. Nenhuma integração, migração de banco ou publicação em produção deve ser presumida concluída sem validação técnica específica.

## Decisão de escopo da fase atual

**Não integrar o Supabase agora.** Já existe um projeto Supabase, mas a integração fica deliberadamente adiada. A prioridade é preparar o fluxo funcional de captação e qualificação de leads e o dashboard administrativo, usando uma camada de repositório local/mock substituível no futuro. Não criar outro projeto Supabase nem aplicar migrations nesta fase.

O produto não é marketplace, diretório público nem ferramenta para o visitante escolher um estabelecimento. A plataforma identifica negócios, prepara uma proposta individualizada e apresenta ao lead uma primeira versão do próprio site.

## Fluxo comercial desejado

1. Capturar leads a partir de fontes públicas permitidas, registrando URL de origem, data, dados observados e estado da verificação.
2. Exibir os leads em um dashboard interno com busca, filtros, status, prioridade, origem e histórico de ações.
3. Permitir revisão humana dos dados; separar fatos verificados de campos ausentes e hipóteses.
4. Gerar a primeira versão de um site personalizado usando os dados revisados e um modelo inicial neutro, sem esperar que o lead escolha um modelo.
5. Associar a prévia ao lead e permitir revisão interna antes do envio.
6. Registrar a proposta como preparada/enviada e acompanhar os estados de contato e resposta, sem disparar mensagens automaticamente.
7. Depois que o lead visualizar a primeira versão, oferecer a opção de solicitar ou escolher outro modelo dentre os modelos habilitados para essa etapa.
8. Versionar o modelo escolhido e preservar o conteúdo e a versão inicial da proposta; alterações não devem modificar silenciosamente uma proposta já enviada.
9. Após aceite explícito, preparar a conversão do lead em cliente/estabelecimento e a publicação do site. Publicação e integrações externas ficam para fase posterior.

## Dashboard da fase atual

- Visão geral: total de leads, novos, em revisão, qualificados, com site preparado, proposta enviada, interessados e descartados.
- Leads: tabela pesquisável, filtros, ficha detalhada, fonte e evidências, status, prioridade, responsável e notas.
- Proposta/site: status da geração, prévia da primeira versão, modelo usado, data e versão.
- Acompanhamento: registro manual de contatos e respostas, próximos passos e histórico.
- Modelos: catálogo interno dos modelos disponíveis e suas versões; a seleção alternativa é vinculada ao site do lead, nunca global.
- Configurações técnicas: indicar claramente quando os dados são locais/de demonstração e quando uma integração real ainda não está habilitada.

## Limites explícitos

- Não conectar o Supabase nesta fase, não executar migrations e não criar outro projeto.
- Não introduzir marketplace, catálogo público de estabelecimentos ou seletor global de tenant.
- Não enviar mensagens, e-mails ou campanhas automaticamente.
- Não publicar sites automaticamente.
- Não inventar dados capturados nem apresentar dados de demonstração como leads reais.
- Não colocar segredos, PINs ou credenciais privilegiadas no bundle do navegador.
- Não tratar localStorage como banco multiusuário seguro; ele é apenas persistência provisória para desenvolvimento/demonstração até a integração futura.
- Não remover os dados e fluxos legados do Yeshua sem inventário e migração não destrutiva. Yeshua deixa de ser a marca da plataforma, mas os ativos específicos do estabelecimento devem ser preservados onde ainda forem necessários.

## Arquitetura de implementação agora

- Preservar React + TypeScript + Vite e o deploy existente na Cloudflare.
- Separar o módulo de prospecção/dashboard do site público de cada negócio.
- Definir tipos de domínio e uma interface de repositório para leads, projetos de site, versões de modelos e atividades.
- Usar implementação local/mock explícita, com dados de exemplo claramente marcados; não simular sucesso de raspagem ou envio externo.
- Preparar a camada de persistência para que o repositório Supabase possa ser conectado depois sem reescrever os componentes.
- Registrar falhas e estados da geração do site; não exibir como pronta uma prévia que não foi gerada.
- A captura automatizada deve usar fontes permitidas, respeitar controles de acesso e operar no servidor; a primeira implementação está em `functions/api/capture.ts` e ainda precisa de validação operacional/rate limiting antes de uso em escala.

## Estado técnico conhecido

- Aplicação React + TypeScript + Vite; deploy configurado para Cloudflare Pages.
- Há persistência e seleção de estabelecimento em localStorage/sessionStorage (src/data/store.ts), inclusive seleção por query string e seleção salva. Isso pertence ao fluxo legado e não deve virar o mecanismo do dashboard de leads.
- Há PINs e autenticação local legada no código cliente. Não são uma fronteira de segurança e não devem ser reaproveitados como autenticação de produção.
- O painel atual de superadmin é focado em estabelecimentos, não em pipeline de leads; deve ser adaptado ou substituído por um dashboard operacional de prospecção, preservando os fluxos de administração local que ainda forem necessários ao site legado.
- A migration Supabase preparada no repositório é somente preparação documental/código. Não foi aplicada nem validada em banco real; fica fora do escopo desta fase.

## Fases

### Fase 1 — Prospecção e dashboard sem integração externa (prioridade)
- Definir tipos, estados e interface de repositório para leads, atividades e projetos de site.
- Implementar dashboard de leads e ficha detalhada com persistência provisória claramente identificada.
- Implementar captura manual/importação assistida, com fonte e revisão; não afirmar que há scraping automatizado se ele não estiver conectado.
- Implementar pipeline de status e histórico de acompanhamento.
- Criar geração/preparação da primeira versão do site a partir de dados aprovados e modelo neutro.
- Exibir prévia ligada ao lead e registrar erros/estado real de geração.
- Deixar preparado o fluxo posterior para escolha alternativa de modelo pelo lead.

### Fase 2 — Modelos e experiência do lead
- Criar catálogo interno versionado de modelos.
- Entregar ao lead a primeira versão já preparada.
- Permitir escolha/solicitação de outro modelo depois da primeira prévia, vinculada ao projeto.
- Preservar versões e registrar decisões do lead; revisão interna antes de atualizar a proposta.

### Fase 3 — Integração e segurança
- Conectar ao projeto Supabase existente somente quando autorizado e quando a fase de produto estiver pronta.
- Aplicar e testar migrations, RLS, autenticação e isolamento; substituir o repositório local sem perder dados revisados.
- Captura server-side inicial implementada em `functions/api/capture.ts` para metadados de sites públicos; adicionar rate limiting/observabilidade e ampliar validação antes de operação em escala.
- Configurar envio de propostas e publicação apenas após decisões explícitas, com proteção de segredos e auditoria.

## Critérios de aceite da Fase 1

- Dashboard mostra leads e seus estados com busca/filtros e histórico.
- A origem e a revisão dos dados ficam visíveis.
- É possível registrar um lead sem inventar resultados de scraping.
- Um lead qualificado pode ter uma primeira versão de site associada a ele.
- A prévia e o estado da geração são verificáveis.
- O dashboard funciona sem conexão com Supabase e deixa claro que a persistência é provisória.
- Não há marketplace nem seletor global de estabelecimento no fluxo de prospecção.
- A primeira versão é preparada antes de oferecer modelos alternativos ao lead.
- Nenhum contato externo ou publicação acontece automaticamente.

## Estado da execução — 2026-10-19

Implementação inicial da Fase 1 adicionada à branch:
- Aba interna "Prospecção de Leads" no painel administrativo existente.
- Cadastro manual de leads, pesquisa, filtro por status, edição de status/verificação e histórico de atividades.
- Importação CSV com reconhecimento de cabeçalhos comuns e deduplicação por nome dentro dos dados existentes.
- Preparação de uma prévia visual local após os dados do lead serem marcados como verificados.
- Opções de modelos alternativos aparecem somente depois da primeira versão; a troca cria uma versão registrada no histórico.
- Persistência provisória em localStorage, sem Supabase.
- Nome global padrão da plataforma neutralizado, preservando Yeshua como estabelecimento existente.

Limitações ainda abertas:
- A prévia agora pode ser aberta por um link autossuficiente e compartilhável, sem login; não é hospedagem/publicação real, não tem persistência server-side nem metadados sociais gerados no servidor.
- A captura automatizada inicial usa uma Cloudflare Pages Function para HTML/JSON-LD público; páginas dinâmicas ou protegidas podem exigir revisão manual.
- Não há envio de proposta, e-mail ou WhatsApp, publicação, autenticação de produção ou sincronização multiusuário.
- Build e testes automatizados ainda precisam ser executados num ambiente com dependências instaladas. Não há execução de GitHub Actions registrada para os commits desta fase.


## Atualização de implementação — captura e prévia (2026-10-19)

- Adicionada a Cloudflare Pages Function `POST /api/capture`: extração server-side de metadados e JSON-LD, limite de resposta, timeout, validação de URL e controle básico de redirecionamentos.
- O dashboard permite capturar dados ao cadastrar um lead ou atualizar dados de um lead existente. Campos capturados ficam em revisão; não são automaticamente considerados verdadeiros.
- Adicionada a página pública `src/pages/SharedSitePreview.tsx` e o link `?site-preview=...`, que transporta um snapshot sanitizado da proposta e pode ser aberto em outro navegador/dispositivo.
- A geração do link não envia mensagens nem publica o site. O payload está no URL, não em banco compartilhado; a versão é um snapshot e não sincroniza alterações futuras.
- Ainda é necessário executar build/lint/testes e implantar a branch no Cloudflare Pages para validar a função HTTP em ambiente real. Nenhum deploy ou teste de ponta a ponta foi realizado por esta alteração.
