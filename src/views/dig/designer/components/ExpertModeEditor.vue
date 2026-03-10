<template>
  <div class="expert-mode-container">
    <div class="editor-header">
      <h3>专家模式 - JSON 配置编辑器</h3>
      <div class="header-actions">
        <el-button size="small" icon="DocumentCopy" @click="formatJson">格式化</el-button>
        <el-button size="small" icon="Check" @click="validateJson">验证</el-button>
      </div>
    </div>
    <div class="editor-wrapper">
      <div ref="editorContainer" class="json-editor"></div>
    </div>
    <div class="editor-footer">
      <el-alert
        v-if="validationError"
        :title="validationError"
        type="error"
        :closable="false"
        show-icon
      />
      <el-alert
        v-else-if="validationSuccess"
        title="JSON 格式正确"
        type="success"
        :closable="false"
        show-icon
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import * as monaco from 'monaco-editor';

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['update:modelValue']);

const editorContainer = ref(null);
const validationError = ref('');
const validationSuccess = ref(false);
let editor = null;

// 初始化编辑器
onMounted(() => {
  nextTick(() => {
    if (editorContainer.value) {
      editor = monaco.editor.create(editorContainer.value, {
        value: props.modelValue || getDefaultTemplate(),
        language: 'json',
        theme: 'vs-dark',
        automaticLayout: true,
        fontSize: 14,
        minimap: { enabled: true },
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        formatOnPaste: true,
        formatOnType: true,
      });

      // 监听内容变化
      editor.onDidChangeModelContent(() => {
        const value = editor.getValue();
        emit('update:modelValue', value);
        validationError.value = '';
        validationSuccess.value = false;
      });
    }
  });
});

// 监听外部值变化
watch(
  () => props.modelValue,
  (newValue) => {
    if (editor && newValue !== editor.getValue()) {
      editor.setValue(newValue || getDefaultTemplate());
    }
  }
);

// 获取默认模板
const getDefaultTemplate = () => {
  return JSON.stringify(
    {
      env: {
        'job.mode': 'BATCH',
      },
      source: [
        {
          plugin_name: 'MySQL-CDC',
          plugin_output: 'mysql_source',
          server_id: 5652,
          username: 'root',
          password: 'password',
          table_names: ['database.table'],
          base_url: 'jdbc:mysql://localhost:3306/database',
        },
      ],
      transform: [],
      sink: [
        {
          plugin_name: 'Doris',
          plugin_input: ['mysql_source'],
          fenodes: 'localhost:8030',
          username: 'root',
          password: '',
          database: 'test',
          table: 'table',
          sink_label: 'label',
          'sink.enable-2pc': true,
          'sink.enable-delete': true,
        },
      ],
    },
    null,
    2
  );
};

// 格式化 JSON
const formatJson = () => {
  if (editor) {
    try {
      const value = editor.getValue();
      const parsed = JSON.parse(value);
      const formatted = JSON.stringify(parsed, null, 2);
      editor.setValue(formatted);
      ElMessage.success('格式化成功');
    } catch (error) {
      ElMessage.error('JSON 格式错误，无法格式化');
    }
  }
};

// 验证 JSON
const validateJson = () => {
  if (editor) {
    try {
      const value = editor.getValue();
      JSON.parse(value);
      validationError.value = '';
      validationSuccess.value = true;
      ElMessage.success('JSON 格式正确');
    } catch (error) {
      validationError.value = `JSON 格式错误: ${error.message}`;
      validationSuccess.value = false;
      ElMessage.error('JSON 格式错误');
    }
  }
};

// 获取编辑器内容
const getValue = () => {
  return editor ? editor.getValue() : '';
};

// 设置编辑器内容
const setValue = (value) => {
  if (editor) {
    editor.setValue(value || getDefaultTemplate());
  }
};

// 暴露方法给父组件
defineExpose({
  getValue,
  setValue,
  validateJson,
});
</script>

<style scoped lang="scss">
.expert-mode-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #1e1e1e;

  .editor-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    background: #252526;
    border-bottom: 1px solid #3e3e42;

    h3 {
      margin: 0;
      color: #cccccc;
      font-size: 16px;
      font-weight: 500;
    }

    .header-actions {
      display: flex;
      gap: 8px;
    }
  }

  .editor-wrapper {
    flex: 1;
    overflow: hidden;

    .json-editor {
      width: 100%;
      height: 100%;
    }
  }

  .editor-footer {
    padding: 12px 20px;
    background: #252526;
    border-top: 1px solid #3e3e42;
    min-height: 60px;
  }
}
</style>
