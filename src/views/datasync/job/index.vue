<template>
    <div class="app-container">
        <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
            <el-form-item label="任务名称" prop="jobName">
                <el-input v-model="queryParams.jobName" placeholder="请输入任务名称" clearable
                          @keyup.enter="handleQuery"/>
            </el-form-item>
            <el-form-item label="任务分组" prop="catalogName">
                <el-select v-model="queryParams.catalogName" placeholder="请选择任务分组" clearable>
                    <el-option v-for="item in catalogOption"
                               :key="item.catalogId"
                               :label="item.catalogName"
                               :value="item.catalogId"/>
                </el-select>
            </el-form-item>
            <el-form-item>
                <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
                <el-button icon="Refresh" @click="resetQuery">重置</el-button>
            </el-form-item>
        </el-form>

        <el-row :gutter="10" class="mb8">
            <el-col :span="1.5">
                <el-button type="primary" plain icon="Plus" @click="toAddJobPage"
                           v-hasPermission="['metadata:datasource:add']">新建任务
                </el-button>
            </el-col>
        </el-row>

        <!-- 任务列表 -->
        <el-table v-loading="loading" :data="jobList" stripe>
            <el-table-column label="任务名称" prop="jobName" :show-overflow-tooltip="true" width="160"/>
            <el-table-column label="所属分组" align="left" prop="catalogName"/>
            <el-table-column label="输入源" align="left" prop="sourceDatasourceName"/>
            <el-table-column label="输出源" align="left" prop="sinkDatasourceName"/>
            <el-table-column label="任务状态" align="center" prop="status">
                <template #default="scope">
                    <el-tooltip :content="formatStatus(scope.row.status)" placement="top">
                        <el-button text :type="formatStatusColor(scope.row.status)" :icon="formatIcon(scope.row.status)" circle />
                    </el-tooltip>
                </template>
            </el-table-column>
            <el-table-column label="任务描述" align="left" prop="remark" :show-overflow-tooltip="true" width="150"/>
            <el-table-column label="创建时间" align="center" prop="createTime" width="160px">
                <template #default="scope">
                    <span>{{ parseTime(scope.row.createTime) }}</span>
                </template>
            </el-table-column>
            <el-table-column label="操作" align="center" width="200" class-name="small-padding fixed-width">
                <template #default="scope">
                    <el-button-group class="ml-4">
                        <el-tooltip content="启动任务" placement="top"
                                    v-if="scope.row.status !== 'RUNNING'">
                            <el-button type="primary" :icon="SwitchButton" @click="openStartJobDialog(scope.row)"
                                       v-hasPermission="['datasync:job:edit']"/>
                        </el-tooltip>
                        <el-tooltip content="暂停任务" placement="top"
                                    v-if="scope.row.status === 'RUNNING'">
                            <el-button type="danger" icon="video-pause" @click="stopJob(scope.row)"
                                       v-hasPermission="['datasync:job:edit']"/>
                        </el-tooltip>
                        <el-tooltip content="任务详情" placement="top" v-if="scope.row.status === 'RUNNING'">
                            <el-button type="primary" icon="view" @click="toJobDetail(scope.row)"
                                       v-hasPermission="['datasync:job:query']"/>
                        </el-tooltip>
                        <el-tooltip content="编辑" placement="top"
                                    v-if="scope.row.status !== 'RUNNING'">
                            <el-button type="warning" icon="edit" @click="toEditJobPage(scope.row)"
                                       v-hasPermission="['datasync:job:edit']"/>
                        </el-tooltip>
                        <el-tooltip content="删除" placement="top"
                                    v-if="scope.row.status !== 'RUNNING'">
                            <el-button type="danger" icon="delete" @click="handleDelete(scope.row)"
                                       v-hasPermission="['datasync:job:remove']"/>
                        </el-tooltip>
                    </el-button-group>
                </template>
            </el-table-column>
        </el-table>

        <!-- 分页 -->
        <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList"/>

        <!-- 启动参数 -->
        <el-dialog title="启动参数设置" v-model="open" append-to-body>
            <el-form ref="startForm" :model="form" :label-width="100" style="height: 100px">
                <el-form-item prop="syncType" label="请选择启动方式：" label-width="130px">
                    <el-select
                            v-model="form.syncType"
                            placeholder="请选择"
                            @change="syncTypeSelect($event)"
                            clearable
                            filterable>
                        <el-option v-for="item in syncTypeOptions" :key="item.value" :label="item.label" :value="item.value"/>
                    </el-select>
                </el-form-item>
                <el-form-item v-if="dateTimeSelect === 'timestamp'" prop="specificOffset" label="请选择启动时间：" label-width="130px">
                    <el-date-picker
                            v-model="form.specificOffset"
                            type="datetime"
                            placeholder="选择日期"
                            clearable />
                </el-form-item>
            </el-form>
            <div slot="footer" class="dialog-footer">
                <el-button @click="closeDialog()">取消</el-button>
                <el-button type="primary" @click="submitJob()">确定</el-button>
            </div>
        </el-dialog>
    </div>
