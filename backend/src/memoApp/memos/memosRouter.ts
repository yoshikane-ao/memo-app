import { Router } from "express";
import searchRouter from "./search";
import registerRouter from "./register";
import deleteRouter from "./delete";
import updateRouter from "./update";
import listRouter from "./list";
import layoutRouter from "./layout";
import sortRouter from "./sort";

export const memosRouter = Router();

memosRouter.use("/search", searchRouter); // メモ検索API
memosRouter.use("/list", listRouter); // メモ一覧API
memosRouter.use("/register", registerRouter);// メモ登録API
memosRouter.use("/delete", deleteRouter); // メモ削除API
memosRouter.use("/update", updateRouter);// メモ更新API
memosRouter.use("/layout", layoutRouter);// メモサイズ変更API
memosRouter.use("/sort", sortRouter); // メモ並び替えAPI


