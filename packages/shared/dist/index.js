// src/index.ts
var getApiBaseUrl = (override) => {
  const envValue = override ?? (typeof process !== "undefined" ? process.env?.EXPO_PUBLIC_API_URL : void 0);
  if (envValue && envValue.trim().length > 0) {
    return envValue.replace(/\/$/, "");
  }
  return "http://localhost:5001";
};
var ApiClient = class {
  constructor(baseUrl) {
    this.token = null;
    this.baseUrl = baseUrl;
  }
  setToken(token) {
    this.token = token;
  }
  async request(path, options = {}) {
    const url = `${this.baseUrl}${path}`;
    const headers = new Headers(options.headers);
    if (this.token) {
      headers.set("Authorization", `Bearer ${this.token}`);
    }
    if (!(options.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }
    try {
      const response = await fetch(url, { ...options, headers, credentials: "include" });
      const data = await response.json();
      if (response.ok) {
        return { ok: true, data: data.data };
      } else {
        return {
          ok: false,
          error: data.message || "An error occurred",
          code: data.code,
          details: data.details
        };
      }
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "Network error" };
    }
  }
  get(path) {
    return this.request(path);
  }
  post(path, body) {
    return this.request(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : void 0
    });
  }
  patch(path, body) {
    return this.request(path, {
      method: "PATCH",
      body: JSON.stringify(body)
    });
  }
  put(path, body) {
    return this.request(path, {
      method: "PUT",
      body: JSON.stringify(body)
    });
  }
  delete(path) {
    return this.request(path, { method: "DELETE" });
  }
};
export {
  ApiClient,
  getApiBaseUrl
};
