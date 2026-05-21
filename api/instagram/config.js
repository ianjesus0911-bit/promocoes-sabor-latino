import { getEnvSummary, getMissingEnv } from "./_lib/env.js";
import { handleOptions, methodNotAllowed, sendJson } from "./_lib/http.js";

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  if (req.method !== "GET") {
    methodNotAllowed(req, res, ["GET"]);
    return;
  }

  const missing = getMissingEnv();
  sendJson(res, 200, {
    ok: true,
    integration: "instagram_graph_api",
    configured: missing.length === 0,
    missingEnv: missing,
    envSummary: getEnvSummary(),
    note: "Configure as variáveis de ambiente na Vercel para ativar chamadas reais à Meta Graph API.",
  });
}
