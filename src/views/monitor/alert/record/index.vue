<template>
    <div class="app-container">
        <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="88px">
            <el-form-item label="关键字" prop="keyword">
                <el-input v-model="queryParams.keyword" placeholder="记录号/标题/内容/BizKey" clearable style="width: 240px" @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="告警组" prop="groupCode">
                <el-select v-model="queryParams.groupCode" placeholder="请选择告警组" clearable style="width: 220px">
                    <el-option v-for="item in groupOptions" :key="item.id" :label="item.groupName" :value="item.groupCode" />
                </el-select>
            </el-form-item>
            <el-form-item label="状态" prop="status">
                <el-select v-model="queryParams.status" placeholder="请选择状态" clearable style="width: 180px">
                    <el-option v-for="item in recordStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
            </el-form-item>
            <el-form-item label="级别" prop="alertLevel">
                <el-select v-model="queryParams.alertLevel" placeholder="请选择级别" clearable style="width: 180px">
                    <el-option v-for="item in levelOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
            </el-form-item>
            <el-form-item label="触发时间" style="width: 308px">
                <el-date-picker v-model="dateRange" value-format="YYYY-MM-DD" type="daterange" range-separator="-" start-placeholder="开始日期" end-placeholder="结束日期" />
            </el-form-item>
            <el-form-item>
                <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
                <el-button icon="Refresh" @click="resetQuery">重置</el-button>
            </el-form-item>
        </el-form>

        <el-row :gutter="10" class="mb8">
            <el-col :span="1.5">
                <el-button type="primary" plain icon="Promotion" @click="handleOpenExecute" v-hasPermission="['monitor:alertRecord:execute']">执行告警</el-button>
            </el-col>
            <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>

        <el-table v-loading="loading" :data="recordList">
            <el-table-column label="记录号" align="center" prop="recordNo" min-width="190" show-overflow-tooltip />
            <el-table-column label="告警标题" align="center" prop="title" min-width="180" show-overflow-tooltip />
            <el-table-column label="告警组" align="center" prop="groupName" min-width="140" show-overflow-tooltip />
            <el-table-column label="级别" align="center" prop="alertLevel" width="110">
                <template #default="scope">
                    <dict-tag :options="levelOptions" :value="scope.row.alertLevel" />
                </template>
            </el-table-column>
            <el-table-column label="状态" align="center" prop="status" width="140">
                <template #default="scope">
                    <dict-tag :options="recordStatusOptions" :value="scope.row.status" />
                </template>
            </el-table-column>
            <el-table-column label="成功/失败" align="center" width="120">
                <template #default="scope">
                    <span>{{ scope.row.successCount }}/{{ scope.row.failedCount }}</span>
                </template>
            </el-table-column>
            <el-table-column label="触发人" align="center" prop="requestedBy" width="120" />
            <el-table-column label="触发时间" align="center" prop="requestedTime" width="180">
                <template #default="scope">
                    <span>{{ parseTime(scope.row.requestedTime) }}</span>
                </template>
            </el-table-column>
            <el-table-column label="操作" align="center" width="180">
                <template #default="scope">
                    <el-button link type="primary" @click="handleView(scope.row)" v-hasPermission="['monitor:alertRecord:query']">详情</el-button>
                    <el-button link type="warning" @click="handleRetry(scope.row)" v-hasPermission="['monitor:alertRecord:retry']">重试</el-button>
                </template>
            </el-table-column>
        </el-table>

        <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

        <el-dialog title="执行告警" v-model="executeOpen" width="760px" append-to-body>
            <el-form ref="executeFormRef" :model="executeForm" :rules="executeRules" label-width="100px">
                <el-form-item label="告警组" prop="groupCode">
                    <el-select v-model="executeForm.groupCode" placeholder="请选择告警组" style="width: 100%">
                        <el-option v-for="item in groupOptions" :key="item.id" :label="item.groupName" :value="item.groupCode" />
                    </el-select>
                </el-form-item>
                <el-form-item label="告警级别" prop="alertLevel">
                    <el-select v-model="executeForm.alertLevel" placeholder="请选择级别" style="width: 100%">
                        <el-option v-for="item in levelOptions" :key="item.value" :label="item.label" :value="item.value" />
                    </el-select>
                </el-form-item>
                <el-form-item label="告警标题" prop="title">
                    <el-input v-model="executeForm.title" placeholder="请输入告警标题" />
                </el-form-item>
                <el-form-item label="BizKey" prop="bizKey">
                    <el-input v-model="executeForm.bizKey" placeholder="可选，业务唯一键" />
                </el-form-item>
                <el-form-item label="触发人" prop="requestedBy">
                    <el-input v-model="executeForm.requestedBy" placeholder="可选，默认当前登录人" />
                </el-form-item>
                <el-form-item label="告警内容" prop="content">
                    <el-input v-model="executeForm.content" type="textarea" :rows="6" placeholder="请输入告警内容" />
                </el-form-item>
            </el-form>
            <template #footer>
                <div class="dialog-footer">
                    <el-button type="primary" @click="submitExecute">确 定</el-button>
                    <el-button @click="executeOpen = false">取 消</el-button>
                </div>
            </template>
        </el-dialog>

        <el-dialog title="告警详情" v-model="detailOpen" width="980px" append-to-body>
            <el-descriptions v-if="detail" :column="2" border>
                <el-descriptions-item label="记录号">{{ detail.recordNo }}</el-descriptions-item>
                <el-descriptions-item label="告警组">{{ detail.groupName }}</el-descriptions-item>
                <el-descriptions-item label="告警级别">
                    <dict-tag :options="levelOptions" :value="detail.alertLevel" />
                </el-descriptions-item>
                <el-descriptions-item label="状态">
                    <dict-tag :options="recordStatusOptions" :value="detail.status" />
                </el-descriptions-item>
                <el-descriptions-item label="触发人">{{ detail.requestedBy }}</el-descriptions-item>
                <el-descriptions-item label="触发时间">{{ parseTime(detail.requestedTime) }}</el-descriptions-item>
                <el-descriptions-item label="标题" :span="2">{{ detail.title }}</el-descriptions-item>
                <el-descriptions-item label="内容" :span="2">{{ detail.content }}</el-descriptions-item>
                <el-descriptions-item label="错误摘要" :span="2">{{ detail.errorMessage || '-' }}</el-descriptions-item>
            </el-descriptions>

            <div class="table-title">发送任务</div>
            <el-table :data="detail?.tasks || []" max-height="360">
                <el-table-column label="任务号" prop="taskNo" min-width="190" show-overflow-tooltip />
                <el-table-column label="实例名称" prop="instanceName" min-width="160" show-overflow-tooltip />
                <el-table-column label="渠道类型" prop="channelTypeCode" width="110" />
                <el-table-column label="状态" prop="status" width="120">
                    <template #default="scope">
                        <dict-tag :options="taskStatusOptions" :value="scope.row.status" />
                    </template>
                </el-table-column>
                <el-table-column label="重试次数" prop="retryCount" width="100" />
                <el-table-column label="最后错误" prop="lastError" min-width="200" show-overflow-tooltip />
                <el-table-column label="操作" width="100" align="center">
                    <template #default="scope">
                        <el-button link type="primary" @click="handleViewLogs(scope.row)">日志</el-button>
                    </template>
                </el-table-column>
            </el-table>
        </el-dialog>

        <el-dialog title="发送日志" v-model="logOpen" width="920px" append-to-body>
            <el-table :data="taskLogs" max-height="480">
                <el-table-column label="尝试次数" prop="attemptNo" width="100" />
                <el-table-column label="是否成功" prop="success" width="100">
                    <template #default="scope">
                        <dict-tag :options="booleanStatusOptions" :value="String(scope.row.success)" />
                    </template>
                </el-table-column>
                <el-table-column label="耗时(ms)" prop="costMs" width="100" />
                <el-table-column label="错误信息" prop="errorMessage" min-width="180" show-overflow-tooltip />
                <el-table-column label="请求内容" prop="requestPayload" min-width="240" show-overflow-tooltip />
                <el-table-column label="响应内容" prop="responsePayload" min-width="240" show-overflow-tooltip />
                <el-table-column label="时间" prop="createTime" width="180">
                    <template #default="scope">
                        <span>{{ parseTime(scope.row.createTime) }}</span>
                    </template>
                </el-table-column>
            </el-table>
        </el-dialog>
    </div>
