<template>
  <div class="dynamic-form">
    <el-form :model="formData" ref="formRef" label-width="100px" size="small">
      <template v-for="field in formFields" :key="field.name">
        <!-- 文本输入框 -->
        <el-form-item
          v-if="field.type === 'string' || field.type === 'text'"
          :label="field.label"
          :prop="field.name"
          :rules="getFieldRules(field)"
        >
          <el-input
            v-model="formData[field.name]"
            :placeholder="field.placeholder || `请输入${field.label}`"
            :disabled="field.disabled"
            @change="handleFieldChange"
          />
        </el-form-item>

        <!-- 数字输入框 -->
        <el-form-item
          v-else-if="field.type === 'number' || field.type === 'integer'"
          :label="field.label"
          :prop="field.name"
          :rules="getFieldRules(field)"
        >
          <el-input-number
            v-model="formData[field.name]"
            :min="field.min"
            :max="field.max"
            :step="field.step || 1"
            :disabled="field.disabled"
            @change="handleFieldChange"
            style="width: 100%"
          />
        </el-form-item>

        <!-- 布尔值选择 -->
        <el-form-item v-else-if="field.type === 'boolean'" :label="field.label" :prop="field.name">
          <el-switch v-model="formData[field.name]" :disabled="field.disabled" @change="handleFieldChange" />
        </el-form-item>

        <!-- 下拉选择 -->
        <el-form-item
          v-else-if="field.type === 'select' || field.type === 'enum'"
          :label="field.label"
          :prop="field.name"
          :rules="getFieldRules(field)"
        >
          <el-select
            v-model="formData[field.name]"
            :placeholder="field.placeholder || `请选择${field.label}`"
            :disabled="field.disabled"
            :multiple="field.multiple"
            :filterable="field.filterable"
            @change="handleFieldChange"
            style="width: 100%"
          >
            <el-option
              v-for="option in field.options"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>

        <!-- 多行文本 -->
        <el-form-item
          v-else-if="field.type === 'textarea'"
          :label="field.label"
          :prop="field.name"
          :rules="getFieldRules(field)"
        >
          <el-input
            v-model="formData[field.name]"
            type="textarea"
            :rows="field.rows || 3"
            :placeholder="field.placeholder || `请输入${field.label}`"
            :disabled="field.disabled"
            @change="handleFieldChange"
          />
        </el-form-item>

        <!-- JSON 编辑器 -->
        <el-form-item
          v-else-if="field.type === 'json'"
          :label="field.label"
          :prop="field.name"
          :rules="getFieldRules(field)"
        >
          <monaco-editor
            v-model="formData[field.name]"
            language="json"
            :height="field.height || 200"
            @change="handleFieldChange"
          />
        </el-form-item>

        <!-- 密码输入框 -->
        <el-form-item
          v-else-if="field.type === 'password'"
          :label="field.label"
          :prop="field.name"
          :rules="getFieldRules(field)"
        >
          <el-input
            v-model="formData[field.name]"
            type="password"
            :placeholder="field.placeholder || `请输入${field.label}`"
            :disabled="field.disabled"
            show-password
            @change="handleFieldChange"
          />
        </el-form-item>

        <!-- 日期选择器 -->
        <el-form-item
          v-else-if="field.type === 'date' || field.type === 'datetime'"
          :label="field.label"
          :prop="field.name"
          :rules="getFieldRules(field)"
        >
          <el-date-picker
            v-model="formData[field.name]"
            :type="field.type === 'datetime' ? 'datetime' : 'date'"
            :placeholder="field.placeholder || `请选择${field.label}`"
            :disabled="field.disabled"
            @change="handleFieldChange"
            style="width: 100%"
          />
        </el-form-item>

        <!-- 文件上传 -->
        <el-form-item
          v-else-if="field.type === 'file'"
          :label="field.label"
          :prop="field.name"
          :rules="getFieldRules(field)"
        >
          <el-upload
            :action="field.uploadUrl || '/api/upload'"
            :headers="uploadHeaders"
            :accept="field.accept"
            :multiple="field.multiple"
            :disabled="field.disabled"
            @success="handleFileSuccess"
            @error="handleFileError"
          >
            <el-button type="primary" size="small">
              <el-icon><Upload /></el-icon>
              选择文件
            </el-button>
            <template #tip>
              <div class="el-upload__tip" v-if="field.tip">
                {{ field.tip }}
              </div>
            </template>
          </el-upload>
        </el-form-item>

        <!-- 键值对编辑器 -->
        <el-form-item v-else-if="field.type === 'keyvalue'" :label="field.label" :prop="field.name">
          <key-value-editor v-model="formData[field.name]" @change="handleFieldChange" />
        </el-form-item>

        <!-- 数组编辑器 -->
        <el-form-item v-else-if="field.type === 'array'" :label="field.label" :prop="field.name">
          <array-editor v-model="formData[field.name]" :item-type="field.itemType" @change="handleFieldChange" />
        </el-form-item>

        <!-- 分组字段 -->
        <el-form-item v-else-if="field.type === 'group'" :label="field.label">
          <el-card class="group-card" shadow="never">
            <dynamic-form :config="field.fields" v-model="formData[field.name]" @change="handleFieldChange" />
          </el-card>
        </el-form-item>

        <!-- 默认文本输入 -->
        <el-form-item v-else :label="field.label" :prop="field.name" :rules="getFieldRules(field)">
          <el-input
            v-model="formData[field.name]"
            :placeholder="field.placeholder || `请输入${field.label}`"
            :disabled="field.disabled"
            @change="handleFieldChange"
          />
        </el-form-item>
      </template>
    </el-form>
  </div>
