const ALLOWED_SIZES = new Set(["1024x1024", "1024x1792", "1792x1024"]);
const DEFAULT_SIZE = "1024x1024";
const DEFAULT_QUALITY = "standard";
const DEFAULT_MODULE = "campanha-inteligente";
const IMAGE_EXPIRES_IN = "1 hora";
const OPENAI_TIMEOUT_MS = 25000;

const PROMPT_COMPLEMENT = [
  "Foto profissional de comida, sem texto na imagem, sem marca d'água, sem logo, sem pessoas identificáveis, iluminação natural quente, estilo editorial gastronômico, cores vibrantes e apetitosas.",
  "Foto profissional de comida, sem texto na imagem, sem marca d'água, sem logo, sem pessoas identificáveis, iluminação natural quente, estilo editorial gastronômico, cores vibrantes e apetitosas, enquadramento publicitário para redes sociais, prato em destaque principal, fundo limpo, aparência realista e muito apetitosa.",
].join(" ");

const PROMPT_COMPLEMENT_ALLOW_TEXT = [
  "Foto profissional de comida, sem marca d'água, sem logo, sem pessoas identificáveis, iluminação natural quente, estilo editorial gastronômico, cores vibrantes e apetitosas.",
  "Foto profissional de comida, sem marca d'água, sem logo, sem pessoas identificáveis, iluminação natural quente, estilo editorial gastronômico, cores vibrantes e apetitosas, enquadramento publicitário para redes sociais, prato em destaque principal, fundo limpo, aparência realista e muito apetitosa.",
].join(" ");

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

const shouldAllowTextInImage = (prompt) => {
  const text = cleanText(prompt).toLowerCase();
  if (!text) return false;
  const textSignals = [
    "texto na imagem",
    "com texto",
    "incluir texto",
    "frase na imagem",
    "headline na imagem",
    "copy na imagem",
    "tipografia na imagem",
    "letras na imagem",
    "com letras",
  ];
  return textSignals.some((signal) => text.includes(signal));
};

const enrichPrompt = (originalPrompt) => {
  const cleaned = cleanText(originalPrompt);
  const complement = shouldAllowTextInImage(cleaned) ? PROMPT_COMPLEMENT_ALLOW_TEXT : PROMPT_COMPLEMENT;
  return `${cleaned}\n\n${complement}`;
};

const normalizeSize = (size) => {
  const candidate = cleanText(size, DEFAULT_SIZE);
  return ALLOWED_SIZES.has(candidate) ? candidate : DEFAULT_SIZE;
};

const normalizeQuality = (quality) => {
  const candidate = cleanText(quality, DEFAULT_QUALITY).toLowerCase();
  return candidate === "standard" ? "standard" : DEFAULT_QUALITY;
};

export default async function handler(request) {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Método não permitido. Use POST." }, 405);
  }

  const body = await parseBody(request);
  if (!body) {
    return jsonResponse({ error: "Body inválido. Envie JSON no formato esperado." }, 400);
  }

  const prompt = cleanText(body.prompt);
  if (!prompt) {
    return jsonResponse({ error: "Prompt vazio. Informe um prompt antes de gerar a imagem." }, 400);
  }

  const openAiKey = process.env.OPENAI_API_KEY;
  if (!openAiKey) {
    return jsonResponse({ error: "OPENAI_API_KEY não configurada na Netlify.", error_type: "internal_error" }, 500);
  }

  const size = normalizeSize(body.size);
  const quality = normalizeQuality(body.quality);
  const moduleName = cleanText(body.module, DEFAULT_MODULE);
  const enrichedPrompt = enrichPrompt(prompt);
  const startedAt = Date.now();

  console.log(`[generate-image] Inicio da geracao | modulo=${moduleName} | size=${size} | quality=${quality}`);

  let timeoutId;
  try {
    const controller = new AbortController();
    timeoutId = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);

    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openAiKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: enrichedPrompt,
        size,
        quality,
        style: "natural",
        response_format: "url",
        n: 1,
      }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const errorMessage = payload?.error?.message || payload?.message || "Não foi possível gerar imagem na OpenAI agora.";
      console.error(`[generate-image] Erro OpenAI | status=${response.status} | detalhe=${errorMessage}`);
      console.log(`[generate-image] Tempo total da requisicao: ${Date.now() - startedAt}ms`);
      return jsonResponse({ error: errorMessage, error_type: "openai_error" }, 502);
    }

    const imageData = Array.isArray(payload?.data) ? payload.data[0] : null;
    const imageUrl = cleanText(imageData?.url);
    if (!imageUrl) {
      console.error("[generate-image] Erro OpenAI | resposta sem URL de imagem valida.");
      console.log(`[generate-image] Tempo total da requisicao: ${Date.now() - startedAt}ms`);
      return jsonResponse({ error: "A resposta da OpenAI não trouxe uma URL de imagem válida.", error_type: "openai_error" }, 502);
    }

    console.log(`[generate-image] Tempo total da requisicao: ${Date.now() - startedAt}ms`);
    return jsonResponse({
      image_url: imageUrl,
      expires_in: IMAGE_EXPIRES_IN,
      module: moduleName,
      size,
      quality,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.error(`[generate-image] Erro timeout | OpenAI ultrapassou ${OPENAI_TIMEOUT_MS}ms.`);
      console.log(`[generate-image] Tempo total da requisicao: ${Date.now() - startedAt}ms`);
      return jsonResponse(
        {
          error: "A geração demorou mais do que o esperado.",
          error_type: "timeout_openai",
        },
        504
      );
    }

    const message = error instanceof Error ? error.message : "Erro inesperado ao gerar imagem.";
    console.error(`[generate-image] Erro inesperado | detalhe=${message}`);
    console.log(`[generate-image] Tempo total da requisicao: ${Date.now() - startedAt}ms`);
    return jsonResponse({ error: message, error_type: "internal_error" }, 500);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}
