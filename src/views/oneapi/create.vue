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
        <el-step title="接口信息配置" />
        <el-step title="SQL脚本配置" />
        <el-step title="请求参数配置" />
        <el-step title="API测试" />
      </el-steps>

      <!-- 步骤内容区域 -->
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
                  <el-input v-model="form.apiUrl" placeholder="请输入接口地址" />
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
              <div class="response-header">
                  <h4>请求参数</h4>
                  <el-switch
                      v-model="form.isPaging"
                      active-text="是否分页"
                      :active-value="1"
                      :inactive-value="0"
                      @change="handlePagingChange"
                  />
              </div>
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
              <h4>返回参数</h4>
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
        <div v-if="activeStep === 4">
          <el-form :model="testForm" label-width="120px">
            <el-form-item v-for="param in requestParams" :key="param.columnName" :label="param.columnName" :prop="param.columnName">
              <el-input v-model="testForm[param.columnName]" :placeholder="param.columnDesc" />
            </el-form-item>
          </el-form>
          <div v-if="testResult" class="test-result mt-4">
            <div class="test-result-info">
              <p>耗时：{{ testResult.costTime }} ms</p>
              <p>状态：{{ testResult.code === 0 ? '成功' : '失败' }}</p>
            </div>
            <el-divider />
            <div class="test-result-data">
              <pre>{{ JSON.stringify(testResult.data, null, 2) }}</pre>
            </div>
          </div>
        </div>
      </div>

      <!-- 步骤操作按钮 -->
      <div class="step-action">
        <el-button @click="handlePrev" v-if="activeStep > 1">上一步</el-button>
        <el-button type="primary" @click="handleNext" v-if="activeStep < 4">下一步</el-button>
        <el-button type="primary" @click="handleTest" v-if="activeStep === 4">测试</el-button>
        <el-button type="success" @click="handleSubmit" v-if="activeStep === 4">保存</el-button>
        <el-button @click="handleCancel">取消</el-button>
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
import { getApiInfo, addApiInfo, updateApiInfo, parseSql, getColTypeList, testApiInfo } from '@/api/oneapi/apiInfoApi';
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
  apiConfig: ''
});

