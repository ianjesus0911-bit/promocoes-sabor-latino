import { getMissingEnv } from "./_lib/env.js";
import { handleOptions, methodNotAllowed, sendJson } from "./_lib/http.js";
import { resolveInstagramBusinessAccount } from "./_lib/metaGraph.js";

const getToken = (req) => {
  return req.query.access_token || process.env.ACCESS_TOKEN || "";
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
    const { page, instagramAccount, pages } = await resolveInstagramBusinessAccount({
      accessToken: token,
    });

    sendJson(res, 200, {
      ok: true,
      connected: Boolean(instagramAccount?.id),
      page,
      instagramAccount,
      pagesFound: pages.length,
      message: instagramAccount?.id
        ? "Conta profissional encontrada com sucesso."
        : "Nenhuma conta profissional encontrada nas páginas disponíveis para esse token.",
    });
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      error: "account_lookup_failed",
      message: error.message,
    });
  }
}
