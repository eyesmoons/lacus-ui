<template>
  <div class="app-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>任务详情</span>
          <el-button link @click="goBack">返回</el-button>
        </div>
      </template>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="任务名称">{{ jobDetail.jobName }}</el-descriptions-item>
        <el-descriptions-item label="任务类型">
          <dict-tag :options="jobTypeOptions" :value="jobDetail.jobType" />
        </el-descriptions-item>
        <el-descriptions-item label="部署模式">{{ jobDetail.deployMode }}</el-descriptions-item>
        <el-descriptions-item label="任务状态">
          <dict-tag :options="statusOptions" :value="jobDetail.jobStatus" />
        </el-descriptions-item>
        <el-descriptions-item label="Driver核心数">{{ jobDetail.driverCores }}</el-descriptions-item>
        <el-descriptions-item label="Driver内存">{{ jobDetail.driverMemory }}</el-descriptions-item>
        <el-descriptions-item label="Executor个数">{{ jobDetail.numExecutors }}</el-descriptions-item>
        <el-descriptions-item label="Executor核心数">{{ jobDetail.executorCores }}</el-descriptions-item>
        <el-descriptions-item label="Executor内存">{{ jobDetail.executorMemory }}</el-descriptions-item>
        <el-descriptions-item label="Yarn队列">{{ jobDetail.queue }}</el-descriptions-item>
        <el-descriptions-item label="命名空间">{{ jobDetail.namespace }}</el-descriptions-item>
        <el-descriptions-item label="应用ID">{{ jobDetail.appId }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ jobDetail.createTime }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ jobDetail.updateTime }}</el-descriptions-item>
        <el-descriptions-item label="任务说明">{{ jobDetail.remark }}</el-descriptions-item>
        <el-descriptions-item label="定时配置">{{ jobDetail.cronExpression }}</el-descriptions-item>
      </el-descriptions>

      <!-- SQL任务特有字段 -->
      <template v-if="jobDetail.jobType === 'BATCH_SQL'">
        <el-divider content-position="left">SQL脚本</el-divider>
        <monaco-editor v-model="jobDetail.sqlContent" language="sql" height="300px" :readonly="true" />
      </template>

      <!-- JAR任务特有字段 -->
      <template v-if="jobDetail.jobType === 'JAR'">
        <el-divider content-position="left">JAR配置</el-divider>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="主类路径">{{ jobDetail.mainJarPath }}</el-descriptions-item>
          <el-descriptions-item label="主类名">{{ jobDetail.mainClassName }}</el-descriptions-item>
          <el-descriptions-item label="主类参数">{{ jobDetail.mainArgs }}</el-descriptions-item>
        </el-descriptions>
      </template>

      <el-divider content-position="left">其他Spark配置</el-divider>
      <pre>{{ jobDetail.otherSparkConf }}</pre>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import MonacoEditor from '@/components/MonacoEditor';
import { getJobDetail } from '@/api/spark/jobApi';

const route = useRoute();
const router = useRouter();

const jobDetail = ref({});

// 任务类型选项
const jobTypeOptions = [
  { label: '批处理SQL任务', value: 'BATCH_SQL' },
  { label: 'JAR任务', value: 'JAR' },
];

// 任务状态选项
const statusOptions = [
  { label: '已提交', value: 'SUBMITTED' },
  { label: '运行中', value: 'RUNNING' },
  { label: '已结束', value: 'FINISHED' },
  { label: '失败', value: 'FAILED' },
  { label: '已杀死', value: 'KILLED' },
  { label: '未运行', value: 'CREATED' },
];

// 获取任务详情
const getDetail = async (jobId) => {
  try {
    const res = await getJobDetail(jobId);
    if (res.code === 200) {
      jobDetail.value = res.data;
    }
  } catch (error) {
    console.error('获取任务详情失败:', error);
  }
};

// 返回列表页
const goBack = () => {
  router.push('/spark/job');
};

onMounted(() => {
  const jobId = route.params.jobId;
  if (jobId) {
    getDetail(jobId);
  }
});
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

pre {
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>
