const ALLOWED_SIZES = new Set(["1024x1024", "1024x1792", "1792x1024"]);
const DEFAULT_SIZE = "1024x1024";
const DEFAULT_MODULE = "campanha-inteligente";
const IMAGE_EXPIRES_IN = "1 hora";
const OPENAI_TIMEOUT_MS = 25000;
const PROMPT_COMPLEMENT =
  "Foto profissional de comida, sem texto na imagem, sem marca d'água, sem logo, sem pessoas identificáveis, iluminação natural quente, estilo editorial gastronômico, cores vibrantes e apetitosas.";

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

const parseBody = async (request) => {
  try {
    return await request.json();
  } catch {
    return null;
  }
};

const normalizeSize = (size) => {
  const candidate = cleanText(size, DEFAULT_SIZE);
  return ALLOWED_SIZES.has(candidate) ? candidate : DEFAULT_SIZE;
};

const enrichPrompt = (prompt) => `${cleanText(prompt)}\n\n${PROMPT_COMPLEMENT}`;

const isUnknownParameterError = (status, technicalDetail, fieldName) => {
  if (status !== 400) return false;
  const detail = String(technicalDetail || "").toLowerCase();
  return detail.includes("unknown parameter") && detail.includes(String(fieldName || "").toLowerCase());
};

const callOpenAIImages = async ({ openAiKey, payload, signal }) => {
  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openAiKey}`,
    },
    signal,
    body: JSON.stringify(payload),
  });

  const responseBody = await response.json().catch(() => ({}));
  return { response, responseBody };
};

export default async function handler(request) {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Método não permitido. Use POST." }, 405);
  }

  const body = await parseBody(request);
  if (!body) {
    return jsonResponse({ error: "Body inválido. Envie JSON no formato esperado." }, 400);
  }

  // Usa apenas os campos permitidos do frontend.
  const prompt = cleanText(body.prompt);
  const validSize = normalizeSize(body.size);
  const moduleName = cleanText(body.module, DEFAULT_MODULE);
  if (!prompt) {
    return jsonResponse({ error: "Prompt vazio. Informe um prompt antes de gerar a imagem." }, 400);
  }

  const openAiKey = process.env.OPENAI_API_KEY;
  if (!openAiKey) {
    return jsonResponse({ error: "OPENAI_API_KEY não configurada na Netlify.", error_type: "internal_error" }, 500);
  }

  const finalPrompt = enrichPrompt(prompt);
  const startedAt = Date.now();
  console.log("generate-image chamada");
  console.log("size usado:", validSize);
  console.log("prompt enviado:", finalPrompt.slice(0, 120));
  console.log(`[generate-image] inicio da geracao | modulo=${moduleName}`);

  let timeoutId;
  try {
    const controller = new AbortController();
    timeoutId = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);

    // Payload limpo e mínimo com parâmetros suportados.
    let openAiPayload = {
      model: "dall-e-3",
      prompt: finalPrompt,
      n: 1,
      size: validSize,
      quality: "standard",
      response_format: "url",
    };

    let { response, responseBody } = await callOpenAIImages({
      openAiKey,
      payload: openAiPayload,
      signal: controller.signal,
    });

    // Fallback automático se response_format for rejeitado.
    const technicalDetailFirst = responseBody?.error?.message || responseBody?.message || "";
    if (isUnknownParameterError(response.status, technicalDetailFirst, "response_format")) {
      console.warn("[generate-image] response_format rejeitado. Tentando novamente sem response_format.");
      openAiPayload = {
        model: "dall-e-3",
        prompt: finalPrompt,
        n: 1,
        size: validSize,
        quality: "standard",
      };

      const secondTry = await callOpenAIImages({
        openAiKey,
        payload: openAiPayload,
        signal: controller.signal,
      });
      response = secondTry.response;
      responseBody = secondTry.responseBody;
    }

    if (!response.ok) {
      const status = response.status;
      const technicalDetail = responseBody?.error?.message || responseBody?.message || "Sem detalhe técnico retornado.";
      console.error(`[generate-image] erro OpenAI | status=${status} | detalhe=${technicalDetail}`);
      console.log(`[generate-image] tempo total da requisicao: ${Date.now() - startedAt}ms`);
      return jsonResponse(
        {
          error: "Falha ao gerar imagem na OpenAI.",
          detalhe_tecnico: technicalDetail,
          status_openai: status,
          error_type: "openai_error",
        },
        502
      );
    }

    const imageData = Array.isArray(responseBody?.data) ? responseBody.data[0] : null;
    const imageUrl = cleanText(imageData?.url);
    if (!imageUrl) {
      const technicalDetail = "OpenAI respondeu sem URL de imagem válida.";
      console.error(`[generate-image] erro OpenAI | detalhe=${technicalDetail}`);
      console.log(`[generate-image] tempo total da requisicao: ${Date.now() - startedAt}ms`);
      return jsonResponse(
        {
          error: "A resposta da OpenAI não trouxe uma URL de imagem válida.",
          detalhe_tecnico: technicalDetail,
          status_openai: response.status,
          error_type: "openai_error",
        },
        502
      );
    }

    console.log(`[generate-image] tempo total da requisicao: ${Date.now() - startedAt}ms`);
    return jsonResponse({
      image_url: imageUrl,
      expires_in: IMAGE_EXPIRES_IN,
      module: moduleName,
      size: validSize,
      quality: "standard",
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.error(`[generate-image] erro timeout | OpenAI ultrapassou ${OPENAI_TIMEOUT_MS}ms.`);
      console.log(`[generate-image] tempo total da requisicao: ${Date.now() - startedAt}ms`);
      return jsonResponse(
        {
          error: "A geração demorou mais do que o esperado.",
          detalhe_tecnico: `Timeout de ${OPENAI_TIMEOUT_MS}ms atingido na chamada OpenAI.`,
          error_type: "timeout_openai",
        },
        504
      );
    }

    const message = error instanceof Error ? error.message : "Erro inesperado ao gerar imagem.";
    console.error(`[generate-image] erro inesperado | detalhe=${message}`);
    console.log(`[generate-image] tempo total da requisicao: ${Date.now() - startedAt}ms`);
    return jsonResponse(
      {
        error: "Erro inesperado ao gerar imagem.",
        detalhe_tecnico: message,
        error_type: "internal_error",
      },
      500
    );
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}
