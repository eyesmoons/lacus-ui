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
          <!-- 动态表单配置（SOURCE类型，包含数据源、数据库、表等所有字段） -->
          <div
            class="config-section"
            v-if="formData.connectorType === 'SOURCE' && dynamicFormConfig && dynamicFormConfig.length > 0"
          >
            <dynamic-form :config="dynamicFormConfig" v-model="formData.taskConfig" @change="onConfigChange" />
          </div>
          <!-- 动态表单配置（TRANSFORM类型） -->
          <div
            class="config-section"
            v-if="formData.connectorType === 'TRANSFORM' && dynamicFormConfig && dynamicFormConfig.length > 0"
          >
            <div class="section-title">转换配置</div>
            <dynamic-form :config="dynamicFormConfig" v-model="formData.taskConfig" @change="onConfigChange" />
          </div>
          <!-- 动态表单配置（SINK类型，包含目标数据源、目标表等所有字段） -->
          <div
            class="config-section"
            v-if="formData.connectorType === 'SINK' && dynamicFormConfig && dynamicFormConfig.length > 0"
          >
            <div class="section-title">输出配置</div>
            <dynamic-form :config="dynamicFormConfig" v-model="formData.taskConfig" @change="onConfigChange" />
          </div>
          <!-- 操作按钮 -->
          <div class="form-actions">
            <el-button size="medium" type="primary" @click="saveConfig" :loading="saving">保存配置</el-button>
          </div>
        </el-form>
      </el-tab-pane>
      <el-tab-pane label="输出模型" name="output">
        <div class="output-model-section">
          <div class="output-model-container">
            <!-- 左侧表名选择 -->
            <div class="table-select-panel">
              <div class="section-title">表名</div>
              <el-input
                v-model="selectedTable"
                placeholder="当前选中的表"
                readonly
                size="small"
                style="margin-bottom: 16px"
                hidden="hidden"
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

            <!-- 右侧输出表结构 -->
            <div class="field-table-panel">
              <div class="section-title">输出表结构</div>
              <div v-if="!selectedTable" class="no-table-selected">请先选择左侧的表</div>
              <div v-else-if="fieldList.length === 0" class="loading-fields">正在加载字段...</div>
              <div v-else>
                <el-table
                  :data="fieldList"
                  size="small"
                  max-height="100%"
                  style="width: 100%"
                  @selection-change="(val) => (outputFields = val.map((f) => f.columnName))"
                >
                  <el-table-column type="selection" width="30" />
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
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, reactive, watch, computed, onMounted, onUnmounted } from 'vue';
import { ElMessage } from 'element-plus';
import * as connectorApi from '@/api/dig/connectorApi';
import * as taskApi from '@/api/dig/taskApi';
import * as tableApi from '@/api/metadata/tableApi';
import * as columnApi from '@/api/metadata/columnApi';
import { getDatasource } from '@/api/metadata/datasourceApi';
import DynamicForm from './DynamicForm.vue';
import { useRoute } from 'vue-router';

