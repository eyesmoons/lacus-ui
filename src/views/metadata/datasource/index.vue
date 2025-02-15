<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="90px">
      <el-form-item label="数据源名称" prop="datasourceName">
        <el-input
          v-model="queryParams.datasourceName"
          placeholder="请输入数据源名称"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="数据源类型" prop="type">
        <el-select v-model="queryParams.type" placeholder="请输入数据源类型" clearable filterable>
          <el-option v-for="dict in datasourceTypeOption" :key="dict.name" :label="dict.name" :value="dict.name" />
        </el-select>
      </el-form-item>
      <el-form-item label="启用状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="启用状态" clearable>
          <el-option v-for="dict in datasource_status" :key="dict.value" :label="dict.label" :value="dict.value" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermission="['metadata:datasource:add']"
          >新增</el-button
        >
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Edit"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermission="['metadata:datasource:edit']"
          >修改</el-button
        >
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermission="['metadata:datasource:remove']"
          >删除</el-button
        >
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
    </el-row>

    <el-table v-loading="loading" :data="datasourceList" stripe border @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="数据源名称" show-overflow-tooltip align="left" prop="datasourceName" />
      <el-table-column label="数据源类型" show-overflow-tooltip align="left" prop="type" />
      <el-table-column label="连接信息" show-overflow-tooltip align="left" prop="connectionParams">
        <template #default="scope">
          <el-button type="text" @click="showConnectionDetails(scope.row.connectionParams)"> 查看详情 </el-button>
        </template>
      </el-table-column>
      <el-table-column label="描述" align="left" prop="remark" show-overflow-tooltip />
      <el-table-column label="启用状态" align="center" prop="status">
        <template #default="scope">
          <el-switch
            v-model="scope.row.status"
            :active-value="1"
            :inactive-value="0"
            @change="handleStatusChange(scope.row)"
          />
        </template>
      </el-table-column>
      <el-table-column label="创建时间" align="center" prop="createTime" :show-overflow-tooltip="true" width="160">
        <template #default="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="200px" fixed="right">
        <template #default="scope">
          <el-button-group class="ml-4">
            <el-tooltip content="测试数据源" placement="top" v-if="scope.row.status === 1">
              <el-button
                type="success"
                icon="Switch"
                @click="handleTest(scope.row)"
                v-hasPermission="['metadata:datasource:edit']"
              />
            </el-tooltip>
            <el-tooltip content="同步元数据" placement="top" v-if="scope.row.status === 1">
              <el-button
                type="primary"
                icon="Refresh"
                @click="handleSync(scope.row)"
                v-hasPermission="['metadata:datasource:edit']"
              />
            </el-tooltip>
            <el-tooltip content="编辑" placement="top" v-if="scope.row.status === 1">
              <el-button
                type="warning"
                icon="Edit"
                @click="handleUpdate(scope.row)"
                v-hasPermission="['metadata:datasource:edit']"
              />
            </el-tooltip>
            <el-tooltip content="删除" placement="top" v-if="scope.row.status === 0">
              <el-button
                type="danger"
                icon="Delete"
                @click="handleDelete(scope.row)"
                v-hasPermission="['metadata:datasource:remove']"
              />
            </el-tooltip>
          </el-button-group>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <pagination
      v-show="total > 0"
      :total="total"
      v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 添加或修改对话框 -->
    <el-dialog :title="title" v-model="open" width="600px" append-to-body style="width: 70%">
      <div class="datasource-body">
        <el-form ref="datasourceRef" :model="form" :rules="rules" label-width="100px">
          <!-- 公共信息 -->
          <el-divider direction="vertical"></el-divider><span class="divider-text">基本信息</span>
          <div class="datasource-form">
            <el-row :gutter="24">
              <el-col :span="12">
                <el-form-item label="数据源名称" prop="datasourceName">
                  <el-input v-model="form.datasourceName" placeholder="请输入数据源名称" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="数据源类型" prop="type">
                  <el-select
                    v-model="form.type"
                    placeholder="请选择数据源类型"
                    style="width: 100%"
                    @change="handleTypeChange"
                  >
                    <el-option
                      v-for="dict in datasourceTypeOption"
                      :key="dict.name"
                      :label="dict.name"
                      :value="dict.name"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="24">
              <el-col :span="12">
                <el-form-item label="输入/输出源" prop="sourceType">
                  <el-select v-model="form.sourceType" placeholder="请选择输入/输出源类型" style="width: 100%">
                    <el-option
                      v-for="item in sourceTypeOptions"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="启用状态" prop="status">
                  <el-radio-group v-model="form.status">
                    <el-radio v-for="dict in datasource_status" :key="dict.value" :label="dict.value">
                      {{ dict.label }}
                    </el-radio>
                  </el-radio-group>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="24">
                <el-form-item label="描述" prop="remark">
                  <el-input type="textarea" v-model="form.remark" placeholder="请输入描述" />
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <!-- 动态配置信息 -->
          <template v-if="form.type">
            <el-divider direction="vertical"></el-divider>
            <span class="divider-text">连接信息</span>
            <div class="datasource-form">
              <template v-if="connectionParamsFields.length > 0">
                <el-row :gutter="24">
                  <template v-for="(field, index) in connectionParamsFields" :key="field.name">
                    <el-col :span="12">
                      <el-form-item
                        :label="field.name"
                        :prop="'connectionParamsObj.' + field.name"
                        :rules="
                          field.required
                            ? [{ required: true, message: field.description + '不能为空', trigger: 'blur' }]
                            : []
                        "
                      >
                        <el-input
                          v-model="form.connectionParamsObj[field.name]"
                          :placeholder="'请输入' + field.description"
                          :type="field.name.toLowerCase().includes('password') ? 'password' : 'text'"
                          @change="updateConnectionParams"
                        />
                      </el-form-item>
                    </el-col>
                  </template>
                </el-row>
              </template>
              <el-empty v-else description="暂无连接参数配置" />
            </div>
          </template>
        </el-form>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 同步元数据弹框 -->
    <el-dialog title="同步元数据" v-model="syncMetaDialog" append-to-body>
      <el-form :model="form">
        <el-form-item label="请选择库表：" :label-width="100">
          <el-tree
            class="tree-border"
            :data="dbTableOptions"
            lazy
            :load="loadTables"
            show-checkbox
            ref="dbTableRef"
            node-key="uniqueFlag"
            empty-text="加载中，请稍候"
            :props="{ label: 'label', isLeaf: 'isLeaf' }"
          >
          </el-tree>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="cancelSync">取消</el-button>
        <el-button type="primary" @click="syncDbTables">确定</el-button>
      </div>
    </el-dialog>

    <!-- 连接信息详情对话框 -->
    <el-dialog title="连接信息详情" v-model="connectionDetailsDialogVisible" width="600px">
      <el-table :data="parsedConnectionDetails" style="width: 100%">
        <el-table-column prop="key" label="字段" width="150" />
        <el-table-column prop="value" label="值" />
      </el-table>
      <template #footer>
        <el-button @click="connectionDetailsDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="datasource">
