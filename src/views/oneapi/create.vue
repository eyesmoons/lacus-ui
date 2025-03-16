<template>
  <div class="app-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>{{ isEdit ? '编辑接口' : '新建接口' }}</span>
        </div>
      </template>

      <!-- 步骤条 -->
      <el-steps :active="activeStep" finish-status="success" simple style="margin-bottom: 20px">
        <el-step title="基本信息" />
        <el-step title="SQL配置" />
        <el-step title="请求参数" />
        <el-step title="API测试" />
      </el-steps>
    </el-card>

    <!-- 步骤内容区域 -->
    <el-card style="margin-top: 20px; width: 100%; min-height: calc(100vh - 400px); margin-bottom: 60px">
      <div class="step-content">
        <!-- 步骤1：接口信息配置 -->
        <div v-if="activeStep === 1">
          <el-form ref="apiInfoFormRef" :model="form" :rules="rules" label-width="120px">
            <el-row :gutter="24">
              <el-col :span="12">
                <el-form-item label="接口名称" prop="apiName">
                  <el-input v-model="form.apiName" placeholder="请输入接口名称" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="请求方式" prop="reqMethod">
                  <el-select v-model="form.reqMethod" placeholder="请选择请求方式" style="width: 100%">
                    <el-option label="GET" value="GET" />
                    <el-option label="POST" value="POST" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="24">
              <el-col :span="24">
                <el-form-item label="接口地址" prop="apiUrl">
                  <el-input v-model="form.apiUrl" placeholder="请输入接口地址">
                    <template #prepend>
                      <div style="width: 55px; text-align: center">/data/</div>
                    </template>
                  </el-input>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="24">
              <el-col :span="12">
                <el-form-item label="超时时间(秒)" prop="queryTimeout">
                  <el-input-number v-model="form.queryTimeout" :min="1" :max="10" style="width: 100%" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="限制条数" prop="limitCount">
                  <el-input-number v-model="form.limitCount" :min="1" :max="10000" style="width: 100%" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="24">
                <el-form-item label="接口描述" prop="apiDesc">
                  <el-input type="textarea" v-model="form.apiDesc" placeholder="请输入接口描述" />
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </div>

        <!-- 步骤2：SQL脚本配置 -->
        <div v-if="activeStep === 2">
          <el-form ref="sqlFormRef" :model="form" :rules="rules" label-width="120px">
            <el-form-item label="选择数据源" prop="datasourceId">
              <el-select v-model="form.datasourceId" placeholder="请选择数据源" style="width: 100%">
                <el-option
                  v-for="item in datasourceOptions"
                  :key="item.datasourceId"
                  :label="item.datasourceName"
                  :value="item.datasourceId"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="SQL脚本" prop="sqlScript">
              <el-input
                type="textarea"
                v-model="form.sqlScript"
                placeholder="请输入SQL脚本，支持Mybatis语法"
                :rows="10"
              />
            </el-form-item>
          </el-form>
        </div>

        <!-- 步骤3：请求参数配置 -->
        <div v-if="activeStep === 3" class="params-container">
          <div class="params-section">
            <h4>请求参数</h4>
            <el-table :data="requestParams" border style="width: 100%">
              <el-table-column label="参数名称" prop="columnName" width="180">
                <template #default="scope">
                  <el-input v-model="scope.row.columnName" placeholder="参数名称" />
                </template>
              </el-table-column>
              <el-table-column label="参数类型" prop="columnType" width="180">
                <template #default="scope">
                  <el-select v-model="scope.row.columnType" placeholder="参数类型" style="width: 100%">
                    <el-option
                      v-for="item in columnTypeOptions"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column label="是否必填" prop="isMust" width="100">
                <template #default="scope">
                  <el-select v-model="scope.row.isMust" placeholder="是否必填" style="width: 100%">
                    <el-option :label="'是'" :value="1" />
                    <el-option :label="'否'" :value="0" />
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column label="实例值" prop="columnDemo">
                <template #default="scope">
                  <el-input v-model="scope.row.columnDemo" placeholder="实例值" />
                </template>
              </el-table-column>
              <el-table-column label="描述" prop="columnDesc">
                <template #default="scope">
                  <el-input v-model="scope.row.columnDesc" placeholder="描述" />
                </template>
              </el-table-column>
            </el-table>
          </div>

          <div class="params-section">
            <div class="response-header">
              <h4>返回参数</h4>
              <el-switch
                v-model="form.isPaging"
                active-text="结果集是否分页"
                :active-value="1"
                :inactive-value="0"
                @change="handlePagingChange"
              />
            </div>
            <el-table :data="responseParams" border style="width: 100%">
              <el-table-column label="参数名称" prop="columnName" width="180">
                <template #default="scope">
                  <el-input v-model="scope.row.columnName" placeholder="参数名称" />
                </template>
              </el-table-column>
              <el-table-column label="参数类型" prop="columnType" width="180">
                <template #default="scope">
                  <el-select v-model="scope.row.columnType" placeholder="参数类型" style="width: 100%">
                    <el-option
                      v-for="item in columnTypeOptions"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column label="描述" prop="columnDesc">
                <template #default="scope">
                  <el-input v-model="scope.row.columnDesc" placeholder="描述" />
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>

        <!-- 步骤4：API测试 -->
        <div v-if="activeStep === 4" class="test-container">
          <el-row :gutter="24">
            <!-- 左侧：请求参数配置 -->
            <el-col :span="12">
              <div class="test-params-panel">
                <div class="panel-header">
                  <h4>请求参数配置</h4>
                </div>
                <div class="panel-content">
                  <el-form :model="testForm" label-width="120px">
                    <el-form-item
                      v-for="param in requestParams"
                      :key="param.columnName"
                      :label="param.columnName"
                      :prop="param.columnName"
                      :required="param.isMust === 1"
                    >
                      <el-input v-model="testForm[param.columnName]" :placeholder="param.columnDesc" />
                    </el-form-item>
                  </el-form>
                </div>
              </div>
            </el-col>
            <!-- 右侧：测试结果 -->
            <el-col :span="12">
              <div class="test-result-panel">
                <div class="panel-header">
                  <h4>测试结果</h4>
                </div>
                <div class="panel-content">
                  <div v-if="testResult" class="test-result-content">
                    <div class="result-info">
                      <div class="info-item">
                        <span class="label">地址：</span>
                        <span class="value">{{ form.reqMethod }} /data/{{ form.apiUrl }}</span>
                      </div>
                      <div class="info-item">
                        <span class="label">状态：</span>
                        <span class="value" :class="testResult.code === 0 ? 'success' : 'error'">
                          {{ testResult.code === 0 ? '成功' : '失败' }}
                        </span>
                      </div>
                      <div class="info-item">
                        <span class="label">耗时：</span>
                        <span class="value">{{ testResult.costTime }} ms</span>
                      </div>
                        <div class="info-item">
                            <span class="label">日志：</span>
                            <span class="value">{{ testResult.debugInfo }}</span>
                        </div>
                    </div>
                    <div class="result-data">
                      <span class="label">响应结果：</span>
                      <pre class="json-viewer" :class="testResult.code === 0 ? 'success' : 'error'">{{
                        testResult.data
                      }}</pre>
                    </div>
                  </div>
                  <div v-else class="no-result">暂无测试结果</div>
                </div>
              </div>
            </el-col>
          </el-row>
        </div>
      </div>

      <!-- 底部操作栏 -->
      <div
        class="bottom-button-container"
        style="
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background-color: #fff;
          padding: 10px 20px;
          text-align: center;
          box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.1);
        "
      >
        <el-button @click="handleCancel">取消</el-button>
        <el-button @click="handlePrev" v-if="activeStep > 1">上一步</el-button>
        <el-button type="primary" @click="handleNext" v-if="activeStep < 4">下一步</el-button>
        <el-button type="success" @click="handleTest" v-if="activeStep === 4">测试</el-button>
        <el-button type="primary" @click="handleSave" v-if="activeStep === 4">保存</el-button>
      </div>
    </el-card>

    <!-- 测试结果对话框 -->
    <el-dialog title="测试结果" v-model="testDialogVisible" width="800px">
      <div v-if="testResult">
        <div class="test-result-info">
          <p>耗时：{{ testResult.costTime }} ms</p>
          <p>状态：{{ testResult.code === 0 ? '成功' : '失败' }}</p>
        </div>
        <el-divider />
        <div class="test-result-data">
          <pre>{{ JSON.stringify(testResult.data, null, 2) }}</pre>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import {
  getApiInfo,
  addApiInfo,
  updateApiInfo,
  parseSql,
  getColTypeList,
  testApiInfo,
  testApiInfoOnline,
} from '@/api/oneapi/apiInfoApi';
import { getDatasourceList } from '@/api/metadata/datasourceApi';

