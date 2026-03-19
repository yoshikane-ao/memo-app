import express, { Request, Response } from "express";
import memosRouter from "./memos/memosroutes";
import { buildApp } from "./app";
import { config } from "./config";


const cors = require('cors');
const app = buildApp();
app.use(cors());


app.use("/memos", memosRouter); //メモアプリのAPI
// app.use("/sanpo", sanpoRouter); //散歩アプリのAPI


// ヘルスチェック（稼働確認）
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

app.listen(config.port, () => {
  console.log(`listening on http://localhost:3000`);
});