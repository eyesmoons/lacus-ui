<template>
  <el-dialog
    :title="`${datasourceName} - 同步日志`"
    v-model="visible"
    width="1200px"
    append-to-body
    @close="handleClose"
  >
    <!-- 查询表单 -->
    <el-form :model="queryParams" ref="queryRef" :inline="true" label-width="80px">
      <el-form-item label="执行状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择执行状态" clearable style="width: 150px">
          <el-option label="成功" value="0" />
          <el-option label="失败" value="1" />
        </el-select>
      </el-form-item>
      <el-form-item label="执行时间">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="-"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          style="width: 240px"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 日志列表 -->
    <el-table v-loading="loading" :data="logList" stripe border>
      <el-table-column label="任务名称" align="left" prop="jobName" show-overflow-tooltip width="200" />
      <el-table-column label="执行时间" align="center" prop="createTime" show-overflow-tooltip width="150">
        <template #default="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="执行状态" align="center" prop="status" width="100">
        <template #default="scope">
          <el-tag :type="scope.row.status === '0' ? 'success' : 'danger'">
            {{ scope.row.status === '0' ? '成功' : '失败' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="执行信息" align="left" prop="jobMessage" show-overflow-tooltip min-width="200" />
      <el-table-column label="错误信息" align="left" prop="exceptionInfo" show-overflow-tooltip min-width="200" />
    </el-table>

    <!-- 分页 -->
    <pagination
      v-show="total > 0"
      :total="total"
      v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 日志详情对话框 -->
    <el-dialog
      title="日志详情"
      v-model="detailDialogVisible"
      width="800px"
      append-to-body
    >
      <el-descriptions :column="1" border>
        <el-descriptions-item label="任务名称">{{ currentLog.jobName }}</el-descriptions-item>
        <el-descriptions-item label="任务组名">{{ currentLog.jobGroup }}</el-descriptions-item>
        <el-descriptions-item label="调用目标">{{ currentLog.invokeTarget }}</el-descriptions-item>
        <el-descriptions-item label="执行时间">{{ parseTime(currentLog.createTime) }}</el-descriptions-item>
        <el-descriptions-item label="执行状态">
          <el-tag :type="currentLog.status === '0' ? 'success' : 'danger'">
            {{ currentLog.status === '0' ? '成功' : '失败' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="执行信息">{{ currentLog.jobMessage }}</el-descriptions-item>
        <el-descriptions-item label="异常信息" v-if="currentLog.exceptionInfo">
          <el-scrollbar max-height="300px">
            <pre style="white-space: pre-wrap; word-wrap: break-word;">{{ currentLog.exceptionInfo }}</pre>
          </el-scrollbar>
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { getSyncJobLogs } from '@/api/metadata/datasourceSyncJobApi';
import { parseTime } from '@/utils/dateUtil';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  datasourceId: {
    type: Number,
    required: true,
  },
  datasourceName: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['update:modelValue']);

const loading = ref(false);
const logList = ref([]);
const total = ref(0);
const detailDialogVisible = ref(false);
const currentLog = ref({});
const dateRange = ref([]);

const queryParams = ref({
  pageNum: 1,
  pageSize: 10,
  status: undefined,
  startTime: undefined,
  endTime: undefined,
});

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

// 监听对话框打开，自动加载数据
watch(visible, (newVal) => {
  if (newVal) {
    resetQuery();
    getList();
  }
});

/** 查询日志列表 */
async function getList() {
  loading.value = true;
  try {
    // 处理日期范围
    if (dateRange.value && dateRange.value.length === 2) {
      queryParams.value.startTime = dateRange.value[0];
      queryParams.value.endTime = dateRange.value[1];
    } else {
      queryParams.value.startTime = undefined;
      queryParams.value.endTime = undefined;
    }

    const response = await getSyncJobLogs(props.datasourceId, queryParams.value);
    logList.value = response.rows || response || [];
    total.value = response.total || logList.value.length;
  } catch (error) {
    console.error('查询同步日志失败:', error);
    logList.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.value.pageNum = 1;
  getList();
}

/** 重置按钮操作 */
function resetQuery() {
  dateRange.value = [];
  queryParams.value = {
    pageNum: 1,
    pageSize: 10,
    status: undefined,
    startTime: undefined,
    endTime: undefined,
  };
  getList();
}

/** 查看详情 */
function handleViewDetail(row) {
  currentLog.value = row;
  detailDialogVisible.value = true;
}

function handleClose() {
  visible.value = false;
  logList.value = [];
  total.value = 0;
}
</script>

<style scoped>
pre {
  margin: 0;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.5;
}

:deep(.el-descriptions__label) {
  width: 120px;
}
</style>
