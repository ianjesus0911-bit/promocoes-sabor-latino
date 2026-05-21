const SYSTEM_PROMPT = `Você escreve campanhas para o Sabor Latino, restaurante de comida cubana e latina em Nova Bassano, RS.

Escreva como uma pessoa real da equipe do restaurante, não como uma IA, não como agência de publicidade e não como propaganda de televisão.

O objetivo é fazer a pessoa parar de rolar a tela, sentir vontade de comer e chamar no WhatsApp.

Estilo de escrita:
- Linguagem simples, brasileira, direta e calorosa.
- Tom humano, próximo, de restaurante familiar.
- Frases curtas.
- Nada formal demais.
- Nada exagerado demais.
- Nada com cara de texto automático.
- Sempre mencionar Nova Bassano de forma natural quando fizer sentido.
- Falar como quem conhece o público local.
- Criar desejo visual pela comida: cheiro, carne desfiada, prato quente, arroz, feijão, tempero, comida feita com carinho.
- Usar urgência suave, sem parecer pressão falsa.
- Priorizar pedidos pelo WhatsApp.
- Usar no máximo 1 ou 2 emojis por texto, somente quando fizer sentido.

Evite totalmente palavras e frases genéricas de IA, como:
'incrível', 'sensacional', 'delicioso', 'imperdível', 'experiência única', 'explosão de sabores', 'qualidade incomparável', 'venha viver essa experiência', 'o melhor da gastronomia', 'sabor autêntico em cada mordida', 'prepare-se para se surpreender', 'não perca essa oportunidade'.

Nunca use reticências no final.
Nunca escreva como comercial de TV.
Nunca escreva textos longos demais.
Nunca invente informações que não foram fornecidas.
Nunca prometa desconto, promoção ou brinde se isso não estiver nos dados recebidos.

Regras por canal:

1. WhatsApp:
- Máximo 3 linhas.
- Deve parecer mensagem real enviada por restaurante.
- Começar com gancho direto.
- Mencionar o prato.
- Finalizar com convite para pedir no WhatsApp.
- Não pode ser apenas o número.
- Não pode ser formal.

2. Instagram Story:
- Uma frase curta, forte e visual.
- Máximo 8 palavras.
- Deve parar o dedo.
- Pode parecer legenda de story real.
- Exemplo de estilo: 'Hoje tem comida cubana de verdade.'

3. Instagram Feed:
- Texto mais emocional e humano.
- Contar uma micro-história.
- Conectar comida, família, noite, saudade ou vontade de comer bem.
- Máximo 5 linhas.
- CTA natural para pedir ou chamar no WhatsApp.

4. Facebook:
- Mais claro e informativo.
- Falar com público de 35 a 55 anos.
- Pode mencionar família, jantar, pedido e atendimento.
- Incluir Nova Bassano e WhatsApp quando disponível.
- Tom respeitoso, mas não robótico.

5. TikTok:
- Começar com gancho forte.
- Linguagem mais jovem e curiosa.
- Pode usar frases como:
  'Isso aqui em Nova Bassano pouca gente conhece'
  'Você já provou comida cubana assim?'
  'Olha essa Ropa Vieja saindo quentinha'
- Deve dar vontade de assistir o vídeo até o final.

6. frase_imagem:
- Curta, forte e legível em arte.
- Máximo 7 palavras.
- Deve funcionar como texto grande de imagem ou story.

7. prompt_imagem:
- Criar um prompt visual detalhado para gerar imagem publicitária realista da comida.
- Deve incluir comida cubana/latina, prato quente, iluminação apetitosa, estilo restaurante familiar, sem texto na imagem.
- Não inventar elementos que não combinem com restaurante latino.

8. roteiro_video:
- Roteiro curto para vídeo de 8 a 15 segundos.
- Dividir por cenas rápidas.
- Primeira cena deve ter gancho visual forte.
- Incluir movimento, comida quente, close-up e chamada para WhatsApp.
- Linguagem prática para gerar vídeo com IA.

9. hashtags:
- Máximo 5 hashtags.
- Somente hashtags relevantes.
- Sempre incluir #SaborLatino e #NovaBassano quando fizer sentido.
- Não usar lista enorme.

10. horario_sugerido:
- Sugerir horário simples baseado no momento informado.
- Exemplo: '19h - 21h'.

11. cta_whatsapp:
- Chamada curta para pedido.
- Direta e humana.

Formato obrigatório:
Responda ONLY em JSON válido.
Não escreva explicações fora do JSON.
Não use markdown.
Não use comentários.
O JSON deve ter exatamente estas chaves:

whatsapp
instagram_feed
instagram_story
facebook
tiktok
frase_imagem
prompt_imagem
roteiro_video
hashtags
horario_sugerido
cta_whatsapp

Antes de responder, revise internamente:
- Parece texto de pessoa real?
- Tem gancho?
- Dá vontade de comer?
- Está curto o suficiente?
- Evitou linguagem genérica de IA?
- O WhatsApp tem mensagem completa e não só número?
- O JSON é válido?`;

