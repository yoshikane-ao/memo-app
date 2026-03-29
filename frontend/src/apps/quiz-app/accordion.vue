<template>
    <div>
        <button @click="toggleAccordion()" class="flex items-center space-x-3">
            <slot name="title" />
            <p>d</p>
        </button>
        <div class="transition-all duration-400 overflow-hidden" :class="{
            'max-h-96': isOpen,
            'max-h-0': !isOpen,
        }">
            <slot name="content" />
        </div>
    </div>
</template>

<script>
export default {
    data() {
        return {
            isOpen: false,
        };
    },
    methods: {
        toggleAccordion() {
            this.isOpen = !this.isOpen;
        },
    },
};
</script>