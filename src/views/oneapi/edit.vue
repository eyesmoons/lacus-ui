<template>
  <div class="app-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>编辑接口</span>
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
              <monaco-editor v-model="form.sqlScript" language="sql" height="300px" />
            </el-form-item>
          </el-form>
        </div>

        <!-- 步骤3：请求参数 -->
        <div v-if="activeStep === 3" class="params-container">
          <div class="params-section">
            <h4><el-divider content-position="left">请求参数</el-divider></h4>
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
              <el-table-column label="是否必填" prop="required" width="100">
                <template #default="scope">
                  <el-select v-model="scope.row.required" placeholder="是否必填" style="width: 100%">
                    <el-option :label="'是'" :value="1" />
                    <el-option :label="'否'" :value="0" />
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column label="实例值" prop="value">
                <template #default="scope">
                  <el-input v-model="scope.row.value" placeholder="实例值" />
                </template>
              </el-table-column>
              <el-table-column label="描述" prop="description">
                <template #default="scope">
                  <el-input v-model="scope.row.description" placeholder="描述" />
                </template>
              </el-table-column>
            </el-table>
          </div>

          <div class="params-section">
            <div class="response-header">
              <el-divider content-position="left">返回参数
              <el-switch
                v-model="form.isPaging"
                active-text="结果集是否分页"
                :active-value="1"
                :inactive-value="0"
                @change="handlePagingChange"
              />
              </el-divider>
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
              <el-table-column label="描述" prop="description">
                <template #default="scope">
                  <el-input v-model="scope.row.description" placeholder="描述" />
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>

        <!-- 步骤4：API测试 -->
        <div v-if="activeStep === 4" class="test-container">
          <el-row :gutter="24">
            <!-- 左侧：请求参数 -->
            <el-col :span="12">
              <div class="test-params-panel">
                <div class="panel-header">
                    <el-divider content-position="left">请求参数</el-divider>
                </div>
                <div class="panel-content">
                  <el-table :data="requestParams" border style="width: 100%">
                    <el-table-column label="参数名称" prop="columnName" width="180" />
                    <el-table-column label="参数类型" prop="columnType" width="180" />
                    <el-table-column label="是否必填" prop="required" width="100">
                      <template #default="scope">
                        <el-tag :type="scope.row.required === 1 ? 'danger' : 'info'">{{
                          scope.row.required === 1 ? '是' : '否'
                        }}</el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column label="描述" prop="description" />
                    <el-table-column label="测试值" width="100" fixed="right">
                      <template #default="scope">
                        <el-input
                          v-model="testForm[scope.row.columnName]"
                          :placeholder="scope.row.value || '请输入测试值'"
                        />
                      </template>
                    </el-table-column>
                  </el-table>
                </div>
              </div>
            </el-col>

            <!-- 右侧：测试结果 -->
            <el-col :span="12">
              <div class="test-result-panel">
                <div class="panel-header">
                  <h4>响应结果</h4>
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
                                  <pre class="value log-content">{{ formatLogContent(testResult.debugInfo) }}</pre>
                              </div>
                          </div>
                          <div class="result-data">
                              <span class="label">响应结果：</span>
                              <monaco-editor v-model="testResult.data" language="sql" height="300px" readonly="readonly" />
                          </div>
                      </div>
                      <div v-else class="no-result">暂无测试结果</div>
                  </div>
              </div>
            </el-col>
          </el-row>
        </div>
      </div>
    </el-card>

    <!-- 底部固定按钮 -->
    <div class="fixed-bottom">
      <el-button @click="prevStep" v-if="activeStep > 1">上一步</el-button>
      <el-button type="primary" @click="nextStep" v-if="activeStep < 4">下一步</el-button>
        <el-button type="success" @click="testApi" v-if="activeStep === 4">测试</el-button>
      <el-button type="success" @click="submitForm" v-if="activeStep === 4">保存</el-button>
      <el-button @click="goBack">返回</el-button>
    </div>
  </div>
</template>

<script setup>
import {onMounted, ref} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import {ElMessage} from 'element-plus';
import MonacoEditor from '@/components/MonacoEditor/index.vue';
import {getApiInfo, parseSql, testApiInfo, updateApiInfo} from '@/api/oneapi/apiInfoApi';
import {getDatasourceList} from '@/api/metadata/datasourceApi';

const route = useRoute();
const router = useRouter();
const apiInfoFormRef = ref(null);
const sqlFormRef = ref(null);
const activeStep = ref(1);
const testing = ref(false);

// 表单数据
const form = ref({
  apiName: '',
  reqMethod: 'GET',
  apiUrl: '',
  queryTimeout: 1,
  limitCount: 1000,
  apiDesc: '',
  datasourceId: undefined,
  sqlScript: '',
  isPaging: 0,
});

// 表单校验规则
const rules = {
  apiName: [{ required: true, message: '请输入接口名称', trigger: 'blur' }],
  reqMethod: [{ required: true, message: '请选择请求方式', trigger: 'change' }],
  apiUrl: [{ required: true, message: '请输入接口地址', trigger: 'blur' }],
  queryTimeout: [{ required: true, message: '请输入超时时间', trigger: 'blur' }],
  limitCount: [{ required: true, message: '请输入限制条数', trigger: 'blur' }],
  datasourceId: [{ required: true, message: '请选择数据源', trigger: 'change' }],
  sqlScript: [{ required: true, message: '请输入SQL脚本', trigger: 'blur' }],
};

