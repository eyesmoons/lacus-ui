<template>
  <div class="rule-container">
    <!-- 搜索区域 -->
    <el-form :model="queryParams" ref="queryRef" :inline="true" class="search-form" v-show="showSearch">
      <el-form-item label="规则名称" prop="ruleName">
        <el-input v-model="queryParams.ruleName" placeholder="请输入规则名称" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="规则模板" prop="templateId">
        <el-select v-model="queryParams.templateId" placeholder="请选择模板" clearable style="width: 180px">
          <el-option v-for="t in templateOptions" :key="t.value" :label="t.label" :value="t.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="启用状态" prop="enabled">
        <el-select v-model="queryParams.enabled" placeholder="请选择状态" clearable style="width: 120px">
          <el-option label="启用" :value="1" />
          <el-option label="禁用" :value="0" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" icon="Plus" @click="handleAdd">新建规则</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getRuleList" />
    </el-row>

    <!-- 规则列表 -->
    <el-table v-loading="loading" :data="ruleList" stripe border>
      <el-table-column label="规则名称" prop="ruleName" min-width="180" show-overflow-tooltip>
        <template #default="scope">
          <el-link type="primary" @click="showDetail(scope.row)">{{ scope.row.ruleName }}</el-link>
        </template>
      </el-table-column>
      <el-table-column label="规则模板" prop="templateName" width="150" align="center">
        <template #default="scope">
          <el-tag v-if="scope.row.templateName" :color="scope.row.templateColor" effect="light" size="small" style="background-color: #ffeaea">
            {{ scope.row.templateName }}
          </el-tag>
          <span v-else>—</span>
        </template>
      </el-table-column>
      <el-table-column label="数据源" prop="datasourceName" min-width="120" show-overflow-tooltip />
      <el-table-column label="数据库" prop="dbName" width="120" show-overflow-tooltip />
      <el-table-column label="数据表" prop="tableName" width="120" show-overflow-tooltip />
      <el-table-column label="检测字段" prop="fieldNames" min-width="140" show-overflow-tooltip />
      <el-table-column label="描述" prop="description" min-width="200" show-overflow-tooltip />
      <el-table-column label="创建时间" prop="createTime" width="160" align="center" show-overflow-tooltip>
        <template #default="scope">{{ parseTime(scope.row.createTime) }}</template>
      </el-table-column>
      <el-table-column label="启用状态" prop="enabled" width="100" align="center" fixed="right">
        <template #default="scope">
          <el-switch
            v-model="scope.row.enabled"
                    :active-value="1"
                    :inactive-value="0"
                    @change="handleToggleEnabled(scope.row)"
                />
            </template>
      </el-table-column>
      <el-table-column label="操作" width="220" align="center" fixed="right">
        <template #default="scope">
          <el-button-group>
            <el-tooltip content="执行规则" placement="top">
              <el-button
                type="success"
                icon="VideoPlay"
                :disabled="!scope.row.enabled"
                @click="handleExecute(scope.row)"
              />
            </el-tooltip>
            <el-tooltip content="编辑规则" placement="top">
              <el-button type="warning" icon="Edit" @click="handleEdit(scope.row)" />
            </el-tooltip>
            <el-tooltip content="删除规则" placement="top">
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
      @pagination="getRuleList"
    />

    <!-- 规则详情弹框 -->
    <el-dialog v-model="dialogVisible" title="规则详情" width="780px" :close-on-click-modal="false" destroy-on-close>
      <template v-if="currentRule">
        <!-- 基本信息 -->
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="规则名称" :span="2">{{ currentRule.ruleName }}</el-descriptions-item>
          <el-descriptions-item label="规则模板">
            <el-tag v-if="currentRule.templateName" :color="currentRule.templateColor" effect="light" size="small">
              {{ currentRule.templateName }}
            </el-tag>
            <span v-else>—</span>
          </el-descriptions-item>
          <el-descriptions-item label="启用状态">
            <el-tag :type="currentRule.enabled ? 'success' : 'info'" size="small">
              {{ currentRule.enabled ? '启用' : '禁用' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="规则描述" :span="2">{{ currentRule.description || '—' }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ parseTime(currentRule.createTime) }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ parseTime(currentRule.updateTime) }}</el-descriptions-item>
        </el-descriptions>

        <!-- 数据源配置 -->
        <el-divider content-position="left">数据源配置</el-divider>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="数据源">{{ currentRule.datasourceName || currentRule.datasourceId || '—' }}</el-descriptions-item>
          <el-descriptions-item label="数据库">{{ currentRule.dbName || '—' }}</el-descriptions-item>
          <el-descriptions-item label="数据表">{{ currentRule.tableName || '—' }}</el-descriptions-item>
          <el-descriptions-item label="检测字段">{{ currentRule.fieldNames || '—' }}</el-descriptions-item>
        </el-descriptions>

        <!-- 校验规则 -->
        <el-divider content-position="left">校验规则</el-divider>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="校验方式">{{ getCheckMethodLabel(parsedConfig(currentRule.ruleConfig)?.checkMethod) }}</el-descriptions-item>
          <el-descriptions-item label="校验操作符">{{ parsedConfig(currentRule.ruleConfig)?.operator || '—' }}</el-descriptions-item>
          <el-descriptions-item label="期望值类型">{{ getExpectedTypeLabel(parsedConfig(currentRule.ruleConfig)?.expectedType) }}</el-descriptions-item>
          <el-descriptions-item label="期望值">{{ parsedConfig(currentRule.ruleConfig)?.expectedValue ?? '—' }}</el-descriptions-item>
          <template v-if="parsedConfig(currentRule.ruleConfig)?.minValue != null || parsedConfig(currentRule.ruleConfig)?.maxValue != null">
            <el-descriptions-item label="最小值">{{ parsedConfig(currentRule.ruleConfig)?.minValue ?? '—' }}</el-descriptions-item>
            <el-descriptions-item label="最大值">{{ parsedConfig(currentRule.ruleConfig)?.maxValue ?? '—' }}</el-descriptions-item>
          </template>
          <template v-if="parsedConfig(currentRule.ruleConfig)?.enumValues?.length">
            <el-descriptions-item label="枚举值" :span="2">
              <el-tag v-for="v in parsedConfig(currentRule.ruleConfig).enumValues" :key="v" size="small" style="margin: 0 4px 4px 0">{{ v }}</el-tag>
            </el-descriptions-item>
          </template>
          <template v-if="parsedConfig(currentRule.ruleConfig)?.regexPattern">
            <el-descriptions-item label="正则表达式" :span="2">
              <el-text type="info" size="small">{{ parsedConfig(currentRule.ruleConfig).regexPattern }}</el-text>
            </el-descriptions-item>
          </template>
          <template v-if="parsedConfig(currentRule.ruleConfig)?.lengthOp != null && parsedConfig(currentRule.ruleConfig)?.length != null">
            <el-descriptions-item label="长度操作符">{{ parsedConfig(currentRule.ruleConfig).lengthOp }}</el-descriptions-item>
            <el-descriptions-item label="长度阈值">{{ parsedConfig(currentRule.ruleConfig).length }}</el-descriptions-item>
          </template>
          <template v-if="parsedConfig(currentRule.ruleConfig)?.statMethod">
            <el-descriptions-item label="统计方式" :span="2">{{ parsedConfig(currentRule.ruleConfig).statMethod }}</el-descriptions-item>
          </template>
          <template v-if="parsedConfig(currentRule.ruleConfig)?.field2">
            <el-descriptions-item label="对比字段" :span="2">{{ parsedConfig(currentRule.ruleConfig).field2 }}</el-descriptions-item>
          </template>
          <template v-if="parsedConfig(currentRule.ruleConfig)?.timeUnit">
            <el-descriptions-item label="时间单位（秒）">{{ parsedConfig(currentRule.ruleConfig).timeUnit }}</el-descriptions-item>
            <el-descriptions-item label="时间差阈值">{{ parsedConfig(currentRule.ruleConfig).threshold ?? '—' }}</el-descriptions-item>
          </template>
          <template v-if="parsedConfig(currentRule.ruleConfig)?.refTable">
            <el-descriptions-item label="参考表名">{{ parsedConfig(currentRule.ruleConfig).refTable }}</el-descriptions-item>
            <el-descriptions-item label="关联字段">{{ parsedConfig(currentRule.ruleConfig).joinField || '—' }}</el-descriptions-item>
          </template>
        </el-descriptions>

        <!-- Spark 任务参数 -->
        <template v-if="parsedSparkParams(currentRule.sparkParams)">
          <el-divider content-position="left">Spark 任务参数</el-divider>
          <el-descriptions :column="3" border size="small">
            <el-descriptions-item label="部署模式">{{ parsedSparkParams(currentRule.sparkParams)?.deployMode || '—' }}</el-descriptions-item>
            <template v-if="parsedSparkParams(currentRule.sparkParams)?.masterAddress">
              <el-descriptions-item label="Master地址">{{ parsedSparkParams(currentRule.sparkParams).masterAddress }}</el-descriptions-item>
            </template>
            <el-descriptions-item label="Yarn队列">{{ parsedSparkParams(currentRule.sparkParams)?.queue || '—' }}</el-descriptions-item>
            <el-descriptions-item label="Driver核心数">{{ parsedSparkParams(currentRule.sparkParams)?.driverCores ?? '—' }}</el-descriptions-item>
            <el-descriptions-item label="Driver内存(GB)">{{ parsedSparkParams(currentRule.sparkParams)?.driverMemory ?? '—' }}</el-descriptions-item>
            <el-descriptions-item label="Executor数量">{{ parsedSparkParams(currentRule.sparkParams)?.numExecutors ?? '—' }}</el-descriptions-item>
            <el-descriptions-item label="Executor内存(GB)">{{ parsedSparkParams(currentRule.sparkParams)?.executorMemory ?? '—' }}</el-descriptions-item>
            <el-descriptions-item label="Executor核心数">{{ parsedSparkParams(currentRule.sparkParams)?.executorCores ?? '—' }}</el-descriptions-item>
            <template v-if="parsedSparkParams(currentRule.sparkParams)?.otherParams">
              <el-descriptions-item label="其他参数" :span="3">
                <el-text type="info" size="small">{{ parsedSparkParams(currentRule.sparkParams).otherParams }}</el-text>
              </el-descriptions-item>
            </template>
          </el-descriptions>
        </template>
      </template>
      <template #footer>
        <el-button @click="dialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="handleEdit(currentRule)">编辑</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="DqRule">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { parseTime } from '@/utils/dateUtil';
