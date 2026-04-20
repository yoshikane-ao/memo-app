import type { RestoreTagInput, TagRepository } from './tagPorts';

export const createTagUseCases = ({ tagRepository }: { tagRepository: TagRepository }) => ({
  listTags(userId: number) {
    return tagRepository.list(userId);
  },

  async linkTagToMemo(userId: number, memoId: number, tagId: number) {
    await tagRepository.linkToMemo(userId, memoId, tagId);
  },

  async createTag(userId: number, title: string, memoId?: number) {
    let tag = await tagRepository.findByTitle(userId, title);

    if (!tag) {
      tag = await tagRepository.create(userId, title);
    }

    if (memoId != null) {
      await tagRepository.linkToMemo(userId, memoId, tag.id);
    }

    return tag;
  },

  async unlinkTagFromMemo(userId: number, memoId: number, tagId: number) {
    await tagRepository.unlinkFromMemo(userId, memoId, tagId);
  },

  deleteSystemTag(userId: number, tagId: number) {
    return tagRepository.deleteSystem(userId, tagId);
  },

  restoreTag(input: RestoreTagInput) {
    return tagRepository.restore(input);
  },
});

export type TagUseCases = ReturnType<typeof createTagUseCases>;