</template>

<script setup>
import { ref, reactive, watch, computed } from 'vue';
import { Upload } from '@element-plus/icons-vue';
import { getToken } from '@/utils/token';
import MonacoEditor from '@/components/MonacoEditor/index.vue';
import KeyValueEditor from './KeyValueEditor.vue';
import ArrayEditor from './ArrayEditor.vue';

const props = defineProps({
  config: {
    type: [Array, Object],
    default: () => [],
  },
  modelValue: {
    type: [Object, String],
    default: () => ({}),
  },
});

const emit = defineEmits(['update:modelValue', 'change']);

const formRef = ref(null);
const formData = reactive({});

// 初始化表单数据
const initFormData = () => {
  formFields.value.forEach((field) => {
    if (!(field.name in formData)) {
      formData[field.name] = getDefaultValue(field);
    }
  });
};
// 获取字段默认值
const getDefaultValue = (field) => {
  if (field.defaultValue !== undefined) {
    return field.defaultValue;
  }
  return undefined;
};

// 计算表单字段
const formFields = computed(() => {
  if (Array.isArray(props.config)) {
    return props.config;
  } else if (props.config && props.config.fields) {
    return props.config.fields;
  }
  return [];
});

// 上传请求头
const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${getToken()}`,
}));

// 监听配置变化
watch(
  () => props.config,
  (newConfig) => {
    initFormData();
  },
  { immediate: true, deep: true },
);

// 监听外部数据变化
watch(
  () => props.modelValue,
  (newValue) => {
    if (typeof newValue === 'string') {
      if (newValue.trim() !== '') {
        try {
          const parsed = JSON.parse(newValue);
          Object.assign(formData, parsed);
        } catch (e) {
          console.warn('Invalid JSON string:', newValue);
        }
      }
    } else if (newValue && typeof newValue === 'object') {
      Object.assign(formData, newValue);
    }
  },
  { immediate: true, deep: true },
);

// 获取字段验证规则
const getFieldRules = (field) => {
  const rules = [];

  if (field.required) {
    rules.push({
      required: true,
      message: `${field.label}不能为空`,
      trigger: ['blur', 'change'],
    });
  }

  if (field.pattern) {
    rules.push({
      pattern: new RegExp(field.pattern),
      message: field.patternMessage || `${field.label}格式不正确`,
      trigger: 'blur',
    });
  }

  if (field.min !== undefined) {
    rules.push({
      min: field.min,
      message: `${field.label}长度不能小于${field.min}`,
      trigger: 'blur',
    });
  }

  if (field.max !== undefined) {
    rules.push({
      max: field.max,
      message: `${field.label}长度不能大于${field.max}`,
      trigger: 'blur',
    });
  }

  return rules;
};

// 字段值变化处理
const handleFieldChange = () => {
  const result = { ...formData };
  emit('update:modelValue', result);
  emit('change', result);
};

// 文件上传成功
const handleFileSuccess = (response, file, fileList) => {
  // 处理文件上传成功逻辑
  handleFieldChange();
};

// 文件上传失败
const handleFileError = (error, file, fileList) => {
  console.error('文件上传失败:', error);
};

// 验证表单
const validate = () => {
  return formRef.value?.validate();
};

// 重置表单
const resetFields = () => {
  formRef.value?.resetFields();
};

// 暴露方法
defineExpose({
  validate,
  resetFields,
});
</script>

<style scoped lang="scss">
.dynamic-form {
  .group-card {
    margin-top: 8px;

    :deep(.el-card__body) {
      padding: 16px;
    }
  }

  .el-form-item {
    margin-bottom: 16px;
  }
}
</style>
