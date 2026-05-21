import {
  buildMetaOauthUrl,
  createCookie,
  findMissingEnv,
  getOAuthStateCookieName,
  jsonResponse,
  randomState,
} from "./_instagram-utils.js";

export default async function handler() {
  const missing = findMissingEnv(["META_APP_ID", "META_REDIRECT_URI"]);
  if (missing.length) {
    return jsonResponse(
      {
        ok: false,
        error: `Variáveis de ambiente ausentes: ${missing.join(", ")}.`,
      },
      500
    );
  }

  const state = randomState();
  const authUrl = buildMetaOauthUrl(state);

  return jsonResponse(
    {
      ok: true,
      authUrl,
      message: "URL oficial de autorização da Meta gerada com sucesso.",
    },
    200,
    {
      "Set-Cookie": createCookie(getOAuthStateCookieName(), state, { maxAge: 600 }),
    }
  );
}

