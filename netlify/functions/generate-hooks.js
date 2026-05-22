const SYSTEM_PROMPT = `Você cria ganchos curtos e humanos para vídeos de restaurantes locais.

Contexto fixo:
- Restaurante: Sabor Latino
- Cidade: Nova Bassano, RS
- Segmento: comida cubana e latina
- Objetivo: parar o dedo nos primeiros 2 segundos, gerar visualizações, interesse e pedidos no WhatsApp.

Regras:
- Linguagem brasileira, natural e local.
- Frases curtas, simples e fortes.
- Não soar como IA.
- Não soar como propaganda de televisão.
- Evitar palavras genéricas como: incrível, sensacional, experiência única, explosão de sabores, imperdível.
- Não inventar desconto se não foi informado.
- Sempre manter conteúdo original.

Formato obrigatório de resposta:
Retorne ONLY JSON válido com estas chaves:
- hooks (array com 10 frases curtas)
- overlay_texts (array com 5 frases para texto grande no vídeo)
- whatsapp_ctas (array com 5 chamadas para WhatsApp)
- visual_openings (array com 3 ideias de abertura visual)
- video_script (string com roteiro de 8 segundos usando o melhor gancho)
`;

const REQUIRED_KEYS = ["hooks", "overlay_texts", "whatsapp_ctas", "visual_openings", "video_script"];

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

const normalizeLines = (value) => {
  if (!Array.isArray(value)) return [];
  const unique = [];
  const seen = new Set();

  for (const item of value) {
    const text = cleanText(item);
    if (!text) continue;
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(text);
  }
  return unique;
};

const buildFallbackHooks = (payload = {}) => {
  const form = payload?.form || {};
  const settings = payload?.settings || {};
  const restaurantName = cleanText(settings.restaurantName, "Sabor Latino");
  const whatsapp = cleanText(settings.whatsappNumber, "+55 54 8100-7256");
  const product = cleanText(form.product, "comida cubana");
  const channel = cleanText(form.channel, "TikTok");

  const hooks = normalizeLines([
    "Isso existe em Nova Bassano e você não sabia.",
    `Você já provou ${product} assim?`,
    `Olha esse ${product} saindo quentinho.`,
    `O prato que tá chamando atenção no ${restaurantName}.`,
    "Se você mora em Nova Bassano, precisa ver isso.",
  ]).slice(0, 5);

  const overlayTexts = normalizeLines([
    `${product} saindo agora`,
    "Hoje tem sabor de casa",
    "Nova Bassano tá pedindo isso",
    "Prato quente e bem servido",
    "Chama no WhatsApp agora",
  ]).slice(0, 5);

  const whatsappCtas = normalizeLines([
    `Chama no WhatsApp ${whatsapp} e peça agora.`,
    `Me chama no WhatsApp ${whatsapp} e já separo o seu.`,
    `Pedido rápido no WhatsApp ${whatsapp}.`,
    `Reserve no WhatsApp ${whatsapp} antes que acabe.`,
    `Quer hoje? Fala no WhatsApp ${whatsapp}.`,
  ]).slice(0, 5);

  const visualOpenings = normalizeLines([
    `Close extremo do ${product} com vapor nos primeiros 2 segundos.`,
    "Câmera entrando na cozinha e prato chegando à mesa em corte rápido.",
    `Primeiro frame com textura da comida e chamada curta para ${channel}.`,
  ]).slice(0, 3);

  const videoScript = `Cena 1 (0-2s): ${hooks[0] || "Olha esse prato saindo quente agora."}
Cena 2 (2-5s): mostrar ${product} em close com comida quente.
Cena 3 (5-8s): CTA direto para WhatsApp ${whatsapp}.`;

  return {
    hooks,
    overlay_texts: overlayTexts,
    whatsapp_ctas: whatsappCtas,
    visual_openings: visualOpenings,
    video_script: videoScript,
  };
};

const normalizeHooksPayload = (rawPayload, fallbackPayload) => {
  const hooks = normalizeLines(rawPayload?.hooks).slice(0, 10);
  const overlay = normalizeLines(rawPayload?.overlay_texts).slice(0, 5);
  const ctas = normalizeLines(rawPayload?.whatsapp_ctas).slice(0, 5);
  const openings = normalizeLines(rawPayload?.visual_openings).slice(0, 3);
  const script = cleanText(rawPayload?.video_script, fallbackPayload.video_script);

  return {
    hooks: hooks.length ? hooks : fallbackPayload.hooks,
    overlay_texts: overlay.length ? overlay : fallbackPayload.overlay_texts,
    whatsapp_ctas: ctas.length ? ctas : fallbackPayload.whatsapp_ctas,
    visual_openings: openings.length ? openings : fallbackPayload.visual_openings,
    video_script: script || fallbackPayload.video_script,
  };
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
    // fallback manual
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
          // tenta próximo
        }
        startIndex = -1;
      }
    }
  }

  return null;
};

const buildPrompt = (payload) =>
  [
    "Gere ganchos originais com base nestes dados.",
    "Nunca copiar conteúdo de terceiros.",
    "Retornar apenas JSON válido.",
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

  const fallbackHooks = normalizeHooksPayload(buildFallbackHooks(body), buildFallbackHooks(body));
  const openAiKey = process.env.OPENAI_API_KEY;

  if (!openAiKey) {
    return jsonResponse(
      {
        error: "OPENAI_API_KEY não configurada na Netlify.",
        fallbackHooks,
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
            name: "sabor_latino_viral_hooks",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              required: REQUIRED_KEYS,
              properties: {
                hooks: {
                  type: "array",
                  items: { type: "string" },
                },
                overlay_texts: {
                  type: "array",
                  items: { type: "string" },
                },
                whatsapp_ctas: {
                  type: "array",
                  items: { type: "string" },
                },
                visual_openings: {
                  type: "array",
                  items: { type: "string" },
                },
                video_script: { type: "string" },
              },
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
              form: body.form || {},
              settings: body.settings || {},
            }),
          },
        ],
      }),
    });

    const openAiPayload = await openAiResponse.json().catch(() => ({}));
    if (!openAiResponse.ok) {
      const message =
        openAiPayload?.error?.message || openAiPayload?.message || "Falha ao gerar ganchos com OpenAI.";
      return jsonResponse(
        {
          error: message,
          fallbackHooks,
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
          fallbackHooks,
        },
        502
      );
    }

    const normalized = normalizeHooksPayload(parsedContent, fallbackHooks);
    return jsonResponse(normalized, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado ao gerar ganchos.";
    return jsonResponse(
      {
        error: message,
        fallbackHooks,
      },
      500
    );
  }
}
