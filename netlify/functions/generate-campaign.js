const SYSTEM_PROMPT =
  "Você é um especialista em marketing digital para restaurantes brasileiros. Crie conteúdo publicitário criativo para o Sabor Latino em Nova Bassano, RS. Responda ONLY em JSON válido com as chaves: whatsapp, instagram_feed, instagram_story, facebook, tiktok, frase_imagem, prompt_imagem, roteiro_video, hashtags, horario_sugerido, cta_whatsapp";

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

const jsonResponse = (payload, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });

const safeText = (value, fallback = "") => {
  if (typeof value !== "string") return fallback;
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized || fallback;
};

const sanitizeWhatsAppDisplay = (numberValue) => {
  const raw = safeText(numberValue, "+55 54 8100-7256");
  return raw || "+55 54 8100-7256";
};

const productDisplayMap = {
  almoço: "Almoço Latino",
  pizza: "Pizza Cubana",
  "ropa vieja cubana": "Ropa Vieja Cubana",
  sobremesa: "Sobremesa da casa",
  "combo familiar": "Combo Familiar",
};

const toneHookMap = {
  urgente: "ATENÇÃO, Nova Bassano: promoção com saída rápida!",
  familiar: "Mesa farta e sabor de casa para a família toda!",
  alegre: "Hoje é dia de comer bem e feliz no Sabor Latino!",
  direto: "Oferta direta para vender agora no Sabor Latino!",
  caseiro: "Comida quentinha, caseira e cheia de sabor latino!",
  elegante: "Uma experiência especial de sabor latino hoje.",
};

const looksLikeOnlyPhone = (text) => {
  const value = safeText(text);
  if (!value) return true;
  const compact = value.replace(/\s+/g, "");
  if (/^[+()\d.\-]+$/.test(compact)) return true;
  const withoutDigits = value.replace(/[0-9+()\s.\-]/g, "");
  if (!withoutDigits.trim()) return true;
  return false;
};

const isWeakWhatsAppMessage = (text) => {
  const value = safeText(text);
  if (!value) return true;
  if (looksLikeOnlyPhone(value)) return true;

  const words = value.split(/\s+/).filter(Boolean);
  const hasPhoneDigits = /\d{8,}/.test(value);
  const hasSalesVerb = SALES_VERB_REGEX.test(value);

  if (words.length < 8) return true;
  if (hasPhoneDigits && !hasSalesVerb) return true;
  return false;
};

const buildStrongWhatsAppMessage = ({ form = {}, settings = {} }) => {
  const restaurantName = safeText(settings.restaurantName, "Sabor Latino");
  const whatsapp = sanitizeWhatsAppDisplay(settings.whatsappNumber);
  const product = productDisplayMap[safeText(form.product, "").toLowerCase()] || safeText(form.product, "Ropa Vieja Cubana");
  const objective = safeText(form.objective, "vender pelo WhatsApp");
  const audience = safeText(form.audience, "famílias");
  const moment = safeText(form.moment, "almoço");
  const tone = safeText(form.tone, "direto").toLowerCase();
  const hook = toneHookMap[tone] || toneHookMap.direto;

  return `${hook}
Hoje o destaque é ${product}, com sabor cubano de verdade e aquele toque caseiro que dá água na boca.
Ideal para ${audience} e perfeito para ${moment}. Objetivo da campanha: ${objective}.
Chama agora e garanta seu pedido fresquinho no WhatsApp ${whatsapp}.`;
};

