"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  ApiClient: () => ApiClient,
  getApiBaseUrl: () => getApiBaseUrl
});
module.exports = __toCommonJS(index_exports);
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ApiClient,
  getApiBaseUrl
});
