<template>
    <!-- 动态表单配置（SOURCE类型）：不含输出模型字段，输出模型在右侧 Tab 配置 -->
    <div class="config-section">
        <dynamic-form :config="config" :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)" @change="emit('change', $event)" />
    </div>
</template>

<script setup>
import DynamicForm from './DynamicForm.vue';

defineProps({
    config: {
        type: Array,
        default: () => [],
    },
    modelValue: {
        type: Object,
        default: () => ({}),
    },
});

const emit = defineEmits(['update:modelValue', 'change']);
</script>
