# Modelo de dados — prospecção e geração de sites

## Entidades

| Tabela | Responsabilidade |
|---|---|
| platform_admins | Registro de contas que podem administrar a plataforma. A autorização efetiva exige claim app_metadata.platform_role=platform_admin emitida por backend confiável. |
| establishments | Clientes/estabelecimentos que possuem site e configuração de marca própria. Yeshua é apenas um registro inicial. |
| establishment_memberships | Associação entre usuário autenticado e estabelecimento, com papel owner/admin/editor/viewer. |
| prospects | Negócios identificados na prospecção antes de se tornarem clientes; guarda fonte e dados capturados. |
| site_templates | Catálogo de modelos disponíveis para seleção no editor. |
| site_template_versions | Configuração versionada de layout, seções e tokens visuais; cada projeto fixa uma versão. |
| site_projects | Rascunho/proposta de site vinculado a prospect ou estabelecimento, com conteúdo separado do modelo. |
| audit_events | Registro de ações relevantes de segurança, aprovação e publicação. |

## Fluxo de dados

```text
Fonte pública permitida
        ↓
     prospects
        ↓ revisão humana
 site_projects (prospect_id)
        ↓ escolha de site_template_version
 geração de conteúdo + design_overrides
        ↓ revisão e aprovação explícita
 conversão do prospect em estabelecimento
        ↓ site_projects passa a usar establishment_id
       publicação
```

## Princípios importantes

- captured_data contém dados coletados; qualification guarda avaliação separada. Não confundir hipótese com fato.
- public_source_urls mantém a origem dos dados e facilita revisão/correção.
- generated_content armazena conteúdo do site (textos, serviços, galeria e contatos aprovados).
- design_overrides guarda customizações do projeto que não alteram o template original.
- template_version_id aponta para uma versão publicada e estável.
- site_projects exige exatamente um contexto: prospect ainda não convertido OU estabelecimento convertido.
- RLS restringe prospects à administração da plataforma; os membros locais acessam apenas projetos do próprio estabelecimento.
- Não armazenar PINs ou senhas de administradores nas tabelas de negócio.
- A service-role key só pode ser usada em servidor confiável e nunca no browser.
- Não expor tabelas a anon por padrão; a publicação pública deve ocorrer por camada de entrega própria e apenas para sites aprovados.

## Modelo inicial

A migration insere um único modelo neutro, modelo-inicial, versão 1, com seções hero, sobre, serviços, galeria e contato. Não é um modelo exclusivo de barbearia e não contém marca, telefone ou endereço do Yeshua.

## Limites do primeiro esquema

- Ainda não há filas/tarefas de raspagem, integração com provedores de IA, armazenamento de arquivos nem domínios customizados. Essas integrações devem ser adicionadas quando o fluxo real estiver definido, sem criar tabelas especulativas.
- A migration não foi aplicada a um projeto Supabase nesta etapa; os testes reais de RLS e advisors ainda precisam ser executados.
