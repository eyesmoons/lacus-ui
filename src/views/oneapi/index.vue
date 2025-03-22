<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="90px">
      <el-form-item label="接口名称" prop="apiName">
        <el-input v-model="queryParams.apiName" placeholder="请输入接口名称" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="接口地址" prop="apiUrl">
        <el-input v-model="queryParams.apiUrl" placeholder="请输入接口地址" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="数据源" prop="datasourceId">
        <el-select v-model="queryParams.datasourceId" placeholder="请选择数据源" clearable>
          <el-option
            v-for="item in datasourceOptions"
            :key="item.datasourceId"
            :label="item.datasourceName"
            :value="item.datasourceId"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="接口状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择接口状态" clearable>
          <el-option label="上线" :value="1" />
          <el-option label="下线" :value="0" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="Plus" @click="handleAdd">构建API</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
    </el-row>

    <el-table v-loading="loading" :data="apiList" stripe border @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="接口名称" align="left" prop="apiName">
        <template #default="scope">
          <el-link type="primary" :underline="false" @click="handleDetail(scope.row)">{{ scope.row.apiName }}</el-link>
        </template>
      </el-table-column>
      <el-table-column label="数据源" align="left" prop="datasourceName" />
      <el-table-column label="接口地址" align="left" prop="apiUrl" show-overflow-tooltip />
      <el-table-column label="请求方式" align="left" prop="reqMethod" />
      <el-table-column label="接口描述" align="left" prop="apiDesc" show-overflow-tooltip />
      <el-table-column label="接口状态" align="center" prop="status">
        <template #default="scope">
          <el-tag type="success" v-if="scope.row.status === 1">上线</el-tag>
          <el-tag type="info" v-else>下线</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" fixed="right" width="220">
        <template #default="scope">
          <el-button-group class="ml-4">
            <el-tooltip content="测试" placement="top">
              <el-button type="success" icon="VideoPlay" @click="handleTest(scope.row)" />
            </el-tooltip>
            <el-tooltip content="编辑" placement="top" v-if="scope.row.status === 0">
              <el-button type="primary" icon="Edit" @click="handleUpdate(scope.row)" />
            </el-tooltip>
            <el-tooltip content="删除" placement="top" v-if="scope.row.status === 0">
              <el-button type="danger" icon="Delete" @click="handleDelete(scope.row)" />
            </el-tooltip>
            <el-tooltip content="上线" placement="top" v-if="scope.row.status === 0">
              <el-button type="warning" icon="Top" @click="handleStatusChange(scope.row, 1)" />
            </el-tooltip>
            <el-tooltip content="下线" placement="top" v-if="scope.row.status === 1">
              <el-button type="info" icon="Bottom" @click="handleStatusChange(scope.row, 0)" />
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

    <!-- 测试API对话框 -->
    <el-dialog title="接口测试" v-model="testOpen" width="900px" append-to-body>
      <div class="test-container">
        <el-row :gutter="20">
          <el-col :span="10">
            <div class="test-params">
              <h3>请求参数</h3>
              <el-table :data="testParams" border stripe style="width: 100%">
                <el-table-column prop="columnName" label="参数名称" width="120" />
                <el-table-column prop="columnType" label="参数类型" width="100" />
                <el-table-column prop="required" label="是否必填" width="80">
                  <template #default="scope">
                    <el-tag :type="scope.row.required ? 'danger' : 'info'">
                      {{ scope.row.required ? '是' : '否' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="参数值" min-width="180" fixed="right">
                  <template #default="scope">
                    <el-tooltip :content="scope.row.description" placement="top" :disabled="!scope.row.description">
                      <el-input
                        v-if="scope.row.columnType === 'string'"
                        v-model="scope.row.value"
                        :placeholder="`请输入${scope.row.columnName}`"
                      />
                      <el-input-number
                        v-else-if="scope.row.columnType === 'number' || scope.row.columnType === 'integer'"
                        v-model="scope.row.value"
                        :placeholder="`请输入${scope.row.columnName}`"
                      />
                      <el-switch v-else-if="scope.row.columnType === 'boolean'" v-model="scope.row.value" />
                      <el-date-picker
                        v-else-if="scope.row.columnType === 'date'"
                        v-model="scope.row.value"
                        type="date"
                        placeholder="选择日期"
                      />
                      <el-input v-else v-model="scope.row.value" :placeholder="`请输入${scope.row.columnName}`" />
                    </el-tooltip>
                  </template>
                </el-table-column>
              </el-table>
              <div class="mt-3">
                <el-button type="primary" @click="submitTest">执行测试</el-button>
              </div>
            </div>
          </el-col>
          <el-col :span="14">
            <div class="test-result">
              <div v-if="testResult">
                <h3>
                  测试结果
                  <el-tag :type="testResult.code === 0 ? 'success' : 'danger'">
                    {{ testResult.code === 0 ? '成功' : '失败' }}
                  </el-tag>
                </h3>
                <div class="result-info">
                  <el-descriptions :column="1" border>
                    <el-descriptions-item label="请求时间">{{
                      parseTime(testResult.requestTime)
                    }}</el-descriptions-item>
                    <el-descriptions-item label="请求耗时">{{ testResult.costTime }} ms</el-descriptions-item>
                    <el-descriptions-item label="请求日志" :span="2">
                      <el-scrollbar max-height="150px">
                        <pre style="white-space: pre-wrap; word-wrap: break-word">{{
                          formatLogContent(testResult.debugInfo)
                        }}</pre>
                      </el-scrollbar>
                    </el-descriptions-item>
                  </el-descriptions>
                </div>
                <el-divider />
                <el-tabs v-model="activeTab">
                  <el-tab-pane label="响应数据" name="data">
                    <div class="result-data">
                      <monaco-editor v-model="testResult.data" language="sql" height="300px" readonly="readonly" />
                    </div>
                  </el-tab-pane>
                  <el-tab-pane label="响应头" name="headers" v-if="testResult.headers">
                    <div class="result-headers">
                      <el-descriptions :column="1" border>
                        <el-descriptions-item v-for="(value, key) in testResult.headers" :key="key" :label="key">
                          {{ value }}
                        </el-descriptions-item>
                      </el-descriptions>
                    </div>
                  </el-tab-pane>
                </el-tabs>
              </div>
              <div v-else class="no-result">
                <el-empty description="暂无测试结果" />
              </div>
            </div>
          </el-col>
        </el-row>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { parseTime } from '@/utils/dateUtil';
import { ElMessage, ElMessageBox } from 'element-plus';
import { listApiInfo, deleteApiInfo, testApiInfoOnline, updateApiStatus, getApiInfo } from '@/api/oneapi/apiInfoApi';
import { getDatasourceList } from '@/api/metadata/datasourceApi';
import { useRouter } from 'vue-router';
import MonacoEditor from '@/components/MonacoEditor/index.vue';
const router = useRouter();

// 遮罩层
const loading = ref(false);
// 选中数组
const ids = ref([]);
// 非单个禁用
const single = ref(true);
// 非多个禁用
const multiple = ref(true);
// 显示搜索条件
const showSearch = ref(true);
// 总条数
const total = ref(0);
// API列表
const apiList = ref([]);
// 查询参数
const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  apiName: undefined,
  apiUrl: undefined,
  datasourceId: undefined,
  status: undefined,
});