const route = useRoute();
const router = useRouter();

// 是否为编辑模式
const isEdit = computed(() => {
  return route.path.includes('/edit');
});

// 当前步骤
const activeStep = ref(1);

// 表单引用
const apiInfoFormRef = ref(null);
const sqlFormRef = ref(null);

// 表单数据
const form = reactive({
  apiId: undefined,
  apiName: '',
  groupId: undefined,
  reqMethod: 'GET',
  apiUrl: '',
  queryTimeout: 3,
  limitCount: 1000,
  apiDesc: '',
  datasourceId: undefined,
  sqlScript: '',
  isPaging: 0,
  apiConfig: '',
});

// 表单验证规则
const rules = {
  apiName: [
    { required: true, message: '请输入接口名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' },
  ],
  reqMethod: [{ required: true, message: '请选择请求方式', trigger: 'change' }],
  apiUrl: [{ required: true, message: '请输入接口地址', trigger: 'blur' }],
  queryTimeout: [{ required: true, message: '请输入超时时间', trigger: 'blur' }],
  limitCount: [{ required: true, message: '请输入限制条数', trigger: 'blur' }],
  datasourceId: [{ required: true, message: '请选择数据源', trigger: 'change' }],
  sqlScript: [{ required: true, message: '请输入SQL脚本', trigger: 'blur' }],
};

