<template>
  <div class="task-config-form">
    <el-tabs v-model="activeTab">
      <el-tab-pane label="属性配置" name="props">
        <el-form :model="formData" :rules="rules" ref="formRef" label-width="80px" size="small">
          <!-- 基本信息 -->
          <div class="config-section">
            <div class="section-title">基本信息</div>
            <el-form-item label="任务名称" prop="taskName">
              <el-input v-model="formData.taskName" placeholder="请输入任务名称" />
            </el-form-item>
            <el-form-item label="连接器" prop="connectorName">
              <el-input v-model="formData.connectorName" disabled />
            </el-form-item>
          </div>
          <!-- 动态表单配置（SOURCE类型）：不含输出模型字段，输出模型在右侧 Tab 配置 -->
          <div
            class="config-section"
            v-if="
              formData.connectorType === 'SOURCE' && dynamicFormConfigFiltered && dynamicFormConfigFiltered.length > 0
            "
          >
            <dynamic-form :config="dynamicFormConfigFiltered" v-model="formData.taskConfig" @change="onConfigChange" />
          </div>
          <!-- 动态表单配置（TRANSFORM类型） -->
          <div
            class="config-section"
            v-if="
              formData.connectorType === 'TRANSFORM' &&
              dynamicFormConfigFiltered &&
              dynamicFormConfigFiltered.length > 0
            "
          >
            <div class="section-title">转换配置</div>
            <dynamic-form :config="dynamicFormConfigFiltered" v-model="formData.taskConfig" @change="onConfigChange" />
          </div>
          <!-- 动态表单配置（SINK类型）：不含输出模型字段 -->
          <div
            class="config-section"
            v-if="
              formData.connectorType === 'SINK' && dynamicFormConfigFiltered && dynamicFormConfigFiltered.length > 0
            "
          >
            <div class="section-title">输出配置</div>
            <dynamic-form :config="dynamicFormConfigFiltered" v-model="formData.taskConfig" @change="onConfigChange" />
          </div>
          <!-- 操作按钮 -->
          <div class="form-actions">
            <el-button size="medium" type="primary" @click="saveConfig" :loading="saving">保存配置</el-button>
          </div>
        </el-form>
      </el-tab-pane>
      <!-- Transform 非 copy：输入模型 Tab -->
      <el-tab-pane v-if="formData.connectorType === 'TRANSFORM' && !isCopyTransform" label="输入模型" name="input">
        <div class="output-model-section">
          <div class="output-model-container">
            <div class="table-select-panel">
              <div class="section-title">输入表名</div>
              <div class="table-options">
                <ul class="table-list">
                  <li
                    v-for="t in availableInputTables"
                    :key="t"
                    :class="{ active: selectedInputTable === t }"
                    @click="onInputTableChange(t)"
                  >
                    {{ t }}
                  </li>
                </ul>
              </div>
            </div>
            <div class="field-table-panel">
              <div class="section-title">输入表结构</div>
              <div v-if="!selectedInputTable" class="no-table-selected">请先在属性配置中选择输入表</div>
              <div v-else-if="inputFieldList.length === 0" class="loading-fields">正在加载字段...</div>
              <div v-else>
                <el-table
                  ref="inputTableRef"
                  :data="inputFieldList"
                  :row-key="(row, index) => getRowColumnName(row) || String(index)"
                  size="small"
                  max-height="100%"
                  style="width: 100%"
                >
                  <el-table-column width="40" align="center">
                    <template #header>
                      <el-checkbox
                        :model-value="isAllInputFieldsSelected"
                        :indeterminate="isSomeInputFieldsSelected"
                        @update:model-value="toggleAllInputFields"
                        @click.stop
                      />
                    </template>
                    <template #default="scope">
                      <el-checkbox
                        :model-value="isInputFieldSelected(scope.row)"
                        @update:model-value="(v) => setInputFieldSelected(scope.row, v)"
                        @click.stop
                      />
                    </template>
                  </el-table-column>
                  <el-table-column type="index" label="#" width="50" align="center" />
                  <el-table-column prop="columnName" label="字段名称" min-width="100" show-overflow-tooltip />
                  <el-table-column prop="columnType" label="字段类型" min-width="100" show-overflow-tooltip />
                  <el-table-column prop="isNullable" label="非空" width="60" align="center" />
                  <el-table-column prop="comment" label="注释" min-width="120" show-overflow-tooltip>
                    <template #default="scope">
                      <span v-if="scope.row.comment">{{ scope.row.comment }}</span>
                      <span v-else style="color: #c0c4cc">-</span>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>
      <!-- Copy 类 Transform：输入/输出合并为字段映射（左表 + 复制 → 右表） -->
      <el-tab-pane v-if="isCopyTransform" label="模型配置" name="copyMap">
        <div class="output-model-section">
          <div class="copy-transform-header">
            <div class="table-select-panel">
              <div class="section-title">输入表名</div>
              <div class="table-options">
                <ul class="table-list" style="margin-top: 5px;margin-left: 0">
                  <li
                    v-for="t in availableInputTables"
                    :key="t"
                    :class="{ active: selectedInputTable === t }">
                    {{ t }}
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <CopyTransformFieldMap :input-field-list="inputFieldList" v-model="copyOutputFields" />
        </div>
      </el-tab-pane>
      <el-tab-pane v-if="!isCopyTransform && formData.connectorType !== 'SINK'" label="模型配置" name="output">
        <div class="output-model-section">
          <div class="output-model-container">
            <div class="table-select-panel">
              <div class="section-title">表名</div>
              <el-input
                v-model="selectedTable"
                placeholder="当前选中的表"
                readonly
                size="small"
                style="margin-bottom: 16px"
                hidden
              />
              <div class="table-options">
                <ul class="table-list">
                  <li
                    v-for="tableName in availableTables"
                    :key="tableName"
                    :class="{ active: selectedTable === tableName }"
                    @click="onOutputTableChange(tableName)"
                  >
                    {{ tableName }}
                  </li>
                </ul>
              </div>
            </div>
            <div class="field-table-panel">
              <div class="section-title">输出模型</div>
              <div v-if="!selectedTable" class="no-table-selected">请先选择左侧的表</div>
              <div v-else-if="fieldList.length === 0" class="loading-fields">正在加载字段...</div>
              <div v-else>
                <el-table
                  ref="outputTableRef"
                  :data="fieldList"
                  :row-key="(row, index) => getRowColumnName(row) || String(index)"
                  size="small"
                  max-height="100%"
                  style="width: 100%"
                >
                  <el-table-column width="40" align="center">
                    <template #header>
                      <el-checkbox
                        :model-value="isAllOutputFieldsSelected"
                        :indeterminate="isSomeOutputFieldsSelected"
                        @update:model-value="toggleAllOutputFields"
                        @click.stop
                      />
                    </template>
                    <template #default="scope">
                      <el-checkbox
                        :model-value="isOutputFieldSelected(scope.row)"
                        @update:model-value="(v) => setOutputFieldSelected(scope.row, v)"
                        @click.stop
                      />
                    </template>
                  </el-table-column>
                  <el-table-column type="index" label="#" width="50" align="center" />
                  <el-table-column prop="columnName" label="字段名称" min-width="100" show-overflow-tooltip />
                  <el-table-column prop="columnType" label="字段类型" min-width="100" show-overflow-tooltip />
                  <el-table-column prop="isNullable" label="非空" width="60" align="center" />
                  <el-table-column prop="comment" label="注释" min-width="120" show-overflow-tooltip>
                    <template #default="scope">
                      <span v-if="scope.row.comment">{{ scope.row.comment }}</span>
                      <span v-else style="color: #c0c4cc">-</span>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>
      <!-- SINK 组件：字段映射（左表+映射→右表） -->
      <el-tab-pane v-if="formData.connectorType === 'SINK'" label="模型配置" name="sinkMap">
        <div class="output-model-section">
          <div class="copy-transform-header">
            <div class="table-select-panel">
              <div class="section-title">目标表名</div>
              <div class="table-options">
                <ul class="table-list">
                  <li
                    v-for="tableName in availableTables"
                    :key="tableName"
                    :class="{ active: selectedTable === tableName }"
                    @click="onOutputTableChange(tableName)"
                  >
                    {{ tableName }}
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div class="field-mapping-container">
            <div class="mapping-header">
