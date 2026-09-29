<template>
  <div class="rule-container">
    <!-- 搜索区域 -->
    <el-form :model="queryParams" ref="queryRef" :inline="true" class="search-form" v-show="showSearch">
      <el-form-item label="调度名称" prop="keyword">
        <el-input v-model="queryParams.keyword" placeholder="请输入调度名称" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable style="width: 120px">
          <el-option label="正常" value="NORMAL" />
          <el-option label="暂停" value="PAUSE" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">查询</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" icon="Plus" @click="handleAdd">新增调度</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="loadList" />
    </el-row>

    <el-tag v-if="filterRuleId" closable @close="clearRuleFilter" type="info" style="margin-bottom: 8px">
      当前过滤规则 ID: {{ filterRuleId }}
    </el-tag>

    <!-- 调度列表 -->
    <el-table v-loading="loading" :data="scheduleList" stripe border>
      <el-table-column label="调度名称" prop="jobName" min-width="180" show-overflow-tooltip />
      <el-table-column label="绑定规则" prop="ruleName" min-width="180" show-overflow-tooltip />
      <el-table-column label="Cron 表达式" prop="cronExpression" width="180" show-overflow-tooltip />
      <el-table-column label="下次执行时间" prop="nextFireTime" width="180" align="center">
        <template #default="scope">{{ scope.row.nextFireTime || '—' }}</template>
      </el-table-column>
      <el-table-column label="状态" prop="status" width="100" align="center">
        <template #default="scope">
          <el-tag :type="scope.row.status === 'NORMAL' ? 'success' : 'danger'" size="small">
            {{ scope.row.status === 'NORMAL' ? '正常' : '暂停' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="260" align="center" fixed="right">
        <template #default="scope">
          <el-button-group>
            <el-tooltip content="编辑" placement="top">
              <el-button type="warning" icon="Edit" @click="handleEdit(scope.row)" />
            </el-tooltip>
            <el-tooltip :content="scope.row.status === 'NORMAL' ? '暂停' : '恢复'" placement="top">
              <el-button
                :type="scope.row.status === 'NORMAL' ? 'info' : 'success'"
                :icon="scope.row.status === 'NORMAL' ? 'VideoPause' : 'VideoPlay'"
                @click="handleToggleStatus(scope.row)"
              />
            </el-tooltip>
            <el-tooltip content="立即执行" placement="top">
              <el-button type="primary" icon="Promotion" @click="handleRun(scope.row)" />
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button type="danger" icon="Delete" @click="handleDelete(scope.row)" />
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
      @pagination="loadList"
    />
  </div>
</template>

<script setup name="DqSchedule">
import { ref, reactive, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  getScheduleList,
  pauseSchedule,
  resumeSchedule,
  runSchedule,
  deleteSchedule,
} from '@/api/dataquality/scheduleApi';

const router = useRouter();
const route = useRoute();
const filterRuleId = ref(Number(route.query.ruleId) || null);
const loading = ref(false);
const total = ref(0);
const scheduleList = ref([]);
const showSearch = ref(true);

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  keyword: '',
  status: '',
});

const loadList = async () => {
  loading.value = true;
  try {
    const params = {
      pageNum: queryParams.pageNum,
      pageSize: queryParams.pageSize,
    };
    if (queryParams.keyword) params.keyword = queryParams.keyword;
    if (queryParams.status) params.status = queryParams.status;
    // 始终传 ruleId（后端未来支持后自动生效），前端同时本地过滤兜底
    if (filterRuleId.value) params.ruleId = filterRuleId.value;
    const res = await getScheduleList(params);
    const all = res.rows || [];
    scheduleList.value = filterRuleId.value
      ? all.filter((s) => s.ruleId === filterRuleId.value)
      : all;
    // 本地过滤时 total 取过滤后长度，后端分页时取 res.total
    total.value = filterRuleId.value ? scheduleList.value.length : (res.total || 0);
  } catch (e) {
    ElMessage.error('获取调度列表失败');
  } finally {
    loading.value = false;
  }
};

const clearRuleFilter = () => {
  filterRuleId.value = null;
  router.replace({ path: '/dataquality/schedule' });
  loadList();
};

const handleQuery = () => { queryParams.pageNum = 1; loadList(); };
const resetQuery = () => {
  queryParams.keyword = '';
  queryParams.status = '';
  queryParams.pageNum = 1;
  loadList();
};

const handleAdd = () => { router.push('/dataquality/schedule/add'); };
const handleEdit = (row) => { router.push(`/dataquality/schedule/edit/${row.jobId}`); };

const handleToggleStatus = async (row) => {
  try {
    if (row.status === 'NORMAL') {
      await pauseSchedule(row.jobId);
      ElMessage.success('已暂停');
    } else {
      await resumeSchedule(row.jobId);
      ElMessage.success('已恢复');
    }
    loadList();
  } catch (e) {
    ElMessage.error('操作失败');
  }
};

const handleRun = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要立即执行调度「${row.jobName}」吗？`, '提示', {
      confirmButtonText: '确定', cancelButtonText: '取消', type: 'info',
    });
    await runSchedule(row.jobId);
    ElMessage.success('调度已触发执行');
    loadList();
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('执行失败');
  }
};

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除调度「${row.jobName}」吗？删除后不可恢复！`, '提示', {
      confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning',
    });
    await deleteSchedule(row.jobId);
    ElMessage.success('删除成功');
    loadList();
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('删除失败');
  }
};

onMounted(() => { loadList(); });
</script>

<style scoped lang="scss">
.rule-container {
  padding: 20px;

  .search-form {
    margin-bottom: 8px;
  }
}
</style>
