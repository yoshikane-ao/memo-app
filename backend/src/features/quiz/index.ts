import { createQuizUseCases } from "./application/quizUseCases";
import { createQuizRepository } from "./infrastructure/quizRepository";
import { createQuizRouter } from "./presentation/http/quizRouter";

const quizUseCases = createQuizUseCases({
  quizRepository: createQuizRepository(),
});

export const quizRouter = createQuizRouter(quizUseCases);
