<template>
  <div class="dynamic-form">
    <el-form :model="formData" ref="formRef" size="small">
      <!-- 按照 tag 分组显示 -->
      <template v-for="group in fieldGroups" :key="group.tagName">
        <div class="field-group" v-if="group.fields.length > 0">
          <div class="group-title">{{ group.tagName || '其他配置' }}</div>

          <template v-for="field in group.fields" :key="field.enName || field.fieldName || field.field || field.name">
            <!-- 文本输入框 -->
            <el-form-item
              v-if="getFieldType(field) === 'text'"
              :label="field.cnName || field.label"
              :prop="field.enName || field.fieldName || field.field || field.name"
              :rules="getFieldRules(field)"
            >
              <el-input
                v-model="formData[field.enName || field.fieldName || field.field || field.name]"
                :placeholder="field.placeHolder || field.placeholder || `请输入${field.cnName || field.label}`"
                :disabled="field.disabled"
                :clearable="field.clearable !== false"
                @change="handleFieldChange"
                @blur="handleFieldChange"
                @input="handleFieldChange"
              />
            </el-form-item>

            <!-- 密码输入框 -->
            <el-form-item
              v-else-if="getFieldType(field) === 'password'"
              :label="field.cnName || field.label"
              :prop="field.enName || field.fieldName || field.field || field.name"
              :rules="getFieldRules(field)"
            >
              <el-input
                v-model="formData[field.enName || field.fieldName || field.field || field.name]"
                type="password"
                :placeholder="field.placeHolder || field.placeholder || `请输入${field.cnName || field.label}`"
                :disabled="field.disabled"
                :clearable="field.clearable !== false"
                show-password
                @change="handleFieldChange"
                @blur="handleFieldChange"
              />
            </el-form-item>

            <!-- 多行文本输入框 -->
            <el-form-item
              v-else-if="getFieldType(field) === 'text_area'"
              :label="field.cnName || field.label"
              :prop="field.enName || field.fieldName || field.field || field.name"
              :rules="getFieldRules(field)"
            >
              <el-input
                v-model="formData[field.enName || field.fieldName || field.field || field.name]"
                type="textarea"
                :rows="field.rows || 3"
                :placeholder="field.placeHolder || field.placeholder || `请输入${field.cnName || field.label}`"
                :disabled="field.disabled"
                :clearable="field.clearable !== false"
                @change="handleFieldChange"
                @blur="handleFieldChange"
              />
            </el-form-item>

            <!-- 数字输入框 -->
            <el-form-item
              v-else-if="getFieldType(field) === 'positive_number' || getFieldType(field) === 'number'"
              :label="field.cnName || field.label"
              :prop="field.enName || field.fieldName || field.field || field.name"
              :rules="getFieldRules(field)"
            >
              <el-input-number
                v-model="formData[field.enName || field.fieldName || field.field || field.name]"
                :min="field.min || (getFieldType(field) === 'positive_number' ? 0 : undefined)"
                :max="field.max"
                :step="field.step || 1"
                :disabled="field.disabled"
                @change="handleFieldChange"
                style="width: 100%"
              />
            </el-form-item>

            <!-- 单选下拉框 -->
            <el-form-item
              v-else-if="getFieldType(field) === 'single_select' || getFieldType(field) === 'SINGLE_SELECT'"
              :label="field.cnName || field.label"
              :prop="field.enName || field.fieldName || field.field || field.name"
              :rules="getFieldRules(field)"
            >
              <el-select
                v-model="formData[field.enName || field.fieldName || field.field || field.name]"
                :placeholder="field.placeHolder || field.placeholder || `请选择${field.cnName || field.label}`"
                :disabled="field.disabled"
                :filterable="field.filterable !== false"
                :clearable="field.clearable !== false"
                @change="handleFieldChange(field)"
                @focus="handleFieldFocus(field)"
                style="width: 100%"
              >
                <el-option
                  v-for="option in getAllFieldOptions(field)"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>
            </el-form-item>

            <!-- 兼容旧版本的其他字段类型 -->
            <el-form-item
              v-else
              :label="field.cnName || field.label"
              :prop="field.enName || field.fieldName || field.field || field.name"
              :rules="getFieldRules(field)"
            >
              <!-- 默认使用文本输入框 -->
              <el-input
                v-model="formData[field.enName || field.fieldName || field.field || field.name]"
                :placeholder="field.placeHolder || field.placeholder || `请输入${field.cnName || field.label}`"
                :disabled="field.disabled"
                :clearable="field.clearable !== false"
                @change="handleFieldChange"
                @blur="handleFieldChange"
              />
            </el-form-item>
          </template>
        </div>
      </template>
    </el-form>
  </div>