// 数据源选项
const datasourceOptions = ref([]);

// 测试相关变量
const testOpen = ref(false);
const testParams = ref([]);
const testResult = ref(null);
const activeTab = ref('data');
const testHistory = ref([]);

const currentTestApi = ref(null);

/** 查询API列表 */
function getList() {
  loading.value = true;
  listApiInfo(queryParams).then((response) => {
    apiList.value = response.rows;
    total.value = response.total;
    loading.value = false;
  });
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.pageNum = 1;
  getList();
}

/** 重置按钮操作 */
function resetQuery() {
  queryParams.apiName = undefined;
  queryParams.apiUrl = undefined;
  queryParams.datasourceId = undefined;
  queryParams.status = undefined;
  handleQuery();
}

/** 多选框选中数据 */
function handleSelectionChange(selection) {
  ids.value = selection.map((item) => item.apiId);
  single.value = selection.length !== 1;
  multiple.value = !selection.length;
}

/** 新增按钮操作 */
function handleAdd() {
  // 跳转到新增页面
  router.push('/oneapi/add');
}

/** 修改按钮操作 */
function handleUpdate(row) {
  // 跳转到编辑页面
  router.push(`/oneapi/edit/${row.apiId}`);
}

/** 详情按钮操作 */
function handleDetail(row) {
  // 跳转到详情页面
  router.push(`/oneapi/detail/${row.apiId}`);
}

