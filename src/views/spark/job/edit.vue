<template>
  <div class="app-container">
    <div v-loading="loading" :style="{ minHeight: '200px' }">
      <sql-form ref="formRef" v-model:form="form" v-if="form.jobType === 'BATCH_SQL'" />
      <jar-form ref="formRef" v-model:form="form" v-else-if="form.jobType === 'JAR'" />
      <div v-else-if="error" class="error-message">
        <el-empty :description="error" />
      </div>
    </div>

    <!-- 底部固定按钮 -->
    <div class="fixed-bottom">
      <el-button type="primary" @click="submitForm" :loading="submitting">提交</el-button>
      <el-button @click="cancel">取消</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import SqlForm from './components/SqlForm.vue';
import JarForm from './components/JarForm.vue';
import { editBatchSqlJob, editJarJob, getJobDetail } from '@/api/spark/jobApi';

const route = useRoute();
const router = useRouter();
const formRef = ref(null);

// 表单数据
const form = ref({
  jobName: '',
  jobType: '',
  deployMode: '',
  driverCores: 1,
  driverMemory: '1',
  numExecutors: 2,
  executorCores: 1,
  executorMemory: '2',
  otherSparkConf: '',
  sqlContent: '',
  mainJarPath: '',
  mainClassName: '',
  mainArgs: '',
  queue: 'default',
  namespace: '',
  envId: undefined,
  remark: '',
  cronExpression: '',
});

const loading = ref(false);
const submitting = ref(false);
const error = ref('');

// 获取任务详情
const getDetail = async (jobId) => {
  loading.value = true;
  error.value = '';
  try {
    const res = await getJobDetail(jobId);
    if (res.jobId) {
      form.value = res;
    } else {
      error.value = res.msg || '获取任务详情失败';
    }
  } catch (err) {
    console.error('获取任务详情失败:', err);
    error.value = '获取任务详情失败';
  } finally {
    loading.value = false;
  }
};

// 提交表单
const submitForm = () => {
  if (submitting.value) return;

  formRef.value
    ?.validate()
    .then(() => {
      submitting.value = true;
      const submitFn = form.value.jobType === 'BATCH_SQL' ? editBatchSqlJob : editJarJob;
      submitFn(form.value)
        .then((res) => {
            console.log('res:', res);
            ElMessage.success('保存成功');
            router.push('/spark/job');
        })
        .catch((error) => {
          console.error('保存失败:', error);
          ElMessage.error('保存失败');
        })
        .finally(() => {
          submitting.value = false;
        });
    })
    .catch(() => {
      ElMessage.warning('请检查表单填写是否正确');
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

.app-container {
  padding-bottom: 60px;
}

.error-message {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}
</style>
