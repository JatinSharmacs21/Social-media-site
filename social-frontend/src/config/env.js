const trimTrailingSlash = (value) => {
  if (!value) return "";
  return value.replace(/\/+$/, "");
};

export const API_BASE_URL = trimTrailingSlash(
  process.env.REACT_APP_API_URL || "http://localhost:5000"
);

export const SOCKET_URL = API_BASE_URL;

export const isProduction = process.env.NODE_ENV === "production";
export const isDevelopment = process.env.NODE_ENV === "development";

const env = {
  API_BASE_URL,
  SOCKET_URL,
  isProduction,
  isDevelopment,
};

export default env;