const REQUIRED_KEYS = [
  "whatsapp",
  "instagram_feed",
  "instagram_story",
  "facebook",
  "tiktok",
  "frase_imagem",
  "prompt_imagem",
  "roteiro_video",
  "hashtags",
  "horario_sugerido",
  "cta_whatsapp",
];

const SALES_VERB_REGEX = /(pe[çc]a|chame|mande|fale|garanta|aproveite|reserve|chama|pedir)/i;
const MOMENT_HOUR_MAP = {
  manhã: "10h - 12h",
  almoço: "11h30 - 14h",
  tarde: "16h - 18h",
  noite: "19h - 21h",
};

const jsonResponse = (payload, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });

const cleanText = (value, fallback = "") => {
  if (typeof value !== "string") return fallback;
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized || fallback;
};

const sanitizeWhatsAppDisplay = (numberValue) => cleanText(numberValue, "+55 54 8100-7256");

const countWords = (text) => cleanText(text).split(" ").filter(Boolean).length;

const truncateToMaxWords = (text, maxWords) => {
  const normalized = cleanText(text);
  if (!normalized) return "";
  const words = normalized.split(" ").filter(Boolean);
  if (words.length <= maxWords) return normalized;
  return words.slice(0, maxWords).join(" ").replace(/[.,;:!?]+$/g, "");
};

const looksLikeOnlyPhone = (text) => {
  const value = cleanText(text);
  if (!value) return true;
  const compact = value.replace(/\s+/g, "");
  if (/^[+()\d.\-]+$/.test(compact)) return true;
  const withoutDigits = value.replace(/[0-9+()\s.\-]/g, "");
  return !withoutDigits.trim();
};

const isWeakWhatsAppMessage = (text) => {
  const value = cleanText(text);
  if (!value) return true;
  if (looksLikeOnlyPhone(value)) return true;
  if (countWords(value) < 8) return true;
  if (value.length < 45) return true;

  const hasPhoneDigits = /\d{8,}/.test(value);
  const hasSalesVerb = SALES_VERB_REGEX.test(value);
  if (hasPhoneDigits && !hasSalesVerb) return true;
  return false;
};

const productDisplayMap = {
  almoço: "Almoço Latino",
  pizza: "Pizza Cubana",
  "ropa vieja cubana": "Ropa Vieja Cubana",
  sobremesa: "Sobremesa da casa",
  "combo familiar": "Combo Familiar",
};

const toneHookMap = {
  urgente: "Nova Bassano, saiu agora e está chamando atenção!",
  familiar: "Tem comida de casa para dividir em família hoje.",
  alegre: "Hoje está com cara de mesa cheia no Sabor Latino.",
  direto: "Passando para avisar: está saindo prato quente agora.",
  caseiro: "Cheiro de comida feita com carinho por aqui.",
  elegante: "Uma noite especial com comida latina bem feita.",
};

const suggestHourByMoment = (form = {}) => MOMENT_HOUR_MAP[cleanText(form.moment).toLowerCase()] || "19h - 21h";

const buildStrongWhatsAppMessage = ({ form = {}, settings = {} }) => {
  const restaurantName = cleanText(settings.restaurantName, "Sabor Latino");
  const whatsapp = sanitizeWhatsAppDisplay(settings.whatsappNumber);
  const product =
    productDisplayMap[cleanText(form.product).toLowerCase()] || cleanText(form.product, "Ropa Vieja Cubana");
  const tone = cleanText(form.tone, "direto").toLowerCase();
  const hook = toneHookMap[tone] || toneHookMap.direto;

  return `${hook}
Hoje tem ${product} quentinho, carne desfiada no ponto e comida com gosto de feita em casa.
Me chama no WhatsApp ${whatsapp} e já deixa seu pedido separado.`;
};

