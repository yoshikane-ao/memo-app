import { Router } from "express";
import { PrismaClient } from "../../generated/prisma/client";
import { prisma } from "../../db";
import registerRouter from "./register";
import deleteRouter from "./delete";

const tagsRouter = Router();

tagsRouter.use("/register", registerRouter);// タグ登録API
tagsRouter.use("/delete", deleteRouter); // タグ削除API


export { tagsRouter };