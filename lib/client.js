"use strict";

const DEFAULT_BASE_URL = "https://api.looot.ai";

/** Calls the looot REST API with global fetch and returns the parsed JSON body. */
async function request(cfg, method, path, body) {
  const token = cfg.token || process.env.LOOOT_TOKEN;
  if (!token) {
    throw new Error("No looot token. Set it in the looot-config node or LOOOT_TOKEN.");
  }
  const base = (cfg.baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, "");
  const res = await fetch(base + path, {
    method,
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
      "User-Agent": "node-red-contrib-looot/0.1.0",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let data = null;
  const text = await res.text();
  try {
    data = text ? JSON.parse(text) : null;
  } catch (e) {
    data = { raw: text };
  }
  if (!res.ok) {
    const err = (data && data.error) || {};
    const e = new Error(err.message || "looot request failed with HTTP " + res.status);
    e.status = res.status;
    e.code = err.code;
    e.requestId = err.requestId;
    throw e;
  }
  return data;
}

/** Free catalog search. */
function search(cfg, q, limit) {
  const qs = "?q=" + encodeURIComponent(q) + "&limit=" + encodeURIComponent(limit || 10);
  return request(cfg, "GET", "/v1/catalog/search" + qs);
}

/** Paid run. A failed call costs nothing. maxCostUsd caps fallback spend. */
function run(cfg, opts) {
  const wait = Math.max(0, Math.min(60, Number(opts.wait) || 0));
  const body = {
    endpointId: opts.endpointId,
    input: opts.input || {},
    idempotencyKey: opts.idempotencyKey,
  };
  if (opts.maxCostUsd !== undefined && opts.maxCostUsd !== "" && !isNaN(Number(opts.maxCostUsd))) {
    body.fallback = { enabled: true, maxCostUsd: Number(opts.maxCostUsd) };
  }
  return request(cfg, "POST", "/v1/runs?wait=" + wait, body);
}

module.exports = { request, search, run, DEFAULT_BASE_URL };
