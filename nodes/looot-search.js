const client = require("../lib/client");

module.exports = function (RED) {
  function LoootSearchNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    node.account = RED.nodes.getNode(config.account);
    node.limit = config.limit;
    node.query = config.query;

    node.on("input", async function (msg, send, done) {
      send = send || node.send.bind(node);
      try {
        const q = node.query || (typeof msg.payload === "string" ? msg.payload : "");
        if (!q) throw new Error("Search needs a query: set it on the node or send a string in msg.payload.");
        const cfg = node.account || {};
        msg.payload = await client.search(cfg, q, Number(node.limit) || 10);
        send(msg);
        done();
      } catch (err) {
        node.status({ fill: "red", shape: "ring", text: err.code || "error" });
        done(err);
      }
    });
  }
  RED.nodes.registerType("looot search", LoootSearchNode);
};
