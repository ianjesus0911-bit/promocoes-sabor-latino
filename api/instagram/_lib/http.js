export const sendJson = (res, status, payload) => {
  res.status(status).setHeader("Content-Type", "application/json; charset=utf-8").json(payload);
};

export const methodNotAllowed = (req, res, allowedMethods) => {
  res.setHeader("Allow", allowedMethods.join(", "));
  sendJson(res, 405, {
    error: "method_not_allowed",
    message: `Use ${allowedMethods.join(", ")} para este endpoint.`,
  });
};

export const handleOptions = (req, res) => {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.status(204).end();
    return true;
  }
  return false;
};

export const parseScopes = (rawScopes) => {
  if (!rawScopes) return [];
  return String(rawScopes)
    .split(",")
    .map((scope) => scope.trim())
    .filter(Boolean);
};