const buildFallbackCampaign = (payload = {}) => {
  const form = payload?.form || {};
  const settings = payload?.settings || {};
  const insights = payload?.insights || {};
  const restaurantName = safeText(settings.restaurantName, "Sabor Latino");
  const whatsapp = sanitizeWhatsAppDisplay(settings.whatsappNumber);
  const address = safeText(settings.address, "Avenida 23 de Maio, nº 313, Centro, Nova Bassano");
  const product = productDisplayMap[safeText(form.product, "").toLowerCase()] || safeText(form.product, "Ropa Vieja Cubana");
  const audience = safeText(form.audience, "famílias");
  const moment = safeText(form.moment, "almoço");
  const bestHour = safeText(insights.bestHour, "18h30 - 20h30");
  const bestVisualStyle = safeText(insights.bestVisualStyle, "close-up com vapor e cores quentes");

  return {
    whatsapp: buildStrongWhatsAppMessage({ form, settings }),
    instagram_feed: `Sabor Latino • Nova Bassano, RS
Hoje é dia de ${product} com pegada cubana e sabor caseiro.
Conteúdo pensado para ${audience}, no melhor momento: ${moment}.
Peça no WhatsApp ${whatsapp}.`,
    instagram_story: `${product.toUpperCase()} HOJE
Quentinho, apetitoso e com cara de quero mais.
Chama no WhatsApp ${whatsapp}.`,
    facebook: `${restaurantName} em Nova Bassano: ${product} em destaque hoje.
Comida latina e cubana com cara de almoço de família.
📍 ${address}
📲 WhatsApp: ${whatsapp}`,
    tiktok: `Vídeo de 8 segundos com close de ${product}, vapor visível, reação de desejo e CTA final para WhatsApp ${whatsapp}.`,
    frase_imagem: `${product.toUpperCase()} SAINDO AGORA`,
    prompt_imagem: `Imagem promocional original para ${restaurantName}, em Nova Bassano/RS, mostrando ${product} em estilo cubano caseiro, comida quente com vapor, mesa familiar, cores quentes, textura suculenta e CTA visual para WhatsApp ${whatsapp}.`,
    roteiro_video: `0-2s: close extremo de ${product} saindo quente.
2-5s: mostrar textura e fartura da comida cubana.
5-8s: texto na tela + convite direto para pedir no WhatsApp ${whatsapp}.`,
    hashtags: "#SaborLatino #NovaBassano #ComidaCubana #RopaViejaCubana #ComidaCaseira #PedidoNoWhatsApp",
    horario_sugerido: bestHour,
    cta_whatsapp: `Peça agora no WhatsApp ${whatsapp} e receba um atendimento rápido do Sabor Latino.`,
  };
};

const ensureStrongWhatsApp = (candidate, fallbackCampaign, payload) => {
  const text = safeText(candidate);
  if (!isWeakWhatsAppMessage(text)) return text;
  return buildStrongWhatsAppMessage({
    form: payload?.form || {},
    settings: payload?.settings || {},
  }) || fallbackCampaign.whatsapp;
};

const normalizeCampaignPayload = (rawPayload, fallbackPayload, payload) => {
  const normalized = {};
  for (const key of REQUIRED_KEYS) {
    normalized[key] = safeText(rawPayload?.[key], fallbackPayload[key] || "");
  }
  normalized.whatsapp = ensureStrongWhatsApp(rawPayload?.whatsapp, fallbackPayload, payload);
  if (looksLikeOnlyPhone(normalized.cta_whatsapp)) {
    normalized.cta_whatsapp = fallbackPayload.cta_whatsapp;
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

const buildCampaignPrompt = (payload) => {
  return [
    "Contexto fixo do negócio:",
    "- Restaurante: Sabor Latino",
    "- Cidade/UF: Nova Bassano, RS",
    "- Especialidade: comida latina e cubana",
    "- Prato símbolo: Ropa Vieja Cubana",
    "- Público principal: famílias e clientes locais",
    "- Conversão principal: pedidos por WhatsApp",
    "",
    "Regras obrigatórias de saída:",
    "- Responder SOMENTE em JSON válido com exatamente as chaves solicitadas.",
    "- NÃO adicionar chaves extras.",
    "- A chave 'whatsapp' deve ser uma mensagem promocional completa e humana.",
    "- Na chave 'whatsapp', incluir obrigatoriamente: gancho forte, nome do prato, desejo/benefício, convite para pedir e número do WhatsApp.",
    "- Nunca retornar apenas número de telefone na chave 'whatsapp'.",
    "- Evitar texto genérico. Personalizar para o produto, objetivo, público e momento informados.",
    "- Linguagem: português do Brasil, tom vendedor, quente e natural.",
    "",
    "Dados para gerar a campanha:",
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

  const fallbackCampaign = buildFallbackCampaign(body);
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
        temperature: 0.8,
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
    const parsedCampaign = JSON.parse(modelContent);
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
