<template>
  <div class="app-container">
    <jar-form ref="formRef" v-model:form="form" />

    <!-- 底部固定按钮 -->
    <div class="fixed-bottom">
      <el-button type="primary" @click="submitForm">提交</el-button>
      <el-button @click="cancel">取消</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import JarForm from './components/JarForm.vue';
import { addJarJob, editJarJob, getJobDetail } from '@/api/spark/jobApi';

const route = useRoute();
const router = useRouter();
const formRef = ref(null);

// 表单数据
const form = ref({
  jobName: '',
  jobType: 'JAR',
  deployMode: '',
  driverCores: 1,
  driverMemory: '1',
  numExecutors: 2,
  executorCores: 1,
  executorMemory: '2',
  otherSparkConf: '',
  mainJarPath: '',
  mainClassName: '',
  mainArgs: '',
  queue: 'default',
  namespace: '',
  envId: undefined,
  remark: '',
  cronExpression: '',
});

// 获取任务详情
const getDetail = async (jobId) => {
  try {
    const res = await getJobDetail(jobId);
    if (res.code === 200) {
      form.value = res.data;
    }
  } catch (error) {
    console.error('获取任务详情失败:', error);
    ElMessage.error('获取任务详情失败');
  }
};

// 提交表单
const submitForm = () => {
  formRef.value
    ?.validate()
    .then(() => {
      const submitFn = form.value.jobId ? editJarJob : addJarJob;
      submitFn(form.value)
        .then((res) => {
          if (res.code === 200) {
            ElMessage.success('保存成功');
            router.push('/spark/job');
          } else {
            ElMessage.error(res.msg || '保存失败');
          }
        })
        .catch((error) => {
          console.error('保存失败:', error);
          ElMessage.error('保存失败');
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
</style>
