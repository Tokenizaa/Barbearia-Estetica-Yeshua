# Roadmap — Plataforma de prospecção automatizada e sites white-label

**Escopo vigente:** 2026-10-20  
**Fonte de verdade funcional:** [Base funcional oficial e prontidão da Fase 1](./PRODUCT_FLOW_BASELINE_AND_PHASE1_READINESS.md)

## Princípio não negociável

**A prospecção é automatizada de ponta a ponta e não depende de intervenção humana obrigatória.** Documentação anterior que descreva cadastro manual de leads, importação manual como fluxo principal, revisão humana obrigatória, contato manual assistido ou ausência de envio automático está obsoleta e não deve orientar a implementação.

Pessoas podem configurar campanhas, acompanhar métricas, ajustar critérios e revisar exceções. Essas ações são complementares: não podem ser gates obrigatórios no caminho normal de um lead.

Se uma fonte, credencial ou integração não estiver configurada, o sistema deve registrar um bloqueio técnico real, preservar o trabalho pendente e expor o motivo no monitoramento. Não pode simular sucesso nem trocar silenciosamente automação por uma tarefa manual.

## Fluxo comercial automatizado

1. **Agendar e executar descoberta:** executar campanhas por segmento, região e critérios configurados, em agenda ou fila de trabalho.
2. **Coletar e mapear:** obter dados comerciais disponíveis por fontes autorizadas, preferindo APIs oficiais/licenciadas quando aplicável; registrar fonte, URL, data, evidência e limitações.
3. **Normalizar e deduplicar:** consolidar negócios existentes e novos, com chaves estáveis e proteção contra execuções concorrentes.
4. **Qualificar automaticamente:** pontuar oportunidades com regras explicáveis, distinguir fatos de inferências e encaminhar registros incompletos por regras de confiança sem bloquear toda a campanha.
5. **Gerar a demonstração personalizada:** selecionar um template adequado, produzir o projeto e salvar dados e versão de forma persistente. Nunca inventar informações ausentes.
6. **Publicar o link da proposta:** criar uma URL individual, estável e pública que abre a landing page comercial, não o painel administrativo nem o site definitivo do estabelecimento.
7. **Apresentar alternativas de modelos:** permitir que o próprio lead compare a proposta e selecione outros modelos antes do cadastro ou pagamento; persistir e versionar cada escolha.
8. **Enviar a abordagem automaticamente:** usar WhatsApp Business Platform ou provedor autorizado, conforme políticas do canal e legislação aplicável. Registrar fila, tentativa, confirmação, falha, retentativa, resposta e opt-out. Nunca declarar envio sem recibo/resultado confirmado.
9. **Acompanhar o funil automaticamente:** registrar eventos e atualizar estados de leads e projetos conforme resultados verificáveis.
10. **Converter após decisão do lead:** cadastro, plano e pagamento só começam quando o lead escolhe contratar; ativar somente após confirmação válida do pagamento.
11. **Ativar a área privada:** depois da ativação, disponibilizar o editor e a publicação conforme plano, mantendo separado o Admin Geral.

## Requisitos de operação autônoma

- Execução assíncrona por fila e/ou agenda; não depender de uma sessão de navegador aberta.
- Persistência server-side compartilhada para leads, campanhas, projetos, versões, tarefas e atividades; `localStorage` não é banco operacional.
- Idempotência em descoberta, geração, publicação de links e envio de mensagens.
- Retentativas limitadas com backoff, classificação de erros e fila de falhas recuperáveis.
- Retomar tarefas interrompidas sem duplicar leads, projetos ou mensagens.
- Observabilidade por etapa: volume processado, duração, sucesso, falha, motivo e próxima tentativa.
- Controle de frequência, respeito às condições de uso das fontes, políticas do WhatsApp, base legal, opt-out e listas de supressão.
- Segredos exclusivamente no servidor; autorização e isolamento de dados aplicados no servidor e no banco.
- Evidência verificável de cada ação externa. Nenhuma interface deve mostrar sucesso presumido.
- Revisão humana opcional para exceções, nunca aprovação obrigatória em cada lead.

