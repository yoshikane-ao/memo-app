import { Router } from "express";
import registerRouter from "./register"

export const quizRouter = Router();

quizRouter.use("/register", registerRouter)