</template>

<script setup name="AlertRecord">
import * as alertApi from '@/api/monitor/alertApi';

const { proxy } = getCurrentInstance();

const loading = ref(false);
const showSearch = ref(true);
const executeOpen = ref(false);
const detailOpen = ref(false);
const logOpen = ref(false);
const total = ref(0);
const recordList = ref([]);
const groupOptions = ref([]);
const dateRange = ref([]);
const detail = ref();
const taskLogs = ref([]);
const executeFormRef = ref();

const levelOptions = [
    { label: 'INFO', value: 'INFO', elTagType: 'info' },
    { label: 'WARN', value: 'WARN', elTagType: 'warning' },
    { label: 'ERROR', value: 'ERROR', elTagType: 'danger' },
    { label: 'CRITICAL', value: 'CRITICAL', elTagType: 'danger' },
];
const recordStatusOptions = [
    { label: '待发送', value: 'PENDING', elTagType: 'info' },
    { label: '发送中', value: 'SENDING', elTagType: 'warning' },
    { label: '部分成功', value: 'PARTIAL_SUCCESS', elTagType: 'warning' },
    { label: '成功', value: 'SUCCESS', elTagType: 'success' },
    { label: '失败', value: 'FAILED', elTagType: 'danger' },
];
const taskStatusOptions = [
    { label: '等待中', value: 'WAITING', elTagType: 'info' },
    { label: '发送中', value: 'SENDING', elTagType: 'warning' },
    { label: '成功', value: 'SUCCESS', elTagType: 'success' },
    { label: '失败', value: 'FAILED', elTagType: 'danger' },
    { label: '重试中', value: 'RETRYING', elTagType: 'warning' },
    { label: '已取消', value: 'CANCELLED', elTagType: 'info' },
];
const booleanStatusOptions = [
    { label: '成功', value: 'true', elTagType: 'success' },
    { label: '失败', value: 'false', elTagType: 'danger' },
];

