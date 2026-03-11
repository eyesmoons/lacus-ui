<template>
  <div class="expert-designer-container">
    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-button icon="Back" @click="goBack">返回</el-button>
        <el-divider direction="vertical" />
        <span class="job-title">{{ jobInfo.jobName || '新建作业' }}</span>
        <el-tag type="warning" style="margin-left: 12px">专家模式</el-tag>
      </div>
      <div class="toolbar-right">
        <el-button icon="DocumentCopy" @click="formatJson">格式化</el-button>
        <el-button icon="Check" @click="validateJson">验证</el-button>
        <el-button type="primary" icon="Document" @click="saveJob" :loading="saving">保存</el-button>
      </div>
    </div>

    <!-- JSON 编辑器 -->
    <div class="editor-container">
      <div class="editor-wrapper">
        <div ref="editorContainer" class="json-editor"></div>
      </div>
      <div class="editor-footer">
        <el-alert
          v-if="validationError"
          :title="validationError"
          type="error"
          :closable="false"
          show-icon
        />
        <el-alert
          v-else-if="validationSuccess"
          title="JSON 格式正确"
          type="success"
          :closable="false"
          show-icon
        />
        <div v-else class="tips">
          <el-icon><InfoFilled /></el-icon>
          <span>提示：请在编辑器中输入 SeaTunnel 任务配置的 JSON 格式</span>
        </div>
      </div>
    </div>

    <!-- 引擎配置弹框 -->
    <engine-config-modal
      v-model:visible="engineConfigVisible"
      :engine-name="jobInfo.engineName"
      :engine-version="jobInfo.engineVersion"
      :engine-param="jobInfo.engineParam"
      @confirm="handleEngineConfigConfirm"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { InfoFilled } from '@element-plus/icons-vue';
import * as monaco from 'monaco-editor';
import * as jobApi from '@/api/dig/jobApi';
import EngineConfigModal from '../designer/components/EngineConfigModal.vue';

const route = useRoute();
const router = useRouter();

const editorContainer = ref(null);
const validationError = ref('');
const validationSuccess = ref(false);
const saving = ref(false);
const engineConfigVisible = ref(false);
let editor = null;

const jobInfo = reactive({
  jobId: null,
  jobName: '',
  description: '',
  jobType: 2,
  jobScript: '',
  engineName: 'seatunnel',
  engineVersion: '',
  engineParam: '',
});

// 获取默认模板
const getDefaultTemplate = () => {
  return JSON.stringify(
    {
      env: {
        'job.mode': 'BATCH',
      },
      source: [
        {
          plugin_name: 'MySQL-CDC',
          plugin_output: 'mysql_source',
          server_id: 5652,
          username: 'root',
          password: 'password',
          table_names: ['database.table'],
          base_url: 'jdbc:mysql://localhost:3306/database',
        },
      ],
      transform: [],
      sink: [
        {
          plugin_name: 'Doris',
          plugin_input: ['mysql_source'],
          fenodes: 'localhost:8030',
          username: 'root',
          password: '',
          database: 'test',
          table: 'table',
          sink_label: 'label',
          'sink.enable-2pc': true,
          'sink.enable-delete': true,
        },
      ],
    },
    null,
    2
  );
};

// 初始化编辑器
const initEditor = () => {
  if (editorContainer.value) {
    editor = monaco.editor.create(editorContainer.value, {
      value: jobInfo.jobScript || getDefaultTemplate(),
      language: 'json',
      theme: 'vs-dark',
      automaticLayout: true,
      fontSize: 14,
      minimap: { enabled: true },
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      formatOnPaste: true,
      formatOnType: true,
      tabSize: 2,
    });

    // 监听内容变化
    editor.onDidChangeModelContent(() => {
      validationError.value = '';
      validationSuccess.value = false;
    });
  }
};

// 加载任务数据
const loadJobData = async () => {
  try {
    const jobId = route.query.jobId;
    if (!jobId) {
      ElMessage.warning('任务ID不存在');
      return;
    }

    // 先从 URL 参数获取 jobName
    if (route.query.jobName) {
      jobInfo.jobName = decodeURIComponent(route.query.jobName);
    }

    const response = await jobApi.getJobDetail(jobId);
    jobInfo.jobId = response.jobId;
    jobInfo.jobName = response.jobName || jobInfo.jobName;
    jobInfo.description = response.description;
    jobInfo.jobType = response.jobType || 2;
    jobInfo.jobScript = response.jobScript || '';
    jobInfo.engineName = response.engineName || 'seatunnel';
    jobInfo.engineVersion = response.engineVersion || '';
    jobInfo.engineParam = response.engineParam || '';

    // 更新编辑器内容
    if (editor && jobInfo.jobScript) {
      editor.setValue(jobInfo.jobScript);
    }
  } catch (error) {
    console.error('加载任务数据失败:', error);
    ElMessage.error('加载任务数据失败');
  }
};

