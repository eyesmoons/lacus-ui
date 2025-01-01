<template>
  <div class="app-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>{{ title }}</span>
        </div>
      </template>
      <sql-form ref="formRef" v-model:form="form" />
      <div class="bottom-buttons">
        <el-button type="primary" @click="submitForm">提交</el-button>
        <el-button @click="cancel">取消</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import SqlForm from './components/SqlForm.vue';
import { addBatchSqlJob, editBatchSqlJob, getJobDetail } from '@/api/spark/jobApi';

const route = useRoute();
const router = useRouter();
const formRef = ref(null);

// 表单数据
const form = ref({
  jobName: '',
  jobType: 'BATCH_SQL',
  deployMode: '',
  driverCores: 1,
  driverMemory: '1g',
  numExecutors: 2,
  executorCores: 1,
  executorMemory: '2g',
  otherSparkConf: '',
  sqlContent: '',
  queue: '',
  namespace: '',
  envId: undefined,
  remark: '',
  cronExpression: '',
});

// 标题
const title = ref('新增SQL任务');

// 获取任务详情
const getDetail = async (jobId) => {
  try {
    const res = await getJobDetail(jobId);
    if (res.code === 200) {
      form.value = res.data;
      title.value = '编辑SQL任务';
    }
  } catch (error) {
    console.error('获取任务详情失败:', error);
  }
};

// 提交表单
const submitForm = () => {
  formRef.value.validate().then(() => {
    const submitFn = form.value.jobId ? editBatchSqlJob : addBatchSqlJob;
    submitFn(form.value).then((res) => {
      if (res.code === 200) {
        ElMessage.success('保存成功');
        router.push('/spark/job');
      }
    });
  });
};

// 取消
const cancel = () => {
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
.bottom-buttons {
  margin-top: 20px;
  text-align: center;
}
</style>
