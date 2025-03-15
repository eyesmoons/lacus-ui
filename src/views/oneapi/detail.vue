<template>
  <div class="app-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>接口详情</span>
          <div>
            <el-button @click="goBack">返回</el-button>
          </div>
        </div>
      </template>
      
      <el-tabs v-model="activeTab">
        <!-- 接口信息 -->
        <el-tab-pane label="接口信息" name="info">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="接口名称">{{ apiInfo.apiName }}</el-descriptions-item>
            <el-descriptions-item label="所属分组">{{ apiInfo.groupId }}</el-descriptions-item>
            <el-descriptions-item label="请求方式">{{ apiInfo.reqMethod }}</el-descriptions-item>
            <el-descriptions-item label="接口地址">{{ apiInfo.apiUrl }}</el-descriptions-item>
            <el-descriptions-item label="超时时间">{{ apiInfo.queryTimeout }}秒</el-descriptions-item>
            <el-descriptions-item label="限制条数">{{ apiInfo.limitCount }}</el-descriptions-item>
            <el-descriptions-item label="接口状态">
              <el-tag type="success" v-if="apiInfo.status === 1">上线</el-tag>
              <el-tag type="info" v-else>下线</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ parseTime(apiInfo.createTime) }}</el-descriptions-item>
            <el-descriptions-item label="接口描述" :span="2">{{ apiInfo.apiDesc }}</el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>
        
        <!-- SQL脚本 -->
        <el-tab-pane label="SQL脚本" name="sql">
          <el-descriptions :column="1" border>
            <el-descriptions-item label="数据源">{{ apiInfo.datasourceName }}</el-descriptions-item>
            <el-descriptions-item label="是否分页">
              <el-tag type="success" v-if="apiConfig.isPaging === 1">是</el-tag>
              <el-tag type="info" v-else>否</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="SQL脚本">
              <div class="code-block">
                <pre>{{ apiConfig.sqlScript }}</pre>
              </div>
            </el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>
        
        <!-- 请求参数 -->
        <el-tab-pane label="请求参数" name="params">
          <el-table :data="apiConfig.requestParams" border style="width: 100%">
            <el-table-column label="参数名称" prop="columnName" width="180" />
            <el-table-column label="参数类型" prop="columnType" width="180" />
            <el-table-column label="是否必填" prop="isMust" width="100">
              <template #default="scope">
                <el-tag type="success" v-if="scope.row.isMust === 1">是</el-tag>
                <el-tag type="info" v-else>否</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="实例值" prop="columnDemo" />
            <el-table-column label="描述" prop="columnDesc" />
          </el-table>
        </el-tab-pane>
        
        <!-- 在线测试 -->
        <el-tab-pane label="在线测试" name="test">
          <div class="test-container">
            <el-row :gutter="20">
              <el-col :span="10">
                <div class="test-params">
                  <h3>请求参数</h3>
                  <el-form label-width="100px">
                    <el-form-item v-for="(param, index) in apiConfig.requestParams" :key="index" :label="param.columnName">
                      <el-input v-model="param.value" :placeholder="`请输入${param.columnName}`" />
                    </el-form-item>
                    <el-form-item>
                      <el-button type="primary" @click="submitTest">执行测试</el-button>
                    </el-form-item>
                  </el-form>
                </div>
              </el-col>
              <el-col :span="14">
                <div class="test-result">
                  <h3>测试结果</h3>
                  <div v-if="testResult">
                    <div class="result-info">
                      <p>耗时：{{ testResult.costTime }} ms</p>
                      <p>状态：{{ testResult.code === 0 ? '成功' : '失败' }}</p>
                    </div>
                    <el-divider />
                    <div class="result-data">
                      <pre>{{ JSON.stringify(testResult.data, null, 2) }}</pre>
                    </div>
                  </div>
                  <div v-else class="no-result">
                    <el-empty description="暂无测试结果" />
                  </div>
                </div>
              </el-col>
            </el-row>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { getApiInfo, testApiInfoOnline } from '@/api/oneapi/apiInfoApi';
import { parseTime } from '@/utils/common';

const route = useRoute();
const router = useRouter();
const apiId = route.params.id;

// 当前激活的标签页
const activeTab = ref('info');

// API信息
const apiInfo = ref({});

// API配置
const apiConfig = ref({
  sqlScript: '',
  isPaging: 0,
  requestParams: []
});

// 测试结果
const testResult = ref(null);

// 获取API详情
function getDetail() {
  getApiInfo(apiId).then(response => {
    apiInfo.value = response.data;
    
    // 解析API配置
    if (apiInfo.value.apiConfig) {
      try {
        const config = JSON.parse(apiInfo.value.apiConfig);
        apiConfig.value = config;
        
        // 为请求参数添加value字段，用于测试
        if (apiConfig.value.requestParams) {
          apiConfig.value.requestParams.forEach(param => {
            param.value = '';
          });
        }
      } catch (error) {
        console.error('解析API配置失败', error);
      }
    }
  }).catch(() => {
    ElMessage.error('获取API详情失败');
    router.push('/oneapi');
  });
}

// 返回列表页
function goBack() {
  router.push('/oneapi');
}

// 提交测试
function submitTest() {
  // 构建测试参数
  const testData = {
    apiName: apiInfo.value.apiName,
    queryTimeout: apiInfo.value.queryTimeout,
    limitCount: apiInfo.value.limitCount,
    pageFlag: apiInfo.value.pageFlag,
    sql: apiInfo.value.sql,
    preSQL: apiInfo.value.preSQL || [],
    apiParams: {
      requestParams: apiConfig.value.requestParams.map(param => ({
        columnName: param.columnName,
        value: param.value,
        columnType: param.columnType,
        required: param.required
      })),
      returnParams: apiConfig.value.returnParams || []
    }
  };
  
  // 调用测试API
  testApiInfoOnline(testData).then(response => {
    testResult.value = response.data;
  }).catch(() => {
    testResult.value = { code: -1, data: '测试失败', costTime: 0 };
  });
}

onMounted(() => {
  if (apiId) {
    getDetail();
  } else {
    ElMessage.error('API ID不能为空');
    router.push('/oneapi');
  }
});
</script>

<style scoped>
.app-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.code-block {
  background-color: #f5f7fa;
  padding: 10px;
  border-radius: 4px;
  max-height: 400px;
  overflow-y: auto;
}

.test-container {
  height: 500px;
  overflow-y: auto;
}

.test-params, .test-result {
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