import { onMounted, ref, watch } from 'vue';
import { applyAutoContentHeight, applyAutoTitleWidth } from '../memoLayout/memoLayout';

export function useMemoRegisterLayout(title: () => string, content: () => string) {
  const titleTextareaRef = ref<HTMLTextAreaElement | null>(null);
  const contentTextareaRef = ref<HTMLTextAreaElement | null>(null);

  const syncTitleLayout = () => {
    if (!titleTextareaRef.value) {
      return;
    }

    applyAutoTitleWidth(titleTextareaRef.value);
  };

  const syncContentLayout = () => {
    if (!contentTextareaRef.value) {
      return;
    }

    applyAutoContentHeight(contentTextareaRef.value);
  };

  const handleTitleInputLayout = (textarea: HTMLTextAreaElement) => {
    applyAutoTitleWidth(textarea);
  };

  const handleContentInputLayout = (textarea: HTMLTextAreaElement) => {
    applyAutoContentHeight(textarea);
  };

  onMounted(() => {
    syncTitleLayout();
    syncContentLayout();
  });

  watch(title, syncTitleLayout);
  watch(content, syncContentLayout);

  return {
    titleTextareaRef,
    contentTextareaRef,
    handleTitleInputLayout,
    handleContentInputLayout
  };
}