import * as datasourceApi from '@/api/metadata/datasourceApi';
import * as schemaApi from '@/api/metadata/schemaApi';
import * as datasourcePluginApi from '@/api/metadata/datasourcePluginApi';
import { ref } from 'vue';

const { proxy } = getCurrentInstance();
const { datasource_status } = proxy.useDict('datasource_status');
const datasourceList = ref([]);
const open = ref(false);
const syncMetaDialog = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const title = ref('');
const dbTableOptions = ref([]);
const checkedKeys = ref([]);
const expandedKeys = ref([]);
const dbTableRef = ref(null);
const sourceTypeOptions = [
  {
    value: 1,
    label: '输入源',
  },
  {
    value: 2,
    label: '输出源',
  },
];
const datasourceTypeOption = ref([]);
const connectionParamsFields = ref([]);
const connectionDetailsDialogVisible = ref(false);
const parsedConnectionDetails = ref([]);

const data = reactive({
  form: {
    datasourceId: undefined,
    datasourceName: undefined,
    type: undefined,
    ip: undefined,
    port: 0,
    status: '0',
    remark: undefined,
    connectionParams: undefined,
    connectionParamsObj: {},
  },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    datasourceName: undefined,
    type: undefined,
    ip: undefined,
    status: undefined,
  },
  rules: {
    datasourceName: [{ required: true, message: '数据源名称不能为空', trigger: 'blur' }],
    type: [{ required: true, message: '数据源类型不能为空', trigger: 'blur' }],
    ip: [{ required: true, message: 'ip不能为空', trigger: 'blur' }],
    port: [{ required: true, message: '端口不能为空', trigger: 'blur' }],
    defaultDbName: [{ required: true, message: '数据库不能为空', trigger: 'blur' }],
    username: [{ required: true, message: '用户名不能为空', trigger: 'blur' }],
  },
});

