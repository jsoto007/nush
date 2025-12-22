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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getApiBaseUrl
});
