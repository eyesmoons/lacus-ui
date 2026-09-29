<template>
  <div class="app-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>实例详情</span>
          <el-button link @click="goBack">返回</el-button>
        </div>
      </template>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="实例名称">{{ instanceDetail.instanceName }}</el-descriptions-item>
        <el-descriptions-item label="任务名称">{{ instanceDetail.jobName }}</el-descriptions-item>
        <el-descriptions-item label="任务类型">
          <dict-tag :options="jobTypeOptions" :value="instanceDetail.jobType" />
        </el-descriptions-item>
        <el-descriptions-item label="部署模式">{{ instanceDetail.deployMode }}</el-descriptions-item>
        <el-descriptions-item label="实例状态">
          <dict-tag :options="statusOptions" :value="instanceDetail.status" />
        </el-descriptions-item>
        <el-descriptions-item label="应用ID">{{ instanceDetail.applicationId }}</el-descriptions-item>
        <el-descriptions-item label="Spark任务ID">{{ instanceDetail.sparkJobId }}</el-descriptions-item>
        <el-descriptions-item label="提交时间">{{ instanceDetail.submitTime }}</el-descriptions-item>
        <el-descriptions-item label="完成时间">{{ instanceDetail.finishedTime }}</el-descriptions-item>
      </el-descriptions>

      <el-divider content-position="left">任务脚本</el-divider>
      <pre>{{ instanceDetail.jobScript }}</pre>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getInstanceDetail } from '@/api/spark/instanceApi';

const route = useRoute();
const router = useRouter();

const instanceDetail = ref({});

// 任务类型选项
const jobTypeOptions = [
  { label: '批处理SQL任务', value: 'BATCH_SQL' },
  { label: 'JAR任务', value: 'JAR' },
];

// 实例状态选项
const statusOptions = [
  { label: '已提交', value: 'SUBMITTED' },
  { label: '运行中', value: 'RUNNING' },
  { label: '已结束', value: 'FINISHED' },
  { label: '失败', value: 'FAILED' },
  { label: '已杀死', value: 'KILLED' },
];

// 获取实例详情
const getDetail = async (instanceId) => {
  try {
    const res = await getInstanceDetail(instanceId);
    if (res.code === 200) {
      instanceDetail.value = res.data;
    }
  } catch (error) {
    console.error('获取实例详情失败:', error);
  }
};

// 返回列表页
const goBack = () => {
  router.push('/spark/instance');
};

onMounted(() => {
  const instanceId = route.params.instanceId;
  if (instanceId) {
    getDetail(instanceId);
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
