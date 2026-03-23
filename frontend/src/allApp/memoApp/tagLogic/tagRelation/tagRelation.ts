import axios from 'axios';

export function useTagRelation() {
  const linkTagToMemo = async (memoId: number, tagId: number) => {
    try {
      await axios.post('http://localhost:3000/tags/link', { memoId, tagId });
      return true;
    } catch {
      return false;
    }
  };

  const unlinkTagFromMemo = async (memoId: number, tagId: number) => {
    try {
      await axios.delete(`http://localhost:3000/tags/unlink/${memoId}/${tagId}`);
      return true;
    } catch {
      return false;
    }
  };

  return {
    linkTagToMemo,
    unlinkTagFromMemo
  };
}
