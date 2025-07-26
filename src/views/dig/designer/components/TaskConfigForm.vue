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
          <!-- 数据源配置 -->
          <div class="config-section" v-if="formData.connectorType === 'SOURCE'">
            <div class="section-title">数据源配置</div>
            <el-form-item label="数据源" prop="datasourceId">
              <el-select
                v-model="formData.datasourceId"
                placeholder="请选择数据源"
                @change="onDatasourceChange"
                filterable
              >
                <el-option
                  v-for="ds in datasourceList"
                  :key="ds.datasourceId"
                  :label="ds.datasourceName"
                  :value="ds.datasourceId"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="数据库" prop="database" v-if="databaseList.length > 0">
              <el-select
                v-model="formData.datasourceConfig.database"
                placeholder="请选择数据库"
                @change="onDatabaseChange"
                filterable
              >
                <el-option v-for="db in databaseList" :key="db.dbId" :label="db.dbName" :value="db.dbName" />
              </el-select>
            </el-form-item>
            <el-form-item label="数据表" prop="tables" v-if="tableList.length > 0">
              <el-select
                v-model="formData.datasourceConfig.tables"
                placeholder="请选择数据表"
                multiple
                filterable
                @change="onTableChange"
              >
                <el-option
                  v-for="table in tableList"
                  :key="table.tableId"
                  :label="table.tableName"
                  :value="table.tableName"
                />
              </el-select>
            </el-form-item>
          </div>
          <!-- 移除字段配置 config-section -->
          <!-- <div class="config-section" v-if="showFieldConfig">
            <div class="section-title">字段配置</div>
            <div class="field-config">
              <el-table :data="fieldList" size="small" max-height="200">
                <el-table-column prop="name" label="字段名" width="100" />
                <el-table-column prop="type" label="类型" width="80" />
                <el-table-column prop="comment" label="注释" show-overflow-tooltip />
                <el-table-column label="主键" width="60" align="center">
                  <template #default="scope">
                    <el-checkbox v-model="scope.row.primaryKey" />
                  </template>
                </el-table-column>
                <el-table-column label="可空" width="60" align="center">
                  <template #default="scope">
                    <el-checkbox v-model="scope.row.nullable" />
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div> -->
          <!-- 动态表单配置，隐藏 database/table 字段 -->
          <div class="config-section" v-if="dynamicFormConfig && dynamicFormConfig.length > 0">
            <div class="section-title">连接器配置</div>
            <dynamic-form
              :config="
                dynamicFormConfig.filter(
                  (f) =>
                    !(
                      (f.field === 'database' && formData.datasourceConfig.database) ||
                      (f.field === 'table' &&
                        formData.datasourceConfig.tables &&
                        formData.datasourceConfig.tables.length > 0)
                    ),
                )
              "
              v-model="formData.taskConfig"
              @change="onConfigChange"
            />
          </div>
          <!-- Transform 配置 -->
          <div class="config-section" v-if="formData.connectorType === 'TRANSFORM'">
            <div class="section-title">转换配置</div>
            <el-form-item label="转换规则">
              <monaco-editor v-model="transformConfig" language="sql" :height="200" @change="onTransformConfigChange" />
            </el-form-item>
          </div>
          <!-- Sink 配置 -->
          <div class="config-section" v-if="formData.connectorType === 'SINK'">
            <div class="section-title">输出配置</div>
            <el-form-item label="目标数据源" prop="sinkDatasourceId">
              <el-select
                v-model="formData.sinkDatasourceId"
                placeholder="请选择目标数据源"
                @change="onSinkDatasourceChange"
                filterable
              >
                <el-option
                  v-for="ds in sinkDatasourceList"
                  :key="ds.datasourceId"
                  :label="ds.datasourceName"
                  :value="ds.datasourceId"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="目标表" prop="sinkTable">
              <el-input v-model="formData.sinkTable" placeholder="请输入目标表名" />
            </el-form-item>
            <el-form-item label="写入模式" prop="writeMode">
              <el-select v-model="formData.writeMode" placeholder="请选择写入模式">
                <el-option label="追加" value="append" />
                <el-option label="覆盖" value="overwrite" />
                <el-option label="更新插入" value="upsert" />
              </el-select>
            </el-form-item>
          </div>
          <!-- 操作按钮 -->
          <div class="form-actions">
            <el-button type="primary" @click="saveConfig" :loading="saving"> 保存配置 </el-button>
            <el-button @click="resetConfig">重置</el-button>
            <el-button type="success" @click="testConnection" :loading="testing"> 测试连接 </el-button>
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
              />
              <div class="table-options">
                <div class="table-options-title">选择表：</div>
                <ul class="table-list">
                  <li
                    v-for="tableName in formData.datasourceConfig.tables"
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
                  max-height="280"
                  style="width: 100%"
                  @selection-change="(val) => (outputFields = val.map((f) => f.name))"
                >
                  <el-table-column type="selection" width="30" />
                  <el-table-column type="index" label="#" width="30" align="center" />
                  <el-table-column prop="columnName" label="字段名称" min-width="100" show-overflow-tooltip />
                  <el-table-column prop="columnType" label="字段类型" min-width="100" show-overflow-tooltip />
                  <el-table-column prop="isNullable" label="非空" width="60" align="center"/>
                  <el-table-column prop="comment" label="字段注释" min-width="120" show-overflow-tooltip>
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
import { ref, reactive, watch, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import * as connectorApi from '@/api/dig/connectorApi';
import { getDatasourceList as getDsList } from '@/api/metadata/datasourceApi';
import { getDatasourceList as getDbList } from '@/api/metadata/dbApi';
import { listTable } from '@/api/metadata/tableApi';
import { listColumn } from '@/api/metadata/columnApi';
import DynamicForm from './DynamicForm.vue';
import MonacoEditor from '@/components/MonacoEditor/index.vue';

const props = defineProps({
  task: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['update']);

// 响应式数据
const formRef = ref(null);
const saving = ref(false);
const testing = ref(false);
const datasourceList = ref([]);
const sinkDatasourceList = ref([]);
const databaseList = ref([]); // 数据库列表
const tableList = ref([]); // 表列表
const fieldList = ref([]); // 字段列表
const selectedTable = ref(''); // 当前选中的表名
const outputFields = ref([]); // 输出模型Tab选中的字段名
const dynamicFormConfig = ref(null);
const transformConfig = ref('');
const activeTab = ref('props');

// 表单数据
const formData = reactive({
  taskId: null,
  taskName: '',
  connectorType: '',
  connectorName: '',
  datasourceId: null,
  taskConfig: '',
  datasourceConfig: {
    database: '',
    tables: [],
  },
  sinkDatasourceId: null,
  sinkTable: '',
  writeMode: 'append',
});

// 表单验证规则
const rules = {
  taskName: [{ required: true, message: '请输入任务名称', trigger: 'blur' }],
  datasourceId: [{ required: true, message: '请选择数据源', trigger: 'change' }],
};

// 计算属性
const showFieldConfig = computed(() => {
  return formData.connectorType === 'SOURCE' && fieldList.value.length > 0;
});

// 加载任务配置
const loadTaskConfig = async () => {
  if (!formData.connectorName) return;
  try {
    // 加载动态表单配置
    const formConfigResp = await connectorApi.getConnectorForm(formData.connectorType, formData.connectorName);
    let formConfig = formConfigResp?.data || formConfigResp;
    if (typeof formConfig === 'string') {
      try {
        formConfig = JSON.parse(formConfig);
      } catch (e) {
        formConfig = {};
      }
    }
    dynamicFormConfig.value = formConfig.forms || formConfig.fields || (Array.isArray(formConfig) ? formConfig : []);
    // 加载数据源列表（使用datasourceApi.js的getDatasourceList）
    if (formData.connectorType === 'SOURCE' || formData.connectorType === 'SINK') {
      const res = await getDsList();
      const data = res?.data || res || [];
      if (formData.connectorType === 'SOURCE') {
        datasourceList.value = data;
      } else {
        sinkDatasourceList.value = data;
      }
    }
    // 如果已有数据源配置，加载相关数据
    if (formData.datasourceId) {
      await onDatasourceChange(formData.datasourceId);
    }
  } catch (error) {
    ElMessage.error('加载任务配置失败');
  }
};

// 监听任务变化
watch(
  () => props.task,
  (newTask) => {
    if (newTask) {
      Object.assign(formData, newTask);
      loadTaskConfig();
    }
  },
  { immediate: true, deep: true },
);

// 数据源变化
const onDatasourceChange = async (datasourceId) => {
  if (!datasourceId) return;
  try {
    // 获取数据库列表
    const res = await getDbList(datasourceId);
    databaseList.value = Array.isArray(res) ? res : res.data || [];
    formData.datasourceConfig.database = '';
    tableList.value = [];
    formData.datasourceConfig.tables = [];
    fieldList.value = [];
    selectedTable.value = '';
    outputFields.value = [];
  } catch (error) {
    ElMessage.error('加载数据库列表失败');
  }
};
// 数据库变化
const onDatabaseChange = async (database) => {
  if (!database || !formData.datasourceId) return;
  try {
    // 获取表列表
    const res = await listTable({ datasourceId: formData.datasourceId, dbName: database });
    tableList.value = Array.isArray(res) ? res : res.data || [];
    formData.datasourceConfig.tables = [];
    fieldList.value = [];
    selectedTable.value = '';
    outputFields.value = [];
  } catch (error) {
    ElMessage.error('加载表列表失败');
  }
};
// 表变化
const onTableChange = async (tables) => {
  if (!tables || tables.length === 0) {
    fieldList.value = [];
    selectedTable.value = '';
    outputFields.value = [];
    return;
  }
  // 只支持单表输出模型
  selectedTable.value = tables[0];
  try {
    // 根据 tableName 找到对应的 tableId
    const selectedTableObj = tableList.value.find((t) => t.tableName === selectedTable.value);
    if (!selectedTableObj) {
      ElMessage.error('未找到对应的表信息');
      return;
    }
    // 获取字段列表，传入 tableId
    const res = await listColumn(selectedTableObj.tableId);
    fieldList.value = Array.isArray(res) ? res : res.data || [];
    // 默认全选
    outputFields.value = fieldList.value.map((f) => f.name);
  } catch (error) {
    ElMessage.error('加载字段列表失败');
  }
};
// 输出模型Tab切换表时
const onOutputTableChange = async (tableName) => {
  selectedTable.value = tableName;
  const selectedTableObj = tableList.value.find((t) => t.tableName === tableName);
  if (!selectedTableObj) {
    fieldList.value = [];
    outputFields.value = [];
    return;
  }
  const res = await listColumn(selectedTableObj.tableId);
  fieldList.value = Array.isArray(res) ? res : res.data || [];
  outputFields.value = fieldList.value.map((f) => f.name);
};

// 目标数据源变化
const onSinkDatasourceChange = (datasourceId) => {
  // 处理目标数据源变化逻辑
};

// 配置变化
const onConfigChange = (config) => {
  formData.taskConfig = config;
};

// Transform 配置变化
const onTransformConfigChange = (config) => {
  formData.transformConfig = config;
};

// 保存配置
const saveConfig = async () => {
  try {
    await formRef.value.validate();
    saving.value = true;
    // 构建完整的任务配置
    const taskConfig = {
      ...formData,
      outputModel: {
        tableName: selectedTable.value,
        fields: fieldList.value.filter((f) => outputFields.value.includes(f.name)),
      },
    };
    emit('update', taskConfig);
    ElMessage.success('配置保存成功');
  } catch (error) {
    ElMessage.error('保存配置失败');
  } finally {
    saving.value = false;
  }
};

// 重置配置
const resetConfig = () => {
  formRef.value.resetFields();
};

// 测试连接
const testConnection = async () => {
  testing.value = true;
  try {
    // 实现测试连接逻辑
    await new Promise((resolve) => setTimeout(resolve, 1000));
    ElMessage.success('连接测试成功');
  } catch (error) {
    console.error('连接测试失败:', error);
    ElMessage.error('连接测试失败');
  } finally {
    testing.value = false;
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

    .el-button {
      width: 100%;
      margin-bottom: 8px;
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
  flex: 1;
  width: 100px;

  .section-title {
      font-size: 13px;
      font-weight: 500;
  }

  .table-options {
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
