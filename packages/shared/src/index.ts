export type HealthResponse = {
  status: string;
};

export const getApiBaseUrl = (override?: string) => {
  const envValue =
    override ??
    (typeof process !== "undefined" ? process.env?.EXPO_PUBLIC_API_URL : undefined);

  if (envValue && envValue.trim().length > 0) {
    return envValue.replace(/\/$/, "");
  }

  return "http://localhost:5001";
};
