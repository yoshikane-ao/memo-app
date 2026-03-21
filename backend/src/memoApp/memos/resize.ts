import { Router } from "express";
import { PrismaClient } from "../../generated/prisma/client";
import { prisma } from "../../db";

const resizeRouter = Router();

export default resizeRouter;