// 数据源选项
const datasourceOptions = ref([]);

// 字段类型选项
const columnTypeOptions = ref([]);

// 请求参数
const requestParams = ref([]);

// 响应参数
const responseParams = ref([]);

// 测试结果
const testResult = ref(null);

// 测试表单数据
const testForm = reactive({});

// 获取API详情
function getDetail(apiId) {
  getApiInfo(apiId)
    .then((response) => {
      const apiData = response.data;
      // 填充表单数据
      Object.assign(form, apiData);

      // 解析API配置
      if (apiData.apiConfig) {
        try {
          const config = JSON.parse(apiData.apiConfig);
          form.sqlScript = config.sqlScript;
          form.isPaging = config.isPaging;
          requestParams.value = config.requestParams || [];
        } catch (error) {
          console.error('解析API配置失败', error);
        }
      }
    })
    .catch(() => {
      ElMessage.error('获取API详情失败');
      router.push('/oneapi');
    });
}

// 获取字段类型列表
function getColumnTypes() {
  getColTypeList().then((response) => {
    columnTypeOptions.value = response.map((item) => ({
      label: item.desc,
      value: item.name,
    }));
  });
}

// 下一步操作
function handleNext() {
  if (activeStep.value === 1) {
    apiInfoFormRef.value.validate((valid) => {
      if (valid) {
        activeStep.value++;
      }
    });
  } else if (activeStep.value === 2) {
    sqlFormRef.value.validate((valid) => {
      if (valid) {
        if (!form.sqlScript || !form.datasourceId) {
          ElMessage.warning('请先选择数据源并输入SQL脚本');
          return;
        }

        parseSql({
          datasourceId: form.datasourceId,
          sqlScript: form.sqlScript,
        })
          .then((response) => {
            const reqParams = response.requestParams;
            const returnParams = response.returnParams;
            requestParams.value = reqParams.map((item) => ({
              columnName: item.columnName,
              columnType: item.columnType || 'STRING',
              isMust: 0,
              columnDemo: '',
              columnDesc: '',
            }));

            responseParams.value = returnParams.map((item) => ({
              columnName: item.columnName,
              columnType: item.columnType || 'STRING',
              columnDesc: '',
            }));

            ElMessage.success('SQL解析成功');
            activeStep.value = 3;
          })
          .catch(() => {
            ElMessage.error('SQL解析失败');
          });
      }
    });
  } else if (activeStep.value === 3) {
    // 验证请求参数和响应参数是否已配置
    if (requestParams.value.length === 0) {
      ElMessage.warning('请配置请求参数');
      return;
    }
    // 验证所有必填参数是否已填写
    const hasEmptyRequired = requestParams.value.some((param) => {
      return param.isMust === 1 && (!param.columnName || !param.columnType);
    });
    if (hasEmptyRequired) {
      ElMessage.warning('请填写所有必填参数的信息');
      return;
    }
    activeStep.value++;
  }
}

// 上一步操作
function handlePrev() {
  activeStep.value--;
}

// 取消操作
function handleCancel() {
  router.push('/oneapi');
}

// 保存API
function handleSave() {
  if (!form.apiResponse) {
    ElMessage.warning('请测试通过后再保存！');
    return;
  }
  // 构建API配置
  const apiConfig = {
    apiName: form.apiName,
    queryTimeout: form.queryTimeout,
    limitCount: form.limitCount,
    pageFlag: form.isPaging,
    sql: form.sqlScript,
    apiParams: {
      requestParams: requestParams.value.map((param) => ({
        columnName: param.columnName,
        columnType: param.columnType,
        isMust: param.isMust,
        columnDesc: param.columnDesc,
        columnDemo: param.columnDemo,
      })),
    },
    apiReturn: form.apiResponse,
    preSQL: [],
  };
  form.apiUrl = '/data/' + form.apiUrl;
  form.apiConfig = JSON.stringify(apiConfig);
  isEdit.value ? updateApiInfo(form) : addApiInfo(form);
  ElMessage.success('保存成功');
  router.push('/oneapi');
}