import * as ruleApi from '@/api/dataquality/ruleApi';
import * as taskApi from '@/api/dataquality/taskApi';
import { getTemplateList } from '@/api/dataquality/templateApi';

const router = useRouter();
const loading = ref(false);
const total = ref(0);
const ruleList = ref([]);
const showSearch = ref(true);
const dialogVisible = ref(false);
const currentRule = ref(null);

// 模板下拉选项（id → label）
const templateOptions = ref([]);

const DEFAULT_TEMPLATES = [
  { value: 1, label: '空值检测' },
  { value: 2, label: '唯一性检测' },
  { value: 3, label: '重复值检测' },
  { value: 4, label: '数值范围检测' },
  { value: 5, label: '枚举值检测' },
  { value: 6, label: '正则格式检测' },
];

const loadTemplates = async () => {
  try {
    const res = await getTemplateList();
    const list = Array.isArray(res) ? res : [];
    if (list.length > 0) {
      templateOptions.value = list.map((t) => ({ value: t.id, label: t.templateName }));
    } else {
      templateOptions.value = DEFAULT_TEMPLATES;
    }
  } catch {
    templateOptions.value = DEFAULT_TEMPLATES;
  }
};

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  ruleName: '',
  templateId: null,
  enabled: '',
});

const checkMethodLabels = {
  expected_minus_actual: '期望值 - 实际值',
  actual_minus_expected: '实际值 - 期望值',
  actual_div_expected: '实际值 ÷ 期望值',
  diff_div_expected: '(期望值 - 实际值) ÷ 期望值',
};
const getCheckMethodLabel = (v) => checkMethodLabels[v] || v || '—';