// 格式化 JSON
const formatJson = () => {
  if (editor) {
    try {
      const value = editor.getValue();
      const parsed = JSON.parse(value);
      const formatted = JSON.stringify(parsed, null, 2);
      editor.setValue(formatted);
      ElMessage.success('格式化成功');
    } catch (error) {
      ElMessage.error('JSON 格式错误，无法格式化');
    }
  }
};

// 验证 JSON
const validateJson = () => {
  if (editor) {
    try {
      const value = editor.getValue();
      if (!value.trim()) {
        validationError.value = 'JSON 内容不能为空';
        ElMessage.error('JSON 内容不能为空');
        return false;
      }
      JSON.parse(value);
      validationError.value = '';
      validationSuccess.value = true;
      ElMessage.success('JSON 格式正确');
      return true;
    } catch (error) {
      validationError.value = `JSON 格式错误: ${error.message}`;
      validationSuccess.value = false;
      ElMessage.error('JSON 格式错误');
      return false;
    }
  }
  return false;
};

// 保存任务
const saveJob = () => {
  // 先验证 JSON 格式
  if (!validateJson()) {
    return;
  }
  // 打开引擎配置弹框
  engineConfigVisible.value = true;
};

// 处理引擎配置确认
const handleEngineConfigConfirm = async (engineConfig) => {
  try {
    saving.value = true;
    const jobId = route.query.jobId || jobInfo.jobId;
    if (!jobId) {
      ElMessage.warning('任务ID不存在');
      return;
    }

    const jobScript = editor.getValue();

    // 调用 PUT /st/job 接口
    const saveData = {
      jobId: parseInt(jobId),
      jobName: jobInfo.jobName,
      description: jobInfo.description,
      jobType: 2, // 专家模式
      jobScript: jobScript,
      engineName: engineConfig.engineName,
      engineVersion: engineConfig.engineVersion,
      engineParam: engineConfig.engineParam,
    };

    await jobApi.updateJob(saveData);

    // 更新本地引擎配置信息
    jobInfo.engineName = engineConfig.engineName;
    jobInfo.engineVersion = engineConfig.engineVersion;
    jobInfo.engineParam = engineConfig.engineParam;

    ElMessage.success('保存成功');
  } catch (error) {
    console.error('保存失败:', error);
    ElMessage.error(error.message || '保存失败');
  } finally {
    saving.value = false;
  }
};

// 返回
const goBack = async () => {
  // 检查是否有未保存的更改
  if (editor) {
    const currentValue = editor.getValue();
    if (currentValue !== jobInfo.jobScript) {
      try {
        await ElMessageBox.confirm('当前有未保存的更改，确定要离开吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        });
      } catch {
        return; // 用户取消
      }
    }
  }
  router.push('/dig/job');
};

onMounted(async () => {
  await nextTick();
  initEditor();

  // 如果有 jobId，加载任务数据
  const jobId = route.query.jobId;
  if (jobId) {
    await loadJobData();
  }
});

onBeforeUnmount(() => {
  if (editor) {
    editor.dispose();
  }
});
</script>

<style scoped lang="scss">
.expert-designer-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #1e1e1e;

  .toolbar {
    height: 60px;
    background: #252526;
    border-bottom: 1px solid #3e3e42;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 32px;
    z-index: 2;

    .toolbar-left {
      display: flex;
      align-items: center;

      .job-title {
        font-size: 16px;
        color: #cccccc;
        margin-left: 10px;
        font-weight: 500;
      }
    }

    .toolbar-right {
      display: flex;
      gap: 8px;
    }
  }

  .editor-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    .editor-wrapper {
      flex: 1;
      overflow: hidden;

      .json-editor {
        width: 100%;
        height: 100%;
      }
    }

    .editor-footer {
      padding: 12px 20px;
      background: #252526;
      border-top: 1px solid #3e3e42;
      min-height: 60px;

      .tips {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #858585;
        font-size: 13px;

        .el-icon {
          font-size: 16px;
        }
      }
    }
  }
}
</style>
