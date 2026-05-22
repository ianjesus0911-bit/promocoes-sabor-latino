const OPENAI_TIMEOUT_MS = 25000;
const DEFAULT_SIZE = "1024x1024";
const DEFAULT_MODULE = "campanha-inteligente";
const PROMPT_COMPLEMENT =
  "Foto profissional de comida, sem texto na imagem, sem marca d'água, sem logo, sem pessoas identificáveis, iluminação natural quente, estilo editorial gastronômico, cores vibrantes e apetitosas, enquadramento publicitário para redes sociais, prato em destaque principal, fundo limpo, aparência realista e muito apetitosa.";

const ALLOWED_INPUT_SIZES = new Set(["1024x1024", "1024x1792", "1792x1024"]);

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

const normalizeInputSize = (size) => {
  const received = cleanText(size, DEFAULT_SIZE);
  return ALLOWED_INPUT_SIZES.has(received) ? received : DEFAULT_SIZE;
};

const mapSizeForGptImage = (inputSize) => {
  if (inputSize === "1024x1792") return "1024x1536";
  if (inputSize === "1792x1024") return "1536x1024";
  return "1024x1024";
};

const mapSizeForDalle = (size) => {
  if (size === "1024x1536") return "1024x1792";
  if (size === "1536x1024") return "1792x1024";
  if (size === "1024x1792" || size === "1792x1024" || size === "1024x1024") return size;
  return "1024x1024";
};

const buildFinalPrompt = (prompt) => `${cleanText(prompt)}\n\n${PROMPT_COMPLEMENT}`;

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

const parseImageFromResponse = (responseBody) => {
  const item = Array.isArray(responseBody?.data) ? responseBody.data[0] : null;
  const b64 = cleanText(item?.b64_json);
  const url = cleanText(item?.url);
  if (b64) {
    return {
      image_base64: b64,
      image_url: `data:image/png;base64,${b64}`,
      expires_in: null,
      is_data_url: true,
    };
  }
  if (url) {
    return {
      image_base64: "",
      image_url: url,
      expires_in: "1 hora",
      is_data_url: false,
    };
  }
  return null;
};

const buildAttemptError = ({ model, response, responseBody }) => {
  const status = Number(response?.status || 0) || 500;
  const message = cleanText(responseBody?.error?.message || responseBody?.message, "Sem detalhe técnico retornado.");
  return {
    model,
    status,
    message,
  };
};

