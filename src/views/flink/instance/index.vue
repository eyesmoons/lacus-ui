<template>
    <div class="app-container">
        <!-- 搜索表单 -->
        <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
            <el-form-item label="任务名称" prop="jobName">
                <el-input v-model="queryParams.jobName" placeholder="请输入任务名称" clearable
                          @keyup.enter="handleQuery"/>
            </el-form-item>
            <el-form-item label="任务类型" prop="jobType">
                <el-select v-model="queryParams.jobType" placeholder="请选择任务类型" clearable>
                    <el-option v-for="dict in jobTypeOptions" :key="dict.value" :label="dict.label"
                               :value="dict.value"/>
                </el-select>
            </el-form-item>
            <el-form-item label="实例状态" prop="status">
                <el-select v-model="queryParams.status" placeholder="请选择实例状态" clearable>
                    <el-option v-for="dict in statusOptions" :key="dict.value" :label="dict.label" :value="dict.value"/>
                </el-select>
            </el-form-item>
            <el-form-item>
                <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
                <el-button icon="Refresh" @click="resetQuery">重置</el-button>
            </el-form-item>
        </el-form>

        <!-- 操作按钮 -->
        <el-row :gutter="10" class="mb8">
            <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"/>
        </el-row>

        <!-- 数据表格 -->
        <el-table v-loading="loading" :data="instanceList" stripe border>
            <el-table-column label="任务名称" align="left" prop="jobName" :show-overflow-tooltip="true"/>
            <el-table-column label="任务类型" align="center" prop="jobType">
                <template #default="scope">
                    {{ formatJobType(scope.row.jobType) }}
                </template>
            </el-table-column>
            <el-table-column label="部署模式" align="center" prop="deployMode"/>
            <el-table-column label="应用ID" align="center" prop="applicationId" :show-overflow-tooltip="true"/>
            <el-table-column label="实例状态" align="center" prop="status">
                <template #default="scope">
                    <el-tag :type="formatStatusType(scope.row.status)">
                        {{ formatStatus(scope.row.status) }}
                    </el-tag>
                </template>
            </el-table-column>
            <el-table-column label="开始时间" align="center" prop="submitTime" width="190">
                <template #default="scope">
                    <span>{{ parseTime(scope.row.submitTime) }}</span>
                </template>
            </el-table-column>
            <el-table-column label="结束时间" align="center" prop="finishedTime" width="190">
                <template #default="scope">
                    <span>{{ parseTime(scope.row.finishedTime) }}</span>
                </template>
            </el-table-column>
            <el-table-column label="操作" align="center" width="150">
                <template #default="scope">
                    <el-button-group>
                        <el-tooltip content="详情" placement="top">
                            <el-button link type="primary" icon="View" @click="handleDetail(scope.row)"/>
                        </el-tooltip>
                    </el-button-group>
                </template>
            </el-table-column>
        </el-table>

        <!-- 分页组件 -->
        <pagination
            v-show="total > 0"
            :total="total"
            v-model:page="queryParams.pageNum"
            v-model:limit="queryParams.pageSize"
            @pagination="getList"
        />
    </div>
</template>

<script setup name="FlinkJobInstance">
import * as instanceApi from '@/api/flink/instanceApi';
import {getCurrentInstance, ref} from 'vue';
import {useRouter} from 'vue-router';

const {proxy} = getCurrentInstance();
const router = useRouter();

// 遮罩层
const loading = ref(false);
// 总条数
const total = ref(0);
// 显示搜索条件
const showSearch = ref(true);
// 实例列表
const instanceList = ref([]);

// 任务类型选项
const jobTypeOptions = [
    {value: 'STREAMING_SQL', label: '流式SQL'},
    {value: 'BATCH_SQL', label: '批处理SQL'},
    {value: 'JAR', label: 'JAR包'},
];

// 状态选项
const statusOptions = [
    {value: 'CREATED', label: '已创建'},
    {value: 'RUNNING', label: '运行中'},
    {value: 'FINISHED', label: '已完成'},
    {value: 'FAILED', label: '已失败'},
    {value: 'CANCELED', label: '已取消'},
];

// 查询参数
const queryParams = ref({
    pageNum: 1,
    pageSize: 10,
    jobName: undefined,
    jobType: undefined,
    status: undefined,
});

/** 查询列表 */
function getList() {
    loading.value = true;
    instanceApi.pageList(queryParams.value).then((response) => {
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
    proxy.$refs.queryRef.resetFields();
    handleQuery();
}

/** 查看详情按钮操作 */
function handleDetail(row) {
    router.push(`/flink/instance/detail/${row.instanceId}`);
}

/** 格式化任务类型 */
function formatJobType(type) {
    return jobTypeOptions.find((item) => item.value === type)?.label || type;
}

/** 格式化状态 */
function formatStatus(status) {
    return statusOptions.find((item) => item.value === status)?.label || status;
}

/** 格式化状态样式 */
function formatStatusType(status) {
    if (status === 'CREATED') return 'info';
    if (status === 'RUNNING') return 'primary';
    if (status === 'FINISHED') return 'success';
    if (status === 'FAILED') return 'danger';
    if (status === 'CANCELED') return 'warning';
    return 'default';
}

getList();
</script>
