<template>
    <div class="app-container">
        <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
            <el-form-item label="任务名称" prop="jobName">
                <el-input v-model="queryParams.jobName" placeholder="请输入任务名称" clearable
                          @keyup.enter="handleQuery"/>
            </el-form-item>
            <el-form-item>
                <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
                <el-button icon="Refresh" @click="resetQuery">重置</el-button>
            </el-form-item>
        </el-form>

        <!-- 任务列表 -->
        <el-table v-loading="loading" :data="jobInstanceList" stripe border>
            <el-table-column label="实例名称" show-overflow-tooltip prop="instanceName" :show-overflow-tooltip="true"/>
            <el-table-column label="任务名称" show-overflow-tooltip prop="jobName" :show-overflow-tooltip="true"/>
            <el-table-column label="启动方式" show-overflow-tooltip align="left" prop="syncType"/>
            <el-table-column label="时间戳" show-overflow-tooltip align="left" prop="timeStamp"/>
            <el-table-column label="applicationId" show-overflow-tooltip align="left" prop="applicationId"/>
            <el-table-column label="任务状态" align="center" prop="status">
                <template #default="scope">
                    <el-tooltip :content="formatStatus(scope.row.status)" placement="top">
                        <el-button text :type="formatStatusColor(scope.row.status)" :icon="formatIcon(scope.row.status)"
                                   circle/>
                    </el-tooltip>
                </template>
            </el-table-column>
            <el-table-column label="开始时间" show-overflow-tooltip align="center" prop="submitTime" width="160px">
                <template #default="scope">
                    <span>{{ parseTime(scope.row.submitTime) }}</span>
                </template>
            </el-table-column>
            <el-table-column label="结束时间" show-overflow-tooltip align="center" prop="finishedTime" width="160px">
                <template #default="scope">
                    <span>{{ parseTime(scope.row.finishedTime) }}</span>
                </template>
            </el-table-column>
            <el-table-column fixed="right" label="操作" align="center" width="250"
                             class-name="small-padding fixed-width">
                <template #default="scope">
                    <el-button-group class="ml-4">
                        <el-tooltip content="TrackingUrl" placement="top">
                            <el-button type="primary" icon="view" @click="toJobDetail(scope.row)"
                                       v-hasPermission="['datasync:instance:query']"/>
                        </el-tooltip>
                    </el-button-group>
                </template>
            </el-table-column>
        </el-table>

        <!-- 分页 -->
        <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum"
                    v-model:limit="queryParams.pageSize" @pagination="getList"/>
    </div>
</template>

<script setup name="jobInstance">
import * as jobInstanceApi from "@/api/datasync/jobInstanceApi";
import {ref} from "vue";

const router = useRouter();
const {proxy} = getCurrentInstance();
const open = ref(false);
const jobInstanceList = ref([]);
const loading = ref(true);
const showSearch = ref(true);
const total = ref(0);

const data = reactive({
    form: {},
    queryParams: {
        jobName: undefined,
        catalogName: undefined
    }
});

const {queryParams, form} = toRefs(data);

function toJobDetail(row) {
    const {trackingUrl} = row;
    window.open(trackingUrl);
}

/**
 * 任务实例列表
 */
function getList() {
    loading.value = true;
    jobInstanceApi.pageList(queryParams.value)
            .then((response) => {
                jobInstanceList.value = response.rows;
                total.value = response.total;
            })
            .finally(() => {
                loading.value = false;
            });
}

/** 搜索按钮操作 */
function handleQuery() {
    getList();
}

/** 重置按钮操作 */
function resetQuery() {
    proxy.resetForm('queryRef');
    handleQuery();
}

function formatStatus(status) {
    if (status === null || status !== 'RUNNING') {
        return '已停止'
    } else {
        return '运行中'
    }
}

function formatStatusColor(status) {
    if (status === null || status !== 'RUNNING') {
        return 'danger'
    } else {
        return 'primary'
    }
}

function formatIcon(status) {
    if (status === null || status !== 'RUNNING') {
        return 'Remove'
    } else {
        return 'Clock'
    }
}

getList();
</script>

<style>
.red {
    color: rgb(255, 73, 73);
}

.blue {
    color: #409EFF;
}
</style>