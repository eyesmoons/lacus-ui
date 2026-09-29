<template>
    <div class="app-container">
        <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="90px">
            <el-form-item label="接口" prop="apiId">
                <el-input v-model="queryParams.apiId" placeholder="接口ID" clearable @keyup.enter="handleQuery"/>
            </el-form-item>
            <el-form-item label="响应状态" prop="status">
                <el-select v-model="queryParams.status" placeholder="请选择" clearable style="width: 120px">
                    <el-option label="成功" value="success"/>
                    <el-option label="失败" value="fail"/>
                </el-select>
            </el-form-item>
            <el-form-item label="时间区间">
                <el-date-picker v-model="dateRange" type="datetimerange" range-separator="至"
                                start-placeholder="开始时间" end-placeholder="结束时间"
                                value-format="YYYY-MM-DD HH:mm:ss"/>
            </el-form-item>
            <el-form-item>
                <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
                <el-button icon="Refresh" @click="resetQuery">重置</el-button>
            </el-form-item>
        </el-form>

        <el-table v-loading="loading" :data="historyList" stripe border>
            <el-table-column label="接口名称" align="left" prop="apiName" show-overflow-tooltip/>
            <el-table-column label="请求方式" align="center" prop="reqMethod" width="100"/>
            <el-table-column label="响应状态" align="center" prop="status" width="100">
                <template #default="scope">
                    <el-tag :type="scope.row.status === 'success' ? 'success' : 'danger'">
                        {{ scope.row.status === 'success' ? '成功' : '失败' }}
                    </el-tag>
                </template>
            </el-table-column>
            <el-table-column label="耗时(ms)" align="center" prop="costTime" width="110"/>
            <el-table-column label="调用方" align="left" prop="caller" show-overflow-tooltip/>
            <el-table-column label="调用时间" align="center" prop="callTime" width="170"/>
            <el-table-column label="入参摘要" align="left" prop="paramSummary" show-overflow-tooltip/>
            <el-table-column label="操作" align="center" width="100" fixed="right">
                <template #default="scope">
                    <el-button type="primary" link icon="View" @click="handleDetail(scope.row)">详情</el-button>
                </template>
            </el-table-column>
        </el-table>

        <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum"
                   v-model:limit="queryParams.pageSize" @pagination="getList"/>

        <el-dialog title="调用详情" v-model="detailOpen" width="700px" append-to-body>
            <el-descriptions :column="1" border v-if="callDetail">
                <el-descriptions-item label="接口">{{ callDetail.apiName }}</el-descriptions-item>
                <el-descriptions-item label="响应状态">
                    <el-tag :type="callDetail.status === 'success' ? 'success' : 'danger'">
                        {{ callDetail.status === 'success' ? '成功' : '失败' }}
                    </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="耗时">{{ callDetail.costTime }} ms</el-descriptions-item>
                <el-descriptions-item label="调用方">{{ callDetail.caller }}</el-descriptions-item>
                <el-descriptions-item label="入参">
                    <pre class="detail-pre">{{ callDetail.requestBody }}</pre>
                </el-descriptions-item>
                <el-descriptions-item label="响应摘要">
                    <pre class="detail-pre">{{ callDetail.responseSummary }}</pre>
                </el-descriptions-item>
                <el-descriptions-item label="错误信息" v-if="callDetail.errorMessage">
                    <pre class="detail-pre">{{ callDetail.errorMessage }}</pre>
                </el-descriptions-item>
            </el-descriptions>
        </el-dialog>
    </div>
</template>

<script setup>
import {onMounted, reactive, ref} from 'vue';
import {ElMessage} from 'element-plus';
import {listCallHistory, getCallDetail} from '@/api/oneapi/historyApi';

const loading = ref(false);
const showSearch = ref(true);
const total = ref(0);
const historyList = ref([]);
const dateRange = ref([]);
const detailOpen = ref(false);
const callDetail = ref(null);

const queryParams = reactive({
    pageNum: 1,
    pageSize: 10,
    apiId: undefined,
    status: undefined,
    startTime: undefined,
    endTime: undefined,
});

function getList() {
    loading.value = true;
    if (dateRange.value && dateRange.value.length === 2) {
        queryParams.startTime = dateRange.value[0];
        queryParams.endTime = dateRange.value[1];
    } else {
        queryParams.startTime = undefined;
        queryParams.endTime = undefined;
    }
    listCallHistory(queryParams)
        .then((res) => {
            historyList.value = res.rows || [];
            total.value = res.total || 0;
        })
        .catch(() => {
            ElMessage.error('查询调用历史失败');
        })
        .finally(() => {
            loading.value = false;
        });
}

function handleQuery() {
    queryParams.pageNum = 1;
    getList();
}

function resetQuery() {
    queryParams.apiId = undefined;
    queryParams.status = undefined;
    dateRange.value = [];
    handleQuery();
}

function handleDetail(row) {
    detailOpen.value = true;
    callDetail.value = null;
    getCallDetail(row.callId)
        .then((res) => {
            callDetail.value = res.data || res;
        })
        .catch(() => {
            ElMessage.error('加载调用详情失败');
        });
}

onMounted(() => {
    getList();
});
</script>

<style scoped>
.app-container {
    padding: 20px;
}

.detail-pre {
    white-space: pre-wrap;
    word-wrap: break-word;
    background-color: #f5f7fa;
    padding: 8px;
    border-radius: 4px;
    margin: 0;
}
</style>
