import { Router } from "express";
import {
  handleRouteError,
  optionalStringArrayField,
  parseBody,
  stringField,
} from "../../../../../shared/http/requestValidation";
import type { MemoUseCases } from "../../../application/memoUseCases";

const parseRegisterBody = (value: unknown) =>
  parseBody(value, {
    title: stringField(),
    content: stringField({ trim: false }),
    tags: optionalStringArrayField(),
  });

export const createRegisterRouter = ({ createMemo }: MemoUseCases) => {
  const registerRouter = Router();

  registerRouter.post("/", async (req, res) => {
    try {
      const { title, content, tags } = parseRegisterBody(req.body);
      const newMemo = await createMemo({ title, content, tags });

      res.status(201).json(newMemo);
    } catch (error) {
      return handleRouteError(res, error, "Failed to create memo.");
    }
  });

  return registerRouter;
};