const expectedTypeLabels = {
  FIXED: '固定值',
  DAILY_AVG: '每天平均',
  WEEKLY_AVG: '每周平均',
  MONTHLY_AVG: '每月平均',
  LAST_7_DAYS_AVG: '过去7天平均',
  LAST_30_DAYS_AVG: '过去30天平均',
};
const getExpectedTypeLabel = (v) => expectedTypeLabels[v] || v || '—';

const parsedConfig = (configStr) => {
  try { return JSON.parse(configStr); } catch { return null; }
};

const parsedSparkParams = (sparkStr) => {
  if (!sparkStr) return null;
  try { return JSON.parse(sparkStr); } catch { return null; }
};

// 获取规则列表
const getRuleList = async () => {
  loading.value = true;
  try {
    const res = await ruleApi.getRuleList(queryParams);
    ruleList.value = res.rows || [];
    total.value = res.total || 0;
  } catch (e) {
    ElMessage.error('获取规则列表失败');
  } finally {
    loading.value = false;
  }
};

const handleQuery = () => { queryParams.pageNum = 1; getRuleList(); };
const resetQuery = () => {
  queryParams.ruleName = '';
  queryParams.templateId = null;
  queryParams.enabled = '';
  queryParams.pageNum = 1;
  getRuleList();
};

const handleAdd = () => { router.push('/dataquality/rule/add'); };
const handleEdit = (row) => { router.push(`/dataquality/rule/edit/${row.id}`); };

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除规则「${row.ruleName}」吗？删除后不可恢复！`, '提示', {
      confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning',
    });
    await ruleApi.deleteRule(row.id);
    ElMessage.success('删除成功');
    getRuleList();
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('删除失败');
  }
};

const handleToggleEnabled = async (row) => {
  try {
    await ruleApi.updateRule({ id: row.id, enabled: row.enabled });
    ElMessage.success(row.enabled ? '已启用' : '已禁用');
  } catch (e) {
    row.enabled = row.enabled ? 0 : 1;
    ElMessage.error('操作失败');
  }
};

const handleExecute = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要执行规则「${row.ruleName}」吗？`, '提示', {
      confirmButtonText: '确定', cancelButtonText: '取消', type: 'info',
    });
    const res = await taskApi.submitTask(row.id);
    const logId = res.data;
    ElMessage.success(`任务已提交，执行记录 ID: ${logId}`);
    router.push('/dataquality/result');
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('任务提交失败');
  }
};

const showDetail = async (row) => {
  try {
    const res = await ruleApi.getRuleDetail(row.id);
    currentRule.value = res;
    dialogVisible.value = true;
  } catch (e) {
    ElMessage.error('获取规则详情失败');
  }
};

onMounted(async () => {
  await loadTemplates();
  getRuleList();
});
</script>

<style scoped lang="scss">
.rule-container {
  padding: 20px;

  .search-form {
    margin-bottom: 8px;
  }

  .rule-config-preview {
    margin-top: 8px;
  }
}
</style>
