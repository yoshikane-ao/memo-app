import { Router } from "express";
import searchRouter from "./search";
import registerRouter from "./register";
import deleteRouter from "./delete";
import restoreRouter from "./restore";
import purgeRouter from "./purge";
import updateRouter from "./update";
import listRouter from "./list";
import layoutRouter from "./layout";
import sortRouter from "./sort";

export const memosRouter = Router();

memosRouter.use("/search", searchRouter);
memosRouter.use("/list", listRouter);
memosRouter.use("/register", registerRouter);
memosRouter.use("/delete", deleteRouter);
memosRouter.use("/restore", restoreRouter);
memosRouter.use("/purge", purgeRouter);
memosRouter.use("/update", updateRouter);
memosRouter.use("/layout", layoutRouter);
memosRouter.use("/sort", sortRouter);
