<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useMemoResize } from './memoLayout.ts';

const props = defineProps<{
    memoId: number;
    initialWidth?: number | null;
    initialHeight?: number | null;
}>();

const wrapperRef = ref<HTMLElement | null>(null);
const { saveSize } = useMemoResize(props.memoId);
let resizeObserver: ResizeObserver | null = null;
let isInitialRender = true;

onMounted(() => {
    if (!wrapperRef.value) return;
    
    // 中の textarea を探す
    const textarea = wrapperRef.value.querySelector('textarea');
    if (!textarea) return;

    // 初期サイズをインラインスタイルで復元する
    if (props.initialWidth) {
        textarea.style.width = `${props.initialWidth}px`;
    }
    if (props.initialHeight) {
        textarea.style.height = `${props.initialHeight}px`;
    }

    // サイズ監視開始
    resizeObserver = new ResizeObserver((entries) => {
        if (isInitialRender) {
            isInitialRender = false;
            return; // 初期化時のResizeイベントは無視する
        }
        for (const entry of entries) {
            const target = entry.target as HTMLElement;
            // 要素の実際の幅・高さを送る
            saveSize(target.offsetWidth, target.offsetHeight);
        }
    });

    resizeObserver.observe(textarea);
});

onBeforeUnmount(() => {
    if (resizeObserver) {
        resizeObserver.disconnect();
    }
});
</script>

<template>
    <div class="memo-layout-wrapper" ref="wrapperRef">
        <slot></slot>
    </div>
</template>

<style scoped>
.memo-layout-wrapper {
    width: 100%;
}
</style>