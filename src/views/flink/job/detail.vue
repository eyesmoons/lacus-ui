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
              <span>{{ form.appId }}</span>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="任务说明">
              <span>{{ form.remark }}</span>
            </el-form-item>
          </el-col>
        </el-row>
      </el-card>

      <el-card class="box-card" style="margin-top: 20px">
        <template #header>
          <div class="card-header">
            <span>运行配置</span>
          </div>
        </template>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="JobManager内存" label-width="130px">
              <span>{{ form.jobManager }}GB</span>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="TaskManager内存" label-width="130px">
              <span>{{ form.taskManager }}GB</span>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Slot个数">
              <span>{{ form.slot }}</span>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="并行度">
              <span>{{ form.parallelism }}</span>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="队列">
              <span>{{ form.queue }}</span>
            </el-form-item>
          </el-col>
        </el-row>
      </el-card>

      <el-card class="box-card" style="margin-top: 20px" v-if="form.jobType === 'BATCH_SQL'">
        <template #header>
          <div class="card-header">
            <span>调度配置</span>
          </div>
        </template>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="定时表达式">
              <span>{{ form.cron }}</span>
            </el-form-item>
          </el-col>
        </el-row>
      </el-card>

      <el-card class="box-card" style="margin-top: 20px">
        <template #header>
          <div class="card-header">
            <span>任务配置</span>
          </div>
        </template>

        <el-row :gutter="20" v-if="form.jobType.includes('SQL')">
          <el-col :span="24">
            <el-form-item label="SQL脚本">
              <div id="sql-editor" style="height: 300px; width: 100%; border: 1px solid #ccc"></div>
            </el-form-item>
          </el-col>
        </el-row>

        <template v-else>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="主类名">
                <span>{{ form.mainClass }}</span>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="24">
              <el-form-item label="自定义参数">
                <span>{{ form.customArgs }}</span>
              </el-form-item>
            </el-col>
          </el-row>
        </template>
      </el-card>
    </el-form>
  </div>
</template>

<script setup name="FlinkJobDetail">
import * as jobApi from '@/api/flink/jobApi';
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRoute } from 'vue-router';
import * as monaco from 'monaco-editor';

const route = useRoute();
const jobId = route.params.jobId;

const form = ref({});

// 任务类型选项
const jobTypeOptions = [
  { value: 'STREAMING_SQL', label: '流式SQL' },
  { value: 'BATCH_SQL', label: '批处理SQL' },
  { value: 'JAR', label: 'JAR包' },
];

/** 格式化任务类型 */
function formatJobType(type) {
  return jobTypeOptions.find((item) => item.value === type)?.label || type;
}

/** 获取详情 */
function getDetail() {
  jobApi.getJobDetail(jobId).then((response) => {
    form.value = response;
  });
}

getDetail();

let editor;
onMounted(() => {
  editor = monaco.editor.create(document.getElementById('sql-editor'), {
    value: form.value.flinkSql || '',
    language: 'sql',
    theme: 'vs-dark',
    automaticLayout: true,
    readOnly: true,
    fontSize: 16,
  });
});

onBeforeUnmount(() => {
  if (editor) {
    editor.dispose();
  }
});
</script>

<style scoped>
.box-card {
  margin-bottom: 20px;
}

.card-header {
  font-weight: bold;
}

.sql-editor {
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
  font-family: monospace;
  white-space: pre-wrap;
}
</style>
