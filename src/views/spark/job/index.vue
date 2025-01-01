<template>
  <div class="app-container">
    <!-- 搜索表单 -->
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="任务名称" prop="jobName">
        <el-input v-model="queryParams.jobName" placeholder="请输入任务名称" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="任务类型" prop="jobType">
        <el-select v-model="queryParams.jobType" placeholder="请选择任务类型" clearable>
          <el-option v-for="dict in jobTypeOptions" :key="dict.value" :label="dict.label" :value="dict.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="任务状态" prop="jobStatus">
        <el-select v-model="queryParams.jobStatus" placeholder="请选择任务状态" clearable>
          <el-option v-for="dict in statusOptions" :key="dict.value" :label="dict.label" :value="dict.value" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 操作按钮 -->
    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-dropdown @command="handleAdd">
          <el-button type="primary" plain icon="Plus">
            新建任务
            <el-icon class="el-icon--right">
              <arrow-down />
            </el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="BATCH_SQL">BATCH_SQL</el-dropdown-item>
              <el-dropdown-item command="JAR">JAR</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
    </el-row>

    <!-- 任务列表 -->
    <el-table v-loading="loading" :data="jobList" stripe border>
      <el-table-column label="任务名称" align="left" prop="jobName" :show-overflow-tooltip="true" />
      <el-table-column label="任务类型" align="center" prop="jobType">
        <template #default="scope">
          <dict-tag :options="jobTypeOptions" :value="scope.row.jobType" />
        </template>
      </el-table-column>
      <el-table-column label="部署模式" align="center" prop="deployMode" />
      <el-table-column label="任务状态" align="center" prop="jobStatus">
        <template #default="scope">
          <dict-tag :options="statusOptions" :value="scope.row.jobStatus" />
        </template>
      </el-table-column>
      <el-table-column label="任务说明" align="center" prop="remark" :show-overflow-tooltip="true" />
      <el-table-column label="应用ID" align="center" prop="appId" :show-overflow-tooltip="true" />
      <el-table-column label="创建时间" align="center" prop="createTime" width="180" />
      <el-table-column label="操作" align="center" width="280" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button type="text" icon="Edit" @click="handleEdit(scope.row)" v-if="scope.row.jobStatus === 'CREATED'"
            >编辑</el-button
          >
          <el-button type="text" icon="Delete" @click="handleDelete(scope.row)" v-if="scope.row.jobStatus === 'CREATED'"
            >删除</el-button
          >
          <el-button type="text" icon="View" @click="handleDetail(scope.row)">详情</el-button>
          <el-button
            type="text"
            icon="VideoPlay"
            @click="handleStart(scope.row)"
            v-if="scope.row.jobStatus === 'CREATED'"
            >启动</el-button
          >
          <el-button
            type="text"
            icon="VideoPause"
            @click="handleStop(scope.row)"
            v-if="scope.row.jobStatus === 'RUNNING'"
            >停止</el-button
          >
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <pagination
      v-show="total > 0"
      :total="total"
      v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { pageList, removeJob, startJob, stopJob } from '@/api/spark/jobApi';
import { useRouter } from 'vue-router';

const router = useRouter();
const loading = ref(false);
const showSearch = ref(true);
const total = ref(0);
const jobList = ref([]);

// 任务类型选项
const jobTypeOptions = [
  { label: '批处理SQL任务', value: 'BATCH_SQL' },
  { label: 'JAR任务', value: 'JAR' },
];

// 任务状态选项
const statusOptions = [
  { label: '已提交', value: 'SUBMITTED' },
  { label: '运行中', value: 'RUNNING' },
  { label: '已结束', value: 'FINISHED' },
  { label: '失败', value: 'FAILED' },
  { label: '已杀死', value: 'KILLED' },
  { label: '未运行', value: 'CREATED' },
];

// 查询参数
const queryParams = ref({
  pageNum: 1,
  pageSize: 10,
  jobName: undefined,
  jobType: undefined,
  jobStatus: undefined,
});

/** 查询任务列表 */
function getList() {
  loading.value = true;
  pageList(queryParams.value).then((response) => {
    jobList.value = response.rows;
    total.value = response.total;
    loading.value = false;
  });
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.value.pageNum = 1;
  getList();
}

/** 重置按钮操作 */
function resetQuery() {
  queryParams.value = {
    pageNum: 1,
    pageSize: 10,
    jobName: undefined,
    jobType: undefined,
    jobStatus: undefined,
  };
  handleQuery();
}

/** 新建任务操作 */
function handleAdd(command) {
  if (command === 'BATCH_SQL') {
    router.push('/spark/job/add/sql');
  } else if (command === 'JAR') {
    router.push('/spark/job/add/jar');
  }
}

/** 编辑任务操作 */
function handleEdit(row) {
  router.push(`/spark/job/edit/${row.jobId}`);
}

/** 删除任务操作 */
function handleDelete(row) {
  ElMessageBox.confirm('是否确认删除该任务?', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    removeJob(row.jobId).then(() => {
      getList();
      ElMessage.success('删除成功');
    });
  });
}

/** 查看详情操作 */
function handleDetail(row) {
  router.push(`/spark/job/detail/${row.jobId}`);
}

/** 启动任务操作 */
function handleStart(row) {
  ElMessageBox.confirm('是否确认启动该任务?', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'info',
  }).then(() => {
    startJob(row.jobId).then(() => {
      getList();
      ElMessage.success('启动成功');
    });
  });
}

/** 停止任务操作 */
function handleStop(row) {
  ElMessageBox.confirm('是否确认停止该任务?', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    stopJob(row.jobId).then(() => {
      getList();
      ElMessage.success('停止成功');
    });
  });
}

onMounted(() => {
  getList();
});
</script>
