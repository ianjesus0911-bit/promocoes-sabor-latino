import { getMissingEnv } from "./_lib/env.js";
import { handleOptions, methodNotAllowed, sendJson } from "./_lib/http.js";
import { graphRequest, resolveInstagramBusinessAccount } from "./_lib/metaGraph.js";

const getToken = (req) => {
  return req.query.access_token || process.env.ACCESS_TOKEN || "";
};

const getLimit = (rawLimit) => {
  const limit = Number(rawLimit || 25);
  if (!Number.isFinite(limit) || limit <= 0) return 25;
  return Math.min(limit, 50);
};

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  if (req.method !== "GET") {
    methodNotAllowed(req, res, ["GET"]);
    return;
  }

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

  try {
    let instagramUserId = req.query.ig_user_id || "";
    let instagramUsername = "";

    if (!instagramUserId) {
      const resolved = await resolveInstagramBusinessAccount({ accessToken: token });
      instagramUserId = resolved?.instagramAccount?.id || "";
      instagramUsername = resolved?.instagramAccount?.username || "";
    }

    if (!instagramUserId) {
      sendJson(res, 404, {
        ok: false,
        error: "instagram_user_not_found",
        message:
          "Não foi possível localizar uma conta profissional de Instagram vinculada a esse token. Verifique a conexão da Página do Facebook.",
      });
      return;
    }

    const fields =
      "id,caption,media_type,media_url,thumbnail_url,timestamp,permalink,like_count,comments_count";

    const response = await graphRequest({
      path: `/${instagramUserId}/media`,
      accessToken: token,
      query: {
        fields,
        limit: getLimit(req.query.limit),
      },
    });

    const normalizedPosts = (response?.data || []).map((item) => ({
      id: item.id,
      date: item.timestamp,
      type: item.media_type,
      caption: item.caption || "",
      permalink: item.permalink || "",
      mediaUrl: item.media_url || item.thumbnail_url || "",
      likes: Number(item.like_count || 0),
      comments: Number(item.comments_count || 0),
    }));

    sendJson(res, 200, {
      ok: true,
      instagramUser: {
        id: instagramUserId,
        username: instagramUsername,
      },
      count: normalizedPosts.length,
      posts: normalizedPosts,
      paging: response?.paging || null,
    });
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      error: "media_fetch_failed",
      message: error.message,
    });
  }
}