/** 删除按钮操作 */
function handleDelete(row) {
  const apiIds = row.apiId || ids.value;
  ElMessageBox.confirm('是否确认删除所选API?', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(function () {
      return deleteApiInfo(apiIds);
    })
    .then(() => {
      getList();
      ElMessage.success('删除成功');
    })
    .catch(() => {});
}

function formatLogContent(logStr) {
  if (!logStr) return '';

  let result = '';
  logStr.split('！').forEach((line) => {
    result += line + '\n';
  });
  return result;
}

/** 测试按钮操作 */
function handleTest(row) {
  currentTestApi.value = row;
  // 根据API配置生成测试参数
  getApiInfo(row.apiId).then((response) => {
    const config = JSON.parse(response.apiConfig);
    testParams.value = config.apiParams.requestParams.map((param) => ({
      columnName: param.columnName,
      columnType: param.columnType,
      value: param.defaultValue || '',
      required: param.required,
      description: param.description || '',
    }));
    testResult.value = null;
    testOpen.value = true;
  });
}

/** 提交测试 */
function submitTest() {
  if (!currentTestApi.value) return;

  // 验证必填参数
  const missingParams = testParams.value.filter((param) => param.required && !param.value);
  if (missingParams.length > 0) {
    ElMessage.warning(`请填写必填参数: ${missingParams.map((p) => p.columnName).join(', ')}`);
    return;
  }

  // 构建测试参数
  const testData = {
    ...currentTestApi.value,
    params: [],
  };

  let apiConfig = JSON.parse(testData.apiConfig);
  apiConfig.apiParams.requestParams = testParams.value;
  testData.apiConfig = JSON.stringify(apiConfig);
  // 保存当前测试参数到历史记录
  testHistory.value.push({
    timestamp: new Date().getTime(),
    params: JSON.parse(JSON.stringify(testParams.value)),
  });
  // 只保留最近的5条记录
  if (testHistory.value.length > 5) {
    testHistory.value.shift();
  }

  // 调用测试API
  testApiInfoOnline(testData)
    .then((response) => {
      testResult.value = {
        ...response,
        requestTime: new Date().getTime(),
        headers: response.headers,
      };
      console.log(testResult.value);
    })
    .catch((error) => {
      testResult.value = {
        code: error.code || -1,
        data: error.message || '测试失败',
        costTime: 0,
        requestTime: new Date().getTime(),
      };
    });
}

/** 修改状态操作 */
function handleStatusChange(row, status) {
  ElMessageBox.confirm(`确认要${status === 1 ? '上线' : '下线'}「${row.apiName}」接口吗?`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(function () {
      return updateApiStatus(row.apiId, status);
    })
    .then(() => {
      getList();
      ElMessage.success(`${status === 1 ? '上线' : '下线'}成功`);
    })
    .catch(() => {});
}

// 获取数据源列表
function loadDatasourceOptions() {
  getDatasourceList('', null)
    .then((response) => {
      datasourceOptions.value = response || [];
    })
    .catch(() => {
      ElMessage.error('获取数据源列表失败');
    });
}

onMounted(() => {
  getList();
  loadDatasourceOptions();
});
</script>

<style scoped>
.app-container {
  padding: 20px;
}

.mb8 {
  margin-bottom: 8px;
}

.test-container {
  height: 500px;
  overflow-y: auto;
}

.test-params,
.test-result {
  height: 100%;
  padding: 10px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.test-result {
  overflow-y: auto;
}

.result-info {
  margin-bottom: 10px;
}

.result-data {
  background-color: #f5f7fa;
  padding: 10px;
  border-radius: 4px;
  max-height: 300px;
  overflow-y: auto;
}

.no-result {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
}
</style>