// 表单验证规则
const rules = {
  apiName: [
    { required: true, message: '请输入接口名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  reqMethod: [
    { required: true, message: '请选择请求方式', trigger: 'change' }
  ],
  apiUrl: [
    { required: true, message: '请输入接口地址', trigger: 'blur' },
    { pattern: /^\/[\w\-\/]+$/, message: '接口地址必须以/开头，只能包含字母、数字、下划线、中划线', trigger: 'blur' }
  ],
  queryTimeout: [
    { required: true, message: '请输入超时时间', trigger: 'blur' }
  ],
  limitCount: [
    { required: true, message: '请输入限制条数', trigger: 'blur' }
  ],
  datasourceId: [
    { required: true, message: '请选择数据源', trigger: 'change' }
  ],
  sqlScript: [
    { required: true, message: '请输入SQL脚本', trigger: 'blur' }
  ]
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
  getApiInfo(apiId).then(response => {
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
  }).catch(() => {
    ElMessage.error('获取API详情失败');
    router.push('/oneapi');
  });
}

// 获取字段类型列表
function getColumnTypes() {
  getColTypeList().then(response => {
    columnTypeOptions.value = response.map(item => ({
      label: item.desc,
      value: item.name
    }));
  });
}

// 下一步操作
function handleNext() {
  if (activeStep.value === 1) {
    apiInfoFormRef.value.validate(valid => {
      if (valid) {
        activeStep.value++;
      }
    });
  } else if (activeStep.value === 2) {
    sqlFormRef.value.validate(valid => {
      if (valid) {
        if (!form.sqlScript || !form.datasourceId) {
          ElMessage.warning('请先选择数据源并输入SQL脚本');
          return;
        }

        parseSql({
          datasourceId: form.datasourceId,
          sqlScript: form.sqlScript
        }).then(response => {
          const reqParams = response.requestParams;
          const returnParams = response.returnParams;
          requestParams.value = reqParams.map(item => ({
            columnName: item.columnName,
            columnType: item.columnType || 'STRING',
            isMust: 0,
            columnDemo: '',
            columnDesc: ''
          }));

          responseParams.value = returnParams.map(item => ({
            columnName: item.columnName,
            columnType: item.columnType || 'STRING',
            columnDesc: ''
          }));

          ElMessage.success('SQL解析成功');
          activeStep.value = 3;
        }).catch(() => {
          ElMessage.error('SQL解析失败');
        });
      }
    });
  }
}

// 上一步操作
function handlePrev() {
  activeStep.value--;
}

// 解析SQL
function handleParseSql() {
  if (!form.sqlScript || !form.datasourceId) {
    ElMessage.warning('请先选择数据源并输入SQL脚本');
    return;
  }

  parseSql({
    datasourceId: form.datasourceId,
    sqlScript: form.sqlScript
  }).then(response => {
    const reqParams = response.requestParams || [];
    requestParams.value = reqParams.map(item => ({
      columnName: item.columnName,
      columnType: item.columnType || 'STRING',
      isMust: 0,
      columnDemo: '',
      columnDesc: ''
    }));

    // 如果选择了分页，添加分页参数
    if (form.isPaging === 1) {
      requestParams.value.push(
        {
          columnName: 'pageNum',
          columnType: 'Integer',
          isMust: 1,
          columnDemo: '1',
          columnDesc: '当前页码'
        },
        {
          columnName: 'pageSize',
          columnType: 'Integer',
          isMust: 1,
          columnDemo: '10',
          columnDesc: '每页显示条数'
        }
      );
    }

    ElMessage.success('SQL解析成功');
    activeStep.value++;
  }).catch(() => {
    ElMessage.error('SQL解析失败');
  });
}

// 取消操作
function handleCancel() {
  router.push('/oneapi');
}

// 测试API
function handleTest() {
  testApiInfo({
    ...form,
    testParams: testForm
  }).then(res => {
    testResult.value = res.data;
  }).catch(() => {
    ElMessage.error('测试失败');
  });
}

// 提交表单
function handleSubmit() {
  // 构建API配置
  const apiConfig = {
    sqlScript: form.sqlScript,
    isPaging: form.isPaging,
    requestParams: requestParams.value
  };

  // 设置API配置
  form.apiConfig = JSON.stringify(apiConfig);

  // 提交表单
  const submitFunc = isEdit.value ? updateApiInfo : addApiInfo;
  submitFunc(form).then(response => {
    ElMessage.success(isEdit.value ? '修改成功' : '新增成功');
    router.push('/oneapi');
  }).catch(() => {
    ElMessage.error(isEdit.value ? '修改失败' : '新增失败');
  });
}

// 获取数据源列表
function loadDatasourceOptions() {
  getDatasourceList('', null).then(response => {
    datasourceOptions.value = response || [];
  }).catch(() => {
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

.test-result {
  margin-top: 20px;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.test-result-info {
  margin-bottom: 10px;
}

.test-result-data {
  background-color: #fff;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
}

.test-result-data pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>

// 分页开关变化处理
function handlePagingChange(value) {
  if (value === 1) {
    // 添加分页参数
    requestParams.value.push(
      {
        columnName: 'pageNum',
        columnType: 'Integer',
        isMust: 1,
        columnDemo: '1',
        columnDesc: '当前页码'
      },
      {
        columnName: 'pageSize',
        columnType: 'Integer',
        isMust: 1,
        columnDemo: '10',
        columnDesc: '每页显示条数'
      }
    );
  } else {
    // 移除分页参数
    requestParams.value = requestParams.value.filter(
      item => item.columnName !== 'pageNum' && item.columnName !== 'pageSize'
    );
  }
}
