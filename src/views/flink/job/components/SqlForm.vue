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
            <el-select v-model="form.jobType" placeholder="请选择任务类型" disabled="disabled">
              <el-option label="流式SQL" value="STREAMING_SQL" />
              <el-option label="批处理SQL" value="BATCH_SQL" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="任务描述" prop="remark">
            <el-input v-model="form.remark" placeholder="请输入任务描述" />
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 其他基本信息字段 -->
    </el-card>

    <!-- 运行配置卡片 -->
    <!-- 运行配置卡片 -->
    <el-card class="box-card" style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span>运行配置</span>
        </div>
      </template>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="JobManager内存" label-width="130px">
            <el-input v-model="form.jobManager" style="width: 100%">
              <template #append>GB</template>
            </el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="TaskManager内存" label-width="130px">
            <el-input v-model="form.taskManager" style="width: 100%">
              <template #append>GB</template>
            </el-input>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="Slot个数" label-width="130px">
            <el-input v-model="form.slot" type="number" :min="1" :max="20" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="并行度" label-width="130px">
            <el-input v-model="form.parallelism" type="number" :min="1" :max="20" style="width: 100%" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="队列" label-width="130px">
            <el-input v-model="form.queue" placeholder="请输入队列名称" />
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="部署模式" prop="deployMode">
            <el-select v-model="form.deployMode" placeholder="请选择部署模式">
              <el-option label="Local" value="LOCAL" />
              <el-option label="Standalone" value="STANDALONE" />
              <el-option label="Yarn-per-job" value="YARN_PER" />
              <el-option label="Yarn-application" value="YARN_APPLICATION" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
    </el-card>

    <!-- SQL配置卡片 -->
    <el-card class="box-card" style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span>SQL配置</span>
        </div>
      </template>

      <div id="sql-editor" style="height: 300px; width: 100%; border: 1px solid #ccc"></div>
    </el-card>

    <!-- 按钮操作 -->
    <div class="bottom-button">
      <el-button type="primary" @click="submitForm">提交</el-button>
      <el-button @click="cancel">取消</el-button>
    </div>
  </el-form>
</template>

<script setup>
import { defineExpose, defineProps, ref, watch, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import * as jobApi from '@/api/flink/jobApi';
import * as monaco from 'monaco-editor';

const props = defineProps({
  isEdit: {
    type: Boolean,
    default: false,
  },
  jobInfo: {
    type: Object,
    default: () => ({}),
  },
});

const router = useRouter();
const form = ref({
  jobName: '',
  jobType: 'STREAMING_SQL',
  deployMode: 'Local',
  flinkSql: '',
  jobManager: 1,
  taskManager: 1,
  slot: 1,
  parallelism: 1,
  queue: 'default',
  remark: '',
});

// 监听jobInfo变化，更新表单数据
watch(
  () => props.jobInfo,
  (val) => {
    if (val && Object.keys(val).length > 0) {
      form.value = { ...val };
      if (editor) {
        editor.setValue(form.value.flinkSql || '');
      }
    }
  },
  { deep: true, immediate: true },
);

// 提交表单
const submitForm = async () => {
  try {
    if (props.isEdit) {
      await jobApi.editStreamingSqlJob(form.value);
    } else {
      await jobApi.addStreamingSqlJob(form.value);
    }
    router.push('/flink/job');
  } catch (error) {
    console.error('提交失败:', error);
  }
};

// 取消
const cancel = () => {
  router.push('/flink/job');
};

let editor;
onMounted(() => {
  editor = monaco.editor.create(document.getElementById('sql-editor'), {
    value: form.value.flinkSql || '',
    language: 'sql',
    theme: 'vs-dark',
    automaticLayout: true,
    fontSize: 16,
  });
  editor.onDidChangeModelContent(() => {
    form.value.flinkSql = editor.getValue();
  });

  // Set up MonacoEnvironment for web workers
  window.MonacoEnvironment = {
    getWorkerUrl: function (workerId, label) {
      return `data:text/javascript;charset=utf-8,${encodeURIComponent(`
                self.MonacoEnvironment = {
                    baseUrl: '${window.location.origin}'
                };
                importScripts('${window.location.origin}/monaco-editor/min/vs/base/worker/workerMain.js');
            `)}`;
    },
  };
});

onBeforeUnmount(() => {
  if (editor) {
    editor.dispose();
  }
});

defineExpose({
  form,
});
</script>

<style scoped>
.box-card {
  margin-bottom: 20px;
}

.card-header {
  font-weight: bold;
}

.bottom-button {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20px;
  background-color: #fff;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  z-index: 100;
  text-align: center;
}

.el-form {
  padding-bottom: 80px;
}
</style>
