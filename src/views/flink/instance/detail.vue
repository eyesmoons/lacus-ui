<template>
  <div class="app-container">
    <el-form :model="form" label-width="120px">
      <el-card class="box-card">
        <template #header>
          <div class="card-header">
            <span>基本信息</span>
          </div>
        </template>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="任务名称">
              <span>{{ form.jobName }}</span>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="任务类型">
              <span>{{ formatJobType(form.jobType) }}</span>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="部署模式">
              <span>{{ form.deployMode }}</span>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="应用ID">
              <span>{{ form.applicationId }}</span>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="实例状态">
              <el-tag :type="formatStatusType(form.status)">
                {{ formatStatus(form.status) }}
              </el-tag>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="开始时间">
              <span>{{ parseTime(form.startTime) }}</span>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="结束时间">
              <span>{{ parseTime(form.endTime) }}</span>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="错误信息" v-if="form.error">
              <div class="error-message">{{ form.error }}</div>
            </el-form-item>
          </el-col>
        </el-row>
      </el-card>
    </el-form>

    <div class="bottom-button">
      <el-button @click="goBack">返回</el-button>
    </div>
  </div>
</template>

<script setup name="FlinkJobInstanceDetail">
import * as instanceApi from '@/api/flink/instanceApi';
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { parseTime } from '@/utils/common';

const route = useRoute();
const router = useRouter();
const instanceId = ref(route.params.instanceId);

// 表单参数
const form = ref({});

// 任务类型选项
const jobTypeOptions = [
  { value: 'STREAMING_SQL', label: '流式SQL' },
  { value: 'BATCH_SQL', label: '批处理SQL' },
  { value: 'JAR', label: 'JAR包' },
];

// 状态选项
const statusOptions = [
  { value: 'CREATED', label: '已创建' },
  { value: 'RUNNING', label: '运行中' },
  { value: 'FINISHED', label: '已完成' },
  { value: 'FAILED', label: '已失败' },
  { value: 'CANCELED', label: '已取消' },
];

/** 格式化任务类型 */
function formatJobType(type) {
  return jobTypeOptions.find((item) => item.value === type)?.label || type;
}

/** 格式化状态 */
function formatStatus(status) {
  return statusOptions.find((item) => item.value === status)?.label || status;
}

/** 格式化状态样式 */
function formatStatusType(status) {
  if (status === 'CREATED') return 'info';
  if (status === 'RUNNING') return 'primary';
  if (status === 'FINISHED') return 'success';
  if (status === 'FAILED') return 'danger';
  if (status === 'CANCELED') return 'warning';
  return 'default';
}

/** 返回按钮操作 */
function goBack() {
  router.push('/flink/instance');
}

// 获取详情
if (instanceId.value) {
  instanceApi.getInstanceDetail(instanceId.value).then((response) => {
    form.value = response.data;
  });
}
</script>

<style scoped>
.box-card {
  margin-bottom: 20px;
}

.card-header {
  font-weight: bold;
}

.bottom-button {
  margin-top: 20px;
  text-align: center;
}

.error-message {
  color: #f56c6c;
  font-family: monospace;
  white-space: pre-wrap;
  background-color: #fef0f0;
  padding: 10px;
  border-radius: 4px;
}
</style>
