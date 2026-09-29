<template>
    <div class="app-container">
        <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="90px">
            <el-form-item label="时间区间" prop="range">
                <el-select v-model="queryParams.range" placeholder="请选择" style="width: 160px">
                    <el-option label="近1小时" value="1h"/>
                    <el-option label="近24小时" value="24h"/>
                    <el-option label="近7天" value="7d"/>
                </el-select>
            </el-form-item>
            <el-form-item label="数据源" prop="datasourceId">
                <el-select v-model="queryParams.datasourceId" placeholder="请选择数据源" clearable>
                    <el-option v-for="item in datasourceOptions" :key="item.datasourceId"
                               :label="item.datasourceName" :value="item.datasourceId"/>
                </el-select>
            </el-form-item>
            <el-form-item label="接口状态" prop="status">
                <el-select v-model="queryParams.status" placeholder="请选择" clearable style="width: 120px">
                    <el-option label="上线" :value="1"/>
                    <el-option label="下线" :value="0"/>
                </el-select>
            </el-form-item>
            <el-form-item>
                <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
                <el-button icon="Refresh" @click="resetQuery">重置</el-button>
            </el-form-item>
        </el-form>

        <el-table v-loading="loading" :data="monitorList" stripe border
                  :row-class-name="rowClassName" :default-sort="{ prop: 'errorRate', order: 'descending' }">
            <el-table-column label="接口名称" align="left" prop="apiName"/>
            <el-table-column label="数据源" align="left" prop="datasourceName"/>
            <el-table-column label="调用次数" align="center" prop="callCount" sortable/>
            <el-table-column label="成功数" align="center" prop="successCount" sortable/>
            <el-table-column label="失败数" align="center" prop="failCount" sortable/>
            <el-table-column label="错误率" align="center" prop="errorRate" sortable>
                <template #default="scope">
                    {{ (scope.row.errorRate * 100).toFixed(2) }}%
                </template>
            </el-table-column>
            <el-table-column label="平均耗时(ms)" align="center" prop="avgCost" sortable/>
            <el-table-column label="P95耗时(ms)" align="center" prop="p95Cost" sortable/>
        </el-table>
    </div>
</template>

<script setup>
import {onMounted, reactive, ref} from 'vue';
import {ElMessage} from 'element-plus';
import {getMonitorOverview} from '@/api/oneapi/monitorApi';
import {getDatasourceList} from '@/api/metadata/datasourceApi';

const loading = ref(false);
const showSearch = ref(true);
const monitorList = ref([]);
const datasourceOptions = ref([]);
const queryParams = reactive({
    range: '24h',
    datasourceId: undefined,
    status: undefined,
});

function rowClassName({row}) {
    return row.errorRate > 0.05 ? 'row-warn' : '';
}

function getList() {
    loading.value = true;
    getMonitorOverview(queryParams)
        .then((res) => {
            monitorList.value = res.rows || res || [];
        })
        .catch(() => {
            ElMessage.error('查询监控数据失败');
        })
        .finally(() => {
            loading.value = false;
        });
}

function handleQuery() {
    getList();
}

function resetQuery() {
    queryParams.range = '24h';
    queryParams.datasourceId = undefined;
    queryParams.status = undefined;
    getList();
}

function loadDatasourceOptions() {
    getDatasourceList('', null)
        .then((response) => {
            datasourceOptions.value = response || [];
        })
        .catch(() => {
        });
}

onMounted(() => {
    loadDatasourceOptions();
    getList();
});
</script>

<style scoped>
.app-container {
    padding: 20px;
}

:deep(.row-warn) {
    color: var(--el-color-danger);
}
</style>
