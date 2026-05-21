export const REQUIRED_ENV = ["META_APP_ID", "META_APP_SECRET", "REDIRECT_URI", "ACCESS_TOKEN"];

export const readEnv = () => ({
  metaAppId: process.env.META_APP_ID || "",
  metaAppSecret: process.env.META_APP_SECRET || "",
  redirectUri: process.env.REDIRECT_URI || "",
  accessToken: process.env.ACCESS_TOKEN || "",
});

export const getMissingEnv = (keys = REQUIRED_ENV) => {
  return keys.filter((key) => !process.env[key] || String(process.env[key]).trim() === "");
};

export const maskValue = (value) => {
  if (!value) return "";
  if (value.length <= 8) return "••••";
  return `${value.slice(0, 4)}••••${value.slice(-4)}`;
};

export const getEnvSummary = () => {
  const env = readEnv();
  return {
    META_APP_ID: env.metaAppId ? maskValue(env.metaAppId) : "",
    META_APP_SECRET: env.metaAppSecret ? "configured" : "",
    REDIRECT_URI: env.redirectUri || "",
    ACCESS_TOKEN: env.accessToken ? maskValue(env.accessToken) : "",
  };
};
