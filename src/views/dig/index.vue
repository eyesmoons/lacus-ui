<template>
  <div class="seatunnel-container">
    <div class="header-section">
      <div class="title-area">
        <h2>SeaTunnel 数据集成</h2>
        <p>可视化数据集成平台，支持多种数据源的实时同步</p>
      </div>
      <div class="action-area">
        <el-button type="primary" icon="Plus" @click="createNewJob"> 新建作业 </el-button>
        <el-button icon="Refresh" @click="refreshJobList"> 刷新 </el-button>
      </div>
    </div>

    <div class="content-section">
      <!-- 搜索区域 -->
      <el-form :model="queryParams" ref="queryRef" :inline="true" class="search-form">
        <el-form-item label="作业名称" prop="jobName">
          <el-input v-model="queryParams.jobName" placeholder="请输入作业名称" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="queryParams.status" placeholder="请选择状态" clearable>
            <el-option label="运行中" value="RUNNING" />
            <el-option label="已停止" value="STOPPED" />
            <el-option label="失败" value="FAILED" />
            <el-option label="完成" value="FINISHED" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 作业列表 -->
      <el-table v-loading="loading" :data="jobList" stripe border>
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="作业ID" prop="jobId" width="80" />
        <el-table-column label="作业名称" prop="jobName" min-width="150" />
        <el-table-column label="描述" prop="description" min-width="200" show-overflow-tooltip />
        <el-table-column label="状态" prop="status" width="100" align="center">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
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
        <el-table-column label="操作" width="200" align="center" fixed="right">
          <template #default="scope">
            <el-button-group>
              <el-tooltip content="编辑" placement="top">
                <el-button type="primary" icon="Edit" @click="editJob(scope.row)" />
              </el-tooltip>
              <el-tooltip content="查看详情" placement="top">
                <el-button type="info" icon="View" @click="viewJob(scope.row)" />
              </el-tooltip>
              <el-tooltip content="执行" placement="top">
                <el-button
                  type="success"
                  icon="VideoPlay"
                  @click="executeJob(scope.row)"
                  :disabled="scope.row.status === 'RUNNING'"
                />
              </el-tooltip>
              <el-tooltip content="停止" placement="top">
                <el-button
                  type="warning"
                  icon="VideoPause"
                  @click="stopJob(scope.row)"
                  :disabled="scope.row.status !== 'RUNNING'"
                />
              </el-tooltip>
              <el-tooltip content="删除" placement="top">
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
    </div>
  </div>
</template>

<script setup name="SeaTunnelIndex">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import * as taskApi from '@/api/dig/taskApi';

const router = useRouter();
const loading = ref(false);
const total = ref(0);
const jobList = ref([]);

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  jobName: '',
  status: '',
});

// 获取作业列表
const getJobList = async () => {
  loading.value = true;
  try {
    const response = await taskApi.getTaskList(queryParams);
    jobList.value = response.rows || [];
    total.value = response.total || 0;
  } catch (error) {
    console.error('获取作业列表失败:', error);
    ElMessage.error('获取作业列表失败');
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
  queryParams.pageNum = 1;
  getJobList();
};

// 刷新列表
const refreshJobList = () => {
  getJobList();
};

// 新建作业
const createNewJob = () => {
  router.push('/seatunnel/designer');
};

// 编辑作业
const editJob = (row) => {
  router.push(`/seatunnel/designer?jobId=${row.jobId}`);
};

// 查看作业详情
const viewJob = (row) => {
  router.push(`/seatunnel/detail/${row.jobId}`);
};

// 执行作业
const executeJob = async (row) => {
  try {
    await taskApi.executeTask(row.jobId);
    ElMessage.success('作业执行成功');
    getJobList();
  } catch (error) {
    console.error('执行作业失败:', error);
    ElMessage.error('执行作业失败');
  }
};

// 停止作业
const stopJob = async (row) => {
  try {
    await ElMessageBox.confirm('确定要停止该作业吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });

    await taskApi.stopTask(row.jobId);
    ElMessage.success('作业停止成功');
    getJobList();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('停止作业失败:', error);
      ElMessage.error('停止作业失败');
    }
  }
};

// 删除作业
const deleteJob = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该作业吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });

    await taskApi.deleteTask(row.jobId);
    ElMessage.success('删除成功');
    getJobList();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除作业失败:', error);
      ElMessage.error('删除作业失败');
    }
  }
};

// 获取状态类型
const getStatusType = (status) => {
  const statusMap = {
    RUNNING: 'success',
    STOPPED: 'info',
    FAILED: 'danger',
    FINISHED: 'success',
  };
  return statusMap[status] || 'info';
};

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    RUNNING: '运行中',
    STOPPED: '已停止',
    FAILED: '失败',
    FINISHED: '完成',
  };
  return statusMap[status] || status;
};

onMounted(() => {
  getJobList();
});
</script>

<style scoped lang="scss">
.seatunnel-container {
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
  }
}
</style>
