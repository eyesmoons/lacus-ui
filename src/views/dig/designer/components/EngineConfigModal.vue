<template>
  <el-dialog title="引擎参数配置" v-model="dialogVisible" width="500px" @close="handleClose">
    <el-form :model="form" ref="formRef" label-width="120px">
      <el-form-item label="引擎" prop="engine">
        <el-select v-model="form.engine" placeholder="请选择引擎">
          <el-option label="seatunnel" value="seatunnel"></el-option>
          <el-option label="flink" value="flink"></el-option>
          <el-option label="spark" value="spark"></el-option>
        </el-select>
      </el-form-item>

      <template v-if="form.engine === 'seatunnel'">
        <el-form-item label="deploy-mode" prop="deployMode">
          <el-select v-model="form.seatunnelParams.deployMode" placeholder="请选择 deploy-mode">
            <el-option label="local" value="local"></el-option>
            <el-option label="cluster" value="cluster"></el-option>
          </el-select>
        </el-form-item>
      </template>

      <template v-if="form.engine === 'flink'">
        <el-form-item label="Flink 版本" prop="engineVersion">
          <el-select v-model="form.engineVersion" placeholder="请选择 Flink 版本">
            <el-option label="1.12.x 到 1.14.x" value="FLINK_1_12_TO_1_14"></el-option>
            <el-option label="1.15.x 到 1.18.x" value="FLINK_1_15_TO_1_18"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="deploy-mode" prop="deployMode">
          <el-select v-model="form.flinkParams.deployMode" placeholder="请选择 deploy-mode">
            <el-option label="run" value="run"></el-option>
            <el-option label="run-application" value="run-application"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="master" prop="master">
          <el-select v-model="form.flinkParams.master" placeholder="请选择 master">
            <el-option label="local" value="local"></el-option>
            <el-option label="remote" value="remote"></el-option>
            <el-option label="yarn-session" value="yarn-session"></el-option>
            <el-option label="yarn-per-job" value="yarn-per-job"></el-option>
          </el-select>
        </el-form-item>
      </template>

      <template v-if="form.engine === 'spark'">
        <el-form-item label="Spark 版本" prop="engineVersion">
          <el-select v-model="form.engineVersion" placeholder="请选择 Spark 版本">
            <el-option label="Spark 2.4.x" value="SPARK_2_4_x"></el-option>
            <el-option label="Spark 3.x.x" value="SPARK_3_x_x"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="master" prop="master">
          <el-input v-model="form.sparkParams.master" placeholder="请输入 master"></el-input>
        </el-form-item>
        <el-form-item label="deploy-mode" prop="deployMode">
          <el-input v-model="form.sparkParams.deployMode" placeholder="请输入 deploy-mode"></el-input>
        </el-form-item>
      </template>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取 消</el-button>
        <el-button type="primary" @click="handleConfirm">确 定</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch } from 'vue';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:visible', 'confirm']);

const dialogVisible = ref(props.visible);
const formRef = ref(null);

const form = reactive({
  engine: 'seatunnel',
  engineVersion: '',
  seatunnelParams: {
    deployMode: '',
  },
  flinkParams: {
    deployMode: '',
    master: '',
  },
  sparkParams: {
    master: '',
    deployMode: '',
  },
});

watch(
  () => props.visible,
  (val) => {
    dialogVisible.value = val;
  },
);

watch(
  () => form.engine,
  (newVal) => {
    form.engineVersion = '';
    form.seatunnelParams = { deployMode: '' };
    form.flinkParams = { deployMode: '', master: '' };
    form.sparkParams = { master: '', deployMode: '' };
  },
);

const handleClose = () => {
  emit('update:visible', false);
};

const handleConfirm = () => {
  const engineParam = {};
  if (form.engine === 'seatunnel') {
    engineParam['deploy-mode'] = form.seatunnelParams.deployMode;
  } else if (form.engine === 'flink') {
    engineParam.master = form.flinkParams.master;
    engineParam['deploy-mode'] = form.flinkParams.deployMode;
  } else if (form.engine === 'spark') {
    engineParam.master = form.sparkParams.master;
    engineParam['deploy-mode'] = form.sparkParams.deployMode;
  }

  emit('confirm', {
    engine: form.engine,
    engineName: form.engine,
    engineVersion: form.engineVersion,
    engineParam: JSON.stringify(engineParam),
  });
  handleClose();
};
</script>
