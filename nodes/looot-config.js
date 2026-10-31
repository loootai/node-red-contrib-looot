module.exports = function (RED) {
  function LoootConfigNode(config) {
    RED.nodes.createNode(this, config);
    this.baseUrl = config.baseUrl || "https://api.looot.ai";
    this.token = this.credentials && this.credentials.token;
  }
  RED.nodes.registerType("looot-config", LoootConfigNode, {
    credentials: { token: { type: "password" } },
  });
};
