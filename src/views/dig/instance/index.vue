<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" :inline="true" v-show="showSearch" label-width="80px">
      <el-form-item label="任务ID" prop="jobId">
        <el-input v-model="queryParams.jobId" placeholder="请输入任务ID" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="实例名称" prop="instanceName">
        <el-input
          v-model="queryParams.instanceName"
          placeholder="请输入实例名称"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="instanceList">
      <el-table-column label="实例ID" align="center" prop="instanceId" width="100" />
      <el-table-column label="实例名称" align="center" prop="instanceName" :show-overflow-tooltip="true" />
      <el-table-column label="任务名称" align="center" prop="jobName" :show-overflow-tooltip="true" />
      <el-table-column label="状态" align="center" prop="status">
        <template #default="scope">
          <el-tag :type="getStatusType(scope.row.status)">
            {{ getStatusLabel(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" align="center" prop="createTime" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="View" @click="handleDetail(scope.row)">详情</el-button>
          <el-button link type="primary" icon="Document" @click="handleLogs(scope.row)">日志</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total > 0"
      :total="total"
      v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 任务实例详情对话框 -->
    <el-dialog :title="dialogTitle" v-model="open" width="80%" append-to-body>
      <div style="height: 500px">
        <monaco-editor v-model="editorContent" :language="editorLanguage" :options="{ readOnly: true }" height="100%" />
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="open = false">关 闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Instance">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { getInstanceList, getInstanceDetail } from '@/api/dig/instanceApi';
import { parseTime } from '@/utils/dateUtil';
import MonacoEditor from '@/components/MonacoEditor/index.vue';

const loading = ref(true);
const showSearch = ref(true);
const total = ref(0);
const instanceList = ref([]);
const open = ref(false);
const dialogTitle = ref('');
const editorContent = ref('');
const editorLanguage = ref('json');

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  jobId: undefined,
  instanceName: undefined,
});

/** 查询任务实例列表 */
const getList = async () => {
  loading.value = true;
  try {
    const response = await getInstanceList(queryParams);
    instanceList.value = response.rows || [];
    total.value = response.total || 0;
  } catch (error) {
    console.error('获取任务实例列表失败:', error);
    ElMessage.error('获取任务实例列表失败');
  } finally {
    loading.value = false;
  }
};

/** 状态标签样式 */
function getStatusType(status) {
  const types = {
    0: 'primary',
    1: 'danger',
    2: 'success',
  };
  return types[status] || 'info';
}

/** 状态标签文字 */
function getStatusLabel(status) {
  const labels = {
    0: '运行中',
    1: '失败',
    2: '成功',
  };
  return labels[status] || '未知';
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.pageNum = 1;
  getList();
}

/** 重置按钮操作 */
function resetQuery() {
  queryParams.jobId = undefined;
  queryParams.instanceName = undefined;
  handleQuery();
}

/** 查看详情操作 */
function handleDetail(row) {
  dialogTitle.value = '任务配置详情';
  editorContent.value = row.jobConfig || '';
  editorLanguage.value = 'json';
  open.value = true;
}

/** 查看日志操作 */
function handleLogs(row) {
  dialogTitle.value = '执行日志';
  editorContent.value = row.logInfo || '';
  editorLanguage.value = 'text';
  open.value = true;
}

onMounted(() => {
  getList();
});
</script>

<style scoped>
.app-container {
  padding: 20px;
}
</style>