</template>

<script setup name="jobManager">
import * as jobApi from "@/api/datasync/jobApi";
import * as catalogApi from "@/api/datasync/catalogApi";
import {ref} from "vue";
import {jobDetail} from "@/api/datasync/jobApi";
import { Delete, Edit, Search, Share, Upload, Switch, SwitchButton, Clock, RemoveFilled, Remove } from '@element-plus/icons-vue'

const router = useRouter();
const {proxy} = getCurrentInstance();
const open = ref(false);
const currentJobId = ref(null)
const dateTimeSelect = ref(null)
const jobList = ref([]);
const loading = ref(true);
const showSearch = ref(true);
const total = ref(0);
const catalogOption = ref([])
const syncTypeOptions = [
    {
        value: 'initial',
        label: '全量快照'
    }, {
        value: 'earliest',
        label: '最早binLog位点'
    }, {
        value: 'latest',
        label: '最新binLog位点'
    }, {
        value: 'specificOffset',
        label: '指定bigLog位点'
    }, {
        value: 'timestamp',
        label: '指定时间戳'
    }
];

const data = reactive({
    form: {},
    queryParams: {
        jobName: undefined,
        catalogName: undefined
    }
});

const {queryParams, form} = toRefs(data);

/**
 * 跳转新增页面
 */
function toAddJobPage() {
    router.push({
        path: `/datasync/job-manager/addJob`,
        query: {
            fromRouterPush: true
        }
    })
}

/**
 * 跳转编辑页面
 */
function toEditJobPage(row) {
    const {jobId} = row;
    router.push({
        path: `/datasync/job-manager/editJob/${jobId}`,
        query: {
            fromRouterPush: true
        }
    })
}

function openStartJobDialog(row) {
    currentJobId.value = row.jobId;
    open.value =true;
}

function syncTypeSelect(data) {
    dateTimeSelect.value = data
}

function submitJob() {
    let data = {
        jobId: currentJobId.value,
        syncType: form.value.syncType,
        specificOffset: form.value.specificOffset
    }
    console.log(data)
    jobApi.submitJob(data)
        .then((response) => {
            open.value = false;
            dateTimeSelect.value = null;
            proxy.resetForm('startForm');
            proxy.$message({message: '任务启动成功', type: 'success'})
        })
}

function stopJob(row) {
    proxy.$modal
        .confirm(`是否确认停止任务["${row.jobName}"]吗？`)
        .then(() => jobApi.stopJob(row.jobId))
        .then(() => {
            getList();
            proxy.$modal.msgSuccess('任务停止成功');
        })
        .catch(() => {});
}

function toJobDetail(row) {
    jobApi.jobDetail(row.jobId, 1)
        .then((response) => {
            window.open(response.trackingUrl, '_blank')
        })
}

function closeDialog() {
    open.value = false;
}

/**
 * 初始化分组下拉框
 */
function initCatalogOption() {
    catalogApi.list(null)
        .then((response) => {
            catalogOption.value = response;
        })
}

/**
 * 任务列表
 */
function getList() {
    loading.value = true;
    jobApi.pageList(queryParams.value)
        .then((response) => {
            jobList.value = response.rows;
            total.value = response.total;
        })
        .finally(() => {
            loading.value = false;
        });
}

function handleDelete(row) {
    proxy.$modal
        .confirm(`确认删除"${row.jobName}"任务吗？`)
        .then(() => jobApi.remove(row.jobId))
        .then(() => {
            getList();
            proxy.$modal.msgSuccess('删除成功');
        })
        .catch(() => {});
}

/** 表单重置 */
function reset() {
    form.value = {
        datasourceName: undefined,
        remark: undefined,
    };
    proxy.resetForm('jobRef');
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
    }  else {
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

initCatalogOption();
getList();
</script>

<style>
.red{
    color: rgb(255, 73, 73);
}
.blue{
    color: #409EFF;
}
</style>