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

## Limites atuais

Este é o primeiro adaptador de coleta, não um serviço HTTP implantado. Ele ainda não grava diretamente no Supabase e não está conectado ao botão “Nova busca” do front-end. Não configurar segredo de serviço no navegador nem expor esse script publicamente. A próxima etapa é disponibilizar um endpoint privado autenticado no runtime apropriado, validar autorização administrativa, gravar em `prospecting_candidates` com deduplicação e conectar o formulário existente do CRM. Até essa integração e um teste real, a captação no front-end não deve ser considerada operacional.

O scraper não tenta contornar CAPTCHA, login, bloqueios ou controles antiabuso. Se o Google Maps não disponibilizar os resultados, a execução informa erro em vez de simular empresas.