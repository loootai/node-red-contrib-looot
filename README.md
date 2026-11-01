# node-red-contrib-looot

Node-RED nodes for [looot](https://looot.ai). One API key and a prepaid balance give your flows access to 4,200+ data APIs from 300+ providers.

## Install

The package is not on npm yet, so the Manage palette search does not find it. Install it from GitHub in your Node-RED user directory, then restart Node-RED:

```bash
cd ~/.node-red
npm install github:loootai/node-red-contrib-looot#v0.1.0
```

Once it is on npm, `npm install node-red-contrib-looot` and the palette search will work too.

Needs Node-RED 3.0 or newer and Node 18 or newer. The package has no runtime dependencies.

## Set up

1. Create an agent token at https://looot.ai (Settings, Agent tokens). Top up from $5 before your first paid run.
2. Add a `looot run` or `looot search` node, open it, and add a new looot account. Paste the token. Node-RED stores it as a credential, so exported flows do not contain it.
3. Without a configured account the nodes read the `LOOOT_TOKEN` environment variable.

## Nodes

| Node | Cost | What it does |
| --- | --- | --- |
| looot search | Free | Searches the catalog. Query from the node or `msg.payload` (string). Returns rows with endpoint ids. |
| looot run | Spends credit on success | Runs an endpoint or a job such as `job:people.email.find`. Input is `msg.payload` (object). A failed call costs nothing. |

`looot run` details:

- Max cost (USD) sets `fallback.maxCostUsd`, the cap for a run that may try other providers. Empty means no fallback.
- The idempotency key is `msg._msgid`, so replaying the same message does not pay twice.
- Wait (seconds, 0 to 60) is how long to hold the request for a result.
- Read `status` and `outcome` on `msg.payload`. A miss is a normal answer, not an error.

## One call

Import `examples/find-email.json` (Menu, Import, Examples), set your token on the account node, and press the inject button. It runs `job:people.email.find` for a name and domain with a 10 cent cap.

## Test

```bash
npm install
npm test
```

Tests mock `fetch`, so they make no network calls.

## Links

- Docs: https://docs.looot.ai
- Remote MCP: https://api.looot.ai/mcp

MIT licence.
