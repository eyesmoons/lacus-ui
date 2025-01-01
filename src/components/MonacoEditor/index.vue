<template>
  <div ref="container" class="monaco-editor-container"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import * as monaco from 'monaco-editor';

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  language: {
    type: String,
    default: 'sql',
  },
  height: {
    type: String,
    default: '300px',
  },
  readonly: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:modelValue', 'change']);

const container = ref(null);
let editor = null;

onMounted(() => {
  editor = monaco.editor.create(container.value, {
    value: props.modelValue,
    language: props.language,
    theme: 'vs',
    automaticLayout: true,
    scrollBeyondLastLine: false,
    minimap: {
      enabled: false,
    },
    readOnly: props.readonly,
  });

  editor.onDidChangeModelContent(() => {
    const value = editor.getValue();
    emit('update:modelValue', value);
    emit('change', value);
  });

  // 设置编辑器容器高度
  container.value.style.height = props.height;
});

onBeforeUnmount(() => {
  if (editor) {
    editor.dispose();
  }
});

watch(
  () => props.modelValue,
  (newValue) => {
    if (editor && newValue !== editor.getValue()) {
      editor.setValue(newValue);
    }
  },
);

watch(
  () => props.readonly,
  (newValue) => {
    if (editor) {
      editor.updateOptions({ readOnly: newValue });
    }
  },
);
</script>

<style scoped>
.monaco-editor-container {
  width: 100%;
  min-height: 100px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}
</style>
