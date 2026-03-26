import { Router } from "express";
import { prisma } from "../../db";
import { handleRouteError } from "../../memoApp/shared/requestValidation";

export type User = { id: number; word: string; mean: string; tag: string; createdAt: string };

const registerRouter = Router();

type RegisterBody = {
    word: string;
    mean: string;
    tag: string[];
};


registerRouter.post("/", async (req, res) => {
    try {

        const { word, mean, tag }: RegisterBody = req.body;

        const new_quiz = await prisma.quizs.create({
            data: {
                word,
                mean,
                quizTagsRelations:
                    tag && tag.length > 0
                        ? {
                            create: tag.map((tagName) => ({
                                quizTag: {
                                    connectOrCreate: {
                                        where: { tagName: tagName },
                                        create: { tagName: tagName },
                                    },
                                },
                            })),
                        }
                        : undefined,
            },
            include: {
                quizTagsRelations: {
                    include: { quizTag: true },
                },
            },
        });

        res.status(201).json(new_quiz);

    } catch (error) {
        return handleRouteError(res, error, "Failed to create quiz.");
    }
})

export default registerRouter;