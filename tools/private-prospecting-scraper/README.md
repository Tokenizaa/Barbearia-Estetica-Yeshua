# Scraper privado de prospecção

Este diretório contém um scraper mínimo Python + Playwright baseado na referência https://github.com/zohaibbashir/Google-Maps-Scrapper, adaptado para retornar JSON compatível com o domínio de captação de leads.

## Requisitos

- Python 3.11 ou superior
- Chromium instalado pelo Playwright
- Execução em máquina/serviço que suporte navegador real; não é executado dentro de Cloudflare Workers

## Instalação local

```bash
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\\Scripts\\activate
pip install -r requirements.txt
python -m playwright install chromium
```

## Uso

```bash
python scraper.py --search "Barbearias em Porto Alegre RS" --limit 10 --output resultados.json
```

Para depurar visualmente:

```bash
python scraper.py --search "Barbearias em Porto Alegre RS" --limit 5 --headed
```

Sem `--output`, o JSON é enviado para stdout. Erros são enviados para stderr e retornam código de saída diferente de zero. O limite permitido é 1–100 resultados.

## Serviço HTTP privado

O `service.py` expõe `POST /search`, protegido pelo cabeçalho `X-Scraper-Secret`, e `GET /health` para verificação básica. A documentação OpenAPI fica desativada. O serviço não acessa o Supabase diretamente: o Worker existente recebe o JSON e mantém a responsabilidade pela normalização, deduplicação e persistência em `prospecting_candidates`.

Construa a imagem a partir deste diretório e configure `PROSPECTING_SCRAPER_SECRET` como segredo do ambiente de execução:

```bash
docker build -t beleza-digital-prospecting-scraper .
docker run --rm -p 8080:8080 -e PROSPECTING_SCRAPER_SECRET='use-um-segredo-forte' beleza-digital-prospecting-scraper
```

Para integração, configure `PROSPECTING_SCRAPER_URL` no `wrangler.prospecting-scheduler.toml` com a origem HTTPS do serviço (sem `/search`) e configure `PROSPECTING_WORKER_SECRET` no Worker com o mesmo valor de `PROSPECTING_SCRAPER_SECRET`. Não use o segredo no front-end. O serviço deve ser hospedado em runtime de contêiner que suporte Chromium, com HTTPS e restrição de acesso de rede quando disponível.

## Estado da integração

O front-end registra campanhas no Supabase; o Worker agora chama o endpoint Python/Playwright em vez de abrir `env.BROWSER`. O Worker continua responsável por persistir candidatos, aplicar deduplicação e enfileirar as etapas seguintes. A integração só estará operacional depois de implantar o serviço, configurar os dois segredos e `PROSPECTING_SCRAPER_URL`, executar build/testes e validar uma busca real até a lista do CRM após recarregar a página.

O scraper não tenta contornar CAPTCHA, login, bloqueios ou controles antiabuso. Se o Google Maps não disponibilizar os resultados, a execução informa erro em vez de simular empresas.