<template>
  <div class="result-container">
    <!-- 搜索区域 -->
    <el-form :model="queryParams" ref="queryRef" :inline="true" class="search-form" v-show="showSearch">
      <el-form-item label="规则名称" prop="ruleName">
        <el-input v-model="queryParams.ruleName" placeholder="请输入规则名称" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="执行状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable style="width: 140px">
          <el-option label="已提交" value="SUBMITTED" />
          <el-option label="运行中" value="RUNNING" />
          <el-option label="成功" value="SUCCESS" />
          <el-option label="失败" value="FAILED" />
          <el-option label="已停止" value="STOPPED" />
        </el-select>
      </el-form-item>
      <el-form-item label="开始时间">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD HH:mm:ss"
          :default-time="[new Date(0, 0, 0, 0, 0, 0), new Date(0, 0, 0, 23, 59, 59)]"
          style="width: 280px"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-tag v-if="hasActiveTask" type="warning" effect="plain">
          <el-icon class="rotating"><Loading /></el-icon>
          有任务正在执行，每 10 秒自动刷新
        </el-tag>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getResultList" />
    </el-row>

    <!-- 执行记录列表 -->
    <el-table v-loading="loading" :data="resultList" stripe border>
      <el-table-column label="规则名称" prop="ruleName" min-width="180" show-overflow-tooltip />
      <el-table-column label="Spark App ID" prop="sparkAppId" width="200" show-overflow-tooltip>
        <template #default="scope">
          <span v-if="scope.row.sparkAppId">
            {{ scope.row.sparkAppId }}
            <el-tooltip content="复制" placement="top">
              <el-icon style="cursor: pointer; margin-left: 4px" @click="copyText(scope.row.sparkAppId)"><CopyDocument /></el-icon>
            </el-tooltip>
          </span>
          <span v-else>—</span>
        </template>
      </el-table-column>
      <el-table-column label="执行状态" prop="status" width="120" align="center">
        <template #default="scope">
          <el-tag :type="getStatusTag(scope.row.status)" size="small">
            <el-icon v-if="scope.row.status === 'RUNNING'" class="rotating"><Loading /></el-icon>
            {{ getStatusLabel(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="检测结果" prop="passFlag" width="110" align="center">
        <template #default="scope">
          <template v-if="scope.row.passFlag === null || scope.row.passFlag === undefined || scope.row.status === 'SUBMITTED' || scope.row.status === 'RUNNING'">
            <el-tag type="info" size="small">—</el-tag>
          </template>
          <template v-else>
            <el-tag :type="scope.row.passFlag ? 'success' : 'danger'" size="small">
              {{ scope.row.passFlag ? '通过' : '不通过' }}
            </el-tag>
          </template>
        </template>
      </el-table-column>
      <el-table-column label="检测值" prop="resultValue" width="120" align="center">
        <template #default="scope">{{ scope.row.resultValue ?? '—' }}</template>
      </el-table-column>
      <el-table-column label="开始时间" prop="startTime" width="160" align="center" show-overflow-tooltip>
        <template #default="scope">{{ parseTime(scope.row.startTime) || '—' }}</template>
      </el-table-column>
      <el-table-column label="结束时间" prop="endTime" width="160" align="center" show-overflow-tooltip>
        <template #default="scope">{{ parseTime(scope.row.endTime) || '—' }}</template>
      </el-table-column>
      <el-table-column label="操作" width="260" align="center" fixed="right">
        <template #default="scope">
          <el-button-group>
            <el-tooltip content="执行详情" placement="top">
              <el-button
                type="primary"
                icon="InfoFilled"
                @click="handleViewDetail(scope.row)"
              />
            </el-tooltip>
            <el-tooltip content="查看日志" placement="top">
              <el-button
                type="info"
                icon="Document"
                :disabled="!scope.row.logInfo"
                @click="handleViewLog(scope.row)"
              />
            </el-tooltip>
            <el-tooltip content="任务配置" placement="top">
              <el-button
                type="primary"
                icon="Setting"
                :disabled="!scope.row.taskConfig"
                @click="handleViewTaskConfig(scope.row)"
              />
            </el-tooltip>
            <el-tooltip content="刷新状态" placement="top">
              <el-button type="success" icon="Refresh" @click="refreshStatus(scope.row)" />
            </el-tooltip>
            <el-tooltip
              v-if="scope.row.status === 'SUBMITTED' || scope.row.status === 'RUNNING'"
              content="停止任务"
              placement="top"
            >
              <el-button type="warning" icon="VideoPause" @click="handleStop(scope.row)" />
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
      @pagination="getResultList"
    />

    <!-- 错误日志 & 检测明细弹窗 -->
    <el-dialog v-model="errorLogVisible" title="执行详情" width="900px" :close-on-click-modal="false" top="4vh" destroy-on-close>
      <div v-if="currentLog">
        <!-- 基本信息 -->
        <el-descriptions :column="3" border size="small" style="margin-bottom: 16px">
          <el-descriptions-item label="规则名称">{{ currentLog.ruleName || '—' }}</el-descriptions-item>
          <el-descriptions-item label="执行状态">
            <el-tag :type="getStatusTag(currentLog.status)" size="small">{{ getStatusLabel(currentLog.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="Spark App ID">{{ currentLog.sparkAppId || '—' }}</el-descriptions-item>
          <el-descriptions-item label="开始时间">{{ parseTime(currentLog.startTime) || '—' }}</el-descriptions-item>
          <el-descriptions-item label="结束时间">{{ parseTime(currentLog.endTime) || '—' }}</el-descriptions-item>
          <el-descriptions-item label="检测结果">
            <el-tag v-if="currentLog.passFlag !== null && currentLog.passFlag !== undefined"
              :type="currentLog.passFlag ? 'success' : 'danger'" size="small">
              {{ currentLog.passFlag ? '通过' : '不通过' }}
            </el-tag>
            <span v-else>—</span>
          </el-descriptions-item>
          <el-descriptions-item label="数据源">{{ currentLog.datasourceName || '—' }}</el-descriptions-item>
          <el-descriptions-item label="数据库">{{ currentLog.dbName || '—' }}</el-descriptions-item>
          <el-descriptions-item label="数据表">{{ currentLog.tableName || '—' }}</el-descriptions-item>
          <el-descriptions-item label="检测字段" :span="3">{{ currentLog.fieldNames || '—' }}</el-descriptions-item>
          <el-descriptions-item v-if="currentLog.errorDataPath" label="错误数据路径" :span="3">
            <el-text truncated style="max-width: 700px">{{ currentLog.errorDataPath }}</el-text>
            <el-tooltip content="复制路径" placement="top">
              <el-icon style="cursor: pointer; margin-left: 6px" @click="copyText(currentLog.errorDataPath)"><CopyDocument /></el-icon>
            </el-tooltip>
          </el-descriptions-item>
        </el-descriptions>

        <!-- 检测明细（单行展示） -->
        <div v-if="checkResultList.length > 0" style="margin-top: 16px">
          <el-card shadow="never">
            <template #header>
              <span style="font-weight: bold; font-size: 14px">检测结果</span>
            </template>
            <el-row :gutter="16">
              <el-col :span="6">
                <div style="text-align: center">
                  <div style="font-size: 12px; color: #909399; margin-bottom: 8px">规则模板</div>
                  <div style="font-size: 16px; font-weight: bold; color: #303133">
                    {{ checkResultList[0].templateName || checkResultList[0].templateCode || '—' }}
                  </div>
                </div>
              </el-col>
              <el-col :span="6">
                <div style="text-align: center">
                  <div style="font-size: 12px; color: #909399; margin-bottom: 8px">实际值</div>
                  <div style="font-size: 20px; font-weight: bold; color: #303133">
                    {{ checkResultList[0].actualValue ?? '—' }}
                  </div>
                </div>
              </el-col>
              <el-col :span="6">
                <div style="text-align: center">
                  <div style="font-size: 12px; color: #909399; margin-bottom: 8px">期望值</div>
                  <div style="font-size: 20px; font-weight: bold; color: #303133">
                    {{ checkResultList[0].expectedValue ?? '—' }}
                  </div>
                </div>
              </el-col>
              <el-col :span="6">
                <div style="text-align: center">
                  <div style="font-size: 12px; color: #909399; margin-bottom: 8px">检测结果</div>
                  <el-tag v-if="checkResultList[0].passFlag !== null && checkResultList[0].passFlag !== undefined"
                    :type="checkResultList[0].passFlag === 1 ? 'success' : 'danger'" size="small" style="margin-top: 4px">
                    {{ checkResultList[0].passFlag === 1 ? '通过' : '不通过' }}
                  </el-tag>
                  <span v-else style="color: #909399">—</span>
                </div>
              </el-col>
            </el-row>
            <el-divider style="margin: 16px 0" />
            <el-row :gutter="16">
              <el-col :span="8">
                <div style="text-align: center">
                  <div style="font-size: 12px; color: #909399; margin-bottom: 8px">校验方式</div>
                  <div style="font-size: 14px; color: #303133">
                    {{ checkResultList[0].checkMethodLabel || checkResultList[0].checkMethod || '—' }}
                  </div>
                </div>
              </el-col>
              <el-col :span="8">
                <div style="text-align: center">
                  <div style="font-size: 12px; color: #909399; margin-bottom: 8px">操作符</div>
                  <div style="font-size: 14px; color: #303133">
                    {{ checkResultList[0].operator || '—' }}
                  </div>
                </div>
              </el-col>
              <el-col :span="8">
                <div style="text-align: center">
                  <div style="font-size: 12px; color: #909399; margin-bottom: 8px">期望类型</div>
                  <div style="font-size: 14px; color: #303133">
                    {{ checkResultList[0].expectedTypeLabel || checkResultList[0].expectedType || '—' }}
                  </div>
                </div>
              </el-col>
            </el-row>
          </el-card>
        </div>
        <el-empty v-else description="暂无检测明细数据" :image-size="60" style="padding: 40px 0" />
      </div>
      <template #footer>
        <el-button @click="errorLogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 完整日志弹窗 -->
    <el-dialog v-model="fullLogVisible" title="执行日志" width="900px" :close-on-click-modal="false" top="5vh">
      <monaco-editor
        ref="fullLogEditorRef"
        v-model="logContent"
        language="shell"
        height="600px"
        :readonly="true"
      />
      <template #footer>
        <el-button @click="fullLogVisible = false">关闭</el-button>
        <el-button type="primary" @click="copyText(currentLog.logInfo)">复制日志</el-button>
      </template>
    </el-dialog>

    <!-- 任务配置弹窗 -->
    <el-dialog v-model="taskConfigVisible" title="Spark 任务配置（JSON 快照）" width="900px" :close-on-click-modal="false" top="5vh">
      <div v-if="currentLog">
        <monaco-editor
          ref="taskConfigEditorRef"
          v-model="formattedTaskConfig"
          language="json"
          height="500px"
          :readonly="true"
        />
      </div>
      <template #footer>
        <el-button @click="taskConfigVisible = false">关闭</el-button>
        <el-button type="primary" @click="copyText(currentLog.taskConfig)">复制</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="DqResult">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { parseTime } from '@/utils/dateUtil';
import * as resultApi from '@/api/dataquality/resultApi';
import * as taskApi from '@/api/dataquality/taskApi';
import MonacoEditor from '@/components/MonacoEditor/index.vue';

const loading = ref(false);
const total = ref(0);
const resultList = ref([]);
const showSearch = ref(true);
const dateRange = ref([]);
let pollTimer = null;

// 执行详情弹窗（含错误日志 + 检测明细 Tab）
const errorLogVisible = ref(false);
const detailActiveTab = ref('errorLog');
// 任务配置弹窗
const taskConfigVisible = ref(false);
// 完整日志弹窗
const fullLogVisible = ref(false);
const currentLog = ref(null);
const formattedTaskConfig = ref(''); // 格式化后的 JSON 配置（供 Monaco Editor 使用）
const logContent = ref(''); // 日志内容（供 Monaco Editor 使用）

// 检测明细
const checkResultList = ref([]);
const checkResultLoading = ref(false);

const loadCheckResult = async (logId) => {
  checkResultLoading.value = true;
  checkResultList.value = [];
  try {
    const res = await resultApi.getCheckResultList(logId);
    checkResultList.value = Array.isArray(res) ? res : [];
    console.log('检测结果数据:', checkResultList.value); // 调试输出
  } catch (err) {
    console.error('加载检测明细失败:', err);
    ElMessage.error('加载检测明细失败');
  } finally {
    checkResultLoading.value = false;
  }
};

// formattedTaskConfig 已在上面定义为 ref

const handleViewDetail = (row) => {
  currentLog.value = row;
  checkResultList.value = [];
  errorLogVisible.value = true;
  // 初始化日志内容
  logContent.value = row.logInfo || '（无日志）';
  // 加载检测明细
  loadCheckResult(row.id);
};

const handleViewTaskConfig = (row) => {
  currentLog.value = row;
  // 格式化 JSON 配置
  if (row.taskConfig) {
    try {
      formattedTaskConfig.value = JSON.stringify(JSON.parse(row.taskConfig), null, 2);
    } catch {
      formattedTaskConfig.value = row.taskConfig;
    }
  } else {
    formattedTaskConfig.value = '';
  }
  taskConfigVisible.value = true;
};

const handleViewLog = (row) => {
  currentLog.value = row;
  logContent.value = row.logInfo || '（无日志）';
  fullLogVisible.value = true;
};

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  ruleName: '',
  status: '',
});

// 是否有进行中的任务
const hasActiveTask = computed(() =>
  resultList.value.some((r) => r.status === 'SUBMITTED' || r.status === 'RUNNING')
);

// 状态映射
const statusLabelMap = {
  SUBMITTED: '已提交',
  RUNNING: '运行中',
  SUCCESS: '成功',
  FAILED: '失败',
  STOPPED: '已停止',
};
const statusTagMap = {
  SUBMITTED: 'info',
  RUNNING: 'warning',
  SUCCESS: 'success',
  FAILED: 'danger',
  STOPPED: 'info',
};
const getStatusLabel = (s) => statusLabelMap[s] || s;
const getStatusTag = (s) => statusTagMap[s] || '';

// 获取执行记录
const getResultList = async () => {
  loading.value = true;
  try {
    const params = { ...queryParams };
    // 删除初始占位的空字符串，有值时才添加，避免后端 Date 类型转换失败
    delete params.startTimeBegin;
    delete params.startTimeEnd;
    if (dateRange.value?.[0]) params.startTimeBegin = dateRange.value[0];
    if (dateRange.value?.[1]) params.startTimeEnd = dateRange.value[1];
    const res = await resultApi.getResultList(params);
    resultList.value = res.rows || [];
    total.value = res.total || 0;

    // 管理轮询
    managePoll();
  } catch (e) {
    ElMessage.error('获取执行记录失败');
  } finally {
    loading.value = false;
  }
};

const handleQuery = () => {
  queryParams.pageNum = 1;
  getResultList();
};

const resetQuery = () => {
  queryParams.ruleName = '';
  queryParams.status = '';
  dateRange.value = [];
  queryParams.pageNum = 1;
  getResultList();
};

// 刷新单行状态
const refreshStatus = async (row) => {
  try {
    const res = await taskApi.getTaskStatus(row.id);
    const updated = res.data;
    const idx = resultList.value.findIndex((r) => r.id === row.id);
    if (idx !== -1) {
      resultList.value[idx] = { ...resultList.value[idx], ...updated };
    }
    ElMessage.success('状态已刷新');
  } catch {
    ElMessage.error('刷新状态失败');
  }
};

// 停止任务
const handleStop = async (row) => {
  try {
    await ElMessageBox.confirm('确定要停止该任务吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });
    await taskApi.stopTask(row.id);
    ElMessage.success('任务已停止');
    getResultList();
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('停止任务失败');
  }
};

// 复制文本
const copyText = (text) => {
  navigator.clipboard?.writeText(text).then(() => {
    ElMessage.success('已复制');
  });
};

// 轮询管理
const managePoll = () => {
  if (hasActiveTask.value) {
    if (!pollTimer) {
      pollTimer = setInterval(() => {
        getResultList();
      }, 10000);
    }
  } else {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  }
};

onMounted(() => {
  getResultList();
});

onUnmounted(() => {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
});
</script>

<style scoped lang="scss">
.result-container {
  padding: 20px;

  .search-form {
    margin-bottom: 8px;
  }

  .rotating {
    animation: rotate 1.5s linear infinite;
  }

  @keyframes rotate {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
}

.log-textarea {
  font-family: 'Menlo', 'Consolas', 'Monaco', monospace;
  font-size: 12px;

  :deep(textarea) {
    background: #1e1e1e;
    color: #d4d4d4;
    line-height: 1.6;
  }
}

.log-error :deep(textarea) {
  color: #f48771;
}
</style>
