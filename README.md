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

A **Campanha Inteligente** e o módulo **Inspirações & Imagens** usam backend serverless para proteger a chave da OpenAI.

- Função: `netlify/functions/generate-campaign.js`
- Endpoint no frontend: `POST /.netlify/functions/generate-campaign`
- Função: `netlify/functions/adapt-inspiration.js`
- Endpoint no frontend: `POST /.netlify/functions/adapt-inspiration`
- Função: `netlify/functions/generate-hooks.js`
- Endpoint no frontend: `POST /.netlify/functions/generate-hooks`
- Modelo usado: `gpt-4o-mini`
- Prompt de sistema fixo no backend (não exposto no React)

### Segurança aplicada

- A chave **não** fica no frontend React.
- Não usar `VITE_OPENAI_API_KEY`.
- A chave é lida apenas no backend com `process.env.OPENAI_API_KEY`.
- Se a IA falhar ou a chave não existir, a app usa **fallback local** automaticamente para não quebrar o fluxo.
- A função valida o campo `whatsapp` para evitar retorno fraco (ex.: só número de telefone).
- O frontend também valida `whatsapp` e reforça automaticamente com texto completo se necessário.

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

## Fluxo de Inspirações com IA

1. Usuário salva inspiração manual com dados de link, plataforma, tipo e métricas.
2. Ao tocar em **✨ Adaptar para Sabor Latino**, o frontend envia os dados para `/.netlify/functions/adapt-inspiration`.
3. A function retorna JSON com adaptação original (gancho, texto da plataforma, WhatsApp, prompt de imagem, roteiro, hashtags e CTA).
4. Se a IA falhar, a função e o frontend usam fallback local para manter a experiência fluida.

---

## Fluxo de Ganchos Virais com IA

1. Usuário escolhe produto, estilo de gancho e canal.
2. O frontend chama `/.netlify/functions/generate-hooks`.
3. A resposta retorna ganchos, frases de vídeo, CTAs de WhatsApp e roteiro curto.
4. Ao tocar em **Usar na Campanha Inteligente**, o gancho é salvo no `localStorage` na chave `gancho_selecionado`.
5. A Campanha Inteligente reaproveita esse gancho como frase inicial em TikTok, Story, roteiro e frase de impacto.

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
