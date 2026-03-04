<template>
    <div class="output-model-section">
        <div class="copy-transform-header">
            <div class="table-select-panel">
                <div class="section-title">输入表名</div>
                <div class="table-options">
                    <ul class="table-list" style="margin-top: 5px; margin-left: 0">
                        <li
                            v-for="t in availableInputTables"
                            :key="t"
                            :class="{ active: isSelectedInputTable(t) }"
                            @click="$emit('input-table-change', t)"
                        >
                            {{ t }}
                        </li>
                    </ul>
                </div>
            </div>
        </div>
        <CopyTransformFieldMap :input-field-list="inputFieldList" :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" />
    </div>
</template>

<script setup>
import CopyTransformFieldMap from './CopyTransformFieldMap.vue';

defineProps({
    availableInputTables: {
        type: Array,
        default: () => [],
    },
    isSelectedInputTable: {
        type: Function,
        required: true,
    },
    inputFieldList: {
        type: Array,
        default: () => [],
    },
    modelValue: {
        type: Array,
        default: () => [],
    },
});

defineEmits(['input-table-change', 'update:modelValue']);
</script>
