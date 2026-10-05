<template>
    <div class="app-container">
        <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
            <el-form-item label="任务名称" prop="taskName">
                <el-input v-model="queryParams.taskName" placeholder="请输入任务名称" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="状态" prop="status">
                <el-select v-model="queryParams.status" placeholder="请选择状态" clearable>
                    <el-option label="全部" value="" />
                    <el-option label="等待中" value="PENDING" />
                    <el-option label="训练中" value="TRAINING" />
                    <el-option label="已完成" value="COMPLETED" />
                    <el-option label="失败" value="FAILED" />
                    <el-option label="已取消" value="CANCELLED" />
                </el-select>
            </el-form-item>
            <el-form-item label="类型" prop="taskType">
                <el-select v-model="queryParams.taskType" placeholder="请选择类型" clearable>
                    <el-option label="全部" value="" />
                    <el-option label="以图搜图" value="SIMILARITY" />
                    <el-option label="图片分类" value="CLASSIFICATION" />
                </el-select>
            </el-form-item>
            <el-form-item>
                <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
                <el-button icon="Refresh" @click="resetQuery">重置</el-button>
            </el-form-item>
        </el-form>

        <el-table v-loading="loading" :data="taskList" border stripe>
            <el-table-column label="ID" align="center" prop="taskId" width="80" />
            <el-table-column label="任务名称" align="left" prop="taskName" show-overflow-tooltip />
            <el-table-column label="类型" align="center" prop="taskType" width="100">
                <template #default="scope">
                    <el-tag>{{ scope.row.taskType === 'SIMILARITY' ? '以图搜图' : '图片分类' }}</el-tag>
                </template>
            </el-table-column>
            <el-table-column label="状态" align="center" prop="status" width="100">
                <template #default="scope">
                    <el-tag :type="getStatusType(scope.row.status)">{{ getStatusText(scope.row.status) }}</el-tag>
                </template>
            </el-table-column>
            <el-table-column label="进度" align="center" width="120">
                <template #default="scope">
                    <el-progress :percentage="scope.row.trainingProgress || 0" />
                </template>
            </el-table-column>
            <el-table-column label="创建时间" align="center" prop="createTime" width="160">
                <template #default="scope">
                    {{ parseTime(scope.row.createTime) }}
                </template>
            </el-table-column>
        </el-table>

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
import { onMounted, reactive, ref } from 'vue';
import { parseTime } from '@/utils/dateUtil';
import { listTasks } from '@/api/lakeintelligence/task';

const loading = ref(false);
const showSearch = ref(true);
const total = ref(0);
const taskList = ref([]);

const queryParams = reactive({
    pageNum: 1,
    pageSize: 10,
    taskName: undefined,
    status: undefined,
    taskType: undefined,
});

function getList() {
    loading.value = true;
    listTasks(queryParams).then((response) => {
        taskList.value = response.rows || response.list || [];
        total.value = response.total || taskList.value.length;
        loading.value = false;
    }).catch(() => {
        loading.value = false;
    });
}

function handleQuery() {
    queryParams.pageNum = 1;
    getList();
}

function resetQuery() {
    queryParams.taskName = undefined;
    queryParams.status = undefined;
    queryParams.taskType = undefined;
    handleQuery();
}

function getStatusType(status) {
    switch (status) {
        case 'COMPLETED': return 'success';
        case 'FAILED': return 'danger';
        case 'TRAINING': return 'warning';
        case 'CANCELLED': return 'info';
        default: return '';
    }
}

function getStatusText(status) {
    switch (status) {
        case 'PENDING': return '等待中';
        case 'TRAINING': return '训练中';
        case 'COMPLETED': return '已完成';
        case 'FAILED': return '失败';
        case 'CANCELLED': return '已取消';
        default: return status;
    }
}

onMounted(() => {
    getList();
});
</script>

<style scoped>
.app-container {
    padding: 20px;
}
</style>