// 数据源选项
const datasourceOptions = ref([]);

// 参数类型选项
const columnTypeOptions = [
  { label: '字符串', value: 'String' },
  { label: '整数', value: 'Integer' },
  { label: '小数', value: 'Double' },
  { label: '日期', value: 'Date' },
  { label: '布尔', value: 'Boolean' },
];

// 请求参数
const requestParams = ref([]);

// 返回参数
const responseParams = ref([]);

// 测试表单数据
const testForm = ref({});
const testResult = ref('');

// 获取API详情
const getDetail = async () => {
  try {
    const res = await getApiInfo(route.params.apiId);
    if (res) {
      form.value = { ...res };
      requestParams.value = res.requestParams || [];
      responseParams.value = res.responseParams || [];
      form.value.sqlScript = JSON.parse(res.apiConfig).sql;
      form.value.apiUrl=res.apiUrl.substring(6,res.apiUrl.length);
    }
  } catch (error) {
    console.error('获取API详情失败:', error);
    ElMessage.error('获取API详情失败');
  }
};

// 格式化日志内容
function formatLogContent(logStr) {
    if (!logStr) return '';

    let result = '';
    logStr.split('！').forEach((line) => {
        result += line + '\n';
    });
    return result;
}

// 获取数据源列表
const getDatasources = async () => {
  try {
    const res = await getDatasourceList();
    datasourceOptions.value = res || [];
  } catch (error) {
    console.error('获取数据源列表失败:', error);
    ElMessage.error('获取数据源列表失败');
  }
};

// 处理分页开关变化
const handlePagingChange = (value) => {
  form.value.isPaging = value;
};

// 解析SQL获取返回参数
const parseSqlScript = async () => {
  try {
    const response = await parseSql({
      datasourceId: form.value.datasourceId,
      sqlScript: form.value.sqlScript,
    });
    if (response) {
        const reqParams = response.requestParams;
        const returnParams = response.returnParams;
        requestParams.value = reqParams.map((item) => ({
            columnName: item.columnName,
            columnType: item.columnType || 'STRING',
            required: 0,
            value: '',
            description: '',
        }));

        responseParams.value = returnParams.map((item) => ({
            columnName: item.columnName,
            columnType: item.columnType || 'STRING',
            description: '',
        }));
    }
  } catch (error) {
    console.error('解析SQL失败:', error);
    ElMessage.error(`解析SQL失败: ${error.message || '未知错误'}`);
    throw error;
  }
};

// 测试API
const testApi = async () => {
  if (testing.value) return;
  testing.value = true;
  try {
      const apiConfig = {
          apiName: form.value.apiName?.replace(/[\n\t]/g, ''),
          queryTimeout: form.value.queryTimeout,
          limitCount: form.value.limitCount,
          pageFlag: form.value.isPaging,
          sql: form.value.sqlScript?.replace(/[\n\t]/g, ''),
          apiParams: {
              requestParams: requestParams.value.map((param) => ({
                  columnName: param.columnName,
                  columnType: param.columnType,
                  required: param.required,
                  description: param.description?.replace(/[\n\t]/g, ''),
                  value: (testForm.value[param.columnName] || param.value)?.replace(/[\n\t]/g, ''),
              })),
              returnParams: responseParams.value.map((param) => ({
                  columnName: param.columnName,
                  columnType: param.columnType,
                  description: param.description?.replace(/[\n\t]/g, ''),
              })),
          },
          preSQL: [],
      };
      form.value.apiConfig = JSON.stringify(apiConfig);
      testResult.value = await testApiInfo(form.value);
  } catch (error) {
    console.error('测试API失败:', error);
    ElMessage.error('测试API失败');
  } finally {
    testing.value = false;
  }
};

// 提交表单
const submitForm = async () => {
  try {
      if (!testResult.value) {
          ElMessage.warning('请测试通过后再保存！');
          return;
      }
    form.value.apiUrl = '/data/' + form.value.apiUrl;
    const params = {
      ...form.value,
      requestParams: requestParams.value,
      responseParams: responseParams.value,
    };
    await updateApiInfo(params);
    ElMessage.success('保存成功');
    router.push('/oneapi/oneapi');
  } catch (error) {
    console.error('保存失败:', error);
    ElMessage.error('保存失败');
  }
};

// 上一步
const prevStep = () => {
  if (activeStep.value > 1) {
    activeStep.value--;
  }
};

// 下一步
const nextStep = async () => {
  if (activeStep.value === 1) {
    await apiInfoFormRef.value?.validate();
  } else if (activeStep.value === 2) {
    await sqlFormRef.value?.validate();
    await parseSqlScript();
  }

  if (activeStep.value < 4) {
    activeStep.value++;
  }
};

// 返回列表
const goBack = () => {
  router.push('/oneapi');
};

onMounted(() => {
  getDetail();
  getDatasources();
});
</script>

<style scoped>
.app-container {
  padding-bottom: 60px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.step-content {
  padding: 20px 0;
}

.params-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.params-section {
  width: 100%;
}

.response-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.test-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.test-params-panel,
.test-result-panel {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 20px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.panel-content {
  width: 100%;
}

.fixed-bottom {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background-color: #fff;
  padding: 10px 20px;
  text-align: center;
  box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.12);
  display: flex;
  justify-content: center;
  gap: 10px;
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
</style>