## Fase 1 — Prospecção automatizada, demonstração e landing page

**Objetivo:** completar o ciclo autônomo desde a descoberta até a abordagem comercial e a experiência pública da proposta.

Inclui:
- fontes autorizadas de descoberta por segmento e região;
- execução automática programada e/ou por fila;
- coleta, proveniência, normalização, deduplicação e qualificação;
- persistência compartilhada de campanhas, leads, projetos, versões e eventos;
- geração de demonstrações individualizadas a partir de templates reais;
- URL pública persistente e landing page comercial separada do painel;
- seleção pública e versionada de modelos;
- envio automático real via WhatsApp autorizado;
- acompanhamento de entregas, falhas, respostas, opt-out e conversão;
- painel do Admin Geral para monitorar e intervir em exceções, sem ser operador obrigatório;
- testes integrados que comprovem o fluxo completo.

**Critérios de aceite:**
1. Uma campanha configurada é executada sem cadastro manual de cada negócio.
2. Novos leads têm proveniência e data de captura e são deduplicados de forma persistente.
3. Qualificação e geração da demonstração avançam sem aprovação humana obrigatória.
4. Falhas em qualquer etapa ficam persistidas e podem ser retomadas sem perda ou duplicação.
5. Cada lead elegível recebe projeto versionado e link público persistente.
6. O link abre a landing page comercial em sessão separada e oferece modelos alternativos antes de cadastro/pagamento.
7. O envio pelo WhatsApp é real, autorizado e confirmado pelo provedor; falhas e opt-outs impedem envios indevidos.
8. O funil reflete eventos comprovados, não cliques administrativos ou sucesso simulado.
9. Build, lint, testes e validação ponta a ponta são executados e registrados.

## Fase 2 — Cadastro, contratação, VenoPag e ativação

- Cadastro do responsável e estabelecimento após intenção explícita de contratar.
- Seleção do plano e preservação do modelo/projeto escolhido.
- Checkout VenoPag criado no servidor.
- Webhook autenticado/validado, processamento idempotente e conciliação de pagamentos.
- Estados separados para cadastro, pagamento pendente, pago, falho, cancelado e cliente ativo.
- Reconciliação do lead com a conta e o estabelecimento sem duplicação.
- Não habilitar cobrança real até validar credenciais, contratos, webhooks, divergências de valor, repetição, expiração e falhas.

## Fase 3 — Plataforma privada, publicação e operação completa

- Área privada multiestabelecimento com isolamento de tenant no servidor e no banco.
- Editor persistente de conteúdo, serviços e imagens.
- Fluxo de revisão e publicação de site conforme plano.
- Admin Geral para leads, campanhas, propostas, mensagens, clientes, planos, pagamentos, projetos e publicações.
- Auditoria, métricas operacionais e financeiras, recuperação de falhas e gestão de permissões.

## Situação técnica conhecida e restrições

A avaliação anterior encontrou um painel de leads com persistência em `localStorage`, captura de metadados de uma URL conhecida em `functions/api/capture.ts`, prévia baseada em snapshot no URL e ausência de integração comprovada de descoberta em escala e envio de WhatsApp. Esses blocos são protótipos reutilizáveis, não uma implementação completa da automação.

Não presumir que migrations, secrets ou integrações estejam configurados apenas porque há arquivos no repositório. A prontidão só pode ser declarada após inspeção e validação executada.

## Regras de preservação e governança

- Preservar o site e os ativos específicos da Barbearia/Estética Yeshua; Yeshua é um estabelecimento inicial, não a marca global.
- O produto não é marketplace nem diretório público.
- A demonstração pública, landing page comercial, contratação, plataforma privada do salão e Admin Geral são experiências distintas.
- Não inventar dados capturados ou apresentar inferências como fatos.
- Não expor credenciais no frontend ou no repositório.
- Usar a branch existente `feat/salon-onboarding-venopag`; não criar branch, mesclar PR ou publicar em produção sem autorização explícita.
- Seguir: entender o estado atual → preservar o que funciona → implementar a menor mudança coerente → validar o resultado.
