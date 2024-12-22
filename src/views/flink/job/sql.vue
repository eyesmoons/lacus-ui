<template>
  <div class="app-container">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
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
                <el-option v-for="dict in jobTypeOptions" :key="dict.value" :label="dict.label" :value="dict.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="任务说明" prop="remark">
              <el-input v-model="form.remark" type="textarea" placeholder="请输入任务说明" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-card>

      <!-- 在 sql.vue 和 jar.vue 中修改运行配置部分 -->
      <el-card class="box-card" style="margin-top: 20px">
        <template #header>
          <div class="card-header">
            <span>运行配置</span>
          </div>
        </template>

        <el-form :model="form" label-width="140px">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="JobManager内存">
                <el-input v-model="form.jobManager" style="width: 100%">
                  <template #append>GB</template>
                </el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="TaskManager内存">
                <el-input v-model="form.taskManager" style="width: 100%">
                  <template #append>GB</template>
                </el-input>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="Slot个数">
                <el-input v-model="form.slot" type="number" :min="1" :max="20" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="并行度">
                <el-input v-model="form.parallelism" type="number" :min="1" :max="20" style="width: 100%" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="队列">
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
        </el-form>
      </el-card>

      <el-card class="box-card" style="margin-top: 20px" v-if="form.jobType === 'BATCH_SQL'">
        <template #header>
          <div class="card-header">
            <span>调度配置</span>
          </div>
        </template>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="定时表达式" prop="cron">
              <el-input v-model="form.cron" placeholder="请输入Cron表达式" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-card>

      <el-card class="box-card" style="margin-top: 20px">
        <template #header>
          <div class="card-header">
            <span>SQL配置</span>
          </div>
        </template>

        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="扩展JAR包" prop="extJarPath">
              <el-input v-model="form.extJarPath" placeholder="请输入扩展JAR包路径" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="SQL脚本" prop="flinkSql">
              <div id="sql-editor" style="height: 300px; width: 100%; border: 1px solid #ccc"></div>
            </el-form-item>
          </el-col>
        </el-row>
      </el-card>

      <div class="bottom-button">
        <el-button type="primary" @click="submitForm">提交</el-button>
        <el-button @click="cancel">取消</el-button>
      </div>
    </el-form>
  </div>
</template>

<script setup name="FlinkSqlJob">
import * as jobApi from '@/api/flink/jobApi';
import { getCurrentInstance, ref, reactive, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import * as monaco from 'monaco-editor';

const { proxy } = getCurrentInstance();
const router = useRouter();
const route = useRoute();

const jobId = ref(route.params.jobId);
const jobType = ref(route.params.type || 'STREAMING_SQL');

// 表单参数
const form = ref({
  jobName: undefined,
  jobType: jobType.value,
  deployMode: 'Local',
  flinkSql: undefined,
  extJarPath: undefined,
  jobManager: 1,
  taskManager: 1,
  slot: 1,
  parallelism: 1,
  queue: 'default',
  cron: undefined,
  remark: undefined,
});

// 表单校验规则
const rules = {
  jobName: [{ required: true, message: '请输入任务名称', trigger: 'blur' }],
  deployMode: [{ required: true, message: '请选择部署模式', trigger: 'change' }],
  flinkSql: [{ required: true, message: '请输入SQL脚本', trigger: 'blur' }],
};

// 任务类型选项
const jobTypeOptions = [
  { value: 'STREAMING_SQL', label: '流式SQL' },
  { value: 'BATCH_SQL', label: '批处理SQL' },
];

/** 提交按钮 */
function submitForm() {
  console.log('Submit button clicked');
  proxy.$refs.formRef.validate((valid) => {
    console.log('Form validation result:', valid);
    if (valid) {
      console.log('Form is valid, proceeding with submission');
      if (jobId.value) {
        jobApi
          .editStreamingSqlJob(form.value)
          .then((response) => {
            console.log('Edit job response:', response);
            proxy.$modal.msgSuccess('修改成功');
            router.push('/flink/job');
          })
          .catch((error) => {
            console.error('Error editing job:', error);
          });
      } else {
        const api = form.value.jobType === 'STREAMING_SQL' ? jobApi.addStreamingSqlJob : jobApi.addBatchSqlJob;
        api(form.value)
          .then((response) => {
            console.log('Add job response:', response);
            proxy.$modal.msgSuccess('新增成功');
            router.push('/flink/job');
          })
          .catch((error) => {
            console.error('Error adding job:', error);
          });
      }
    } else {
      console.log('Form is invalid');
    }
  });
}

/** 取消按钮 */
function cancel() {
  router.push('/flink/job');
}

// 获取详情
if (jobId.value) {
  jobApi.getJobDetail(jobId.value).then((response) => {
    console.log(response);
    form.value = response.data;
  });
}

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
</style>
