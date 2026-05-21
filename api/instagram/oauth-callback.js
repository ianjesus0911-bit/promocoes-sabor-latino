import { getMissingEnv, readEnv } from "./_lib/env.js";
import { handleOptions, methodNotAllowed, sendJson } from "./_lib/http.js";
import {
  exchangeCodeForShortLivedToken,
  exchangeShortLivedForLongLivedToken,
} from "./_lib/metaGraph.js";

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  if (req.method !== "GET") {
    methodNotAllowed(req, res, ["GET"]);
    return;
  }

  const code = req.query.code;
  if (!code) {
    sendJson(res, 400, {
      ok: false,
      error: "missing_code",
      message: "Parâmetro 'code' não encontrado no callback OAuth.",
    });
    return;
  }

  const missing = getMissingEnv(["META_APP_ID", "META_APP_SECRET", "REDIRECT_URI"]);
  if (missing.length) {
    sendJson(res, 400, {
      ok: false,
      error: "missing_env",
      missingEnv: missing,
      message: "Defina META_APP_ID, META_APP_SECRET e REDIRECT_URI para trocar o código por token.",
    });
    return;
  }

  try {
    const env = readEnv();

    const shortToken = await exchangeCodeForShortLivedToken({
      code,
      appId: env.metaAppId,
      appSecret: env.metaAppSecret,
      redirectUri: env.redirectUri,
    });

    const longToken = await exchangeShortLivedForLongLivedToken({
      shortLivedToken: shortToken.access_token,
      appId: env.metaAppId,
      appSecret: env.metaAppSecret,
    });

    sendJson(res, 200, {
      ok: true,
      tokenType: "user_access_token",
      shortLivedToken: {
        accessToken: shortToken.access_token,
        expiresIn: shortToken.expires_in,
      },
      longLivedToken: {
        accessToken: longToken.access_token,
        expiresIn: longToken.expires_in,
      },
      nextStep:
        "Salve o token com segurança no backend (DB/Secret Manager) e use-o para consultar páginas e conta profissional conectada.",
    });
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      error: "oauth_exchange_failed",
      message: error.message,
    });
  }
}