const extractHashtags = (text) => {
  const matches = cleanText(text).match(/#[A-Za-zÀ-ÿ0-9_]+/g) || [];
  const unique = [];
  const seen = new Set();
  for (const tag of matches) {
    const normalized = tag.trim();
    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(normalized);
  }
  return unique;
};

const normalizeHashtags = (candidate, fallback, payload) => {
  const restaurantName = cleanText(payload?.settings?.restaurantName, "Sabor Latino");
  const includeNovaBassano = /nova bassano/i.test(
    `${restaurantName} ${payload?.settings?.address || ""} ${payload?.form?.objective || ""}`
  );

  let tags = extractHashtags(candidate);
  if (!tags.length) tags = extractHashtags(fallback);

  const priority = ["#SaborLatino", "#ComidaCubana", "#PedidoNoWhatsApp", "#ComidaLatina", "#RopaViejaCubana"];
  if (includeNovaBassano) priority.splice(1, 0, "#NovaBassano");

  for (let i = priority.length - 1; i >= 0; i -= 1) {
    const tag = priority[i];
    const already = tags.some((item) => item.toLowerCase() === tag.toLowerCase());
    if (!already) tags.unshift(tag);
  }

  const cleaned = [];
  const seen = new Set();
  for (const tag of tags) {
    const normalized = tag.startsWith("#") ? tag : `#${tag}`;
    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    cleaned.push(normalized);
  }

  return cleaned.slice(0, 5).join(" ");
};

const normalizeStory = (story, fallbackStory) => {
  const baseStory = cleanText(story, cleanText(fallbackStory, "Hoje tem comida cubana de verdade."));
  const singleLine = baseStory.replace(/\n+/g, " ");
  return truncateToMaxWords(singleLine, 8);
};

const buildFallbackCampaign = (payload = {}) => {
  const form = payload?.form || {};
  const settings = payload?.settings || {};
  const insights = payload?.insights || {};

  const restaurantName = cleanText(settings.restaurantName, "Sabor Latino");
  const whatsapp = sanitizeWhatsAppDisplay(settings.whatsappNumber);
  const address = cleanText(settings.address, "Avenida 23 de Maio, nº 313, Centro, Nova Bassano");
  const product =
    productDisplayMap[cleanText(form.product).toLowerCase()] || cleanText(form.product, "Ropa Vieja Cubana");
  const audience = cleanText(form.audience, "famílias");
  const moment = cleanText(form.moment, "almoço");
  const bestHour = cleanText(insights.bestHour, suggestHourByMoment(form));
  const bestVisualStyle = cleanText(insights.bestVisualStyle, "comida quente com vapor e luz apetitosa");

  return {
    whatsapp: buildStrongWhatsAppMessage({ form, settings }),
    instagram_feed: `No fim do dia, a mesa cheia faz diferença.
Hoje o ${product} saiu do jeito que o pessoal de Nova Bassano gosta: quente e bem servido.
Se bateu vontade de comer bem, chama a gente no WhatsApp ${whatsapp}.`,
    instagram_story: `Hoje tem comida cubana de verdade.`,
    facebook: `${restaurantName} em Nova Bassano está com ${product} saindo quentinho hoje.
É comida com tempero caseiro, ideal para ${audience}.
Atendemos pedidos no WhatsApp ${whatsapp}.
Endereço: ${address}.`,
    tiktok: `Você já provou comida cubana assim? Mostra o ${product} saindo quente, close na textura e finaliza com chamada para pedir no WhatsApp ${whatsapp}.`,
    frase_imagem: `${product} quentinho saindo agora`,
    prompt_imagem: `Foto publicitária realista de ${product}, comida cubana/latina, prato quente com vapor, textura suculenta, arroz e feijão ao lado, iluminação apetitosa, mesa de restaurante familiar, ambiente latino acolhedor, sem texto na imagem.`,
    roteiro_video: `Cena 1 (0-3s): close forte do ${product} saindo quente com vapor.
Cena 2 (3-8s): corte mostrando textura da carne, arroz e feijão no prato.
Cena 3 (8-12s): mesa familiar e chamada curta para pedir no WhatsApp ${whatsapp}.`,
    hashtags: "#SaborLatino #NovaBassano #ComidaCubana #RopaViejaCubana #PedidoNoWhatsApp",
    horario_sugerido: bestHour,
    cta_whatsapp: `Chama no WhatsApp ${whatsapp} e faz seu pedido.`,
  };
};

const ensureStrongWhatsApp = (candidate, fallbackCampaign, payload) => {
  const text = cleanText(candidate);
  if (!isWeakWhatsAppMessage(text)) return text;
  return (
    buildStrongWhatsAppMessage({
      form: payload?.form || {},
      settings: payload?.settings || {},
    }) || fallbackCampaign.whatsapp
  );
};

const normalizeCampaignPayload = (rawPayload, fallbackPayload, payload) => {
  const normalized = {};
  for (const key of REQUIRED_KEYS) {
    normalized[key] = cleanText(rawPayload?.[key], fallbackPayload[key] || "");
  }

  normalized.whatsapp = ensureStrongWhatsApp(rawPayload?.whatsapp, fallbackPayload, payload);
  normalized.instagram_story = normalizeStory(normalized.instagram_story, fallbackPayload.instagram_story);
  normalized.hashtags = normalizeHashtags(normalized.hashtags, fallbackPayload.hashtags, payload);
  normalized.horario_sugerido = cleanText(normalized.horario_sugerido, suggestHourByMoment(payload?.form || {}));

  if (looksLikeOnlyPhone(normalized.cta_whatsapp) || countWords(normalized.cta_whatsapp) < 4) {
    normalized.cta_whatsapp = fallbackPayload.cta_whatsapp;
  }

  for (const key of REQUIRED_KEYS) {
    if (!cleanText(normalized[key])) {
      normalized[key] = fallbackPayload[key] || "";
    }
  }

  return normalized;
};

const parseRequestBody = async (request) => {
  try {
    return await request.json();
  } catch {
    return null;
  }
};

const extractOpenAIMessage = (responsePayload) => {
  const text = responsePayload?.choices?.[0]?.message?.content;
  if (typeof text !== "string" || !text.trim()) {
    throw new Error("Resposta vazia da OpenAI.");
  }
  return text;
};

const extractJsonObjectFromText = (text) => {
  const source = cleanText(text);
  if (!source) return null;

  try {
    const parsed = JSON.parse(source);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
  } catch {
    // continua para tentativa de extração
  }

  let startIndex = -1;
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === "\\") {
        escaped = true;
        continue;
      }
      if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === "{") {
      if (depth === 0) startIndex = i;
      depth += 1;
      continue;
    }

    if (char === "}") {
      if (depth <= 0) continue;
      depth -= 1;
      if (depth === 0 && startIndex >= 0) {
        const candidate = source.slice(startIndex, i + 1);
        try {
          const parsed = JSON.parse(candidate);
          if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
        } catch {
          // tenta próximo bloco
        }
        startIndex = -1;
      }
    }
  }

  return null;
};

