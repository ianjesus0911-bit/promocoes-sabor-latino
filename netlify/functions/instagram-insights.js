import {
  classifyPerformance,
  computeHourRange,
  extractDishFromCaption,
  fetchJson,
  findMissingEnv,
  getAccessTokenFromRequest,
  getGraphBaseUrl,
  getInstagramProfileData,
  jsonResponse,
  listConnectedInstagramAccounts,
} from "./_instagram-utils.js";

const metricValue = (insightsData, metricName) => {
  if (!Array.isArray(insightsData)) return 0;
  const metric = insightsData.find((item) => item?.name === metricName);
  if (!metric) return 0;
  if (Array.isArray(metric.values) && metric.values[0]?.value !== undefined) {
    return Number(metric.values[0].value) || 0;
  }
  return Number(metric.value) || 0;
};

const normalizeMediaType = (mediaType) => {
  const value = String(mediaType || "").toUpperCase();
  if (value === "VIDEO" || value === "REELS") return "Reel";
  if (value === "CAROUSEL_ALBUM" || value === "IMAGE") return "Feed";
  return "Story";
};

export default async function handler(request) {
  const missing = findMissingEnv(["META_APP_ID", "META_APP_SECRET", "META_REDIRECT_URI"]);
  if (missing.length) {
    return jsonResponse(
      {
        ok: false,
        error: `Variáveis de ambiente ausentes: ${missing.join(", ")}.`,
      },
      500
    );
  }

  const accessToken = getAccessTokenFromRequest(request);
  if (!accessToken) {
    return jsonResponse(
      {
        ok: false,
        error: "Token de acesso não encontrado. Conecte o Instagram via Meta para consultar métricas reais.",
      },
      401
    );
  }

  try {
    const requestUrl = new URL(request.url);
    const limitParam = Number(requestUrl.searchParams.get("limit") || 15);
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 5), 30) : 15;

    const profile = await getInstagramProfileData(accessToken);
    const pages = await listConnectedInstagramAccounts(accessToken);
    const page = pages[0];
    const igAccountId = page.instagram_business_account.id;
    const igToken = page.access_token || accessToken;

    const mediaUrl = new URL(`${getGraphBaseUrl()}/${igAccountId}/media`);
    mediaUrl.searchParams.set(
      "fields",
      "id,caption,media_type,permalink,timestamp,like_count,comments_count"
    );
    mediaUrl.searchParams.set("limit", String(limit));
    mediaUrl.searchParams.set("access_token", igToken);

    const mediaData = await fetchJson(mediaUrl.toString());
    const mediaList = Array.isArray(mediaData?.data) ? mediaData.data : [];

    const posts = [];
    for (const media of mediaList) {
      const insightsUrl = new URL(`${getGraphBaseUrl()}/${media.id}/insights`);
      insightsUrl.searchParams.set("metric", "impressions,reach,saved,shares");
      insightsUrl.searchParams.set("access_token", igToken);

      let insights = [];
      try {
        const insightsData = await fetchJson(insightsUrl.toString());
        insights = Array.isArray(insightsData?.data) ? insightsData.data : [];
      } catch (error) {
        insights = [];
      }

      const views = metricValue(insights, "impressions");
      const likes = Number(media.like_count) || 0;
      const comments = Number(media.comments_count) || 0;
      const saves = metricValue(insights, "saved");
      const shares = metricValue(insights, "shares");
      const estimatedOrders = Math.max(0, Math.round((likes + comments * 1.8 + saves * 1.4 + shares * 1.6) / 35));
      const dish = extractDishFromCaption(media.caption || "");
      const type = normalizeMediaType(media.media_type);
      const score = views * 0.04 + likes * 1.1 + comments * 2.3 + saves * 2.2 + shares * 2.4 + estimatedOrders * 5;

      posts.push({
        id: media.id,
        date: media.timestamp,
        type,
        dish,
        views,
        likes,
        comments,
        saves,
        shares,
        estimatedOrders,
        performance: classifyPerformance(score),
        permalink: media.permalink || "",
        score,
      });
    }

    const topPost = [...posts].sort((a, b) => b.score - a.score)[0] || null;
    const dishScores = posts.reduce((acc, post) => {
      if (!acc[post.dish]) {
        acc[post.dish] = { total: 0, count: 0 };
      }
      acc[post.dish].total += post.score;
      acc[post.dish].count += 1;
      return acc;
    }, {});

    const topDish =
      Object.entries(dishScores)
        .sort((a, b) => b[1].total / b[1].count - a[1].total / a[1].count)
        .map(([dish]) => dish)[0] || "Ropa vieja cubana";

    const formatScores = posts.reduce((acc, post) => {
      acc[post.type] = (acc[post.type] || 0) + post.score;
      return acc;
    }, {});
    const topFormat =
      Object.entries(formatScores)
        .sort((a, b) => b[1] - a[1])
        .map(([format]) => format)[0] || "Reel";

    const bestHourRange = computeHourRange(posts.map((post) => post.date));

    return jsonResponse({
      ok: true,
      source: "real",
      profile,
      metrics: {
        analyzedCount: posts.length,
        topDish,
        bestHourRange,
        topFormat,
        topPost: topPost
          ? {
              id: topPost.id,
              type: topPost.type,
              dish: topPost.dish,
              views: topPost.views,
              comments: topPost.comments,
              permalink: topPost.permalink,
            }
          : null,
      },
      posts,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao consultar métricas reais do Instagram.";
    return jsonResponse(
      {
        ok: false,
        error: message,
      },
      500
    );
  }
}

