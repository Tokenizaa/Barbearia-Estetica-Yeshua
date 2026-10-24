# ADR — Scraper privado e simples para captação de leads

- **Status:** aprovado para implementação
- **Data:** 2026-10-24
- **Projeto:** Beleza-Digital
- **Referência de implementação:** https://github.com/zohaibbashir/Google-Maps-Scrapper

## Contexto

O módulo CRM/Empresas do front-end apresenta busca e modelos integrados, mas a captação real não está comprovada: a interface anteriormente podia exibir dados iniciais e a campanha dependia do binding `BROWSER`. Esse binding faz parte da implementação antiga e não será requisito do novo fluxo.

A referência escolhida na conversa é um scraper Python com Playwright que pesquisa estabelecimentos no Google Maps e extrai campos públicos como nome, endereço, telefone, site, avaliações, quantidade de avaliações e horário de funcionamento.

## Decisão

Adaptar o scraper de referência ao fluxo já existente no front-end de Beleza-Digital e à persistência Supabase. Manter o escopo privado, pequeno e operável; não criar uma plataforma genérica de scraping nem adicionar provedores desnecessários.

**Playwright continua sendo usado. O binding Cloudflare `BROWSER` deixa de ser uma dependência obrigatória.** O scraper Python/Playwright precisa executar em um ambiente que suporte Python e navegador Chromium; ele não será executado diretamente dentro de um Cloudflare Worker. O front-end deve acionar um endpoint privado de execução compatível com esse runtime, protegido por autenticação/segredo de serviço, e exibir estados reais da busca.

## Fluxo esperado

1. Usuário autorizado informa o segmento/termo e a região no módulo CRM/Empresas.
2. Front-end envia a solicitação ao endpoint privado do scraper.
3. O scraper pesquisa estabelecimentos públicos com Playwright, aplica limite de resultados e normaliza os campos.
4. Resultados são validados e persistidos em `public.prospecting_candidates`, com deduplicação por identificador estável (site/telefone normalizados e, como fallback, nome + endereço normalizados).
5. A interface atualiza a lista e informa resultados encontrados, novos, duplicados e falhas reais; nenhuma empresa fictícia deve aparecer como resultado da busca.
6. Etapas, modelos, notas e follow-ups do CRM permanecem persistidos em `public.prospecting_crm_state`.

## Requisitos de implementação

- Remover a dependência obrigatória de `env.BROWSER`, `chromium.connectOverCDP(env.BROWSER)` e a configuração antiga `[browser] binding = "BROWSER"` do caminho ativo.
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

Esta decisão registra o desenho e os critérios de aceite; não significa que o scraper já esteja integrado ou implantado. A implementação deve começar pelo contrato do endpoint e pelo adaptador Python/Playwright, depois conectar a ação de busca existente no front-end, persistir os resultados e validar a jornada completa.