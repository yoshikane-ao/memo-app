import { Router } from "express";
import {
  arrayField,
  handleRouteError,
  parseBody,
  positiveIntField,
  stringField,
} from "../../../../../shared/http/requestValidation";
import type { TagUseCases } from "../../../application/tagUseCases";

const parseRestoreTagBody = (value: unknown) =>
  parseBody(value, {
    id: positiveIntField(),
    title: stringField(),
    linkedMemoIds: arrayField(positiveIntField(), {
      optional: true,
      defaultValue: [],
      dedupeBy: (memoId) => memoId,
    }),
  });

export const createTagRestoreRouter = ({ restoreTag }: Pick<TagUseCases, "restoreTag">) => {
  const restoreRouter = Router();

  restoreRouter.post("/", async (req, res) => {
    try {
      const body = parseRestoreTagBody(req.body);
      const restoredTag = await restoreTag({
        id: body.id,
        title: body.title,
        linkedMemoIds: body.linkedMemoIds ?? [],
      });

      res.status(201).json(restoredTag);
    } catch (error) {
      return handleRouteError(res, error, "Failed to restore tag.");
    }
  });

  return restoreRouter;
};
