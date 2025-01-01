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
      <el-form-item label="实例状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择实例状态" clearable>
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
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
    </el-row>

    <!-- 实例列表 -->
    <el-table v-loading="loading" :data="instanceList" stripe border>
      <el-table-column label="实例名称" align="left" prop="instanceName" :show-overflow-tooltip="true" />
      <el-table-column label="任务名称" align="left" prop="jobName" :show-overflow-tooltip="true" />
      <el-table-column label="任务类型" align="center" prop="jobType">
        <template #default="scope">
          <dict-tag :options="jobTypeOptions" :value="scope.row.jobType" />
        </template>
      </el-table-column>
      <el-table-column label="部署模式" align="center" prop="deployMode" />
      <el-table-column label="实例状态" align="center" prop="status">
        <template #default="scope">
          <dict-tag :options="statusOptions" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="应用ID" align="center" prop="applicationId" :show-overflow-tooltip="true" />
      <el-table-column label="提交时间" align="center" prop="submitTime" width="180" />
      <el-table-column label="完成时间" align="center" prop="finishedTime" width="180" />
      <el-table-column label="操作" align="center" width="150" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button type="text" icon="View" @click="handleDetail(scope.row)">详情</el-button>
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
import { useRouter } from 'vue-router';
import { pageList } from '@/api/spark/instanceApi';

const router = useRouter();
const loading = ref(false);
const showSearch = ref(true);
const total = ref(0);
const instanceList = ref([]);

// 任务类型选项
const jobTypeOptions = [
  { label: '批处理SQL任务', value: 'BATCH_SQL' },
  { label: 'JAR任务', value: 'JAR' },
];

// 实例状态选项
const statusOptions = [
  { label: '已提交', value: 'SUBMITTED' },
  { label: '运行中', value: 'RUNNING' },
  { label: '已结束', value: 'FINISHED' },
  { label: '失败', value: 'FAILED' },
  { label: '已杀死', value: 'KILLED' },
];

// 查询参数
const queryParams = ref({
  pageNum: 1,
  pageSize: 10,
  jobName: undefined,
  jobType: undefined,
  status: undefined,
});

/** 查询实例列表 */
function getList() {
  loading.value = true;
  pageList(queryParams.value).then((response) => {
    instanceList.value = response.rows;
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
    status: undefined,
  };
  handleQuery();
}

/** 查看详情操作 */
function handleDetail(row) {
  router.push(`/spark/instance/detail/${row.instanceId}`);
}

onMounted(() => {
  getList();
});
</script>
