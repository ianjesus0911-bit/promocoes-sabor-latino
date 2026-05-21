const SYSTEM_PROMPT =
  'Você é um especialista em marketing digital para restaurantes brasileiros. Crie conteúdo publicitário criativo para o Sabor Latino em Nova Bassano, RS. Responda ONLY em JSON válido com as chaves: whatsapp, instagram_feed, instagram_story, facebook, tiktok, frase_imagem, prompt_imagem, roteiro_video, hashtags, horario_sugerido, cta_whatsapp';

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
  const text = value.trim();
  return text || fallback;
};

const buildFallbackCampaign = (payload = {}) => {
  const form = payload?.form || {};
  const settings = payload?.settings || {};
  const insights = payload?.insights || {};

  const restaurantName = safeText(settings.restaurantName, "Sabor Latino");
  const whatsapp = safeText(settings.whatsappNumber, "+55 54 8100-7256");
  const address = safeText(settings.address, "Avenida 23 de Maio, nº 313, Centro, Nova Bassano");
  const product = safeText(form.product, "almoço");
  const objective = safeText(form.objective, "vender pelo WhatsApp");
  const audience = safeText(form.audience, "famílias");
  const moment = safeText(form.moment, "almoço");
  const tone = safeText(form.tone, "direto");
  const bestHour = safeText(insights.bestHour, "18h30 - 20h30");
  const bestVisualStyle = safeText(insights.bestVisualStyle, "close com vapor e cores quentes");

  return {
    whatsapp: `🔥 ${restaurantName}: ${product} com foco em ${objective}. Público: ${audience}. Período: ${moment}. Chame agora no WhatsApp ${whatsapp}.`,
    instagram_feed: `🍽️ ${restaurantName} em Nova Bassano\nHoje é dia de ${product}!\nObjetivo: ${objective}\nTom: ${tone}\n📲 Peça no WhatsApp ${whatsapp}`,
    instagram_story: `🔥 ${product.toUpperCase()} HOJE\nPoucas unidades!\n📲 ${whatsapp}`,
    facebook: `${restaurantName} | ${product} em destaque.\n${objective} para ${audience}.\n📍 ${address}\n📲 WhatsApp: ${whatsapp}`,
    tiktok: `Vídeo curto de ${product}: close de comida quente, reação de desejo e CTA final no WhatsApp ${whatsapp}.`,
    frase_imagem: `${product.toUpperCase()} QUENTINHO AGORA`,
    prompt_imagem: `Imagem promocional original de ${product} para ${restaurantName}, estilo latino/cubano, ${bestVisualStyle}, vapor visível, mesa acolhedora, CTA para WhatsApp ${whatsapp}.`,
    roteiro_video: `0-2s: close de ${product} saindo quente.\n2-5s: textura e ambiente latino.\n5-8s: frase de impacto + CTA no WhatsApp ${whatsapp}.`,
    hashtags: "#SaborLatino #ComidaLatina #NovaBassano #PedidoNoWhatsApp #Restaurante",
    horario_sugerido: bestHour,
    cta_whatsapp: `👉 Peça agora no WhatsApp ${whatsapp} e garanta seu pedido.`,
  };
};

const normalizeCampaignPayload = (rawPayload, fallbackPayload) => {
  const normalized = {};
  for (const key of REQUIRED_KEYS) {
    normalized[key] = safeText(rawPayload?.[key], fallbackPayload[key] || "");
  }
  return normalized;
};

const parseRequestBody = async (request) => {
  try {
    return await request.json();
  } catch (error) {
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
        temperature: 0.9,
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
            content: `Gere uma campanha completa com base nestes dados:\n${JSON.stringify(promptData, null, 2)}`,
          },
        ],
      }),
    });

    const openAiPayload = await openAiResponse.json().catch(() => ({}));

    if (!openAiResponse.ok) {
      const errorMessage =
        openAiPayload?.error?.message ||
        openAiPayload?.message ||
        "Falha ao gerar conteúdo com a OpenAI.";
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
    const normalizedCampaign = normalizeCampaignPayload(parsedCampaign, fallbackCampaign);
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
