// src/index.ts
var getApiBaseUrl = (override) => {
  const envValue = override ?? (typeof process !== "undefined" ? process.env?.EXPO_PUBLIC_API_URL : void 0);
  if (envValue && envValue.trim().length > 0) {
    return envValue.replace(/\/$/, "");
  }
  return "http://localhost:5001";
};
export {
  getApiBaseUrl
};
