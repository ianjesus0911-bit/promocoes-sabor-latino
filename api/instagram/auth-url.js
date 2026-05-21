import { getMissingEnv, readEnv } from "./_lib/env.js";
import { handleOptions, methodNotAllowed, parseScopes, sendJson } from "./_lib/http.js";
import { buildMetaOAuthUrl, defaultInstagramScopes } from "./_lib/metaGraph.js";

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  if (req.method !== "GET") {
    methodNotAllowed(req, res, ["GET"]);
    return;
  }

  const missing = getMissingEnv(["META_APP_ID", "REDIRECT_URI"]);
  if (missing.length) {
    sendJson(res, 400, {
      ok: false,
      error: "missing_env",
      missingEnv: missing,
      message: "Defina META_APP_ID e REDIRECT_URI para gerar a URL de autorização.",
    });
    return;
  }

  const env = readEnv();
  const scopes = parseScopes(req.query.scopes);
  const oauthUrl = buildMetaOAuthUrl({
    appId: env.metaAppId,
    redirectUri: env.redirectUri,
    state: req.query.state || "sabor-latino-state",
    scopes: scopes.length ? scopes : defaultInstagramScopes,
  });

  sendJson(res, 200, {
    ok: true,
    oauthUrl,
    apiVersion: process.env.META_API_VERSION || "v20.0",
    scopes: scopes.length ? scopes : defaultInstagramScopes,
  });
}
