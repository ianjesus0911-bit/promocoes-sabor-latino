import {
  clearCookie,
  createCookie,
  fetchJson,
  findMissingEnv,
  getAccessTokenCookieName,
  getGraphBaseUrl,
  getOAuthStateCookieName,
  getSiteBaseUrl,
  parseCookies,
} from "./_instagram-utils.js";

const buildRedirect = (baseUrl, status, extra = {}) => {
  const url = new URL("/", baseUrl);
  url.searchParams.set("ig_oauth_status", status);
  Object.entries(extra).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });
  return url.toString();
};

export default async function handler(request, context) {
  const siteBaseUrl = getSiteBaseUrl(request, context);

  const missing = findMissingEnv(["META_APP_ID", "META_APP_SECRET", "META_REDIRECT_URI"]);
  if (missing.length) {
    const location = buildRedirect(siteBaseUrl, "erro", {
      ig_oauth_error: `Variáveis ausentes: ${missing.join(", ")}`,
    });
    return new Response(null, { status: 302, headers: { Location: location } });
  }

  const requestUrl = new URL(request.url);
  const authCode = requestUrl.searchParams.get("code");
  const stateFromQuery = requestUrl.searchParams.get("state");
  const cookieHeader = request.headers.get("cookie") || "";
  const cookies = parseCookies(cookieHeader);
  const stateFromCookie = cookies[getOAuthStateCookieName()];

  if (!authCode) {
    const location = buildRedirect(siteBaseUrl, "erro", {
      ig_oauth_error: "Código de autorização não recebido no callback da Meta.",
    });
    return new Response(null, { status: 302, headers: { Location: location } });
  }

  if (!stateFromQuery || !stateFromCookie || stateFromQuery !== stateFromCookie) {
    const location = buildRedirect(siteBaseUrl, "erro", {
      ig_oauth_error: "Falha de segurança no estado OAuth. Tente conectar novamente.",
    });
    return new Response(null, { status: 302, headers: { Location: location } });
  }

  try {
    const shortTokenUrl = new URL(`${getGraphBaseUrl()}/oauth/access_token`);
    shortTokenUrl.searchParams.set("client_id", process.env.META_APP_ID);
    shortTokenUrl.searchParams.set("client_secret", process.env.META_APP_SECRET);
    shortTokenUrl.searchParams.set("redirect_uri", process.env.META_REDIRECT_URI);
    shortTokenUrl.searchParams.set("code", authCode);

    const shortTokenData = await fetchJson(shortTokenUrl.toString());
    const shortToken = shortTokenData.access_token;
    if (!shortToken) {
      throw new Error("Token temporário não retornado pela Meta.");
    }

    const longTokenUrl = new URL(`${getGraphBaseUrl()}/oauth/access_token`);
    longTokenUrl.searchParams.set("grant_type", "fb_exchange_token");
    longTokenUrl.searchParams.set("client_id", process.env.META_APP_ID);
    longTokenUrl.searchParams.set("client_secret", process.env.META_APP_SECRET);
    longTokenUrl.searchParams.set("fb_exchange_token", shortToken);

    const longTokenData = await fetchJson(longTokenUrl.toString());
    const accessToken = longTokenData.access_token || shortToken;
    const expiresInSeconds = Number(longTokenData.expires_in) || 60 * 60 * 24 * 45;
    const connectedAt = new Date().toISOString();

    const redirectLocation = buildRedirect(siteBaseUrl, "conectado", {
      ig_connected_at: connectedAt,
    });

    const headers = new Headers({
      Location: redirectLocation,
      "Set-Cookie": createCookie(getAccessTokenCookieName(), accessToken, {
        maxAge: expiresInSeconds,
      }),
    });
    headers.append("Set-Cookie", clearCookie(getOAuthStateCookieName()));

    return new Response(null, {
      status: 302,
      headers,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao concluir autenticação com a Meta.";
    const redirectLocation = buildRedirect(siteBaseUrl, "erro", {
      ig_oauth_error: message,
    });
    const headers = new Headers({
      Location: redirectLocation,
      "Set-Cookie": clearCookie(getOAuthStateCookieName()),
    });
    return new Response(null, { status: 302, headers });
  }
}

