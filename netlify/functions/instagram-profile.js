import {
  findMissingEnv,
  getAccessTokenFromRequest,
  getInstagramProfileData,
  jsonResponse,
} from "./_instagram-utils.js";

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
        error: "Token de acesso não encontrado. Conecte o Instagram via Meta para continuar.",
      },
      401
    );
  }

  try {
    const profile = await getInstagramProfileData(accessToken);
    return jsonResponse({
      ok: true,
      profile,
      connectedAt: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao consultar o perfil do Instagram.";
    return jsonResponse(
      {
        ok: false,
        error: message,
      },
      500
    );
  }
}

