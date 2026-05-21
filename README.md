# Promoções Sabor Latino

Aplicação web em React para criar promoções rápidas e campanhas diárias do restaurante **Sabor Latino**, com foco em vendas por WhatsApp e redes sociais.

## Seções da app

1. Início
2. Campanha Inteligente
3. Criador de promoções
4. Gerador de textos
5. Campanha do Dia
6. Instagram Oficial (simulado)
7. Inspirações & Imagens
8. Histórico
9. Favoritas
10. Promoções rápidas prontas
11. Configurações

---

## PWA instalável (celular)

A aplicação foi preparada como **PWA** e pode ser instalada no celular como app.

### Recursos incluídos

- `public/manifest.json` (principal)
- `public/manifest.webmanifest` (compatibilidade)
- `public/sw.js` (Service Worker)
- Ícones básicos da app em `public/icons/`
- Nome da app: **Promoções Sabor Latino**
- Short name: **Sabor Latino**
- Cor principal quente: `#e15b1e`
- Suporte a **Adicionar à tela inicial**
- Configuração compatível com Android + Chrome

### Como instalar no Android (Chrome)

1. Publique a app (ex.: Vercel) em **HTTPS**.
2. Abra a URL no Chrome do celular.
3. Toque no menu de três pontos.
4. Toque em **Adicionar à tela inicial** ou **Instalar app**.
5. Confirme para criar o atalho/app.

### Após instalar

- A app abre em modo “app” (standalone), sem barra do navegador.
- O Service Worker mantém cache dos arquivos principais para abrir mais rápido.

### Atualizações da app

Quando publicar nova versão, o cache pode levar alguns segundos para atualizar.
Se necessário:

1. Feche e abra a app instalada.
2. No Chrome, recarregue a página uma vez.

---

## Publicação na Vercel

1. Faça deploy do projeto.
2. Confirme que os arquivos PWA estão públicos:
   - `/manifest.json`
   - `/sw.js`
   - `/icons/icon-192.png`
   - `/icons/icon-512.png`
3. Abra a URL final no celular e valide a instalação.

Observação: PWA funciona corretamente em produção com HTTPS (padrão da Vercel).

---

## Backend para Instagram Graph API (Vercel Functions)

Foi adicionada estrutura backend para integração oficial futura com Instagram Graph API da Meta, sem scraping e sem automações não autorizadas.

### Endpoints criados

- `GET /api/instagram/config`
  - Verifica se variáveis de ambiente estão configuradas.
- `GET /api/instagram/auth-url`
  - Gera URL oficial de OAuth da Meta.
- `GET /api/instagram/oauth-callback`
  - Recebe `code` do OAuth e troca por token short-lived e long-lived.
- `GET /api/instagram/account`
  - Busca conta profissional de Instagram conectada à página do Facebook.
- `GET /api/instagram/media`
  - Busca publicações da conta profissional conectada.
- `GET|POST /api/instagram/recommendations`
  - Gera recomendações automáticas com base nos dados de posts.

### Arquivos principais de backend

- `api/instagram/_lib/env.js`
- `api/instagram/_lib/http.js`
- `api/instagram/_lib/metaGraph.js`
- `api/instagram/config.js`
- `api/instagram/auth-url.js`
- `api/instagram/oauth-callback.js`
- `api/instagram/account.js`
- `api/instagram/media.js`
- `api/instagram/recommendations.js`

### Runtime Vercel

- `vercel.json` configurado para `nodejs20.x` nas funções de `api/`.

---

## Variáveis de ambiente

Use `.env.example` como base:

```bash
META_APP_ID=YOUR_META_APP_ID
META_APP_SECRET=YOUR_META_APP_SECRET
REDIRECT_URI=https://your-domain.vercel.app/api/instagram/oauth-callback
ACCESS_TOKEN=YOUR_LONG_LIVED_USER_ACCESS_TOKEN
META_API_VERSION=v20.0
```

### Variáveis obrigatórias

- `META_APP_ID`
- `META_APP_SECRET`
- `REDIRECT_URI`
- `ACCESS_TOKEN`

Importante:

- Não commitar chaves reais no repositório.
- Não expor token no frontend.
- Guardar tokens apenas no backend (ou secret manager).

---

## Passo a passo no Meta Developers (oficial)

1. Criar app em [Meta for Developers](https://developers.facebook.com/).
2. Adicionar produtos necessários no app:
   - Facebook Login
   - Instagram Graph API
3. Em Facebook Login, configurar a URL de redirecionamento OAuth:
   - deve ser igual ao `REDIRECT_URI`
   - exemplo: `https://your-domain.vercel.app/api/instagram/oauth-callback`
4. Garantir que o Instagram esteja em conta profissional (Business ou Creator).
5. Conectar a conta profissional do Instagram a uma página do Facebook.
6. Solicitar permissões necessárias no app (conforme cenário):
   - `instagram_basic`
   - `instagram_manage_insights`
   - `pages_show_list`
   - `pages_read_engagement`
7. Gerar token de acesso de teste (modo development) para validar.
8. Configurar variáveis de ambiente no projeto Vercel.
9. Fazer deploy e testar endpoints de backend.
10. Para produção, concluir App Review da Meta para permissões avançadas.

---

## Fluxo recomendado de integração

1. Front chama `GET /api/instagram/auth-url`.
2. Usuário autoriza via Meta.
3. Meta redireciona para `REDIRECT_URI` com `code`.
4. Backend troca `code` por token em `GET /api/instagram/oauth-callback`.
5. Backend usa token para:
   - localizar conta profissional (`/api/instagram/account`)
   - buscar posts (`/api/instagram/media`)
   - gerar recomendações (`/api/instagram/recommendations`)

---

## Testes rápidos de endpoints

### 1) Verificar configuração

`GET /api/instagram/config`

### 2) Gerar URL de autorização

`GET /api/instagram/auth-url`

### 3) Buscar conta conectada

`GET /api/instagram/account`

### 4) Buscar mídia

`GET /api/instagram/media?limit=10`

### 5) Gerar recomendações

`GET /api/instagram/recommendations`

---

## Observações de segurança

- Nunca usar scraping para Instagram.
- Nunca armazenar `META_APP_SECRET` no cliente.
- Sempre tratar tokens como segredo.
- Para produção, usar backend seguro com renovação e persistência de token.
