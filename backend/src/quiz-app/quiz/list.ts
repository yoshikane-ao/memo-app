import { Router } from "express";
import { prisma } from "../../db";

export type lists = { id: number; word: string; mean: string; tag: string; createdAt: string };

const listRouter = Router();

type listBody = {
    word: string;
    mean: string;
};

type tagbody = {
    tagName: string;
}

listRouter.get("/", async (req, res) => {
    try {
        // const list_quiz = await prisma.quizs.findMany();
        // const list_tag = await prisma.quizTag.findMany();
const list_quiz = await prisma.quizs.findMany({
    select: {
    id: true,
    word: true,
    mean: true,
    quizTagsRelations: {
      select: {
        quizTag: {
          select: {
            id: true,
            tagName: true,
          }
        }
      }
    }
  }
});
        res.json(list_quiz);
        
    } catch (error) {
        console.error(error);
        res.status(201).send("listAPI呼び出しエラー");

    }
})




export default listRouter;