<!--              <div class="panel-label">输入模型</div>-->
<!--              <div class="panel-label">输出模型</div>-->
            </div>
            <div class="mapping-body">
              <!-- 左侧面板：上游输出字段列表 -->
              <div class="panel left-panel">
                <div class="section-title">输入模型</div>
                <div v-if="!inputFieldList.length" class="empty-tip">请先建立与上游节点的连接以获取输出字段</div>
                <el-table v-else :data="inputFieldList" size="small" max-height="400" class="field-table">
                  <el-table-column type="index" label="#" width="40" align="center" />
                  <el-table-column prop="columnName" label="字段名" min-width="100" show-overflow-tooltip>
                    <template #default="scope">
                      {{ getRowColumnName(scope.row) || '-' }}
                    </template>
                  </el-table-column>
                  <el-table-column prop="columnType" label="类型" width="90" show-overflow-tooltip />
                </el-table>
              </div>
              <!-- 中间：连接线示意 -->
              <div class="panel center-panel">
                <div class="connection-lines">
                  <div v-if="!fieldList.length" class="no-connections">等待选择目标表</div>
                </div>
              </div>
              <!-- 右侧面板：目标表字段列表，用于映射 -->
              <div class="panel right-panel">
                <div class="section-title">输出模型</div>
                <div v-if="!fieldList.length" class="empty-tip">请先选择目标表</div>
                <el-table v-else :data="fieldList" size="small" max-height="400" class="field-table">
                  <el-table-column type="index" label="#" width="40" align="center" />
                  <el-table-column label="目标字段" min-width="100">
                    <template #default="scope">
                      <span class="target-name">{{ getRowColumnName(scope.row) }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="映射来源" min-width="140">
                    <template #default="scope">
                      <el-select
                        v-model="mappingFields[getRowColumnName(scope.row)]"
                        size="small"
                        placeholder="选择映射字段"
                        clearable
                        @change="onFieldMappingChange"
                      >
                        <el-option
                          v-for="inputField in inputFieldList"
                          :key="getRowColumnName(inputField)"
                          :label="getRowColumnName(inputField)"
                          :value="getRowColumnName(inputField)"
                        />
                      </el-select>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, reactive, watch, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import * as connectorApi from '@/api/dig/connectorApi';
import * as taskApi from '@/api/dig/taskApi';
import * as columnApi from '@/api/metadata/columnApi';
import { getDatasource } from '@/api/metadata/datasourceApi';
import DynamicForm from './DynamicForm.vue';
import CopyTransformFieldMap from './CopyTransformFieldMap.vue';
import { useRoute } from 'vue-router';

const props = defineProps({
  task: {
    type: Object,
    required: true,
  },
  /** 上游 Source 的 outputModel（连线后由 designer 传入，用于 Copy Transform 左侧输入字段列表） */
  upstreamOutputModel: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(['update', 'close', 'updateTaskId']);
const route = useRoute();

// 转换表单数据中的数值字段为适当类型
const convertFormValuesToCorrectTypes = (formData, formConfig) => {
  if (!formData || !formConfig || !Array.isArray(formConfig)) {
    return formData;
  }

  const convertedData = { ...formData };

  formConfig.forEach((field) => {
    const fieldName = field.enName || field.fieldName || field.field || field.name;
    const fieldValue = convertedData[fieldName];

    // 如果字段值存在且是字符串类型
    if (fieldValue !== undefined && typeof fieldValue === 'string') {
      // 检查字段类型是否为数字类型
      const fieldType = field.formType || field.type || 'text';

      if (fieldType === 'number' || fieldType === 'positive_number') {
        // 尝试转换为数字
        const numValue = Number(fieldValue);
        if (!isNaN(numValue)) {
          convertedData[fieldName] = numValue;
        }
      }
    }
  });

  return convertedData;
};

// 响应式数据
const formRef = ref(null);
const outputTableRef = ref(null);
const inputTableRef = ref(null); // 输入表 el-table 引用（Transform 回显勾选用）
const saving = ref(false);
const fieldList = ref([]); // 输出表字段列表
const selectedTable = ref(''); // 输出模型：当前选中的表名
const outputTableFromConfig = ref(''); // 从 connectorConfig.outputModel 解析出的表名，保证左侧列表与回显不因 pickFormFieldsOnly 丢失
const outputFields = ref([]); // 输出模型：选中的字段名
const copyOutputFields = ref([]); // Copy 类 Transform：右侧映射列表 [{ sourceColumn, targetColumn }]
const inputFieldList = ref([]); // 输入表字段列表（仅 Transform）
const selectedInputTable = ref(''); // 输入模型：当前选中的表名（仅 Transform）
const inputFields = ref([]); // 输入模型：选中的字段名（仅 Transform）
const mappingFields = ref({}); // SINK 组件字段映射关系：目标字段 -> 源字段
const dynamicFormConfig = ref(null);
const activeTab = ref('props');
// 正在从 connectorConfig 回显 outputModel/inputModel 时置为 true，避免 updateOutputModel 覆盖勾选
const restoringFromConnectorConfig = ref(false);

let isComponentActive = true;

// 在组件卸载时标记为非活跃状态
onUnmounted(() => {
  isComponentActive = false;
});

// 表单数据
const formData = reactive({
  taskId: null,
  taskName: '',
  connectorType: '',
  connectorName: '',
  taskConfig: '', // 动态表单的数据都存在这里
  // 保留一些输出模型相关的字段
  datasourceConfig: {
    database: '',
    tables: [],
  },
});

// 表单验证规则
const rules = {
  taskName: [{ required: true, message: '请输入任务名称', trigger: 'blur' }],
};

// 计算属性
const showFieldConfig = computed(() => {
  return formData.connectorType === 'SOURCE' && fieldList.value.length > 0;
});

/** Copy 类 Transform：连接器名包含 copy 时使用字段映射（左表+复制→右表） */
const isCopyTransform = computed(() => {
  return formData.connectorType === 'TRANSFORM' && (formData.connectorName || '').toLowerCase().includes('copy');
});

// 左侧属性配置：过滤掉「输出模型」相关字段，输出模型仅在右侧 Tab 配置
const dynamicFormConfigFiltered = computed(() => {
  const config = dynamicFormConfig.value;
  if (!config || !Array.isArray(config)) return [];
  const outputModelKeys = ['outputModel', 'output_model', '输出模型'];
  const isOutputModelField = (f) => {
    const name = (f.enName || f.fieldName || f.field || f.name || '').toLowerCase();
    const cn = (f.cnName || f.label || f.displayName || '').toString();
    const tag = (f.tag || '').toString();
    return outputModelKeys.some(
      (k) => name.includes(k.toLowerCase()) || cn.includes('输出模型') || tag.includes('输出模型'),
    );
  };
  return config.filter((f) => !isOutputModelField(f));
});

// 右侧输出模型的表：优先用 connectorConfig 回显的表名，否则用属性配置里的 tableName/table
const availableTables = computed(() => {
  const fromConfig = outputTableFromConfig.value;
  if (fromConfig) return [fromConfig];
  const tableFromForm = formData.taskConfig?.tableName || formData.taskConfig?.table;
  if (tableFromForm) return [tableFromForm];
  return [];
});

// 输出模型：已选字段名集合（小写，用于受控勾选判断）
const outputFieldsSetLower = computed(
  () => new Set(outputFields.value.map((f) => String(f).trim().toLowerCase()).filter(Boolean)),
);
const isOutputFieldSelected = (row) => outputFieldsSetLower.value.has(getRowColumnName(row).toLowerCase());
const isAllOutputFieldsSelected = computed(() => {
  const list = fieldList.value || [];
  if (list.length === 0) return false;
  return list.every((row) => isOutputFieldSelected(row));
});
const isSomeOutputFieldsSelected = computed(() => {
  const list = fieldList.value || [];
  if (list.length === 0) return false;
  const selected = list.filter((row) => isOutputFieldSelected(row)).length;
  return selected > 0 && selected < list.length;
});
const toggleAllOutputFields = (selected) => {
  const list = fieldList.value || [];
  outputFields.value = selected ? list.map((row) => getRowColumnName(row)).filter(Boolean) : [];
};
const setOutputFieldSelected = (row, selected) => {
  const name = getRowColumnName(row);
  if (!name) return;
  if (selected) {
    const exists = outputFields.value.some((f) => String(f).trim().toLowerCase() === name.toLowerCase());
    if (!exists) outputFields.value = [...outputFields.value, name];
  } else {
    outputFields.value = outputFields.value.filter((f) => String(f).trim().toLowerCase() !== name.toLowerCase());
  }
};

// 输入模型：已选字段名集合（小写，用于受控勾选判断）
const inputFieldsSetLower = computed(
  () => new Set(inputFields.value.map((f) => String(f).trim().toLowerCase()).filter(Boolean)),
);
const isInputFieldSelected = (row) => inputFieldsSetLower.value.has(getRowColumnName(row).toLowerCase());
const isAllInputFieldsSelected = computed(() => {
  const list = inputFieldList.value || [];
  if (list.length === 0) return false;
  return list.every((row) => isInputFieldSelected(row));
});
const isSomeInputFieldsSelected = computed(() => {
  const list = inputFieldList.value || [];
  if (list.length === 0) return false;
  const selected = list.filter((row) => isInputFieldSelected(row)).length;
  return selected > 0 && selected < list.length;
});
const toggleAllInputFields = (selected) => {
  const list = inputFieldList.value || [];
  inputFields.value = selected ? list.map((row) => getRowColumnName(row)).filter(Boolean) : [];
};
const setInputFieldSelected = (row, selected) => {
  const name = getRowColumnName(row);
  if (!name) return;
  if (selected) {
    const exists = inputFields.value.some((f) => String(f).trim().toLowerCase() === name.toLowerCase());
    if (!exists) inputFields.value = [...inputFields.value, name];
  } else {
    inputFields.value = inputFields.value.filter((f) => String(f).trim().toLowerCase() !== name.toLowerCase());
  }
};

// SINK 组件字段映射处理函数
const onFieldMappingChange = () => {
  // 当字段映射发生变化时触发
  console.log('字段映射发生变化:', mappingFields.value);
};

// 输入模型（仅 Transform）：从动态表单或已回显的 inputModel 获取可用的输入表名（Copy 时优先显示 selectedInputTable）
const availableInputTables = computed(() => {
  const fromForm =
    formData.taskConfig?.inputTable ||
    formData.taskConfig?.inputTableName ||
    formData.taskConfig?.tableName ||
    formData.taskConfig?.table;
  if (isCopyTransform.value && selectedInputTable.value) {
    return Array.from(new Set([selectedInputTable.value, fromForm].filter(Boolean)));
  }
  if (fromForm) return [fromForm];
  return [];
});

// SINK 组件：上游输出模型（从连接的上游节点获取）
const sinkInputModel = computed(() => {
  if (formData.connectorType === 'SINK' && props.upstreamOutputModel?.fields?.length) {
    return props.upstreamOutputModel;
  }
  return null;
});

/**
 * 从动态表单配置中获取所有字段名（与 /st/connector/form 返回的字段结构一致）
 */
function getFormFieldNames(formConfig) {
  const config = formConfig || dynamicFormConfig.value;
  if (!config || !Array.isArray(config)) return [];
  return config.map((f) => f.enName || f.fieldName || f.field || f.name).filter(Boolean);
}

/**
 * 仅保留表单配置中存在的字段，得到严格符合 /st/connector/form 结构的对象。
 * 排除 sourceFieldsConfig、transformConfig、sinkFieldsConfig、datasourceConfig 等额外字段。
 */
function pickFormFieldsOnly(obj, formConfig) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return {};
  const names = getFormFieldNames(formConfig);
  const result = {};
  names.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(obj, key) && obj[key] !== undefined) {
      result[key] = obj[key];
    }
  });
  return result;
}

