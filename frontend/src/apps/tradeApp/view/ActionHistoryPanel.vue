<script setup lang="ts">
defineProps<{
    entries?: unknown[]
}>()

const metrics = [
    { label: 'P1株', value: '118' },
    { label: 'P2株', value: '96' },
    { label: '市場株', value: '106' },
    { label: '市場参加CPU', value: '63人' },
    { label: 'CPU投資総額', value: '114,723円' },
]
</script>

<template>
    <aside class="history-panel">
        <div class="panel-head">
            <div class="panel-title">指標</div>
        </div>

        <div class="metrics-card">
            <div v-for="metric in metrics" :key="metric.label" class="metric-row">
                <div class="metric-label">{{ metric.label }}</div>
                <div class="metric-value">{{ metric.value }}</div>
            </div>
        </div>
    </aside>
</template>

<style scoped>
.history-panel {
    height: 100%;
    min-height: 0;
    min-width: 0;
    border-radius: 16px;
    border: 1px solid rgba(120, 156, 228, 0.16);
    background:
        linear-gradient(180deg, rgba(2, 10, 28, 0.98) 0%, rgba(2, 8, 22, 0.95) 100%),
        radial-gradient(circle at top, rgba(78, 131, 255, 0.05), transparent 48%);
    padding: 8px;
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    gap: 8px;
    overflow: hidden;
}

.panel-title {
    color: #f4f8ff;
    font-size: 11px;
    font-weight: 800;
}

.metrics-card {
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.03);
    padding: 8px;
    display: grid;
    align-content: start;
    gap: 6px;
}

.metric-row {
    border-radius: 10px;
    padding: 7px 8px;
    border: 1px solid rgba(255, 255, 255, 0.05);
    background: rgba(255, 255, 255, 0.025);
    display: grid;
    gap: 2px;
}

.metric-label {
    color: rgba(193, 214, 255, 0.74);
    font-size: 9px;
    font-weight: 700;
}

.metric-value {
    color: #eef5ff;
    font-size: 15px;
    font-weight: 800;
    line-height: 1.1;
}
</style>
