# ADR — Scraper privado e simples para captação de leads

- **Status:** aprovado para implementação
- **Data:** 2026-10-24
- **Projeto:** Beleza-Digital
- **Referência de implementação:** https://github.com/zohaibbashir/Google-Maps-Scrapper

## Contexto

O módulo CRM/Empresas do front-end apresenta busca e modelos integrados, mas a captação real não está comprovada: a interface anteriormente podia exibir dados iniciais e a campanha dependia do binding `BROWSER`. Esse binding faz parte da implementação antiga e não será requisito do novo fluxo.

A referência escolhida na conversa é um scraper Python com Playwright que pesquisa estabelecimentos no Google Maps e extrai campos públicos como nome, endereço, telefone, site, avaliações, quantidade de avaliações e horário de funcionamento.

## Decisão

Executar a coleta no próprio Cloudflare Worker com Cloudflare Browser Run e Playwright. Não usar serviço Python externo, Docker, contêiner ou VPS. O binding de navegador será nomeado `PROSPECTING_BROWSER`, evitando a dependência do nome antigo `BROWSER` sem abandonar a execução de navegador remoto gerenciada pela Cloudflare.

A referência Python `zohaibbashir/Google-Maps-Scrapper` permanece como referência de comportamento e campos a coletar, não como runtime a hospedar. O Worker existente é o lugar da implementação compatível com Cloudflare.

## Fluxo esperado

1. Usuário autorizado informa o segmento/termo e a região no módulo CRM/Empresas.
2. Front-end envia a solicitação ao endpoint privado do scraper.
3. O scraper pesquisa estabelecimentos públicos com Playwright, aplica limite de resultados e normaliza os campos.
4. Resultados são validados e persistidos em `public.prospecting_candidates`, com deduplicação por identificador estável (site/telefone normalizados e, como fallback, nome + endereço normalizados).
5. A interface atualiza a lista e informa resultados encontrados, novos, duplicados e falhas reais; nenhuma empresa fictícia deve aparecer como resultado da busca.
6. Etapas, modelos, notas e follow-ups do CRM permanecem persistidos em `public.prospecting_crm_state`.

## Requisitos de implementação

- Usar `env.PROSPECTING_BROWSER` e declarar `[browser] binding = "PROSPECTING_BROWSER"` na configuração Wrangler do Worker.
- Reutilizar o front-end e os contratos de dados existentes sempre que compatíveis; não duplicar páginas ou menus.
- Não expor chaves Supabase de serviço, tokens do scraper ou segredos no navegador.
- Restringir o endpoint de execução a usuários autorizados; validar entrada, limitar resultados, aplicar timeout e devolver erros compreensíveis.
- Não contornar CAPTCHA, login, bloqueios de acesso ou controles antiabuso. Respeitar termos e limites do site; se a fonte impedir a consulta, reportar a falha em vez de fabricar dados.
- Preservar a rastreabilidade da origem e da data de coleta. Não sobrescrever alterações comerciais do CRM ao atualizar dados de um estabelecimento.
- Não afirmar que a busca funciona antes de validar o fluxo completo com uma pesquisa real e persistência confirmada.

## Critérios de aceite

- [ ] Front-end envia os parâmetros reais da pesquisa e mostra estado de carregamento/erro.
- [ ] Scraper Python/Playwright executa sem binding `BROWSER`.
- [ ] Resultados reais são normalizados e gravados em Supabase.
- [ ] Repetir a mesma busca não cria duplicatas.
- [ ] CRM recupera os dados após recarregar a página.
- [ ] Segredos não são expostos no bundle nem nas respostas/logs.
- [ ] Teste de build e teste ponta a ponta registrados; ambiente de produção só é considerado operacional após validação explícita.

## Estado atual e próximo passo

A coleta foi iniciada diretamente no Worker e o binding foi renomeado para PROSPECTING_BROWSER. A implementação ainda precisa de build/testes, validação de configuração Cloudflare e busca real ponta a ponta antes de ser considerada operacional.