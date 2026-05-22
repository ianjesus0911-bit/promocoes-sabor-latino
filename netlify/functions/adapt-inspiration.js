const SYSTEM_PROMPT = `Você é um estrategista criativo de marketing para restaurantes locais. Você ajuda o Sabor Latino, restaurante de comida cubana e latina em Nova Bassano, RS, a transformar referências manuais em conteúdo original.

Nunca copie texto, imagem, identidade visual ou ideia exata de terceiros.
Use a inspiração apenas para entender estrutura, gancho, formato, ritmo, elemento visual e motivo de desempenho.

Crie conteúdo humano, local, natural e vendedor.
Escreva como uma pessoa real da equipe do restaurante, não como IA e não como propaganda de televisão.

O objetivo é gerar mais visualizações, mais desejo pela comida e mais pedidos pelo WhatsApp.

Evite palavras genéricas como:
incrível, sensacional, experiência única, explosão de sabores, imperdível.

Responda ONLY em JSON válido.`;

const REQUIRED_KEYS = [
  "gancho",
  "texto_plataforma",
  "whatsapp",
  "frase_imagem",
  "prompt_imagem",
  "roteiro_video",
  "hashtags",
  "recomendacao_adaptacao",
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

const cleanText = (value, fallback = "") => {
  if (typeof value !== "string") return fallback;
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized || fallback;
};

const sanitizeWhatsAppDisplay = (numberValue) => cleanText(numberValue, "+55 54 8100-7256");

const extractHashtags = (value) => {
  const tags = cleanText(value).match(/#[A-Za-zÀ-ÿ0-9_]+/g) || [];
  const unique = [];
  const seen = new Set();
  for (const tag of tags) {
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(tag);
  }
  return unique;
};

const normalizeHashtags = (candidate, fallback) => {
  const source = extractHashtags(candidate);
  const fallbackSource = extractHashtags(fallback);
  const base = source.length ? source : fallbackSource;
  const priority = ["#SaborLatino", "#NovaBassano", "#ComidaCubana", "#ComidaLatina", "#PedidoNoWhatsApp"];

  for (let i = priority.length - 1; i >= 0; i -= 1) {
    const tag = priority[i];
    if (!base.some((item) => item.toLowerCase() === tag.toLowerCase())) {
      base.unshift(tag);
    }
  }

  return base.slice(0, 5).join(" ");
};

const buildFallbackAdaptation = (payload = {}) => {
  const inspiration = payload?.inspiration || {};
  const settings = payload?.settings || {};
  const restaurantName = cleanText(settings.restaurantName, "Sabor Latino");
  const whatsapp = sanitizeWhatsAppDisplay(settings.whatsappNumber);
  const platform = cleanText(inspiration.platform, "Instagram");
  const contentType = cleanText(inspiration.contentType, "Reel");
  const niche = cleanText(inspiration.niche, "comida cubana");
  const visualElement = cleanText(inspiration.visualElement, "close-up");
  const whyWorked = cleanText(inspiration.whyWorked, "gancho visual forte nos primeiros segundos");
  const adaptationIdea = cleanText(
    inspiration.adaptationIdea,
    "usar o mesmo ritmo curto com conteúdo original do Sabor Latino"
  );

  return {
    gancho: `Nova Bassano, olha isso saindo agora no ${restaurantName}.`,
    texto_plataforma: `${platform} (${contentType}): abra com ${visualElement}, mostre ${niche} com apelo visual forte e finalize com chamada para WhatsApp.`,
    whatsapp: `Hoje no ${restaurantName} tem comida latina e cubana saindo quentinha. Chame no WhatsApp ${whatsapp} para pedir agora.`,
    frase_imagem: "Comida cubana quente saindo agora",
    prompt_imagem: `Imagem publicitária original de comida latina/cubana para ${restaurantName}, em Nova Bassano. Foco em ${niche}, elemento visual principal ${visualElement}, prato quente com vapor, luz quente, mesa familiar, composição comercial limpa, sem texto na imagem, sem marca d'água, não copiar imagem de terceiros.`,
    roteiro_video: `Cena 1 (0-2s): gancho com ${visualElement}. Cena 2 (2-6s): textura da comida quente e reação de fome. Cena 3 (6-8s): chamada para pedido no WhatsApp ${whatsapp}.`,
    hashtags: "#SaborLatino #NovaBassano #ComidaCubana #ComidaLatina #PedidoNoWhatsApp",
    recomendacao_adaptacao: `Use a inspiração para estrutura (gancho, ritmo e enquadramento), mas mantenha texto, cena e identidade totalmente originais. Base de desempenho observada: ${whyWorked}. Ideia aplicada: ${adaptationIdea}.`,
    cta_whatsapp: `Peça agora pelo WhatsApp ${whatsapp}.`,
  };
};

const normalizeAdaptationPayload = (rawPayload, fallbackPayload) => {
  const normalized = {};
  for (const key of REQUIRED_KEYS) {
    normalized[key] = cleanText(rawPayload?.[key], fallbackPayload[key] || "");
  }
  normalized.hashtags = normalizeHashtags(normalized.hashtags, fallbackPayload.hashtags);
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
    // fallback para extração manual
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

const buildPrompt = (payload) =>
  [
    "Use os dados de inspiração apenas como referência estratégica.",
    "Nunca copiar texto, identidade ou imagem de terceiros.",
    "Gerar conteúdo original para Sabor Latino.",
    JSON.stringify(payload, null, 2),
  ].join("\n");

export default async function handler(request) {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Método não permitido. Use POST." }, 405);
  }

  const body = await parseRequestBody(request);
  if (!body) {
    return jsonResponse({ error: "Body inválido. Envie JSON válido." }, 400);
  }

  const fallbackAdaptation = normalizeAdaptationPayload(
    buildFallbackAdaptation(body),
    buildFallbackAdaptation(body)
  );
  const openAiKey = process.env.OPENAI_API_KEY;

  if (!openAiKey) {
    return jsonResponse(
      {
        error: "OPENAI_API_KEY não configurada na Netlify.",
        fallbackAdaptation,
      },
      500
    );
  }

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
            name: "sabor_latino_inspiration_adaptation",
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
            content: buildPrompt({
              inspiration: body.inspiration || {},
              settings: body.settings || {},
            }),
          },
        ],
      }),
    });

    const openAiPayload = await openAiResponse.json().catch(() => ({}));
    if (!openAiResponse.ok) {
      const message =
        openAiPayload?.error?.message || openAiPayload?.message || "Falha ao adaptar inspiração com OpenAI.";
      return jsonResponse(
        {
          error: message,
          fallbackAdaptation,
        },
        502
      );
    }

    const modelContent = extractOpenAIMessage(openAiPayload);
    const parsedContent = extractJsonObjectFromText(modelContent);
    if (!parsedContent) {
      return jsonResponse(
        {
          error: "Resposta da IA fora do JSON esperado. Aplicando fallback local.",
          fallbackAdaptation,
        },
        502
      );
    }

    const normalized = normalizeAdaptationPayload(parsedContent, fallbackAdaptation);
    return jsonResponse(normalized, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado ao adaptar inspiração.";
    return jsonResponse(
      {
        error: message,
        fallbackAdaptation,
      },
      500
    );
  }
}
