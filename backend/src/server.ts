// import memosRouter from "./memoApp/memos/memosroutes";
import { buildApp } from "./app";
import { config } from "./config";

const app = buildApp();

app.listen(config.port, () => {
  console.log(`listening on http://localhost:3000`);
});