# Captação de leads — execução nativa na Cloudflare

A coleta ativa fica no Worker `workers/prospecting-scheduler/src/index.ts`. Este diretório não contém um serviço para implantar.

## Arquitetura

- Cloudflare Worker executa a fila de campanhas e a lógica de captação.
- Cloudflare Browser Run fornece o Chromium remoto via binding `PROSPECTING_BROWSER`.
- Playwright controla o navegador a partir do Worker; não há Docker, contêiner, VPS, Python ou serviço externo.
- O Worker normaliza, deduplica e persiste os resultados em Supabase.
- O front-end existente continua sendo a interface de busca e CRM.

## Configuração

O arquivo `wrangler.prospecting-scheduler.toml` declara `[browser] binding = "PROSPECTING_BROWSER"`. As credenciais Supabase permanecem como secrets do Worker; não devem ser colocadas no front-end. A implantação exige confirmar o binding Browser Run no ambiente Cloudflare e validar compatibilidade do pacote Playwright instalado.

## Validação pendente

Ainda é necessário executar o build/testes do Worker e uma busca real ponta a ponta, confirmando resultados persistidos e deduplicação. A existência do código não significa que o coletor esteja implantado ou operacional.