export default async function handler(request) {
  if (request.method !== "POST") {
    return jsonResponse({ error: true, message: "Método não permitido. Use POST." }, 405);
  }

  const body = await parseBody(request);
  if (!body) {
    return jsonResponse({ error: true, message: "Body inválido. Envie JSON no formato esperado." }, 400);
  }

  const prompt = cleanText(body.prompt);
  if (!prompt) {
    return jsonResponse({ error: true, message: "Prompt vazio." }, 400);
  }

  const openAiKey = process.env.OPENAI_API_KEY;
  if (!openAiKey) {
    return jsonResponse({ error: true, message: "OPENAI_API_KEY não configurada no Netlify." }, 500);
  }

  const sizeReceived = cleanText(body.size, DEFAULT_SIZE);
  const normalizedInputSize = normalizeInputSize(sizeReceived);
  const gptSize = mapSizeForGptImage(normalizedInputSize);
  const moduleName = cleanText(body.module, DEFAULT_MODULE);
  const finalPrompt = buildFinalPrompt(prompt);

  console.log("generate-image chamada");
  console.log("OPENAI_API_KEY existe:", !!process.env.OPENAI_API_KEY);
  console.log("size recebido:", sizeReceived);
  console.log("size usado:", gptSize);
  console.log("prompt enviado:", finalPrompt.slice(0, 120));

  const startedAt = Date.now();
  const modelAttempts = ["gpt-image-1", "dall-e-3"];
  const attemptErrors = [];

  let timeoutId;
  const controller = new AbortController();
  try {
    timeoutId = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);

    console.log("Tentando gerar imagem com:", "gpt-image-1");
    const gptPayload = {
      model: "gpt-image-1",
      prompt: finalPrompt,
      n: 1,
      size: gptSize,
      quality: "medium",
    };

    const gptResult = await callOpenAIImages({
      openAiKey,
      payload: gptPayload,
      signal: controller.signal,
    });

    if (gptResult.response.ok) {
      const parsed = parseImageFromResponse(gptResult.responseBody);
      if (parsed?.image_url) {
        console.log("Modelo usado com sucesso:", "gpt-image-1");
        console.log(`[generate-image] Tempo total da requisição: ${Date.now() - startedAt}ms`);
        return jsonResponse({
          image_base64: parsed.image_base64,
          image_url: parsed.image_url,
          model_used: "gpt-image-1",
          expires_in: null,
          module: moduleName,
          size: gptSize,
        });
      }

      attemptErrors.push({
        model: "gpt-image-1",
        status: gptResult.response.status,
        message: "Resposta sem imagem válida.",
      });
    } else {
      const gptError = buildAttemptError({
        model: "gpt-image-1",
        response: gptResult.response,
        responseBody: gptResult.responseBody,
      });
      attemptErrors.push(gptError);
      console.error("Erro no gpt-image-1:", gptError);
    }

    console.log("Tentando fallback para dall-e-3...");
    const dalleSize = mapSizeForDalle(gptSize);
    const dallePayload = {
      model: "dall-e-3",
      prompt: finalPrompt,
      n: 1,
      size: dalleSize,
      quality: "standard",
    };

    const dalleResult = await callOpenAIImages({
      openAiKey,
      payload: dallePayload,
      signal: controller.signal,
    });

    if (dalleResult.response.ok) {
      const parsed = parseImageFromResponse(dalleResult.responseBody);
      if (parsed?.image_url) {
        console.log("Modelo usado com sucesso:", "dall-e-3");
        console.log(`[generate-image] Tempo total da requisição: ${Date.now() - startedAt}ms`);
        return jsonResponse({
          image_base64: parsed.image_base64,
          image_url: parsed.image_url,
          model_used: "dall-e-3",
          expires_in: parsed.expires_in,
          module: moduleName,
          size: dalleSize,
        });
      }

      attemptErrors.push({
        model: "dall-e-3",
        status: dalleResult.response.status,
        message: "Resposta sem imagem válida.",
      });
    } else {
      const dalleError = buildAttemptError({
        model: "dall-e-3",
        response: dalleResult.response,
        responseBody: dalleResult.responseBody,
      });
      attemptErrors.push(dalleError);
      console.error("Erro no dall-e-3:", dalleError);
    }

    const lastStatus = Number(attemptErrors[attemptErrors.length - 1]?.status || 502) || 502;
    const details = attemptErrors
      .map((item) => `${item.model} [status ${item.status}]: ${item.message}`)
      .join(" | ");
    console.log(`[generate-image] Tempo total da requisição: ${Date.now() - startedAt}ms`);
    return jsonResponse(
      {
        error: true,
        message: "Não foi possível gerar a imagem agora.",
        details,
        status: lastStatus,
        model_attempts: modelAttempts,
      },
      502
    );
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.error(`[generate-image] Erro timeout | OpenAI ultrapassou ${OPENAI_TIMEOUT_MS}ms.`);
      console.log(`[generate-image] Tempo total da requisição: ${Date.now() - startedAt}ms`);
      return jsonResponse(
        {
          error: true,
          message: "Não foi possível gerar a imagem agora.",
          details: `Timeout de ${OPENAI_TIMEOUT_MS}ms na chamada OpenAI.`,
          status: 504,
          model_attempts: modelAttempts,
        },
        504
      );
    }

    const message = error instanceof Error ? error.message : "Erro inesperado.";
    console.error("[generate-image] Erro inesperado:", message);
    console.log(`[generate-image] Tempo total da requisição: ${Date.now() - startedAt}ms`);
    return jsonResponse(
      {
        error: true,
        message: "Não foi possível gerar a imagem agora.",
        details: message,
        status: 500,
        model_attempts: modelAttempts,
      },
      500
    );
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}
