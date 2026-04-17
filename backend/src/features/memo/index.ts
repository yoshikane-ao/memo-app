import { createMemoUseCases } from "./application/memoUseCases";
import { createTagUseCases } from "./application/tagUseCases";
import { createMemoRepository } from "./infrastructure/memoRepository";
import { createTagRepository } from "./infrastructure/tagRepository";
import { createMemosRouter } from "./presentation/http/memosRouter";
import { createTagsRouter } from "./presentation/http/tagsRouter";

const memoUseCases = createMemoUseCases({
  memoRepository: createMemoRepository(),
});

const tagUseCases = createTagUseCases({
  tagRepository: createTagRepository(),
});

export const memosRouter = createMemosRouter(memoUseCases);
export const tagsRouter = createTagsRouter(tagUseCases);