const { queryParams, form, rules } = toRefs(data);

/** 查询数据源列表 */
function getList() {
  loading.value = true;
  datasourceApi
    .listDatasource(queryParams.value)
    .then((response) => {
      datasourceList.value = response.rows;
      total.value = response.total;
    })
    .finally(() => {
      loading.value = false;
    });
}

/** 取消按钮 */
function cancel() {
  open.value = false;
  reset();
}

/** 表单重置 */
function reset() {
  form.value = {
    datasourceId: undefined,
    datasourceName: undefined,
    type: undefined,
    status: '0',
    remark: undefined,
    connectionParams: undefined,
    connectionParamsObj: {},
  };
  proxy.resetForm('datasourceRef');
}

function resetTreeChecked() {
  checkedKeys.value = [];
  expandedKeys.value = [];
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.value.pageNum = 1;
  getList();
}

/** 重置按钮操作 */
function resetQuery() {
  proxy.resetForm('queryRef');
  handleQuery();
}

/** 多选框选中数据 */
function handleSelectionChange(selection) {
  ids.value = selection.map((item) => item.datasourceId);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}

/** 新增按钮操作 */
function handleAdd() {
  reset();
  initDatasourceTypeOption();
  form.value = {
    datasourceId: undefined,
    datasourceName: undefined,
    type: undefined,
    status: '0',
    remark: undefined,
    connectionParams: undefined,
    connectionParamsObj: {},
  };
  open.value = true;
  title.value = '新增数据源';
}

function initDatasourceTypeOption() {
  datasourcePluginApi.list().then((response) => {
    datasourceTypeOption.value = response;
  });
}

function handleTest(row) {
  reset();
  const datasourceId = row.datasourceId || ids.value;
  datasourceApi
    .testDatasource(datasourceId)
    .then((response) => {
      if (response) {
        proxy.$modal.msgSuccess('测试成功');
      } else {
        proxy.$modal.msgError('测试失败');
      }
    })
    .catch(() => {});
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  initDatasourceTypeOption();
  const datasourceId = row.datasourceId || ids.value;
  datasourceApi.getDatasource(datasourceId).then((response) => {
    form.value = {
      ...response,
      connectionParamsObj: response.connectionParams ? JSON.parse(response.connectionParams) : {},
    };
    // 确保连接参数字段被正确解析并显示
    connectionParamsFields.value = Object.entries(form.value.connectionParamsObj).map(([name, value]) => ({
      name,
      description: name,
      required: false,
      defaultValue: value,
    }));
    open.value = true;
    title.value = '修改数据源';
  });
}

function handleStatusChange(row) {
  const text = row.status ? '启用' : '停用';
  proxy.$modal
    .confirm(`确认要"${text}""${row.datasourceName}"数据源吗?`)
    .then(() => datasourceApi.changeStatus(row.datasourceId, row.status))
    .then(() => {
      proxy.$modal.msgSuccess(`${text}成功`);
    })
    .catch(() => {
      row.status = row.status === '0' ? '1' : '0';
    });
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs.datasourceRef.validate((valid) => {
    if (valid) {
      updateConnectionParams();
      if (form.value.datasourceId !== undefined) {
        datasourceApi.updateDatasource(form.value).then((response) => {
          proxy.$modal.msgSuccess('修改成功');
          open.value = false;
          getList();
        });
      } else {
        datasourceApi.addDatasource(form.value).then((response) => {
          proxy.$modal.msgSuccess('新增成功');
          open.value = false;
          getList();
        });
      }
    }
  });
}

/** 删除按钮操作 */
function handleDelete(row) {
  const datasourceIds = row.datasourceId || ids.value;
  proxy.$modal
    .confirm(`是否确认删除ID为"${datasourceIds}"的数据源吗？`)
    .then(() => datasourceApi.deleteDatasource(datasourceIds))
    .then(() => {
      getList();
      proxy.$modal.msgSuccess('删除成功');
    })
    .catch(() => {});
}

