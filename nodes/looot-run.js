const client = require("../lib/client");

module.exports = function (RED) {
  function LoootRunNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    node.account = RED.nodes.getNode(config.account);
    node.endpointId = config.endpointId;
    node.maxCostUsd = config.maxCostUsd;
    node.wait = config.wait;

    node.on("input", async function (msg, send, done) {
      send = send || node.send.bind(node);
      try {
        const endpointId = node.endpointId || msg.endpointId;
        if (!endpointId) throw new Error("Run needs an endpoint or job id: set it on the node or in msg.endpointId.");
        const input = msg.payload && typeof msg.payload === "object" ? msg.payload : {};
        const maxCostUsd = node.maxCostUsd !== "" && node.maxCostUsd !== undefined ? node.maxCostUsd : msg.maxCostUsd;
        node.status({ fill: "blue", shape: "dot", text: "running" });
        msg.payload = await client.run(node.account || {}, {
          endpointId,
          input,
          idempotencyKey: msg._msgid,
          maxCostUsd,
          wait: node.wait,
        });
        node.status({});
        send(msg);
        done();
      } catch (err) {
        node.status({ fill: "red", shape: "ring", text: err.code || "error" });
        done(err);
      }
    });
  }
  RED.nodes.registerType("looot run", LoootRunNode);
};