/**
 * 安全解析 connectorConfig：保证返回普通对象，避免字符串被当作对象导致 "0","1","2" 等键
 */
function parseConnectorConfigSafe(connectorConfig) {
  if (connectorConfig == null) return {};
  if (typeof connectorConfig === 'string') {
    if (connectorConfig.trim() === '') return {};
    try {
      const parsed = JSON.parse(connectorConfig);
      return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }
  if (typeof connectorConfig === 'object' && !Array.isArray(connectorConfig)) return { ...connectorConfig };
  return {};
}

const COPY_OUTPUT_MODEL_SKIP_KEYS = new Set(['tableName', 'table', 'fields', 'fieldMapping']);

/** Copy Transform：将后端 outputModel 转为 copyOutputFields。支持格式 { "目标": "来源" } 或旧格式 fieldMapping/fields */
function parseCopyOutputModel(outModel) {
  if (!outModel || typeof outModel !== 'object' || Array.isArray(outModel)) return [];
  if (Array.isArray(outModel.fieldMapping) && outModel.fieldMapping.length > 0) {
    return outModel.fieldMapping.map((m) => ({
      sourceColumn: m.sourceColumn ?? m.source ?? '',
      targetColumn: m.targetColumn ?? m.target ?? m.sourceColumn ?? m.source ?? '',
    }));
  }
  const savedFields = Array.isArray(outModel.fields) ? outModel.fields : [];
  if (savedFields.length > 0) {
    return savedFields.map((f) => ({ sourceColumn: f, targetColumn: f }));
  }
  // 新格式：{ "name": "name", "name1": "name", "age1": "age" }，跳过 tableName 等非映射键
  return Object.entries(outModel)
    .filter(([k, v]) => !COPY_OUTPUT_MODEL_SKIP_KEYS.has(k) && typeof v === 'string')
    .map(([target, source]) => ({ sourceColumn: source.trim(), targetColumn: target.trim() }));
}

// 加载任务配置（仅加载动态表单配置）
const loadTaskConfig = async () => {
  if (!formData.connectorName) return;
  try {
    // 加载动态表单配置 - 适配新的后端接口
    const formConfigArray = await connectorApi.getConnectorForm(formData.connectorType, formData.connectorName);
    // 后端现在直接返回数组，不再需要解析JSON字符串
    dynamicFormConfig.value = Array.isArray(formConfigArray) ? formConfigArray : [];
  } catch (error) {
    console.error('加载任务配置失败:', error);
    ElMessage.error('加载任务配置失败');
  }
};

// 输出/输入模型依赖的 taskConfig 键，过滤后必须保留
const OUTPUT_MODEL_KEYS = ['tableName', 'table', 'datasourceId', 'datasource_id', 'database', 'dbName'];
const INPUT_MODEL_KEYS = [
  'inputTableName',
  'inputTable',
  'inputDatasourceId',
  'inputDatabase',
  'inputDatabaseName',
  'datasourceId',
  'datasource_id',
  'database',
  'dbName',
];

// 当 dynamicFormConfig 就绪后，将 taskConfig 过滤为仅包含表单字段，但保留输出模型所需键
// 过滤时临时置 restoringFromConnectorConfig，避免触发 updateOutputModel 把已回显的 outputFields 清空
watch(
  dynamicFormConfig,
  (newConfig) => {
    if (
      newConfig &&
      Array.isArray(newConfig) &&
      newConfig.length > 0 &&
      formData.taskConfig &&
      typeof formData.taskConfig === 'object' &&
      !Array.isArray(formData.taskConfig)
    ) {
      restoringFromConnectorConfig.value = true;
      const prev = formData.taskConfig;
      let filtered = pickFormFieldsOnly(prev, newConfig);
      // 转换数值字段类型以避免ElInputNumber类型错误
      filtered = convertFormValuesToCorrectTypes(filtered, newConfig);
      const preserved = {};
      [...OUTPUT_MODEL_KEYS, ...INPUT_MODEL_KEYS].forEach((k) => {
        if (prev[k] !== undefined) preserved[k] = prev[k];
      });
      formData.taskConfig = { ...filtered, ...preserved };
      nextTick().then(() => {
        restoringFromConnectorConfig.value = false;
      });
    }
  },
  { deep: true },
);

// 监听动态表单配置变化（回显时跳过，避免覆盖 outputModel 勾选）
watch(
  () => formData.taskConfig,
  (newConfig) => {
    if (restoringFromConnectorConfig.value) return;
    if (newConfig && typeof newConfig === 'object') {
      updateOutputModel();
    }
  },
  { deep: true },
);

// 加载输入表字段（仅 Transform）。configOverride 回显时传入，避免依赖 formData.taskConfig 未同步
const loadInputTableFields = async (tableName, configOverride) => {
  if (!tableName) return;
  const cfg = configOverride ?? formData.taskConfig;
  try {
    const datasourceId = cfg?.inputDatasourceId ?? cfg?.inputDatasource_id ?? cfg?.datasourceId ?? cfg?.datasource_id;
    const database = cfg?.inputDatabase ?? cfg?.inputDatabaseName ?? cfg?.database ?? cfg?.dbName;
    if (!datasourceId || !database) {
      inputFieldList.value = [];
      return;
    }
    const response = await columnApi.listColumnByName(datasourceId, database, tableName);
    const fields = Array.isArray(response) ? response : response?.data || [];
    inputFieldList.value = fields;
  } catch (error) {
    console.error('加载输入表字段失败:', error);
    ElMessage.error('加载输入表字段失败');
    inputFieldList.value = [];
  }
};

// 加载表字段信息（输出模型）。configOverride 回显时传入；connectorConfigAtStart 用于竞态防护，仅当当前 task 的 connectorConfig 仍是本次请求的那份才写入 fieldList（避免先完成的节点数据请求覆盖后完成的 API 数据）
const loadTableFields = async (tableName, configOverride, connectorConfigAtStart) => {
  if (!tableName) return;
  const cfg = configOverride ?? formData.taskConfig;
  const configSnapshot = connectorConfigAtStart ?? props.task?.connectorConfig;
  try {
    const datasourceId = cfg?.datasourceId ?? cfg?.datasource_id;
    const database = cfg?.database ?? cfg?.dbName;
    if (!datasourceId || !database) {
      console.warn('缺少数据源ID或数据库名称，无法加载表字段');
      if (configSnapshot == null || String(props.task?.connectorConfig) === String(configSnapshot))
        fieldList.value = [];
      return;
    }
    const response = await columnApi.listColumnByName(datasourceId, database, tableName);
    const fields = Array.isArray(response) ? response : response?.data || [];
    if (configSnapshot == null || String(props.task?.connectorConfig) === String(configSnapshot))
      fieldList.value = fields;
  } catch (error) {
    console.error('加载表字段失败:', error);
    ElMessage.error('加载表字段失败');
    if (configSnapshot == null || String(props.task?.connectorConfig) === String(configSnapshot)) fieldList.value = [];
  }
};

// Copy Transform：连线后上游 Source 的 outputModel 传入时，用其填充左侧输入字段列表
watch(
  () => [props.task, props.upstreamOutputModel],
  () => {
    if (!props.task) return;
    const isCopy =
      (props.task.connectorType || '') === 'TRANSFORM' &&
      (props.task.connectorName || '').toString().toLowerCase().includes('copy');
    const isSink = props.task.connectorType === 'SINK';

    if (isCopy && props.upstreamOutputModel?.fields?.length) {
      selectedInputTable.value = props.upstreamOutputModel.tableName ?? '';
      inputFieldList.value = (props.upstreamOutputModel.fields || []).map((f) =>
        typeof f === 'string'
          ? { columnName: f, columnType: '-' }
          : { columnName: f.columnName ?? f.name ?? f, columnType: f.columnType ?? '-' },
      );
    } else if (isSink && props.upstreamOutputModel?.fields?.length) {
      // SINK 组件：使用上游输出模型作为输入字段列表
      inputFieldList.value = (props.upstreamOutputModel.fields || []).map((f) =>
        typeof f === 'string'
          ? { columnName: f, columnType: '-' }
          : { columnName: f.columnName ?? f.name ?? f, columnType: f.columnType ?? '-' },
      );
    }
  },
  { immediate: true, deep: true },
);

// connectorConfig 后续被父组件更新（如 loadTaskConfig）时，仅补跑输出/输入模型回显，避免需点两次才渲染
watch(
  () => [props.task?.taskId, props.task?.connectorConfig],
  async ([taskId, connectorConfig]) => {
    if (!props.task || !taskId || !connectorConfig || typeof connectorConfig !== 'string') return;
    try {
      restoringFromConnectorConfig.value = true;
      const parsed = parseConnectorConfigSafe(connectorConfig);
      const taskConfigObj =
        props.task.taskConfig && typeof props.task.taskConfig === 'object' ? props.task.taskConfig : {};
      const mergedParsed = { ...taskConfigObj, ...parsed };
      const outModel = mergedParsed.outputModel ?? props.task.outputModel ?? taskConfigObj.outputModel;
      const inModel = mergedParsed.inputModel ?? props.task.inputModel ?? taskConfigObj.inputModel;
      const isCopy =
        (mergedParsed.connectorType ?? props.task?.connectorType ?? '') === 'TRANSFORM' &&
        (mergedParsed.connectorName ?? props.task?.connectorName ?? '').toString().toLowerCase().includes('copy');
      if (outModel && typeof outModel === 'object' && !Array.isArray(outModel)) {
        const tableName = outModel.tableName ?? outModel.table;
        // 检查是否是新格式（包含fields数组和relation映射）
        let savedFields = [];
        if (Array.isArray(outModel.fields)) {
          // 新格式：{ fields: [...], relation: {...} }
          savedFields = [...outModel.fields];
        } else {
          // 旧格式：{ fieldName: mapping, ... } 或标准格式
          savedFields = Array.isArray(outModel.fields) ? [...outModel.fields] : [];
        }
        if (isCopy) {
          copyOutputFields.value = parseCopyOutputModel(outModel);
          if (tableName) selectedInputTable.value = tableName;
          const savedInputFields = Array.isArray(inModel?.fields) ? inModel.fields : [];
          if (savedInputFields.length > 0) {
            inputFieldList.value = savedInputFields.map((f) =>
              typeof f === 'string'
                ? { columnName: f, columnType: '-' }
                : { columnName: f.columnName ?? f.name ?? f, columnType: f.columnType ?? '-' },
            );
          } else if (props.upstreamOutputModel?.fields?.length) {
            inputFieldList.value = (props.upstreamOutputModel.fields || []).map((f) =>
              typeof f === 'string'
                ? { columnName: f, columnType: '-' }
                : { columnName: f.columnName ?? f.name ?? f, columnType: f.columnType ?? '-' },
            );
          } else if (tableName) {
            await loadInputTableFields(tableName, mergedParsed);
          }
        } else if (tableName) {
          outputTableFromConfig.value = tableName;
          selectedTable.value = tableName;
          outputFields.value = savedFields;
          await loadTableFields(tableName, mergedParsed, props.task?.connectorConfig);
        }
      }
      if (inModel && typeof inModel === 'object' && !Array.isArray(inModel)) {
        const inputTableName = inModel.tableName ?? inModel.table;
        const savedInputFields = Array.isArray(inModel.fields) ? [...inModel.fields] : [];
        if (inputTableName) selectedInputTable.value = inputTableName;
        if (isCopy) {
          if (savedInputFields.length > 0) {
            inputFieldList.value = savedInputFields.map((f) =>
              typeof f === 'string'
                ? { columnName: f, columnType: '-' }
                : { columnName: f.columnName ?? f.name ?? f, columnType: f.columnType ?? '-' },
            );
          } else if (inputTableName) {
            await loadInputTableFields(inputTableName, mergedParsed);
          }
        } else if (inputTableName) {
          inputFields.value = savedInputFields;
          await loadInputTableFields(inputTableName, mergedParsed);
        }
      }
    } catch (e) {
      console.error('connectorConfig 更新回显失败:', e);
    } finally {
      restoringFromConnectorConfig.value = false;
    }
  },
  { immediate: true },
);

watch(
  () => props.task,
  async (newTask, oldTask) => {
    try {
      // taskId 变化、connectorConfig 变化、或 task 引用变化（父组件用新对象替换 selectedTask）都需重新跑回显
      const taskChanged = !oldTask || newTask?.taskId !== oldTask?.taskId;
      const connectorConfigUpdated =
        newTask?.connectorConfig &&
        typeof newTask.connectorConfig === 'string' &&
        newTask.connectorConfig !== oldTask?.connectorConfig;
      const taskRefReplaced = oldTask && newTask && newTask !== oldTask;
      if (newTask && (taskChanged || connectorConfigUpdated || taskRefReplaced)) {
        // 只赋值与接口一致的基本信息，不整体 assign 避免带入多余字段
        formData.taskId = newTask.taskId ?? null;
        formData.taskName = newTask.taskName ?? '';
        formData.connectorType = newTask.connectorType ?? '';
        formData.connectorName = newTask.connectorName ?? '';

        // 解析 connectorConfig（详情/接口返回的 plugins[].connectorConfig 字符串，内含表单字段 + outputModel/inputModel）
        const parsed = parseConnectorConfigSafe(newTask.connectorConfig);
        const taskConfigObj = newTask.taskConfig && typeof newTask.taskConfig === 'object' ? newTask.taskConfig : {};
        const mergedParsed = { ...taskConfigObj, ...parsed };
        const formConfigRef = newTask.dynamicFormConfig || dynamicFormConfig.value;
        const fieldNames = getFormFieldNames(formConfigRef);
        // 回显期间不触发 updateOutputModel，避免覆盖 outputModel 勾选
        restoringFromConnectorConfig.value = true;
        // 有表单配置时只保留表单字段给 taskConfig，但必须保留输出/输入模型所需键
        let filtered = fieldNames.length > 0 ? pickFormFieldsOnly(mergedParsed, formConfigRef) : mergedParsed;
        // 转换数值字段类型以避免ElInputNumber类型错误
        filtered = convertFormValuesToCorrectTypes(filtered, formConfigRef);
        const preserved = {};
        [...OUTPUT_MODEL_KEYS, ...INPUT_MODEL_KEYS].forEach((k) => {
          if (mergedParsed[k] !== undefined) preserved[k] = mergedParsed[k];
        });
        formData.taskConfig = { ...filtered, ...preserved };

        // 回显 outputModel / inputModel：Copy Transform 用 outputModel 键值对 + inputModel.tableName/fields
        const outModel = mergedParsed.outputModel ?? newTask.outputModel ?? taskConfigObj.outputModel;
        const inModel = mergedParsed.inputModel ?? newTask.inputModel ?? taskConfigObj.inputModel;
        const isCopy =
          (formData.connectorType || '') === 'TRANSFORM' &&
          (formData.connectorName || '').toString().toLowerCase().includes('copy');
        const isSink = formData.connectorType === 'SINK';
        if (outModel && typeof outModel === 'object' && !Array.isArray(outModel)) {
          const tableName = outModel.tableName ?? outModel.table;
          // 检查是否是新格式（包含fields数组和relation映射）
          let savedFields = [];
          if (Array.isArray(outModel.fields)) {
            // 新格式：{ fields: [...], relation: {...} }
            savedFields = [...outModel.fields];
          } else {
            // 旧格式：{ fieldName: mapping, ... } 或标准格式
            savedFields = Array.isArray(outModel.fields) ? [...outModel.fields] : [];
          }
          if (isCopy) {
            copyOutputFields.value = parseCopyOutputModel(outModel);
            const inputTableName = inModel?.tableName ?? inModel?.table ?? tableName;
            if (inputTableName) selectedInputTable.value = inputTableName;
            const savedInputFields = Array.isArray(inModel?.fields) ? inModel.fields : [];
            if (props.upstreamOutputModel?.fields?.length) {
              inputFieldList.value = (props.upstreamOutputModel.fields || []).map((f) =>
                typeof f === 'string'
                  ? { columnName: f, columnType: '-' }
                  : { columnName: f.columnName ?? f.name ?? f, columnType: f.columnType ?? '-' },
              );
            } else if (savedInputFields.length > 0) {
              inputFieldList.value = savedInputFields.map((f) =>
                typeof f === 'string'
                  ? { columnName: f, columnType: '-' }
                  : { columnName: f.columnName ?? f.name ?? f, columnType: f.columnType ?? '-' },
              );
            } else if (inputTableName) {
              await loadInputTableFields(inputTableName, mergedParsed);
            } else {
              copyOutputFields.value = [];
              selectedInputTable.value = '';
              inputFieldList.value = [];
            }
          } else if (isSink && tableName) {
            // SINK 组件：回显字段映射
            outputTableFromConfig.value = tableName;
            selectedTable.value = tableName;
            if (outModel.fieldMapping && typeof outModel.fieldMapping === 'object') {
              mappingFields.value = { ...outModel.fieldMapping };
            }
            await loadTableFields(tableName, mergedParsed, newTask?.connectorConfig);
          } else if (tableName) {
            outputTableFromConfig.value = tableName;
            selectedTable.value = tableName;
            outputFields.value = savedFields;
            await loadTableFields(tableName, mergedParsed, newTask?.connectorConfig);
          } else {
            outputTableFromConfig.value = '';
            selectedTable.value = '';
            outputFields.value = [];
            fieldList.value = [];
          }
        } else {
          outputTableFromConfig.value = '';
          selectedTable.value = '';
          outputFields.value = [];
          fieldList.value = [];
          if (isCopy) copyOutputFields.value = [];
        }

        // 回显 inputModel（仅 Transform）：Copy 已在上面用 inModel 恢复；此处补 selectedInputTable，非 Copy 时恢复 inputFields 并加载表结构
        const inModelRestore = mergedParsed.inputModel ?? newTask.inputModel ?? taskConfigObj.inputModel;
        if (inModelRestore && typeof inModelRestore === 'object' && !Array.isArray(inModelRestore)) {
          const inputTableName = inModelRestore.tableName ?? inModelRestore.table;
          const savedInputFields = Array.isArray(inModelRestore.fields) ? [...inModelRestore.fields] : [];
          if (inputTableName) {
            selectedInputTable.value = inputTableName;
            if (isCopy) {
              if (savedInputFields.length === 0) await loadInputTableFields(inputTableName, mergedParsed);
            } else {
              inputFields.value = savedInputFields;
              await loadInputTableFields(inputTableName, mergedParsed);
            }
          } else if (formData.connectorType === 'SINK') {
            // SINK 组件：始终使用上游输出模型作为输入字段列表，以反映最新的上游字段
            if (props.upstreamOutputModel?.fields?.length > 0) {
              inputFieldList.value = (props.upstreamOutputModel.fields || []).map((f) =>
                typeof f === 'string'
                  ? { columnName: f, columnType: '-' }
                  : { columnName: f.columnName ?? f.name ?? f, columnType: f.columnType ?? '-' },
              );
            } else if (savedInputFields.length > 0) {
              // 如果没有上游输出模型但有保存的输入字段，则使用保存的字段
              inputFieldList.value = savedInputFields.map((f) =>
                typeof f === 'string'
                  ? { columnName: f, columnType: '-' }
                  : { columnName: f.columnName ?? f.name ?? f, columnType: f.columnType ?? '-' },
              );
            }
          }
        } else if (!isCopy) {
          selectedInputTable.value = '';
          inputFields.value = [];
          inputFieldList.value = [];
        }

        // 检查是否为新节点（以node_开头的是前端生成的临时ID）
        const isNewNode = !newTask.taskId || newTask.taskId === 'null' || String(newTask.taskId).startsWith('node_');

        if (isNewNode) {
          if (newTask.dynamicFormConfig) {
            dynamicFormConfig.value = newTask.dynamicFormConfig;
          } else {
            loadTaskConfig();
          }
        } else {
          if (newTask.dynamicFormConfig) {
            dynamicFormConfig.value = newTask.dynamicFormConfig;
          } else {
            loadTaskConfig();
          }
        }
      }
    } catch (error) {
      console.error('处理任务变化时发生错误:', error);
    } finally {
      restoringFromConnectorConfig.value = false;
    }
  },
  { immediate: true, deep: true },
);

// 配置变化
const onConfigChange = (config) => {
  formData.taskConfig = config;

  // 当数据源配置变化时，更新输出模型
  updateOutputModel();
};

// 左侧数据源选中的表变化时，同步到右侧输出模型（右侧表来自左侧选中的数据表）
const updateOutputModel = () => {
  const tableFromForm = formData.taskConfig?.tableName || formData.taskConfig?.table;
  if (tableFromForm) {
    if (selectedTable.value !== tableFromForm) {
      outputFields.value = []; // 用户切换表时清空勾选
      outputTableFromConfig.value = tableFromForm;
      selectedTable.value = tableFromForm;
      loadTableFields(tableFromForm);
    }
  } else {
    outputTableFromConfig.value = '';
    selectedTable.value = '';
    fieldList.value = [];
    outputFields.value = [];
  }

  // Transform：输入表仍可由属性配置驱动（若有 inputTable 等字段）
  if (formData.connectorType === 'TRANSFORM') {
    const inputTableFromForm =
      formData.taskConfig?.inputTable ||
      formData.taskConfig?.inputTableName ||
      formData.taskConfig?.tableName ||
      formData.taskConfig?.table;
    if (inputTableFromForm) {
      if (selectedInputTable.value !== inputTableFromForm) {
        selectedInputTable.value = inputTableFromForm;
        loadInputTableFields(inputTableFromForm);
      }
    } else {
      selectedInputTable.value = '';
      inputFieldList.value = [];
      inputFields.value = [];
    }
  }
};

// 从行数据中取字段名（兼容 columnName / column_name / name / field / fieldName），统一 trim 便于匹配
const getRowColumnName = (row) =>
  (row?.columnName ?? row?.column_name ?? row?.name ?? row?.field ?? row?.fieldName ?? '').toString().trim();

// 输出模型表变化处理（用户切换表时清空已选字段）
const onOutputTableChange = async (tableName) => {
  outputFields.value = [];
  outputTableFromConfig.value = tableName; // 与左侧列表一致，避免被误判为“未选表”
  selectedTable.value = tableName;
  await loadTableFields(tableName);
};

// 输入模型表变化处理（仅 Transform）；Copy 类切换表时清空右侧映射
const onInputTableChange = async (tableName) => {
  if (isCopyTransform.value) copyOutputFields.value = [];
  selectedInputTable.value = tableName;
  await loadInputTableFields(tableName);
};

// 保存配置：connectorConfig 严格按 /st/connector/form 返回的字段结构，不包含 taskName、datasourceConfig 等多余参数
const saveConfig = async () => {
  try {
    await formRef.value.validate();
    saving.value = true;

    const jobId = route.query.jobId;
    if (!jobId) {
      ElMessage.error('作业ID不能为空');
      return;
    }

    // formData.taskConfig 必须为对象，避免字符串被错误序列化成 "0","1","2"
    const rawTaskConfig =
      typeof formData.taskConfig === 'string'
        ? parseConnectorConfigSafe(formData.taskConfig)
        : formData.taskConfig && typeof formData.taskConfig === 'object'
        ? formData.taskConfig
        : {};

    // 仅保留左侧表单字段（不含 outputModel/inputModel），再合并 outputModel、inputModel 到 connectorConfig
    let connectorConfigObj = pickFormFieldsOnly(rawTaskConfig, dynamicFormConfigFiltered.value);
    // 转换数值字段类型以避免ElInputNumber类型错误
    connectorConfigObj = convertFormValuesToCorrectTypes(connectorConfigObj, dynamicFormConfigFiltered.value);

    // outputModel 合并进 connectorConfig：Copy 类 Transform 格式为 { "目标字段名": "来源字段名", ... }，并合并到 connectorConfig
    if (isCopyTransform.value) {
      if (Array.isArray(copyOutputFields.value) && copyOutputFields.value.length > 0) {
        const outputModelMapping = {};
        copyOutputFields.value.forEach((m) => {
          const target = (m.targetColumn ?? m.sourceColumn ?? '').toString().trim();
          const source = (m.sourceColumn ?? '').toString().trim();
          if (target) outputModelMapping[target] = source;
        });
        // 将输出模型改为新结构：包含 fields 数组和 relation 映射
        const outputFields = Object.keys(outputModelMapping);
        connectorConfigObj.outputModel = {
          fields: outputFields,
          relation: outputModelMapping,
        };
        if (selectedInputTable.value) {
          const inputFieldNames = inputFieldList.value.map((row) => getRowColumnName(row)).filter(Boolean);
          connectorConfigObj.inputModel = { tableName: selectedInputTable.value, fields: inputFieldNames };
        }
      }
    } else if (formData.connectorType === 'SINK' && selectedTable.value) {
      // SINK 组件：保存字段映射关系
      const fieldMapping = {};
      Object.entries(mappingFields.value).forEach(([targetField, sourceField]) => {
        if (targetField && sourceField) {
          fieldMapping[targetField] = sourceField;
        }
      });
      connectorConfigObj.outputModel = { tableName: selectedTable.value, fieldMapping };
    } else if (selectedTable.value && Array.isArray(outputFields.value)) {
      connectorConfigObj.outputModel = { tableName: selectedTable.value, fields: [...outputFields.value] };
    }

    // inputModel 合并进 connectorConfig：仅 Transform（非 copy 时用勾选字段；copy 时上面已写 inputModel）
    if (
      formData.connectorType === 'TRANSFORM' &&
      !isCopyTransform.value &&
      selectedInputTable.value &&
      Array.isArray(inputFields.value)
    ) {
      connectorConfigObj.inputModel = { tableName: selectedInputTable.value, fields: [...inputFields.value] };
    }

    // SINK 组件：保存输入模型（来自上游的字段列表）
    if (formData.connectorType === 'SINK' && inputFieldList.value.length > 0) {
      const inputFieldNames = inputFieldList.value.map((row) => getRowColumnName(row)).filter(Boolean);
      connectorConfigObj.inputModel = { fields: inputFieldNames };
    }

    // 请求体：taskId、jobId、connectorConfig、connectorName、connectorType、taskName
    const connectorConfigStr = JSON.stringify(connectorConfigObj);
    const taskData = {
      taskId: props.task.taskId || '',
      jobId: parseInt(jobId, 10),
      connectorConfig: connectorConfigStr,
      connectorName: formData.connectorName ?? '',
      connectorType: formData.connectorType ?? '',
      taskName: formData.taskName ?? '',
    };

    const response = await taskApi.createTask(taskData);
    ElMessage.success('节点配置保存成功');

    const oldTaskId = props.task.taskId;
    const newTaskId = response.data?.taskId ?? response.taskId;
    if (newTaskId != null) {
      props.task.taskId = newTaskId;

      if (isComponentActive) {
        try {
          emit('update', {
            taskId: newTaskId,
            taskName: formData.taskName,
            connectorType: formData.connectorType,
            connectorName: formData.connectorName,
            connectorConfig: connectorConfigStr,
          });
          emit('updateTaskId', { oldTaskId, newTaskId });
          emit('close');
        } catch (error) {
          console.error('发送组件更新事件失败:', error);
        }
      }
    }
  } catch (error) {
    console.error('保存配置失败:', error);
    ElMessage.error('保存配置失败');
  } finally {
    saving.value = false;
  }
};

// 重置配置
const resetConfig = () => {
  if (formRef.value) {
    formRef.value.resetFields();
  }
  // 重置表单数据到初始状态
  Object.keys(formData).forEach((key) => {
    delete formData[key];
  });
  // 重新初始化表单数据
  outputTableFromConfig.value = '';
  selectedTable.value = '';
  fieldList.value = [];
  outputFields.value = [];
  selectedInputTable.value = '';
  inputFieldList.value = [];
  inputFields.value = [];
  copyOutputFields.value = [];
  mappingFields.value = {};
};

// 测试连接
const testConnection = async () => {
  try {
    // 实现测试连接逻辑
    await new Promise((resolve) => setTimeout(resolve, 1000));
    ElMessage.success('连接测试成功');
  } catch (error) {
    console.error('连接测试失败:', error);
    ElMessage.error('连接测试失败');
  }
};

onMounted(() => {
  loadTaskConfig();
});
</script>

<style scoped lang="scss">
.task-config-form {
  .config-section {
    margin-bottom: 20px;

    .section-title {
      font-size: 12px;
      font-weight: 800;
      color: #3a71a8;
      margin-bottom: 5px;
      padding-bottom: 6px;
      border-bottom: 1px solid var(--el-border-color-lighter);
    }
  }

  .field-config {
    margin-top: 8px;
  }

  .form-actions {
    margin-top: 20px;
    padding-top: 16px;
    border-top: 1px solid var(--el-border-color-lighter);
    display: flex;
    gap: 12px;
    justify-content: center;
    position: sticky;
    bottom: 0;
    background: white;
    z-index: 10;
    padding-bottom: 16px;

    .el-button {
      min-width: 100px;
    }
  }
}

.output-model-section {
  padding: 2px 4px 0 4px;
}

.copy-transform-header {
  margin-bottom: 12px;
}

.output-model-container {
  display: flex;
  gap: 20px;
}

.table-select-panel {
  width: 120px;

  .section-title {
    font-size: 13px;
    font-weight: 500;
  }

  .table-options {
    overflow-x: auto;
    width: 100%;
    display: inline-block;
    line-height: 16px;
    .table-options-title {
      font-size: 13px;
      color: #606266;
      margin-bottom: 8px;
      font-weight: 500;
    }

    .table-list {
      list-style: none;
      padding: 0;
      margin: 0;

      li {
        padding: 2px 5px;
        font-size: 13px;
        cursor: pointer;
        border-radius: 4px;
        transition: background-color 0.2s ease;

        &:hover {
          background-color: #f5f7fa;
        }

        &.active {
          font-weight: bold;
          color: #409eff;
        }
      }
    }
  }
}

.field-table-panel {
  flex: 1;
  width: 200px;
  .section-title {
    font-size: 13px;
    font-weight: 500;
  }

  .no-table-selected {
    text-align: center;
    color: #909399;
    padding: 10px 0;
  }

  .loading-fields {
    text-align: center;
    color: #909399;
    padding: 10px 0;
  }
}

.field-mapping-container {
  padding: 0;
  /* 与 el-table size="small" 行高一致，便于中间连接线与左右表格行对齐 */
  --copy-map-row-height: 32px;
  --copy-map-header-offset: 72px;
}
.mapping-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px 8px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  .panel-label {
    font-size: 12px;
    font-weight: 600;
    color: var(--el-text-color-secondary);
    flex: 1;
    &.center-label {
      text-align: center;
      flex: 0 0 120px;
    }
  }
}
.mapping-body {
  display: flex;
  gap: 12px;
  align-items: stretch;
  min-height: 320px;
}
.panel {
  flex: 1;
  min-width: 0;
  .section-title {
    font-size: 12px;
    font-weight: 600;
    color: #3a71a8;
    margin-bottom: 8px;
  }
  .empty-tip {
    color: var(--el-text-color-placeholder);
    font-size: 12px;
    padding: 16px;
    text-align: center;
  }
  .field-table {
    width: 100%;
  }
}
.center-panel {
  flex: 0 0 100px;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  /* 与左右表格对齐：预留与 section-title + 表头 等高的空间，使第一条线对齐第一行数据 */
  padding-top: var(--copy-map-header-offset);
  .connection-lines {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0;
  }
  .connection-item {
    height: var(--copy-map-row-height);
    display: flex;
    align-items: center;
    gap: 2px;
    flex-shrink: 0;
  }
  .connector-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--el-color-primary);
    flex-shrink: 0;
    &.right-dot {
      background: var(--el-color-success);
    }
  }
  .connector-line {
    width: 24px;
    height: 2px;
    background: linear-gradient(to right, var(--el-color-primary), var(--el-color-success));
    flex-shrink: 0;
  }
  .no-connections {
    font-size: 11px;
    color: var(--el-text-color-placeholder);
    text-align: center;
    padding: 8px;
  }
}
.target-name {
  color: var(--el-text-color-regular);
  font-size: 12px;
}
</style>
