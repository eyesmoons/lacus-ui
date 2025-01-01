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
            <el-form-item label="任务状态" prop="jobStatus">
                <el-select v-model="queryParams.jobStatus" placeholder="请选择任务状态" clearable>
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
            <el-col :span="1.5">
                <el-dropdown @command="handleAdd">
                    <el-button type="primary" plain icon="Plus">
                        新建任务
                        <el-icon class="el-icon--right">
                            <arrow-down/>
                        </el-icon>
                    </el-button>
                    <template #dropdown>
                        <el-dropdown-menu>
                            <el-dropdown-item command="STREAMING_SQL">STREAMING_SQL</el-dropdown-item>
                            <el-dropdown-item command="BATCH_SQL">BATCH_SQL</el-dropdown-item>
                            <el-dropdown-item command="JAR">JAR</el-dropdown-item>
                        </el-dropdown-menu>
                    </template>
                </el-dropdown>
            </el-col>
            <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"/>
        </el-row>

        <!-- 任务列表 -->
        <el-table v-loading="loading" :data="jobList" stripe border>
            <el-table-column label="任务名称" align="left" prop="jobName" :show-overflow-tooltip="true"/>
            <el-table-column label="任务类型" align="center" prop="jobType">
                <template #default="scope">
                    {{ formatJobType(scope.row.jobType) }}
                </template>
            </el-table-column>
            <el-table-column label="部署模式" align="center" prop="deployMode"/>
            <el-table-column label="任务状态" align="center" prop="jobStatus">
                <template #default="scope">
                    <el-tag :type="formatStatusType(scope.row.jobStatus)">
                        {{ formatStatus(scope.row.jobStatus) }}
                    </el-tag>
                </template>
            </el-table-column>
            <el-table-column label="任务说明" align="left" prop="remark" :show-overflow-tooltip="true"/>
            <el-table-column label="应用ID" align="left" prop="appId" :show-overflow-tooltip="true"/>
            <el-table-column label="创建时间" align="center" prop="createTime" width="190">
                <template #default="scope">
                    <span>{{ parseTime(scope.row.createTime) }}</span>
                </template>
            </el-table-column>
            <el-table-column label="操作" align="center" width="380">
                <template #default="scope">
                    <el-button-group>
                        <el-tooltip content="编辑" placement="top">
                            <el-button
                                type="primary"
                                icon="Edit"
                                @click="handleUpdate(scope.row)"
                                v-if="scope.row.jobStatus !== 'RUNNING'"
                            />
                        </el-tooltip>
                        <el-tooltip content="删除" placement="top">
                            <el-button
                                type="danger"
                                icon="Delete"
                                @click="handleDelete(scope.row)"
                                v-if="scope.row.jobStatus !== 'RUNNING'"
                            />
                        </el-tooltip>
                        <el-tooltip content="详情" placement="top">
                            <el-button type="info" icon="View" @click="handleDetail(scope.row)"/>
                        </el-tooltip>
                        <el-tooltip content="启动" placement="top">
                            <el-button
                                type="success"
                                icon="VideoPlay"
                                @click="handleStart(scope.row)"
                                v-if="scope.row.jobStatus !== 'RUNNING'"
                            />
                        </el-tooltip>
                        <el-tooltip content="恢复" placement="top">
                            <el-button
                                type="warning"
                                icon="VideoPlay"
                                @click="handleResume(scope.row)"
                                v-if="scope.row.jobStatus === 'PAUSED'"
                            />
                        </el-tooltip>
                        <el-tooltip content="停止" placement="top">
                            <el-button
                                type="danger"
                                icon="VideoPause"
                                @click="handleStop(scope.row)"
                                v-if="scope.row.jobStatus === 'RUNNING'"
                            />
                        </el-tooltip>
                        <el-tooltip content="暂停" placement="top">
                            <el-button
                                type="warning"
                                icon="VideoPause"
                                @click="handlePause(scope.row)"
                                v-if="scope.row.jobStatus === 'RUNNING'"
                            />
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
            @pagination="getList"
        />
    </div>
