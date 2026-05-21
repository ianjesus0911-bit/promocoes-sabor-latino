# Promoções Sabor Latino

Aplicação web em React para criar promoções rápidas e campanhas diárias do restaurante **Sabor Latino**, com foco em vendas por WhatsApp e redes sociais.

## Seções da app

1. Início
2. Campanha Inteligente
3. Criador de promoções
4. Gerador de textos
5. Campanha do Dia
6. Instagram Oficial
7. Inspirações & Imagens
8. Histórico
9. Favoritas
10. Promoções rápidas prontas
11. Configurações

---

## Instagram Oficial com Netlify Functions

A integração oficial foi preparada para funcionar na **Netlify** usando funções serverless em:

- `netlify/functions/instagram-auth-url.js`
- `netlify/functions/instagram-callback.js`
- `netlify/functions/instagram-profile.js`
- `netlify/functions/instagram-insights.js`
- `netlify/functions/_instagram-utils.js`

### Endpoints gerados pela Netlify

- `/.netlify/functions/instagram-auth-url`
  - Gera a URL oficial de autorização da Meta.
- `/.netlify/functions/instagram-callback`
  - Recebe o `code` do OAuth e troca por token de acesso.
- `/.netlify/functions/instagram-profile`
  - Consulta dados básicos reais do perfil profissional conectado.
- `/.netlify/functions/instagram-insights`
  - Estrutura pronta para métricas reais do perfil e publicações.

### Segurança aplicada

- Sem scraping.
- Sem automação não autorizada.
- Sem segredo da Meta no frontend React.
- `META_APP_SECRET` usado apenas no backend (Netlify Functions).
- Token de acesso salvo em cookie `httpOnly` no callback.

---

## Configurar variáveis de ambiente na Netlify

No painel da Netlify (`Site configuration` -> `Environment variables`), configurar:

- `META_APP_ID`
- `META_APP_SECRET`
- `META_REDIRECT_URI`

Exemplo de `META_REDIRECT_URI`:

`https://SEU-SITE.netlify.app/.netlify/functions/instagram-callback`

Variáveis opcionais:

- `PUBLIC_SITE_URL` (ex.: `https://SEU-SITE.netlify.app`)
- `META_API_VERSION` (ex.: `v20.0`)

Arquivo de referência local:

- `.env.example`

---

## Requisitos para funcionar de verdade

Para a conexão oficial real, é necessário:

1. Conta do Instagram **profissional** (Business ou Creator).
2. App criada no **Meta Developers**.
3. Permissões aprovadas pela Meta (App Review), conforme uso.
4. `Redirect URI` configurada corretamente no app da Meta.
5. Instagram profissional vinculado a uma Página do Facebook.

---

## Fluxo de conexão oficial

1. Usuário toca em **Conectar Instagram via Meta** no módulo Instagram Oficial.
2. Front chama `/.netlify/functions/instagram-auth-url`.
3. Função retorna URL oficial de OAuth da Meta.
4. Usuário autentica e autoriza na Meta.
5. Meta redireciona para `/.netlify/functions/instagram-callback`.
6. Callback troca `code` por token e salva cookie seguro.
7. Front atualiza estado para:
   - Não conectado
   - Conectando
   - Conectado
   - Erro na conexão
8. Front consulta `/.netlify/functions/instagram-profile` para exibir dados do perfil.

---

## Comportamento no frontend

No módulo **Instagram Oficial**, a app mostra:

- Instagram oficial configurado (ex.: `@saborlatinobassano`)
- Estado de conexão
- Data da conexão
- Dados do perfil quando disponíveis
- Mensagem clara em caso de variáveis ausentes ou erro de autenticação

---

## PWA instalável (celular)

A aplicação foi preparada como **PWA** e pode ser instalada no celular como app.

### Recursos incluídos

- `public/manifest.json` (principal)
- `public/manifest.webmanifest` (compatibilidade)
- `public/sw.js` (Service Worker)
- ícones em `public/icons/`

### Como instalar no Android (Chrome)

1. Publique em HTTPS (Netlify já fornece HTTPS).
2. Abra a URL no Chrome do celular.
3. Menu de três pontos.
4. Toque em **Adicionar à tela inicial** ou **Instalar app**.

---

## Observações importantes

- Se a conexão oficial falhar, revise permissões e `META_REDIRECT_URI`.
- Não coloque chaves da Meta no código do frontend.
- Para produção, mantenha escopos e tokens sob governança de segurança.
