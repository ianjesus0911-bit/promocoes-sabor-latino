import { getMissingEnv } from "./_lib/env.js";
import { handleOptions, methodNotAllowed, sendJson } from "./_lib/http.js";
import { graphRequest, resolveInstagramBusinessAccount } from "./_lib/metaGraph.js";

const getToken = (req) => req.query.access_token || process.env.ACCESS_TOKEN || "";

const inferDish = (caption = "") => {
  const text = String(caption).toLowerCase();
  if (text.includes("pizza")) return "pizza cubana";
  if (text.includes("ropa vieja")) return "ropa vieja cubana";
  if (text.includes("sobremesa") || text.includes("doce")) return "sobremesa";
  if (text.includes("combo")) return "combo familiar";
  if (text.includes("almoço") || text.includes("almoco")) return "almoço latino";
  return "prato do dia";
};

const parseHour = (timestamp) => {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return 19;
  return date.getHours();
};

const buildPromotionPack = ({ dish, bestHourRange }) => {
  const whatsappText = `🔥 Hoje vale focar em ${dish} no Sabor Latino!\nPublicação sugerida entre ${bestHourRange}.\nQuer garantir seu pedido agora? Chama no WhatsApp: +55 54 8100-7256`;

  const instagramText = `Hoje o destaque é ${dish} no Sabor Latino.\nClose-up, vapor e chamada direta para pedido no WhatsApp.\nHorário ideal: ${bestHourRange}.\n#SaborLatino #ComidaLatina #NovaBassano #PedidoNoWhatsApp`;

  const storyText = `${dish.toUpperCase()} HOJE\n${bestHourRange}\nPeça no WhatsApp`;

  const imagePrompt = `Crie imagem original para Sabor Latino com foco em ${dish}, close-up extremo, vapor visível, cores quentes de restaurante latino, iluminação de fim de tarde, composição vertical para redes sociais e chamada para WhatsApp.`;

  const videoIdea = `Vídeo curto (8s):\n0-3s close em ${dish} com vapor\n3-6s detalhe de textura/apetite\n6-8s chamada: Peça agora no WhatsApp +55 54 8100-7256`;

  return { whatsappText, instagramText, storyText, imagePrompt, videoIdea };
};

const fetchPosts = async ({ token, igUserId, limit = 25 }) => {
  let resolvedUserId = igUserId || "";
  if (!resolvedUserId) {
    const resolved = await resolveInstagramBusinessAccount({ accessToken: token });
    resolvedUserId = resolved?.instagramAccount?.id || "";
  }
  if (!resolvedUserId) return [];

  const response = await graphRequest({
    path: `/${resolvedUserId}/media`,
    accessToken: token,
    query: {
      fields: "id,caption,media_type,timestamp,like_count,comments_count",
      limit,
    },
  });

  return (response?.data || []).map((post) => ({
    id: post.id,
    caption: post.caption || "",
    type: post.media_type || "FEED",
    timestamp: post.timestamp,
    likes: Number(post.like_count || 0),
    comments: Number(post.comments_count || 0),
  }));
};

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  if (!["GET", "POST"].includes(req.method)) {
    methodNotAllowed(req, res, ["GET", "POST"]);
    return;
  }

  try {
    let posts = [];

    if (req.method === "POST" && Array.isArray(req.body?.posts)) {
      posts = req.body.posts;
    } else {
      const token = getToken(req);
      if (!token) {
        const missing = getMissingEnv(["ACCESS_TOKEN"]);
        sendJson(res, 400, {
          ok: false,
          error: "missing_access_token",
          missingEnv: missing,
          message: "Defina ACCESS_TOKEN na Vercel ou envie ?access_token=...",
        });
        return;
      }
      posts = await fetchPosts({
        token,
        igUserId: req.query.ig_user_id,
        limit: Number(req.query.limit || 25),
      });
    }

    if (!posts.length) {
      sendJson(res, 200, {
        ok: true,
        metrics: null,
        recommendations: [
          "Sem dados suficientes ainda. Faça publicações e rode a análise novamente.",
          "Use vídeo vertical com close-up e vapor.",
          "Inclua chamada clara para pedir no WhatsApp.",
        ],
      });
      return;
    }

    const dishStats = {};
    const hourStats = {};

    posts.forEach((post) => {
      const dish = inferDish(post.caption);
      const score = Number(post.likes || 0) + Number(post.comments || 0) * 2.2;
      const hour = parseHour(post.timestamp);

      if (!dishStats[dish]) dishStats[dish] = { score: 0, count: 0 };
      dishStats[dish].score += score;
      dishStats[dish].count += 1;

      if (!hourStats[hour]) hourStats[hour] = { score: 0, count: 0 };
      hourStats[hour].score += score;
      hourStats[hour].count += 1;
    });

    const topDish =
      Object.entries(dishStats)
        .sort((a, b) => b[1].score / b[1].count - a[1].score / a[1].count)
        .map(([dish]) => dish)[0] || "prato do dia";

    const bestHour =
      Object.entries(hourStats)
        .sort((a, b) => b[1].score / b[1].count - a[1].score / a[1].count)
        .map(([hour]) => Number(hour))[0] ?? 19;

    const bestHourRange = `${String(bestHour).padStart(2, "0")}h - ${String((bestHour + 2) % 24).padStart(2, "0")}h`;

    const recommendations = [
      `Hoje vale promover ${topDish} porque os posts desse prato tiveram melhor desempenho médio.`,
      "Use vídeo vertical com close-up e vapor para aumentar o desejo de compra.",
      `Publique entre ${bestHourRange}.`,
      "Use chamada direta para WhatsApp em toda peça publicada.",
    ];

    sendJson(res, 200, {
      ok: true,
      metrics: {
        analyzedCount: posts.length,
        topDish,
        bestHourRange,
      },
      recommendations,
      promotionPack: buildPromotionPack({ dish: topDish, bestHourRange }),
    });
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      error: "recommendation_generation_failed",
      message: error.message,
    });
  }
}
