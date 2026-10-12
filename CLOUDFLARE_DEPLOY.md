# Como Hospedar na Cloudflare com Wrangler

Este projeto já está 100% preparado para rodar no **Cloudflare Pages** ou **Cloudflare Workers** com suporte a SPA, cache otimizado e PWA.

---

### Opção 1: Publicação Rápida via Cloudflare Pages (Recomendado)

1. Faça login na sua conta Cloudflare no terminal (apenas na 1ª vez):
   ```bash
   npx wrangler login
   ```

2. Gere o build e envie para o Cloudflare Pages:
   ```bash
   npm run pages:deploy
   ```
   *(Ou execute diretamente: `npx wrangler pages deploy dist --project-name=barbearia-yeshua`)*

3. Quando o comando finalizar, o Cloudflare fornecerá uma URL pública gratuita (ex: `https://barbearia-yeshua.pages.dev`).

---

### Opção 2: Testar Localmente com o Emulador do Cloudflare (Preview)

Para simular o comportamento de borda (edge) do Cloudflare no seu computador:
```bash
npm run pages:preview
```

---

### Arquivos já configurados no projeto:
- `wrangler.jsonc` & `wrangler.toml`: Configuração do projeto e diretório de saída (`./dist`).
- `public/_redirects`: Regra de redirecionamento SPA (`/* /index.html 200`) para que rotas funcionem sem erro 404 ao recarregar a página.
- `public/_headers`: Políticas de cache (Service Worker / Manifest sem cache agressivo, assets com cache imutável).
- `package.json`: Scripts prontos (`npm run pages:deploy` e `npm run pages:preview`).
