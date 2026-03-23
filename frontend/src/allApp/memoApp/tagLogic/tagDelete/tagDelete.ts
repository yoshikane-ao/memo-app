import axios from 'axios';

export function useTagDelete() {
  const executeDelete = async (tagId: number) => {
    try {
      await axios.delete(`http://localhost:3000/tags/system-delete/${tagId}`);
      return true;
    } catch {
      return false;
    }
  };

  return {
    executeDelete
  };
}