function handleSync(row) {
  form.value.datasourceId = row.datasourceId;
  getSchemaDbList(row.datasourceId);
  syncMetaDialog.value = true;
}

function getSchemaDbList(datasourceId) {
  schemaApi
    .getSchemaDbList(datasourceId)
    .then((response) => {
      dbTableOptions.value = response.schemaDbList;
      checkedKeys.value = response.checkedKeys;
      expandedKeys.value = response.expandedKeys;
    })
    .catch(() => {});
}

function loadTables(node, resolve) {
  const data = node.data;
  if (node.level === 0) {
    return resolve([{ name: '' }]);
  }
  if (node.level > 1) return resolve([]);
  setTimeout(() => {
    schemaApi.getSchemaTableList(data.datasourceId, data.dbName).then((response) => {
      resolve(response);
    });
  }, 500);
}

function cancelSync() {
  syncMetaDialog.value = false;
  reset();
  resetTreeChecked();
}

function syncDbTables() {
  form.value.dbTables = getAllCheckedKeys();
  schemaApi.syncDbTables(form.value).then((response) => {
    proxy.$modal.msgSuccess('同步成功');
    syncMetaDialog.value = false;
    resetTreeChecked();
    getList();
  });
}

function getAllCheckedKeys() {
  // 目前被选中的节点
  const checkedKeys = dbTableRef.value.getCheckedKeys();
  // 半选中的节点
  const halfCheckedKeys = dbTableRef.value.getHalfCheckedKeys();
  checkedKeys.unshift.apply(checkedKeys, halfCheckedKeys);
  return checkedKeys;
}

// 添加新方法
function handleTypeChange(newType) {
  if (newType) {
    form.value.connectionParamsObj = {};
    form.value.connectionParams = undefined;
    datasourcePluginApi.getByName(newType).then((response) => {
      if (response?.connectionParams) {
        try {
          const params = JSON.parse(response.connectionParams);
          if (Array.isArray(params)) {
            connectionParamsFields.value = params;
            const defaultValues = {};
            params.forEach((field) => {
              if (field.defaultValue !== undefined) {
                defaultValues[field.name] = field.defaultValue;
              }
            });
            form.value.connectionParamsObj = defaultValues;
          } else if (typeof params === 'object') {
            const fields = [];
            const defaultValues = {};
            Object.entries(params).forEach(([name, config]) => {
              const field = {
                name,
                description: config.description || name,
                required: config.required || false,
                defaultValue: config.defaultValue,
                ...config,
              };
              fields.push(field);
              if (field.defaultValue !== undefined) {
                defaultValues[name] = field.defaultValue;
              }
            });
            connectionParamsFields.value = fields;
            form.value.connectionParamsObj = defaultValues;
          }
          updateConnectionParams();
        } catch (e) {
          console.error('解析连接参数失败:', e);
          connectionParamsFields.value = [];
        }
      } else {
        connectionParamsFields.value = [];
      }
    });
  } else {
    connectionParamsFields.value = [];
    form.value.connectionParamsObj = {};
    form.value.connectionParams = undefined;
  }
}

// 更新连接参数
function updateConnectionParams() {
  form.value.connectionParams = JSON.stringify(form.value.connectionParamsObj);
}

function showConnectionDetails(details) {
  try {
    const parsedDetails = JSON.parse(details);
    parsedConnectionDetails.value = Object.entries(parsedDetails).map(([key, value]) => ({ key, value }));
  } catch (e) {
    parsedConnectionDetails.value = [{ key: '错误', value: '无法解析连接信息' }];
  }
  connectionDetailsDialogVisible.value = true;
}

getList();
</script>
<style>
.datasource-form {
  margin-top: 15px;
  border: 1px dashed #e2dcd2;
  padding: 15px 20px;
}

.el-divider--vertical {
  border-left: 2px #1c84c6 solid;
  margin: 0 5px;
}

.divider-text {
  display: inline-block;
  margin-top: 10px;
}

.datasource-body {
  height: 500px;
  overflow-y: scroll;
}

pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  background-color: #f8f8f8;
  padding: 10px;
  border-radius: 5px;
  overflow-x: auto;
}
</style>
