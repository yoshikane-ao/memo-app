import { buildApp } from "./app";
import { config } from "./config";

const app = buildApp();
const publicHost = config.host === "0.0.0.0" ? "localhost" : config.host;

app.listen(config.port, config.host, () => {
  console.log(`Listening on http://${publicHost}:${config.port}`);
});
