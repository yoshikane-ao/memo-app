import type { RestoreTagInput, TagRepository } from "./tagPorts";

export const createTagUseCases = ({
  tagRepository,
}: {
  tagRepository: TagRepository;
}) => ({
  listTags() {
    return tagRepository.list();
  },

  async linkTagToMemo(memoId: number, tagId: number) {
    await tagRepository.linkToMemo(memoId, tagId);
  },

  async createTag(title: string, memoId?: number) {
    let tag = await tagRepository.findByTitle(title);

    if (!tag) {
      tag = await tagRepository.create(title);
    }

    if (memoId != null) {
      await tagRepository.linkToMemo(memoId, tag.id);
    }

    return tag;
  },

  async unlinkTagFromMemo(memoId: number, tagId: number) {
    await tagRepository.unlinkFromMemo(memoId, tagId);
  },

  deleteSystemTag(tagId: number) {
    return tagRepository.deleteSystem(tagId);
  },

  restoreTag(input: RestoreTagInput) {
    return tagRepository.restore(input);
  },
});

export type TagUseCases = ReturnType<typeof createTagUseCases>;