const buildCampaignPrompt = (payload) => {
  return [
    "Use somente os dados abaixo para gerar a campanha.",
    "Se algum dado estiver ausente, escreva de forma natural sem inventar promoções ou descontos.",
    JSON.stringify(payload, null, 2),
  ].join("\n");
};

export default async function handler(request) {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Método não permitido. Use POST." }, 405);
  }

  const body = await parseRequestBody(request);
  if (!body) {
    return jsonResponse({ error: "Body inválido. Envie JSON no formato esperado." }, 400);
  }

  const fallbackBase = buildFallbackCampaign(body);
  const fallbackCampaign = normalizeCampaignPayload(fallbackBase, fallbackBase, body);
  const openAiKey = process.env.OPENAI_API_KEY;

  if (!openAiKey) {
    return jsonResponse(
      {
        error: "OPENAI_API_KEY não configurada na Netlify.",
        fallbackCampaign,
      },
      500
    );
  }

  const promptData = {
    form: body.form || {},
    settings: body.settings || {},
    insights: body.insights || {},
    metrics: body.metrics || {},
  };

  try {
    const openAiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openAiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.75,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "sabor_latino_campaign",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              required: REQUIRED_KEYS,
              properties: Object.fromEntries(REQUIRED_KEYS.map((key) => [key, { type: "string" }])),
            },
          },
        },
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: buildCampaignPrompt(promptData),
          },
        ],
      }),
    });

    const openAiPayload = await openAiResponse.json().catch(() => ({}));
    if (!openAiResponse.ok) {
      const errorMessage =
        openAiPayload?.error?.message || openAiPayload?.message || "Falha ao gerar conteúdo com a OpenAI.";
      return jsonResponse(
        {
          error: errorMessage,
          fallbackCampaign,
        },
        502
      );
    }

    const modelContent = extractOpenAIMessage(openAiPayload);
    const parsedCampaign = extractJsonObjectFromText(modelContent);
    if (!parsedCampaign) {
      return jsonResponse(
        {
          error: "A resposta da IA não veio em JSON válido. Aplicando fallback local.",
          fallbackCampaign,
        },
        502
      );
    }

    const normalizedCampaign = normalizeCampaignPayload(parsedCampaign, fallbackCampaign, body);
    return jsonResponse(normalizedCampaign, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado ao gerar campanha.";
    return jsonResponse(
      {
        error: message,
        fallbackCampaign,
      },
      500
    );
  }
}