const data = reactive({
    queryParams: {
        pageNum: 1,
        pageSize: 10,
        groupCode: undefined,
        status: undefined,
        alertLevel: undefined,
        keyword: undefined,
    },
    executeForm: {
        groupCode: undefined,
        alertLevel: 'ERROR',
        title: '',
        content: '',
        bizKey: '',
        requestedBy: '',
        triggerSource: 'MANUAL',
    },
    executeRules: {
        groupCode: [{ required: true, message: '告警组不能为空', trigger: 'change' }],
        alertLevel: [{ required: true, message: '告警级别不能为空', trigger: 'change' }],
        title: [{ required: true, message: '告警标题不能为空', trigger: 'blur' }],
        content: [{ required: true, message: '告警内容不能为空', trigger: 'blur' }],
    },
});

const { queryParams, executeForm, executeRules } = toRefs(data);

function getList() {
    loading.value = true;
    alertApi
        .listRecords(proxy.addTimeRange(queryParams.value, dateRange.value))
        .then((response) => {
            recordList.value = response.rows;
            total.value = response.total;
        })
        .finally(() => {
            loading.value = false;
        });
}

function loadGroupOptions() {
    return alertApi.listGroups({ pageNum: 1, pageSize: 500, enabled: true }).then((response) => {
        groupOptions.value = response.rows || [];
    });
}

function handleQuery() {
    queryParams.value.pageNum = 1;
    getList();
}

function resetQuery() {
    dateRange.value = [];
    proxy.resetForm('queryRef');
    handleQuery();
}

function handleOpenExecute() {
    executeForm.value = {
        groupCode: undefined,
        alertLevel: 'ERROR',
        title: '',
        content: '',
        bizKey: '',
        requestedBy: '',
        triggerSource: 'MANUAL',
    };
    executeOpen.value = true;
    proxy.resetForm('executeFormRef');
}

async function submitExecute() {
    await executeFormRef.value.validate();
    await alertApi.executeAlert(executeForm.value);
    proxy.$modal.msgSuccess('已进入发送队列');
    executeOpen.value = false;
    getList();
}

function handleView(row) {
    alertApi.getRecord(row.id).then((response) => {
        detail.value = response;
        detailOpen.value = true;
    });
}

function handleViewLogs(row) {
    alertApi.listTaskLogs(row.id).then((response) => {
        taskLogs.value = response || [];
        logOpen.value = true;
    });
}

function handleRetry(row) {
    proxy.$modal
        .confirm(`是否确认重试告警记录“${row.recordNo}”？`)
        .then(() => alertApi.retryRecord(row.id))
        .then(() => {
            proxy.$modal.msgSuccess('重试任务已重新入队');
            getList();
            if (detailOpen.value && detail.value?.id === row.id) {
                handleView(row);
            }
        })
        .catch(() => {});
}

onMounted(async () => {
    await loadGroupOptions();
    getList();
});
</script>

<style scoped>
.table-title {
    font-weight: 600;
    margin: 16px 0 12px;
}
</style>
