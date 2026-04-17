import { Router } from "express";
import type { MemoUseCases } from "../../application/memoUseCases";
import { createDeleteRouter } from "./memos/delete";
import { createLayoutRouter } from "./memos/layout";
import { createListRouter } from "./memos/list";
import { createPurgeRouter } from "./memos/purge";
import { createRegisterRouter } from "./memos/register";
import { createRestoreRouter } from "./memos/restore";
import { createSearchRouter } from "./memos/search";
import { createSortRouter } from "./memos/sort";
import { createUpdateRouter } from "./memos/update";

export const createMemosRouter = (memoUseCases: MemoUseCases) => {
  const memosRouter = Router();

  memosRouter.use("/search", createSearchRouter(memoUseCases));
  memosRouter.use("/list", createListRouter(memoUseCases));
  memosRouter.use("/register", createRegisterRouter(memoUseCases));
  memosRouter.use("/delete", createDeleteRouter(memoUseCases));
  memosRouter.use("/restore", createRestoreRouter(memoUseCases));
  memosRouter.use("/purge", createPurgeRouter(memoUseCases));
  memosRouter.use("/update", createUpdateRouter(memoUseCases));
  memosRouter.use("/layout", createLayoutRouter(memoUseCases));
  memosRouter.use("/sort", createSortRouter(memoUseCases));

  return memosRouter;
};
