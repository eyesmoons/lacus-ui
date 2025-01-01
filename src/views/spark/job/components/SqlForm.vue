<template>
  <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
    <el-form-item label="任务名称" prop="jobName">
      <el-input v-model="form.jobName" placeholder="请输入任务名称" />
    </el-form-item>
    <el-form-item label="部署模式" prop="deployMode">
      <el-select v-model="form.deployMode" placeholder="请选择部署模式">
        <el-option v-for="item in deployModeOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </el-form-item>
    <el-form-item label="Driver核心数" prop="driverCores">
      <el-input-number v-model="form.driverCores" :min="1" :max="10" />
    </el-form-item>
    <el-form-item label="Driver内存" prop="driverMemory">
      <el-input v-model="form.driverMemory" placeholder="请输入Driver内存，如：1g" />
    </el-form-item>
    <el-form-item label="Executor个数" prop="numExecutors">
      <el-input-number v-model="form.numExecutors" :min="1" :max="100" />
    </el-form-item>
    <el-form-item label="Executor核心数" prop="executorCores">
      <el-input-number v-model="form.executorCores" :min="1" :max="10" />
    </el-form-item>
    <el-form-item label="Executor内存" prop="executorMemory">
      <el-input v-model="form.executorMemory" placeholder="请输入Executor内存，如：2g" />
    </el-form-item>
    <el-form-item label="其他Spark配置" prop="otherSparkConf">
      <el-input v-model="form.otherSparkConf" type="textarea" placeholder="请输入其他Spark配置，每行一个配置项" />
    </el-form-item>
    <el-form-item label="SQL脚本" prop="sqlContent">
      <monaco-editor v-model="form.sqlContent" language="sql" height="300px" />
    </el-form-item>
    <el-form-item label="Yarn队列" prop="queue">
      <el-input v-model="form.queue" placeholder="请输入Yarn队列名称" />
    </el-form-item>
    <el-form-item label="命名空间" prop="namespace">
      <el-input v-model="form.namespace" placeholder="请输入命名空间" />
    </el-form-item>
    <el-form-item label="环境" prop="envId">
      <el-select v-model="form.envId" placeholder="请选择环境">
        <el-option v-for="item in envOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </el-form-item>
    <el-form-item label="任务说明" prop="remark">
      <el-input v-model="form.remark" type="textarea" placeholder="请输入任务说明" />
    </el-form-item>
    <el-form-item label="定时配置" prop="cronExpression">
      <cron-tab v-model="form.cronExpression" />
    </el-form-item>
  </el-form>
</template>

<script setup>
import { ref, defineProps, defineEmits } from 'vue';
import MonacoEditor from '@/components/MonacoEditor';
import CronTab from '@/components/CronTab';

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

// 环境选项（需要从后端获取）
const envOptions = [
  { label: '开发环境', value: 1 },
  { label: '测试环境', value: 2 },
  { label: '生产环境', value: 3 },
];

// 表单校验规则
const rules = {
  jobName: [{ required: true, message: '请输入任务名称', trigger: 'blur' }],
  deployMode: [{ required: true, message: '请选择部署模式', trigger: 'change' }],
  driverCores: [{ required: true, message: '请输入Driver核心数', trigger: 'blur' }],
  driverMemory: [{ required: true, message: '请输入Driver内存', trigger: 'blur' }],
  numExecutors: [{ required: true, message: '请输入Executor个数', trigger: 'blur' }],
  executorCores: [{ required: true, message: '请输入Executor核心数', trigger: 'blur' }],
  executorMemory: [{ required: true, message: '请输入Executor内存', trigger: 'blur' }],
  sqlContent: [{ required: true, message: '请输入SQL脚本', trigger: 'blur' }],
  queue: [{ required: true, message: '请输入Yarn队列名称', trigger: 'blur' }],
  namespace: [{ required: true, message: '请输入命名空间', trigger: 'blur' }],
  envId: [{ required: true, message: '请选择环境', trigger: 'change' }],
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
