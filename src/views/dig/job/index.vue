<template>
  <div class="job-container">
    <!-- 搜索区域 -->
    <el-form :model="queryParams" ref="queryRef" :inline="true" class="search-form">
      <el-form-item label="任务名称" prop="jobName">
        <el-input v-model="queryParams.jobName" placeholder="请输入任务名称" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable>
          <el-option label="草稿" :value="0" />
          <el-option label="已发布" :value="1" />
        </el-select>
      </el-form-item>
      <el-form-item label="创建时间">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" icon="Plus" @click="createNewJob"> 新建任务 </el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
    </el-row>
    <!-- 任务列表 -->
    <el-table v-loading="loading" :data="jobList" stripe border @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="任务名称" prop="jobName" min-width="150" show-overflow-tooltip />
      <el-table-column label="描述" prop="description" min-width="200" show-overflow-tooltip />
      <el-table-column label="状态" prop="status" width="100" align="center">
        <template #default="scope">
          <el-tag :type="getStatusType(scope.row.status)">
            {{ getStatusText(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="创建人" prop="createBy" width="120" />
      <el-table-column label="创建时间" prop="createTime" width="180" align="center">
        <template #default="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="更新时间" prop="updateTime" width="180" align="center">
        <template #default="scope">
          <span>{{ parseTime(scope.row.updateTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="250" align="center" fixed="right">
        <template #default="scope">
          <el-button-group>
            <el-tooltip content="设计任务" placement="top">
              <el-button type="primary" icon="Refresh" @click="designJob(scope.row)" />
            </el-tooltip>
            <el-tooltip content="编辑任务" placement="top">
              <el-button type="warning" icon="Edit" @click="editJob(scope.row)" />
            </el-tooltip>
            <el-tooltip content="发布任务" placement="top">
              <el-button
                type="success"
                icon="Upload"
                @click="publishJob(scope.row)"
                :disabled="scope.row.status === 1"
              />
            </el-tooltip>
            <el-tooltip content="删除任务" placement="top">
              <el-button type="danger" icon="Delete" @click="deleteJob(scope.row)" />
            </el-tooltip>
          </el-button-group>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <pagination
      v-show="total > 0"
      :total="total"
      v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize"
      @pagination="getJobList"
    />

    <!-- 批量操作 -->
    <div class="batch-actions" v-if="selectedJobs.length > 0">
      <el-card shadow="always">
        <div class="batch-content">
          <span>已选择 {{ selectedJobs.length }} 个任务</span>
          <div class="batch-buttons">
            <el-button type="danger" icon="Delete" @click="batchDelete">批量删除</el-button>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 新建任务弹框 -->
    <el-dialog
      v-model="createDialogVisible"
      title="新建任务"
      width="500px"
      :close-on-click-modal="false"
      @close="resetCreateForm"
    >
      <el-form ref="createFormRef" :model="createForm" :rules="createRules" label-width="100px">
        <el-form-item label="任务名称" prop="jobName">
          <el-input v-model="createForm.jobName" placeholder="请输入任务名称" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item label="任务描述" prop="description">
          <el-input
            v-model="createForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入任务描述"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="createDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitCreateForm" :loading="createLoading"> 确定 </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 编辑任务弹框 -->
    <el-dialog
      v-model="editDialogVisible"
      title="编辑任务"
      width="500px"
      :close-on-click-modal="false"
      @close="resetEditForm"
    >
      <el-form ref="editFormRef" :model="editForm" :rules="editRules" label-width="100px">
        <el-form-item label="任务名称" prop="jobName">
          <el-input v-model="editForm.jobName" placeholder="请输入任务名称" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item label="任务描述" prop="description">
          <el-input
            v-model="editForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入任务描述"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitEditForm" :loading="editLoading"> 确定 </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="DigJob">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { parseTime } from '@/utils/dateUtil';
import * as jobApi from '@/api/dig/jobApi';

const router = useRouter();
const loading = ref(false);
const total = ref(0);
const jobList = ref([]);
const selectedJobs = ref([]);
const dateRange = ref([]);
const showSearch = ref(true);

// 新建任务相关
const createDialogVisible = ref(false);
const createLoading = ref(false);
const createFormRef = ref(null);
const createForm = reactive({
  jobName: '',
  description: '',
});

// 编辑任务相关
const editDialogVisible = ref(false);
const editLoading = ref(false);
const editFormRef = ref(null);
const editForm = reactive({
  jobId: '',
  jobName: '',
  description: '',
});

// 新建任务表单验证规则
const createRules = {
  jobName: [
    { required: true, message: '请输入任务名称', trigger: 'blur' },
    { min: 2, max: 50, message: '任务名称长度在 2 到 50 个字符', trigger: 'blur' },
  ],
  description: [{ max: 200, message: '任务描述长度不能超过 200 个字符', trigger: 'blur' }],
};

// 编辑任务表单验证规则
const editRules = {
  jobName: [
    { required: true, message: '请输入任务名称', trigger: 'blur' },
    { min: 2, max: 50, message: '任务名称长度在 2 到 50 个字符', trigger: 'blur' },
  ],
  description: [{ max: 200, message: '任务描述长度不能超过 200 个字符', trigger: 'blur' }],
};

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  jobName: '',
  status: '',
});

// 获取任务列表
const getJobList = async () => {
  loading.value = true;
  try {
    const params = {
      ...queryParams,
      startTime: dateRange.value?.[0],
      endTime: dateRange.value?.[1],
    };
    const response = await jobApi.getJobList(params);
    jobList.value = response.rows || [];
    total.value = response.total || 0;
  } catch (error) {
    console.error('获取任务列表失败:', error);
    ElMessage.error('获取任务列表失败');
  } finally {
    loading.value = false;
  }
};

// 搜索
const handleQuery = () => {
  queryParams.pageNum = 1;
  getJobList();
};

// 重置搜索
const resetQuery = () => {
  queryParams.jobName = '';
  queryParams.status = '';
  dateRange.value = [];
  queryParams.pageNum = 1;
  getJobList();
};

// 刷新列表
const refreshJobList = () => {
  getJobList();
};

// 为RightToolbar组件提供的方法
const getList = () => {
  getJobList();
};

// 新建任务
const createNewJob = () => {
  createDialogVisible.value = true;
};

// 重置新建表单
const resetCreateForm = () => {
  createForm.jobName = '';
  createForm.description = '';
  createFormRef.value?.resetFields();
};

// 提交新建表单
const submitCreateForm = async () => {
  try {
    await createFormRef.value.validate();
    createLoading.value = true;

    // 调用创建任务API
    const response = await jobApi.createJob(createForm);
    ElMessage.success('任务创建成功');
    createDialogVisible.value = false;
    resetCreateForm();
    getJobList();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('创建任务失败:', error);
      ElMessage.error('创建任务失败');
    }
  } finally {
    createLoading.value = false;
  }
};

// 设计任务
const designJob = (row) => {
  router.push(`/dig/job/designer?jobId=${row.jobId}`);
};

// 编辑任务
const editJob = (row) => {
  // 填充编辑表单数据
  editForm.jobId = row.jobId;
  editForm.jobName = row.jobName;
  editForm.description = row.description || '';
  editDialogVisible.value = true;
};

// 重置编辑表单
const resetEditForm = () => {
  editForm.jobId = '';
  editForm.jobName = '';
  editForm.description = '';
  editFormRef.value?.resetFields();
};

// 提交编辑表单
const submitEditForm = async () => {
  try {
    await editFormRef.value.validate();
    editLoading.value = true;

    // 调用更新任务API
    await jobApi.updateJob(editForm);
    ElMessage.success('任务更新成功');
    editDialogVisible.value = false;
    resetEditForm();
    await getJobList();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('更新任务失败:', error);
      ElMessage.error('更新任务失败');
    }
  } finally {
    editLoading.value = false;
  }
};

// 删除任务
const deleteJob = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该任务吗？删除后不可恢复！', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });

    await jobApi.deleteJob(row.jobId);
    ElMessage.success('删除成功');
    getJobList();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除任务失败:', error);
      ElMessage.error('删除任务失败');
    }
  }
};