const props = defineProps({
  task: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['update', 'close', 'updateTaskId']);
const route = useRoute();

// 响应式数据
const formRef = ref(null);
const saving = ref(false);
const fieldList = ref([]); // 字段列表（用于输出模型）
const selectedTable = ref(''); // 当前选中的表名
const outputFields = ref([]); // 输出模型Tab选中的字段名
const dynamicFormConfig = ref(null);
const activeTab = ref('props');

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

// 从动态表单配置中获取可用的表名列表
const availableTables = computed(() => {
  // 如果用户在动态表单中选择了表，将其作为可用表
  const selectedTableFromForm = formData.taskConfig?.tableName || formData.taskConfig?.table;

  if (selectedTableFromForm) {
    return [selectedTableFromForm];
  }

  // 如果没有选择表，返回空数组
  return [];
});

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

// 监听动态表单配置变化
watch(
  () => formData.taskConfig,
  (newConfig) => {
    if (newConfig && typeof newConfig === 'object') {
      updateOutputModel();
    }
  },
  { deep: true },
);
watch(
  () => props.task,
  (newTask, oldTask) => {
    try {
      if (newTask && (!oldTask || newTask.taskId !== oldTask.taskId)) {
        // 先赋值基本信息，但要特别处理 connectorConfig
        Object.assign(formData, newTask);

        // 如果 newTask 包含 connectorConfig 字段（从作业DAG数据中），需要解析并覆盖 taskConfig
        if (newTask.connectorConfig && typeof newTask.connectorConfig === 'string') {
          try {
            formData.taskConfig = JSON.parse(newTask.connectorConfig);
          } catch (error) {
            console.warn('解析 connectorConfig 失败:', error, newTask.connectorConfig);
            // 保留原始的 taskConfig 或使用空对象
            formData.taskConfig = newTask.taskConfig || {};
          }
        }

        // 检查是否为新节点（以node_开头的是前端生成的临时ID）
        const isNewNode = !newTask.taskId || newTask.taskId === 'null' || String(newTask.taskId).startsWith('node_');

        if (isNewNode) {
          // 如果任务已经包含动态表单配置，直接使用
          if (newTask.dynamicFormConfig) {
            dynamicFormConfig.value = newTask.dynamicFormConfig;
          } else {
            // 否则按原来的流程加载
            loadTaskConfig();
          }
        } else {
          // 已保存的任务，如果有预加载的配置则使用，否则加载
          if (newTask.dynamicFormConfig) {
            dynamicFormConfig.value = newTask.dynamicFormConfig;
          } else {
            loadTaskConfig();
          }
        }
      }
    } catch (error) {
      console.error('处理任务变化时发生错误:', error);
    }
  },
  { immediate: true, deep: false },
);

// 配置变化
const onConfigChange = (config) => {
  formData.taskConfig = config;
  console.log('动态表单配置变化:', config);

  // 当数据源配置变化时，更新输出模型
  updateOutputModel();
};

// 更新输出模型
const updateOutputModel = () => {
  // 检查是否选择了表
  const selectedTableFromForm = formData.taskConfig?.tableName || formData.taskConfig?.table;

  if (selectedTableFromForm) {
    // 如果当前选中的表和表单中的表不同，自动切换
    if (selectedTable.value !== selectedTableFromForm) {
      selectedTable.value = selectedTableFromForm;
      loadTableFields(selectedTableFromForm);
    }
  } else {
    // 如果没有选择表，清空
    selectedTable.value = '';
    fieldList.value = [];
    outputFields.value = [];
  }
};

// 输出模型表变化处理
const onOutputTableChange = async (tableName) => {
  selectedTable.value = tableName;
  await loadTableFields(tableName);
};

// 加载表字段信息
const loadTableFields = async (tableName) => {
  if (!tableName) return;

  try {
    const datasourceId = formData.taskConfig?.datasourceId || formData.taskConfig?.datasource_id;
    const database = formData.taskConfig?.database || formData.taskConfig?.dbName;

    if (!datasourceId || !database) {
      console.warn('缺少数据源ID或数据库名称，无法加载表字段');
      fieldList.value = [];
      return;
    }

    // 使用 columnApi.listColumnByName 获取字段信息
    const response = await columnApi.listColumnByName(datasourceId, database, tableName);

    // 根据API返回格式调整
    const fields = Array.isArray(response) ? response : response?.data || [];
    fieldList.value = fields;

    // 清空之前的字段选择
    outputFields.value = [];
  } catch (error) {
    console.error('加载表字段失败:', error);
    ElMessage.error('加载表字段失败');
    fieldList.value = [];
  }
};

// 保存配置
const saveConfig = async () => {
  try {
    await formRef.value.validate();
    saving.value = true;

    // 获取当前作业ID
    const jobId = route.query.jobId;
    if (!jobId) {
      ElMessage.error('作业ID不能为空');
      return;
    }

    // 构建完整的任务配置数据
    const taskData = {
      taskId: props.task.taskId || '', // 直接使用原始的taskId字符串类型
      taskName: formData.taskName,
      jobId: parseInt(jobId),
      connectorType: formData.connectorType,
      connectorName: formData.connectorName,
      // 从动态表单中获取数据源配置
      datasourceId: formData.taskConfig?.datasourceId || formData.taskConfig?.datasource_id || 0,
      taskConfig:
        typeof formData.taskConfig === 'object' ? JSON.stringify(formData.taskConfig) : formData.taskConfig || '',
      datasourceConfig: {
        // 从动态表单中获取数据库和表信息
        database: formData.taskConfig?.database || formData.taskConfig?.dbName || '',
        tables: selectedTable.value ? [selectedTable.value] : [],
      },
      sourceFieldsConfig: null,
      transformConfig: null,
      sinkFieldsConfig: null,
    };

    // 根据连接器类型设置不同的配置
    if (formData.connectorType === 'SOURCE') {
      // Source 任务配置
      if (selectedTable.value && fieldList.value.length > 0) {
        taskData.sourceFieldsConfig = {
          tableName: selectedTable.value,
          tableFields: fieldList.value.filter((f) => outputFields.value.includes(f.columnName)),
        };
      }
    } else if (formData.connectorType === 'TRANSFORM') {
      // Transform 任务配置
      taskData.transformConfig = formData.transformConfig || {};
    } else if (formData.connectorType === 'SINK') {
      // Sink 任务配置
      if (selectedTable.value && fieldList.value.length > 0) {
        taskData.sinkFieldsConfig = [
          {
            database: formData.taskConfig?.database || formData.taskConfig?.dbName || '',
            tableName: selectedTable.value,
            fields: fieldList.value.filter((f) => outputFields.value.includes(f.columnName)),
          },
        ];
      }
    }

    // 调用创建任务API
    const response = await taskApi.createTask(taskData);
    ElMessage.success('任务配置保存成功');

    // 在覆盖 props.task.taskId 之前，先缓存旧ID
    const oldTaskId = props.task.taskId;
    const newTaskId = response.data?.taskId || response.taskId;
    if (newTaskId) {
      // 更新当前节点的taskId
      props.task.taskId = newTaskId;

      // 通知父组件更新节点数据
      if (isComponentActive) {
        try {
          emit('update', {
            ...taskData,
            taskId: newTaskId,
          });

          // 通知父组件更新相关边的ID（必须用旧ID映射到新ID）
          emit('updateTaskId', {
            oldTaskId,
            newTaskId,
          });

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
  selectedTable.value = '';
  fieldList.value = [];
  outputFields.value = [];
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
</style>
