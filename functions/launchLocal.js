const ngrok = require("@ngrok/ngrok");
const ngrokAccount = require("./data/keys/NgrokAccount.json");

const { LineBotController } = require("./lib/LineBotController");
const lineAccount = require("./data/keys/LineAccount_local.json");
const line = new LineBotController(lineAccount);

const http = require('http');
http.createServer((req,res) => {
  res.writeHead(200);
  res.end();
}).listen(8081);

(async function() {
  await ngrok.authtoken(ngrokAccount.token);
  const listener = await ngrok.forward({addr: 5000});
  console.log(`Ingress established at: ${listener.url()}`);

  await line.setWebhookEndpointUrl(`${listener.url()}/racsu-develop/asia-northeast1/expressFunctions/webhook`);
  console.log(`Endpoint set to ${listener.url()}/racsu-develop/asia-northeast1/expressFunctions/webhook`);
  console.log("\nRunning... (Ctrl+C to quit)\n");
})();