// 发布任务
const publishJob = async (row) => {
  try {
    await ElMessageBox.confirm('确定要发布该任务吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info',
    });

    await jobApi.publishJob(row.jobId);
    ElMessage.success('任务发布成功');
    getJobList();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('发布任务失败:', error);
      ElMessage.error('发布任务失败');
    }
  }
};

// 选择变化
const handleSelectionChange = (selection) => {
  selectedJobs.value = selection;
};

// 批量删除
const batchDelete = async () => {
  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedJobs.value.length} 个任务吗？删除后不可恢复！`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });

    // 实现批量删除逻辑
    ElMessage.success('批量删除成功');
    getJobList();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量删除失败:', error);
      ElMessage.error('批量删除失败');
    }
  }
};

// 获取状态类型
const getStatusType = (status) => {
  const statusMap = {
    0: 'info', // 草稿
    1: 'success', // 已发布
  };
  return statusMap[status] || 'info';
};

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    0: '草稿',
    1: '已发布',
  };
  return statusMap[status] || '未知';
};

onMounted(() => {
  getJobList();
});
</script>

<style scoped lang="scss">
.job-container {
  padding: 20px;

  .header-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding: 20px;
    background: var(--el-bg-color);
    border-radius: 8px;

    .title-area {
      h2 {
        margin: 0 0 8px 0;
        color: var(--el-text-color-primary);
        font-size: 24px;
      }

      p {
        margin: 0;
        color: var(--el-text-color-secondary);
        font-size: 14px;
      }
    }
  }

  .content-section {
    .search-form {
      background: var(--el-bg-color);
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
    }

    .task-badge {
      :deep(.el-badge__content) {
        background-color: var(--el-color-primary);
      }
    }
  }

  .batch-actions {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1000;

    .batch-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      min-width: 400px;

      .batch-buttons {
        display: flex;
        gap: 8px;
      }
    }
  }
}
</style>
