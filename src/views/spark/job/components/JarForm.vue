<template>
  <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
    <!-- 基本信息卡片 -->
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>基本信息</span>
        </div>
      </template>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="任务名称" prop="jobName">
            <el-input v-model="form.jobName" placeholder="请输入任务名称" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="任务类型" prop="jobType">
            <el-select v-model="form.jobType" placeholder="请选择任务类型" disabled>
              <el-option label="批处理SQL" value="BATCH_SQL" />
              <el-option label="JAR任务" value="JAR" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="部署模式" prop="deployMode">
            <el-select v-model="form.deployMode" placeholder="请选择部署模式">
              <el-option v-for="item in deployModeOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="任务说明" prop="remark">
            <el-input v-model="form.remark" placeholder="请输入任务说明" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-card>

    <!-- 资源配置卡片 -->
    <el-card class="box-card" style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span>资源配置</span>
        </div>
      </template>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="Driver核心数" prop="driverCores">
            <el-input-number v-model="form.driverCores" :min="1" :max="10" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="Driver内存" prop="driverMemory">
            <el-input v-model="form.driverMemory" placeholder="请输入Driver内存，如：1">
              <template #append>GB</template>
            </el-input>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="Executor个数" prop="numExecutors">
            <el-input-number v-model="form.numExecutors" :min="1" :max="100" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="Executor核心" prop="executorCores">
            <el-input-number v-model="form.executorCores" :min="1" :max="10" style="width: 100%" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="Executor内存" prop="executorMemory">
            <el-input v-model="form.executorMemory" placeholder="请输入Executor内存，如：2">
              <template #append>GB</template>
            </el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="Yarn队列" prop="queue">
            <el-input v-model="form.queue" placeholder="请输入Yarn队列名称" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="命名空间" prop="namespace">
            <el-input v-model="form.namespace" placeholder="请输入命名空间" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="环境" prop="envId">
            <el-select v-model="form.envId" placeholder="请选择环境">
              <el-option v-for="item in envOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item label="其他Spark配置" prop="otherSparkConf">
            <el-input v-model="form.otherSparkConf" type="textarea" placeholder="请输入其他Spark配置，每行一个配置项" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-card>

    <!-- JAR配置卡片 -->
    <el-card class="box-card" style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span>JAR配置</span>
        </div>
      </template>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="主类路径" prop="mainJarPath">
            <el-select v-model="form.mainJarPath" placeholder="请选择主类路径">
              <el-option v-for="item in jarOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="主类名" prop="mainClassName">
            <el-input v-model="form.mainClassName" placeholder="请输入主类名" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item label="主类参数" prop="mainArgs">
            <el-input v-model="form.mainArgs" type="textarea" placeholder="请输入主类参数" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-card>

    <!-- 定时配置卡片 -->
    <el-card class="box-card" style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span>定时配置</span>
        </div>
      </template>

      <el-form-item prop="cronExpression">
        <cron-tab v-model="form.cronExpression" />
      </el-form-item>
    </el-card>
  </el-form>
</template>

<script setup>
import { ref, defineProps, defineEmits, onMounted } from 'vue';
import CronTab from '@/components/CronTab';
import { listEnv } from '@/api/system/envApi';
import { ElMessage } from 'element-plus';

const props = defineProps({
  form: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['update:form']);

const formRef = ref(null);

// 部署模式选项
const deployModeOptions = [
  { label: 'LOCAL', value: 'LOCAL' },
  { label: 'STANDALONE_CLIENT', value: 'STANDALONE_CLIENT' },
  { label: 'STANDALONE_CLUSTER', value: 'STANDALONE_CLUSTER' },
  { label: 'YARN_CLIENT', value: 'YARN_CLIENT' },
  { label: 'YARN_CLUSTER', value: 'YARN_CLUSTER' },
  { label: 'K8S_CLIENT', value: 'K8S_CLIENT' },
  { label: 'K8S_CLUSTER', value: 'K8S_CLUSTER' },
];

// JAR包选项（需要从后端获取）
const jarOptions = [{ label: 'example.jar', value: '/path/to/example.jar' }];

// 环境选项
const envOptions = ref([]);

// 获取环境列表
const getEnvOptions = async () => {
  try {
    const res = await listEnv();
      envOptions.value = res.rows.map((item) => ({
        label: item.name,
        value: item.envId,
      }));
  } catch (error) {
    console.error('获取环境列表失败:', error);
    ElMessage.error('获取环境列表失败');
  }
};

onMounted(() => {
  getEnvOptions();
});

// 表单校验规则
const rules = {
  jobName: [{ required: true, message: '请输入任务名称', trigger: 'blur' }],
  deployMode: [{ required: true, message: '请选择部署模式', trigger: 'change' }],
  driverCores: [{ required: true, message: '请输入Driver核心数', trigger: 'blur' }],
  driverMemory: [{ required: true, message: '请输入Driver内存', trigger: 'blur' }],
  numExecutors: [{ required: true, message: '请输入Executor个数', trigger: 'blur' }],
  executorCores: [{ required: true, message: '请输入Executor核心数', trigger: 'blur' }],
  executorMemory: [{ required: true, message: '请输入Executor内存', trigger: 'blur' }],
  mainJarPath: [{ required: true, message: '请选择主类路径', trigger: 'change' }],
  mainClassName: [{ required: true, message: '请输入主类名', trigger: 'blur' }],
};

// 表单校验方法
const validate = () => {
  return formRef.value.validate();
};

// 暴露方法给父组件
defineExpose({
  validate,
});
</script>

<style scoped>
.box-card {
  margin-bottom: 20px;
}

.card-header {
  font-weight: bold;
}

.el-form {
  padding-bottom: 80px;
}

:deep(.el-input-number .el-input__wrapper) {
  width: 100%;
}
</style>
