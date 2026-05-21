# Promoções Sabor Latino

Aplicação web em React para criar campanhas e promoções rápidas do restaurante **Sabor Latino** (Nova Bassano/RS), com foco em conversão por WhatsApp e redes sociais.

## Seções principais da app

1. Início  
2. Campanha Inteligente  
3. Criador de promoções  
4. Gerador de textos  
5. Campanha do Dia  
6. Instagram Oficial e Análise Manual  
7. Inspirações & Imagens  
8. Histórico  
9. Favoritas  
10. Promoções rápidas prontas  
11. Configurações  

---

## Geração com IA (segura via Netlify Functions)

A **Campanha Inteligente** usa backend serverless para proteger a chave da OpenAI.

- Função: `netlify/functions/generate-campaign.js`
- Endpoint no frontend: `POST /.netlify/functions/generate-campaign`
- Modelo usado: `gpt-4o-mini`
- Prompt de sistema fixo no backend (não exposto no React)

### Segurança aplicada

- A chave **não** fica no frontend React.
- Não usar `VITE_OPENAI_API_KEY`.
- A chave é lida apenas no backend com `process.env.OPENAI_API_KEY`.
- Se a IA falhar ou a chave não existir, a app usa **fallback local** automaticamente para não quebrar o fluxo.

---

## Variáveis de ambiente na Netlify

No painel da Netlify (`Site configuration` -> `Environment variables`), configure:

- `OPENAI_API_KEY` (obrigatória para geração com IA real)

Variáveis já existentes no projeto (fluxos de Instagram backend):

- `META_APP_ID`
- `META_APP_SECRET`
- `META_REDIRECT_URI`
- `PUBLIC_SITE_URL` (opcional)
- `META_API_VERSION` (opcional)

Arquivo de referência local:

- `.env.example`

---

## Fluxo da Campanha Inteligente

1. Usuário preenche produto, objetivo, público, momento, canal e tom.
2. Frontend envia os dados para `/.netlify/functions/generate-campaign`.
3. A function gera os textos com OpenAI no backend.
4. O frontend exibe o conteúdo retornado.
5. Se houver falha de IA, a app mostra mensagem amigável e ativa o gerador local automaticamente.

---

## Netlify Functions

`netlify.toml` já está configurado para publicar funções em:

- `[functions]`
- `directory = "netlify/functions"`
- `node_bundler = "esbuild"`

---

## PWA instalável (celular)

A aplicação está preparada como PWA para uso no celular.

### Recursos incluídos

- `public/manifest.json`
- `public/manifest.webmanifest`
- `public/sw.js`
- ícones em `public/icons/`

### Como instalar no Android (Chrome)

1. Publique em HTTPS (Netlify já fornece HTTPS).
2. Abra a URL no Chrome do celular.
3. Toque no menu de três pontos.
4. Selecione **Adicionar à tela inicial** ou **Instalar app**.
