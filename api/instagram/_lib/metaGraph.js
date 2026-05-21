const META_API_VERSION = process.env.META_API_VERSION || "v20.0";
const META_GRAPH_BASE = `https://graph.facebook.com/${META_API_VERSION}`;
const META_OAUTH_BASE = `https://www.facebook.com/${META_API_VERSION}`;

export const defaultInstagramScopes = [
  "instagram_basic",
  "instagram_manage_insights",
  "pages_show_list",
  "pages_read_engagement",
];

export const buildMetaOAuthUrl = ({ appId, redirectUri, state = "sabor-latino-state", scopes }) => {
  const url = new URL(`${META_OAUTH_BASE}/dialog/oauth`);
  url.searchParams.set("client_id", appId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", (scopes?.length ? scopes : defaultInstagramScopes).join(","));
  url.searchParams.set("state", state);
  return url.toString();
};

const withQuery = (baseUrl, queryParams = {}) => {
  const url = new URL(baseUrl);
  Object.entries(queryParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });
  return url.toString();
};

export const graphRequest = async ({ path, accessToken, query = {}, method = "GET" }) => {
  const fullUrl = withQuery(`${META_GRAPH_BASE}${path}`, {
    ...query,
    access_token: accessToken,
  });

  const response = await fetch(fullUrl, { method });
  const data = await response.json();

  if (!response.ok || data.error) {
    const errorMessage = data?.error?.message || "Erro ao consultar Graph API.";
    const errorCode = data?.error?.code || response.status;
    throw new Error(`[MetaGraph ${errorCode}] ${errorMessage}`);
  }

  return data;
};

export const exchangeCodeForShortLivedToken = async ({
  code,
  appId,
  appSecret,
  redirectUri,
}) => {
  const url = withQuery(`${META_GRAPH_BASE}/oauth/access_token`, {
    client_id: appId,
    client_secret: appSecret,
    redirect_uri: redirectUri,
    code,
  });

  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok || data.error) {
    const errorMessage = data?.error?.message || "Erro ao trocar código por token.";
    throw new Error(errorMessage);
  }

  return data;
};

export const exchangeShortLivedForLongLivedToken = async ({
  shortLivedToken,
  appId,
  appSecret,
}) => {
  const url = withQuery(`${META_GRAPH_BASE}/oauth/access_token`, {
    grant_type: "fb_exchange_token",
    client_id: appId,
    client_secret: appSecret,
    fb_exchange_token: shortLivedToken,
  });

  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok || data.error) {
    const errorMessage = data?.error?.message || "Erro ao gerar token de longa duração.";
    throw new Error(errorMessage);
  }

  return data;
};

export const resolveInstagramBusinessAccount = async ({ accessToken }) => {
  const pages = await graphRequest({
    path: "/me/accounts",
    accessToken,
    query: {
      fields: "id,name,instagram_business_account{id,username}",
      limit: 50,
    },
  });

  const pageWithInstagram = (pages?.data || []).find((page) => page.instagram_business_account?.id);
  if (!pageWithInstagram) {
    return { page: null, instagramAccount: null, pages: pages?.data || [] };
  }

  return {
    page: { id: pageWithInstagram.id, name: pageWithInstagram.name },
    instagramAccount: {
      id: pageWithInstagram.instagram_business_account.id,
      username: pageWithInstagram.instagram_business_account.username || "",
    },
    pages: pages?.data || [],
  };
};
