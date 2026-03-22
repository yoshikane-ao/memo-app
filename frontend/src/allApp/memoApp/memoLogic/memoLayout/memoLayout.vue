<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';

const props = defineProps<{
    memoId: number;
    initialWidth?: number | null;
    initialHeight?: number | null;
}>();

const emit = defineEmits<{
    (e: 'resize', width: number, height: number): void;
}>();

const wrapperRef = ref<HTMLElement | null>(null);
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

    let baseWidth: number | null = null;
    let baseHeight: number | null = null;

    // サイズ監視開始
    resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
            const el = entry.target as HTMLElement;
            
            // 初回レンダリング時のサイズを基準として記録
            if (isInitialRender) {
                baseWidth = el.offsetWidth;
                baseHeight = el.offsetHeight;
                isInitialRender = false;
                return;
            }

            // 基準サイズから変更があった場合のみユーザーリサイズとみなす
            // inline style が設定されていれば明らかにユーザー操作
            const isWidthChanged = Math.abs(el.offsetWidth - (baseWidth || 0)) > 2;
            const isHeightChanged = Math.abs(el.offsetHeight - (baseHeight || 0)) > 2;

            if (isWidthChanged || isHeightChanged || el.style.width || el.style.height) {
                emit('resize', el.offsetWidth, el.offsetHeight);
            }
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