// 测试并保存API
function handleTest() {
  // 构建API配置
  const apiConfig = {
    apiName: form.apiName?.replace(/[\n\t]/g, ''),
    queryTimeout: form.queryTimeout,
    limitCount: form.limitCount,
    pageFlag: form.isPaging,
    sql: form.sqlScript?.replace(/[\n\t]/g, ''),
    apiParams: {
      requestParams: requestParams.value.map((param) => ({
        columnName: param.columnName,
        columnType: param.columnType,
        isMust: param.isMust,
        columnDesc: param.columnDesc?.replace(/[\n\t]/g, ''),
        columnDemo: (testForm[param.columnName] || param.columnDemo)?.replace(/[\n\t]/g, ''),
      })),
      returnParams: responseParams.value.map((param) => ({
        columnName: param.columnName,
        columnType: param.columnType,
        columnDesc: param.columnDesc?.replace(/[\n\t]/g, ''),
      })),
    },
    preSQL: [],
  };

  form.apiConfig = JSON.stringify(apiConfig);

  testApiInfo(form)
    .then((res) => {
      testResult.value = res;
      if (res.code === 0) {
        try {
          form.apiResponse = res.data;
        } catch (error) {
          ElMessage.error('API响应数据格式错误，请检查返回数据');
          return;
        }
      } else {
        ElMessage.warning('测试未通过，请检查API配置');
      }
    })
    .catch(() => {
      ElMessage.error('测试失败');
    });
}

function handlePagingChange(value) {
  if (value === 1) {
    // 添加分页参数
    requestParams.value.push(
      {
        columnName: 'pageNum',
        columnType: 'INT',
        isMust: 1,
        columnDemo: '1',
        columnDesc: '当前页码',
      },
      {
        columnName: 'pageSize',
        columnType: 'INT',
        isMust: 1,
        columnDemo: '10',
        columnDesc: '每页显示条数',
      },
    );
  } else {
    // 移除分页参数
    requestParams.value = requestParams.value.filter(
      (item) => item.columnName !== 'pageNum' && item.columnName !== 'pageSize',
    );
  }
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
  // 获取字段类型列表
  getColumnTypes();

  // 获取数据源列表
  loadDatasourceOptions();

  // 如果是编辑模式，获取API详情
  if (isEdit.value && route.params.id) {
    getDetail(route.params.id);
  }
});
</script>

<style scoped>
.fixed-bottom {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #fff;
  padding: 10px 20px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  width: 100%;
}

.app-container {
  padding-bottom: 60px;
}
.app-container {
  padding: 20px;
  padding-bottom: 80px;
  position: relative;
  min-height: calc(100vh - 84px);
}

.params-container {
  display: flex;
  gap: 20px;
}

.params-section {
  flex: 1;
  min-width: 0;
}

.response-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.step-action {
  margin-top: 20px;
  text-align: center;
}

.test-container {
  padding: 20px;
}

.test-params-panel,
.test-result-panel {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  height: 600px;
  display: flex;
  flex-direction: column;
}

.panel-header {
  padding: 16px 20px;
  border-bottom: 1px solid #ebeef5;
}

.panel-header h4 {
  margin: 0;
  font-size: 16px;
  color: #303133;
}

.panel-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.panel-content::-webkit-scrollbar {
  width: 6px;
}

.panel-content::-webkit-scrollbar-thumb {
  background: #c0c4cc;
  border-radius: 3px;
}

.test-result-content {
  height: 100%;
  overflow-y: auto;
  padding: 10px;
}

.result-info {
  margin-bottom: 15px;
  background: #f8f9fa;
  padding: 12px;
  border-radius: 4px;
}

.info-item {
  margin-bottom: 8px;
  display: flex;
  align-items: flex-start;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-item .label {
  color: #606266;
  width: 80px;
  flex-shrink: 0;
}

.info-item .value {
  color: #303133;
  word-break: break-all;
}

.info-item .value.success {
  color: #67c23a;
}

.info-item .value.error {
  color: #f56c6c;
}

.result-data {
  background: #f8f9fa;
  border-radius: 4px;
  overflow: hidden;
}

.json-viewer {
  margin: 0;
  padding: 12px;
  font-family: Monaco, Menlo, Consolas, 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
}

.json-viewer.success {
  color: #303133;
  background: #f0f9eb;
  border: 1px solid #e1f3d8;
}

.json-viewer.error {
  color: #303133;
  background: #fef0f0;
  border: 1px solid #fde2e2;
}

.no-result {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
  font-size: 14px;
  background: #f8f9fa;
  border-radius: 4px;
}
</style>
