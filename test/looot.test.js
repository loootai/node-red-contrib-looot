"use strict";
const assert = require("node:assert");
const helper = require("node-red-node-test-helper");
const configNode = require("../nodes/looot-config.js");
const searchNode = require("../nodes/looot-search.js");
const runNode = require("../nodes/looot-run.js");

helper.init(require.resolve("node-red"));

const realFetch = global.fetch;
let calls;

function mockFetch(status, body) {
  calls = [];
  global.fetch = async (url, opts) => {
    calls.push({ url, opts });
    return { ok: status < 400, status, text: async () => JSON.stringify(body) };
  };
}

const cfg = { id: "c", type: "looot-config", name: "acct" };
const creds = { c: { token: "test-token" } };

describe("node-red-contrib-looot", function () {
  beforeEach(async () => {
    await helper.startServer();
  });
  afterEach(async () => {
    global.fetch = realFetch;
    await helper.unload();
    await helper.stopServer();
  });

  it("search sends the query and returns rows", async function () {
    mockFetch(200, { results: [{ endpointId: "job:people.email.find" }] });
    const flow = [
      cfg,
      { id: "s", type: "looot search", account: "c", query: "", limit: 5, wires: [["h"]] },
      { id: "h", type: "helper" },
    ];
    await helper.load([configNode, searchNode], flow, creds);
    const out = new Promise((resolve) => helper.getNode("h").on("input", resolve));
    helper.getNode("s").receive({ payload: "find email" });
    const msg = await out;
    assert.strictEqual(msg.payload.results[0].endpointId, "job:people.email.find");
    assert.ok(calls[0].url.startsWith("https://api.looot.ai/v1/catalog/search?q=find%20email&limit=5"));
    assert.strictEqual(calls[0].opts.headers.Authorization, "Bearer test-token");
  });

  it("run posts input, idempotency key from _msgid and cost cap", async function () {
    mockFetch(200, { runId: "r1", status: "succeeded" });
    const flow = [
      cfg,
      { id: "r", type: "looot run", account: "c", endpointId: "job:people.email.find", maxCostUsd: "0.1", wait: 20, wires: [["h"]] },
      { id: "h", type: "helper" },
    ];
    await helper.load([configNode, runNode], flow, creds);
    const out = new Promise((resolve) => helper.getNode("h").on("input", resolve));
    helper.getNode("r").receive({ _msgid: "abc123", payload: { domain: "example.com" } });
    const msg = await out;
    assert.strictEqual(msg.payload.status, "succeeded");
    assert.ok(calls[0].url.endsWith("/v1/runs?wait=20"));
    const body = JSON.parse(calls[0].opts.body);
    assert.deepStrictEqual(body, {
      endpointId: "job:people.email.find",
      input: { domain: "example.com" },
      idempotencyKey: "abc123",
      fallback: { enabled: true, maxCostUsd: 0.1 },
    });
  });

  it("run reports an API error on the catch path", async function () {
    mockFetch(402, { error: { code: "insufficient_balance", message: "Top up first", requestId: "q1" } });
    const flow = [
      cfg,
      { id: "r", type: "looot run", account: "c", endpointId: "job:company.enrich", maxCostUsd: "", wait: 0, wires: [[]] },
    ];
    await helper.load([configNode, runNode], flow, creds);
    const failed = new Promise((resolve) => {
      helper.getNode("r").on("call:error", (call) => resolve(call.args[0]));
    });
    helper.getNode("r").receive({ payload: { domain: "example.com" } });
    const err = await failed;
    const text = String(err.message || err);
    assert.match(text, /Top up first/);
    const body = JSON.parse(calls[0].opts.body);
    assert.strictEqual(body.fallback, undefined);
  });
});