</template>

<script setup>
import { ref, reactive, watch, computed, onMounted, onUnmounted } from 'vue';
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
const initFormData = async () => {
  for (const field of formFields.value) {
    const fieldName = field.enName || field.fieldName || field.field || field.name;
    if (!(fieldName in formData)) {
      // 如果是URL类型的字段，先加载选项
      if (field.dictType === 'url' && field.dictUrl) {
        await loadDynamicOptions(field);
      }
      
      formData[fieldName] = getDefaultValue(field);
    }
  }
};

// 获取字段默认值
const getDefaultValue = (field) => {
  if (field.defaultValue !== undefined) {
    return field.defaultValue;
  }
  return undefined;
};

// 获取字段类型（适配后端 formType 字段）
const getFieldType = (field) => {
  // 优先使用 formType，然后是 type
  return field.formType || field.type || 'text';
};

// 获取字段选项（适配后端 dictEnum 和 dictUrl 字段）
const getFieldOptions = (field) => {
  const fieldName = field.enName || field.fieldName || field.field || field.name;

  // 按规范：当formType为SINGLE_SELECT时处理选项
  if (getFieldType(field) === 'single_select' || getFieldType(field) === 'SINGLE_SELECT') {
    // 按规范：若dictType为ENUM，则从dictEnum获取
    if (field.dictType === 'enum' && field.dictEnum && Array.isArray(field.dictEnum)) {
      return field.dictEnum.map((item) => ({
        label: item,
        value: item,
      }));
    }

    // 按规范：若dictType为URL，则从dictUrl获取
    if (field.dictType === 'url' && field.dictUrl) {
      // 返回动态选项数据
      return dynamicOptions[fieldName] || [];
    }
  }

  // 兼容旧版本的 options
  if (field.options && Array.isArray(field.options)) {
    return field.options;
  }

  return [];
};

// 获取字段的所有选项（静态+动态）
const getAllFieldOptions = (field) => {
  const fieldName = field.enName || field.fieldName || field.field || field.name;

  // 优先返回动态选项
  if (dynamicOptions[fieldName] && dynamicOptions[fieldName].length > 0) {
    // 检查当前字段值是否在动态选项中，如果没有，但当前值是数据源相关的，可以尝试从formData中获取原始数据源信息
    const currentValue = formData[fieldName];
    const hasCurrentValue = dynamicOptions[fieldName].some(option => option.value == currentValue); // 使用宽松比较以处理数字和字符串
    
    // 如果当前值不在选项中，但这是一个数据源相关的字段，我们可以考虑添加一个临时选项
    if (currentValue != null && !hasCurrentValue) {
      // 检查是否是数据源ID字段
      if ((fieldName === 'datasourceId' || fieldName === 'datasource_id') && currentValue) {
        // 尝试查找对应的名称（仅在当前数据源列表中查找）
        const savedValue = currentValue;
        
        // 如果有动态加载的数据源列表，尝试从中查找
        const matchedOption = dynamicOptions[fieldName].find(option => option.value == savedValue);
        if (!matchedOption) {
          // 如果当前值不在动态选项中，但它是数据源ID，我们可以保留原选项数组
          // 但确保el-select能正确显示
          return [...dynamicOptions[fieldName]];
        }
      }
    }
    
    return dynamicOptions[fieldName];
  }

  // 返回静态选项
  return getFieldOptions(field);
};

