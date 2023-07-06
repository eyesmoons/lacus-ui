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

        <el-table
                v-if="refreshTable"
                v-loading="loading"
                :data="jobList"
                stripe
                row-key="jobId"
                :default-expand-all="isExpandAll"
                :tree-props="{ children: 'children', hasChildren: 'hasChildren' }">
            <el-table-column prop="jobName" label="任务 / 分组名称" :show-overflow-tooltip="true" width="160"/>
            <el-table-column label="输入源" align="left" prop="sourceDatasourceName"/>
            <el-table-column label="输出源" align="left" prop="sinkDatasourceName"/>
            <el-table-column label="同步方式" align="left" prop="syncType"/>
            <el-table-column label="source状态" align="left" prop="sourceStatus">
                <template #default="scope">
                    <el-tooltip content="运行中" placement="top" v-if="scope.row.catalogId === '0' && scope.row.sourceStatus === 'RUNNING'">
                        <el-button link type="success" plain icon="video-play">运行中</el-button>
                    </el-tooltip>
                    <el-tooltip content="已停止" placement="top" v-if="scope.row.catalogId === '0' && scope.row.sourceStatus !== 'RUNNING'">
                        <el-button link type="danger" plain icon="video-pause">已停止</el-button>
                    </el-tooltip>
                </template>
            </el-table-column>
            <el-table-column label="sink状态" align="left" prop="sinkStatus">
                <template #default="scope">
                    <el-tooltip content="运行中" placement="top" v-if="scope.row.catalogId === '0' && scope.row.sinkStatus === 'RUNNING'">
                        <el-button link type="success" plain icon="video-play">运行中</el-button>
                    </el-tooltip>
                    <el-tooltip content="已停止" placement="top" v-if="scope.row.catalogId === '0' && scope.row.sinkStatus !== 'RUNNING'">
                        <el-button link type="danger" plain icon="video-pause">已停止</el-button>
                    </el-tooltip>
                </template>
            </el-table-column>
            <el-table-column label="任务 / 分组描述" align="left" prop="remark" :show-overflow-tooltip="true"
                             width="150"/>
            <el-table-column label="操作" align="center" width="200" class-name="small-padding fixed-width">
                <template #default="scope">
                    <el-button-group class="ml-4">
                        <el-tooltip content="启动任务" placement="top"
                                    v-if="scope.row.catalogId === '0' && (scope.row.sourceStatus !== 'RUNNING' && scope.row.sinkStatus !== 'RUNNING')">
                            <el-button link type="primary" icon="switch-button" @click="openStartJobDialog(scope.row)"
                                       v-hasPermission="['datasync:job:edit']"/>
                        </el-tooltip>
                        <el-tooltip content="暂停任务" placement="top"
                                    v-if="scope.row.catalogId === '0' && (scope.row.sourceStatus === 'RUNNING' || scope.row.sinkStatus === 'RUNNING')">
                            <el-button link type="danger" icon="video-pause" @click="stopJob(scope.row)"
                                       v-hasPermission="['datasync:job:edit']"/>
                        </el-tooltip>
                        <el-tooltip content="编辑" placement="top"
                                    v-if="scope.row.catalogId !== '0' && (scope.row.sourceStatus !== 'RUNNING' || scope.row.sinkStatus !== 'RUNNING')">
                            <el-button link type="primary" icon="Edit" @click="toEditJobPage(scope.row)"
                                       v-hasPermission="['datasync:job:edit']"/>
                        </el-tooltip>
                        <el-tooltip content="删除" placement="top"
                                    v-if="scope.row.catalogId !== '0' && (scope.row.sourceStatus !== 'RUNNING' || scope.row.sinkStatus !== 'RUNNING')">
                            <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)"
                                       v-hasPermission="['datasync:job:remove']"/>
                        </el-tooltip>
                    </el-button-group>
                </template>
            </el-table-column>
        </el-table>

        <!-- 启动参数 -->
        <el-dialog title="启动参数设置" v-model="open" append-to-body>
            <el-form ref="startForm" :model="form" :label-width="100" style="height: 100px">
                <el-form-item prop="syncType" label="请选择启动方式：" label-width="130px">
                    <el-select
                            v-model="form.syncType"
                            placeholder="请输入数据源类型"
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

const router = useRouter();
const {proxy} = getCurrentInstance();
const open = ref(false);
const currentCatalogId = ref(null)
const dateTimeSelect = ref(null)
const jobList = ref([]);
const loading = ref(true);
const showSearch = ref(true);
const total = ref(0);
const isExpandAll = ref(false);
const refreshTable = ref(true);
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
    currentCatalogId.value = row.jobId;
    open.value =true;
}

function syncTypeSelect(data) {
    dateTimeSelect.value = data
}

function submitJob() {
    let data = {
        catalogId: currentCatalogId.value,
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
 * 树形列表
 */
function getList() {
    loading.value = true;
    jobApi.jobListTree(queryParams.value)
        .then((response) => {
            jobList.value = proxy.handleTree(response, 'jobId', 'catalogId');
        })
        .finally(() => {
            loading.value = false;
        });
}

function handleDelete(row) {
    let jobId = row.jobId;
    proxy.$modal
        .confirm(`是否确认删除ID为"${jobId}"的任务吗？`)
        .then(() => jobApi.remove(jobId))
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

initCatalogOption();
getList();
</script>