</template>

<script setup name="FlinkJob">
import * as jobApi from '@/api/flink/jobApi';
import {getCurrentInstance, ref} from 'vue';
import {useRouter} from 'vue-router';

const {proxy} = getCurrentInstance();
const router = useRouter();

// 遮罩层
const loading = ref(true);
// 显示搜索条件
const showSearch = ref(true);
// 总条数
const total = ref(0);
// 任务表格数据
const jobList = ref([]);

// 任务类型选项
const jobTypeOptions = [
    {value: 'STREAMING_SQL', label: '流式SQL'},
    {value: 'BATCH_SQL', label: '批处理SQL'},
    {value: 'JAR', label: 'JAR包'},
];

// 状态选项
const statusOptions = [
    {value: 1, label: '提交成功'},
    {value: 2, label: '运行中'},
    {value: 3, label: '成功'},
    {value: 4, label: '失败'},
];

// 查询参数
const queryParams = ref({
    pageNum: 1,
    pageSize: 10,
    jobName: undefined,
    jobType: undefined,
    jobStatus: undefined,
    createTime: undefined
});

/** 查询任务列表 */
function getList() {
    loading.value = true;
    jobApi.pageList(queryParams.value).then((response) => {
        jobList.value = response.rows;
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
    proxy.resetForm('queryRef');
    handleQuery();
}

/** 新增按钮操作 */
function handleAdd(command) {
    router.push(`/flink/job/add/${command}`);
}

/** 修改按钮操作 */
function handleUpdate(row) {
    router.push(`/flink/job/edit/${row.jobId}`);
}

/** 详情按钮操作 */
function handleDetail(row) {
    router.push(`/flink/job/detail/${row.jobId}`);
}

/** 删除按钮操作 */
function handleDelete(row) {
    proxy.$modal.confirm('是否确认删除任务名称为"' + row.jobName + '"的数据项?').then(() => {
        jobApi.removeJob(row.jobId).then(() => {
            getList();
            proxy.$modal.msgSuccess('删除成功');
        });
    });
}

/** 启动任务 */
function handleStart(row) {
    proxy.$modal.confirm('是否确认启动任务名称为"' + row.jobName + '"的任务?').then(() => {
        jobApi.startJob(row.jobId).then(() => {
            getList();
            proxy.$modal.msgSuccess('启动成功');
        });
    });
}

/** 恢复任务 */
function handleResume(row) {
    proxy.$modal.confirm('是否确认恢复任务名称为"' + row.jobName + '"的任务?').then(() => {
        jobApi.resumeJob(row.jobId).then(() => {
            getList();
            proxy.$modal.msgSuccess('恢复成功');
        });
    });
}

/** 停止任务 */
function handleStop(row) {
    proxy.$modal.confirm('是否确认停止任务名称为"' + row.jobName + '"的任务?').then(() => {
        jobApi.stopJob(row.jobId).then(() => {
            getList();
            proxy.$modal.msgSuccess('停止成功');
        });
    });
}

/** 暂停任务 */
function handlePause(row) {
    proxy.$modal.confirm('是否确认暂停任务名称为"' + row.jobName + '"的任务?').then(() => {
        jobApi.pauseJob(row.jobId).then(() => {
            getList();
            proxy.$modal.msgSuccess('暂停成功');
        });
    });
}

/** 格式化任务类型 */
function formatJobType(type) {
    return jobTypeOptions.find((item) => item.value === type)?.label || type;
}

/** 格式化状态 */
function formatStatus(status) {
    if (!status) status = "CREATED";
    return statusOptions.find((item) => item.value === status)?.label || status;
}

/** 格式化状态样式 */
function formatStatusType(status) {
    if (status === 1) return 'info';
    if (status === 2) return 'primary';
    if (status === 3) return 'success';
    if (status === 4) return 'danger';
    return 'default';
}

getList();
</script>