// 动态选项存储
const dynamicOptions = reactive({});





// 加载动态选项（从URL获取）
const loadDynamicOptions = async (field) => {
  const fieldName = field.enName || field.fieldName || field.field || field.name;

  if (field.dictType === 'url' && field.dictUrl) {
    try {


      // 处理URL中的参数替换
      let url = field.dictUrl;

      // 替换URL中的{datasourceId}参数
      if (url.includes('{datasourceId}')) {
        const datasourceId = formData.datasourceId || formData.datasource_id;
        if (datasourceId) {
          url = url.replace('{datasourceId}', datasourceId);
        } else {
          console.warn(`字段 ${fieldName} 需要 datasourceId 参数，但未找到`);
          dynamicOptions[fieldName] = [];
          return [];
        }
      }

      // 这里需要导入相应的API来获取数据
      // 根据URL的路径调用不同的API
      let options = [];

      if (url.includes('/metadata/datasource/list')) {
        // 获取数据源列表
        const { getDatasourceList } = await import('@/api/metadata/datasourceApi');
        const response = await getDatasourceList('', '');
        const data = response?.data || response || [];
        options = data.map((item) => ({
          label: item.datasourceName || item.name,
          value: item.datasourceId || item.id,
        }));
      } else if (url.includes('/metadata/db/list')) {
        // 获取数据库列表
        const datasourceId = formData.datasourceId || formData.datasource_id;
        if (datasourceId) {
          const { getDatasourceList: getDbList } = await import('@/api/metadata/dbApi');
          const response = await getDbList(datasourceId);
          const data = response?.data || response || [];
          options = data.map((item) => ({
            label: item.dbName || item.name,
            value: item.dbName || item.name,
          }));
        }
      } else if (url.includes('/metadata/table/listTable')) {
        // 获取表列表
        const datasourceId = formData.datasourceId || formData.datasource_id;
        const database = formData.database || formData.dbName;
        if (datasourceId && database) {
          const { listTable } = await import('@/api/metadata/tableApi');
          const response = await listTable({ datasourceId, dbName: database });
          const data = response?.data || response || [];
          options = data.map((item) => ({
            label: item.tableName || item.name,
            value: item.tableName || item.name,
          }));
        }
      }

      dynamicOptions[fieldName] = options;

      return options;
    } catch (error) {
      console.error(`加载 ${fieldName} 动态选项失败:`, error);
      dynamicOptions[fieldName] = [];
      return [];
    }
  }

  return [];
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

// 按照 tag 分组字段
const fieldGroups = computed(() => {
  const fields = formFields.value;
  const groups = new Map();

  // 收集所有标签及其order信息
  const tagOrderMap = new Map();

  // 将字段分配到对应的组，并收集标签order信息
  fields.forEach((field) => {
    const tagName = field.tag || '其他配置';
    const tagOrder =
      field.tagOrder !== undefined
        ? field.tagOrder
        : field.tag_order !== undefined
        ? field.tag_order
        : field.tagOrderValue !== undefined
        ? field.tagOrderValue
        : 999; // 支持多种可能的字段名

    // 记录每个标签的order（如果有多个字段属于同一标签，使用最小的order值）
    if (!tagOrderMap.has(tagName) || tagOrder < tagOrderMap.get(tagName)) {
      tagOrderMap.set(tagName, tagOrder);
    }

    if (!groups.has(tagName)) {
      groups.set(tagName, {
        tagName: tagName,
        fields: [],
        order: tagOrder,
      });
    }

    groups.get(tagName).fields.push(field);
  });

  // 更新每个组的order为对应标签的order
  groups.forEach((group, tagName) => {
    group.order = tagOrderMap.get(tagName) || 999;
  });

  // 对每个组内的字段按照字段的order属性进行排序
  groups.forEach((group) => {
    group.fields.sort((a, b) => {
      const aOrder =
        a.order !== undefined
          ? a.order
          : a.fieldOrder !== undefined
          ? a.fieldOrder
          : a.sort !== undefined
          ? a.sort
          : 999;
      const bOrder =
        b.order !== undefined
          ? b.order
          : b.fieldOrder !== undefined
          ? b.fieldOrder
          : b.sort !== undefined
          ? b.sort
          : 999;

      // 如果order相同，按照字段名排序保证稳定性
      if (aOrder === bOrder) {
        const aName = a.enName || a.fieldName || a.field || a.name || '';
        const bName = b.enName || b.fieldName || b.field || b.name || '';
        return aName.localeCompare(bName);
      }

      return aOrder - bOrder;
    });
  });

  // 转换为数组并按标签order排列，过滤空组
  const result = Array.from(groups.values())
    .filter((group) => group.fields.length > 0)
    .sort((a, b) => {
      // 如果order相同，按照标签名排序保证稳定性
      if (a.order === b.order) {
        return a.tagName.localeCompare(b.tagName);
      }
      return a.order - b.order;
    });

  return result;
});

// 上传请求头
const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${getToken()}`,
}));

// 监听配置变化
watch(
  () => props.config,
  async (newConfig) => {
    await initFormData();
  },
  { immediate: true, deep: true },
);

// 监听外部数据变化
watch(
  () => props.modelValue,
  async (newValue) => {
    try {
      let newFormData = {};
      
      if (typeof newValue === 'string') {
        if (newValue.trim() !== '') {
          try {
            newFormData = JSON.parse(newValue);
          } catch (e) {
            console.warn('Invalid JSON string:', newValue);
          }
        }
      } else if (newValue && typeof newValue === 'object') {
        newFormData = { ...newValue };
      }
      
      // 在设置表单数据之前，先加载相关的动态选项
      // 特别是当存在数据源ID等需要动态加载的字段时
      for (const field of formFields.value) {
        const fieldName = field.enName || field.fieldName || field.field || field.name;
        const fieldValue = newFormData[fieldName];
        
        // 如果是URL类型的字段且有初始值，先加载选项
        if (field.dictType === 'url' && field.dictUrl && fieldValue != null) {
          await loadDynamicOptions(field);
        }
      }
      
      // 设置表单数据
      Object.assign(formData, newFormData);
    } catch (error) {
      console.error('处理外部数据变化时发生错误:', error);
    }
  },
  { immediate: true, deep: true },
);

// 获取字段验证规则
const getFieldRules = (field) => {
  const rules = [];

  // 支持后端返回的 required 字段
  if (field.required === true || field.required === 'true') {
    rules.push({
      required: true,
      message: `${field.cnName || field.label}不能为空`,
      trigger: ['blur', 'change'],
    });
  }

  // 支持新的验证结构（适配后端接口）
  if (field.validate) {
    const validate = field.validate;

    // 必填验证
    if (validate.required) {
      rules.push({
        required: true,
        message: validate.message || `${field.cnName || field.label}不能为空`,
        trigger: validate.trigger || ['blur', 'change'],
      });
    }

    // 非空验证
    if (validate.type === 'non-empty') {
      rules.push({
        required: true,
        message: validate.message || `${field.cnName || field.label}不能为空`,
        trigger: validate.trigger || ['blur', 'change'],
      });
    }

    // 自定义验证器
    if (validate.validator) {
      rules.push({
        validator: validate.validator,
        trigger: validate.trigger || ['blur', 'change'],
      });
    }
  }

  // 正则表达式验证
  if (field.pattern) {
    rules.push({
      pattern: new RegExp(field.pattern),
      message: field.patternMessage || `${field.cnName || field.label}格式不正确`,
      trigger: 'blur',
    });
  }

  // 长度验证
  if (field.min !== undefined) {
    rules.push({
      min: field.min,
      message: `${field.cnName || field.label}长度不能小于${field.min}`,
      trigger: 'blur',
    });
  }

  if (field.max !== undefined) {
    rules.push({
      max: field.max,
      message: `${field.cnName || field.label}长度不能大于${field.max}`,
      trigger: 'blur',
    });
  }

  return rules;
};

// 字段获得焦点处理（用于动态加载选项）
const handleFieldFocus = async (field) => {
  const fieldName = field.enName || field.fieldName || field.field || field.name;

  // 如果是URL类型的字段，动态加载选项
  if (field.dictType === 'url' && field.dictUrl) {
    await loadDynamicOptions(field);
  }
};

// 在组件挂载后立即尝试加载所有URL类型的字段选项
onMounted(async () => {
  isComponentActive = true;
  
  // 尝试加载所有URL类型的字段选项，以确保初始数据显示正确
  for (const field of formFields.value) {
    if (field.dictType === 'url' && field.dictUrl) {
      await loadDynamicOptions(field);
    }
  }
});

// 字段值变化处理
const handleFieldChange = async (field = null) => {
  // 处理数据源联动逻辑
  if (field && field.enName) {
    const fieldName = field.enName;

    // 数据源变化时，清空数据库和表的选择，并加载数据库列表
    if (fieldName === 'datasourceId' || fieldName === 'datasource_id') {
      formData.database = undefined;
      formData.tableName = undefined;
      formData.table = undefined;

      // 查找数据库字段并加载选项
      const dbField = formFields.value.find(
        (f) => (f.enName === 'database' || f.enName === 'dbName') && f.dictType === 'url',
      );
      if (dbField) {
        await loadDynamicOptions(dbField);
      }
    }

    // 数据库变化时，清空表的选择，并加载表列表
    else if (fieldName === 'database' || fieldName === 'dbName') {
      formData.tableName = undefined;
      formData.table = undefined;

      // 查找表字段并加载选项
      const tableField = formFields.value.find(
        (f) => (f.enName === 'tableName' || f.enName === 'table') && f.dictType === 'url',
      );
      if (tableField) {
        await loadDynamicOptions(tableField);
      }
    }
  }

  // 获取所有字段的最新值
  const result = { ...formData };


  // 在发出事件前确保组件仍然活跃
  if (isComponentActive) {
    try {
      emit('update:modelValue', result);
      emit('change', result);
    } catch (error) {
      console.error('发送表单变化事件失败:', error);
    }
  }
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

let isComponentActive = false;



// 在组件卸载时标记为非活跃状态
onUnmounted(() => {
  isComponentActive = false;
});
</script>

<style scoped lang="scss">
.dynamic-form {
  .field-group {
    margin-bottom: 20px;

    &:last-child {
      margin-bottom: 0;
    }

    .group-title {
      font-size: 13px;
      font-weight: 600;
      color: #3a71a8;
      margin-bottom: 12px;
      padding-bottom: 6px;
      border-bottom: 1px solid var(--el-border-color-lighter);
      position: relative;

      &::before {
        content: '';
        position: absolute;
        left: 0;
        bottom: -1px;
        width: 30px;
        height: 2px;
        background: linear-gradient(90deg, #409eff, #67c23a);
        border-radius: 1px;
      }
    }
  }

  .el-form-item {
    margin-bottom: 16px;

    :deep(.el-form-item__label) {
      font-weight: 500;
      color: #606266;
    }
  }

  // 美化输入框样式
  :deep(.el-input) {
    .el-input__wrapper {
      border-radius: 6px;
      transition: all 0.2s ease;

      &:hover {
        box-shadow: 0 0 0 1px var(--el-color-primary) inset;
      }
    }
  }

  :deep(.el-select) {
    .el-select__wrapper {
      border-radius: 6px;
      transition: all 0.2s ease;

      &:hover {
        box-shadow: 0 0 0 1px var(--el-color-primary) inset;
      }
    }
  }

  :deep(.el-input-number) {
    .el-input__wrapper {
      border-radius: 6px;
    }
  }

  :deep(.el-textarea) {
    .el-textarea__inner {
      border-radius: 6px;
      transition: all 0.2s ease;

      &:hover {
        border-color: var(--el-color-primary);
      }
    }
  }
}
</style>
