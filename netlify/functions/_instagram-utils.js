const DEFAULT_GRAPH_VERSION = "v20.0";
const OAUTH_STATE_COOKIE = "ig_oauth_state";
const ACCESS_TOKEN_COOKIE = "ig_access_token";

export const getGraphVersion = () => process.env.META_API_VERSION || DEFAULT_GRAPH_VERSION;

export const getGraphBaseUrl = () => `https://graph.facebook.com/${getGraphVersion()}`;

export const jsonResponse = (payload, status = 200, extraHeaders = {}) => {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...extraHeaders,
    },
  });
};

export const findMissingEnv = (envKeys) => {
  return envKeys.filter((key) => !process.env[key]);
};

export const parseCookies = (cookieHeader = "") => {
  return cookieHeader
    .split(";")
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .reduce((acc, chunk) => {
      const separatorIndex = chunk.indexOf("=");
      if (separatorIndex < 0) return acc;
      const key = chunk.slice(0, separatorIndex).trim();
      const value = chunk.slice(separatorIndex + 1).trim();
      acc[key] = decodeURIComponent(value);
      return acc;
    }, {});
};

export const createCookie = (
  name,
  value,
  {
    maxAge = 3600,
    httpOnly = true,
    secure = true,
    sameSite = "Lax",
    path = "/",
  } = {}
) => {
  const parts = [`${name}=${encodeURIComponent(value)}`, `Path=${path}`, `Max-Age=${maxAge}`, `SameSite=${sameSite}`];
  if (httpOnly) parts.push("HttpOnly");
  if (secure) parts.push("Secure");
  return parts.join("; ");
};

export const clearCookie = (name) => {
  return `${name}=; Path=/; Max-Age=0; SameSite=Lax; HttpOnly; Secure`;
};

export const getOAuthStateCookieName = () => OAUTH_STATE_COOKIE;

export const getAccessTokenCookieName = () => ACCESS_TOKEN_COOKIE;

export const randomState = () => {
  const entropy = Math.random().toString(36).slice(2);
  return `ig-${Date.now()}-${entropy}`;
};

export const getSiteBaseUrl = (request, context) => {
  if (process.env.PUBLIC_SITE_URL) {
    return process.env.PUBLIC_SITE_URL.replace(/\/$/, "");
  }

  if (context?.site?.url) {
    return String(context.site.url).replace(/\/$/, "");
  }

  const requestUrl = new URL(request.url);
  return `${requestUrl.protocol}//${requestUrl.host}`;
};

export const buildMetaOauthUrl = (state) => {
  const authUrl = new URL("https://www.facebook.com/v20.0/dialog/oauth");
  authUrl.searchParams.set("client_id", process.env.META_APP_ID);
  authUrl.searchParams.set("redirect_uri", process.env.META_REDIRECT_URI);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set(
    "scope",
    "instagram_basic,instagram_manage_insights,pages_show_list,pages_read_engagement,business_management"
  );
  authUrl.searchParams.set("state", state);
  return authUrl.toString();
};

export const fetchJson = async (url, options = {}) => {
  const response = await fetch(url, options);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorMessage = payload?.error?.message || payload?.message || "Falha ao consultar a API da Meta.";
    throw new Error(errorMessage);
  }
  return payload;
};

export const getAccessTokenFromRequest = (request) => {
  const cookieHeader = request.headers.get("cookie") || "";
  const cookies = parseCookies(cookieHeader);
  if (cookies[ACCESS_TOKEN_COOKIE]) return cookies[ACCESS_TOKEN_COOKIE];

  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice("Bearer ".length).trim();
  }

  return "";
};

export const listConnectedInstagramAccounts = async (userAccessToken) => {
  const pagesUrl = new URL(`${getGraphBaseUrl()}/me/accounts`);
  pagesUrl.searchParams.set(
    "fields",
    "id,name,access_token,instagram_business_account{id,username,profile_picture_url}"
  );
  pagesUrl.searchParams.set("access_token", userAccessToken);

  const pagesData = await fetchJson(pagesUrl.toString());
  const pages = Array.isArray(pagesData?.data) ? pagesData.data : [];
  return pages.filter((page) => page?.instagram_business_account?.id);
};

export const getInstagramProfileData = async (userAccessToken) => {
  const pagesWithInstagram = await listConnectedInstagramAccounts(userAccessToken);
  if (!pagesWithInstagram.length) {
    throw new Error(
      "Nenhuma conta profissional do Instagram foi encontrada. Verifique se o Instagram está vinculado a uma Página do Facebook."
    );
  }

  const page = pagesWithInstagram[0];
  const igAccount = page.instagram_business_account;
  const igToken = page.access_token || userAccessToken;
  const profileUrl = new URL(`${getGraphBaseUrl()}/${igAccount.id}`);
  profileUrl.searchParams.set(
    "fields",
    "id,username,name,biography,followers_count,follows_count,media_count,profile_picture_url"
  );
  profileUrl.searchParams.set("access_token", igToken);

  const profileData = await fetchJson(profileUrl.toString());

  return {
    page: {
      id: page.id,
      name: page.name,
    },
    instagram: profileData,
  };
};

export const extractDishFromCaption = (caption = "") => {
  const text = caption.toLowerCase();
  if (text.includes("pizza")) return "Pizza cubana";
  if (text.includes("ropa vieja")) return "Ropa vieja cubana";
  if (text.includes("sobremesa") || text.includes("doce")) return "Sobremesa";
  if (text.includes("combo")) return "Combo familiar";
  if (text.includes("almoço") || text.includes("almoco")) return "Almoço latino";
  return "Prato latino";
};

export const classifyPerformance = (score) => {
  if (score >= 4500) return "alto";
  if (score >= 1800) return "médio";
  return "baixo";
};

export const computeHourRange = (timestampIsoList) => {
  if (!timestampIsoList.length) return "18h - 20h";
  const byHour = timestampIsoList.reduce((acc, iso) => {
    const hour = new Date(iso).getHours();
    acc[hour] = (acc[hour] || 0) + 1;
    return acc;
  }, {});

  const bestHour = Number(
    Object.entries(byHour)
      .sort((a, b) => b[1] - a[1])
      .map(([hour]) => hour)[0] || 18
  );

  return `${String(bestHour).padStart(2, "0")}h - ${String((bestHour + 2) % 24).padStart(2, "0")}h`;
};

