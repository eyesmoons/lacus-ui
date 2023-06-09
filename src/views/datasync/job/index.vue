<template>
    <div class="app-container">
        <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="90px">
            <el-form-item label="任务名称" prop="datasourceName">
                <el-input v-model="queryParams.jobName" placeholder="请输入任务名称" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="任务分组" prop="catalogName">
                <el-select v-model="queryParams.catalogName" placeholder="请选择任务分组" clearable>
                    <el-option v-for="dict in datasource_status" :key="dict.value" :label="dict.label" :value="dict.value" />
                </el-select>
            </el-form-item>
            <el-form-item>
                <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
                <el-button icon="Refresh" @click="resetQuery">重置</el-button>
            </el-form-item>
        </el-form>

        <el-row :gutter="10" class="mb8">
            <el-col :span="1.5">
                <el-button type="primary" plain icon="Plus" @click="toAddJobPage" v-hasPermission="['metadata:datasource:add']">新建任务</el-button>
            </el-col>
        </el-row>

        <el-table v-loading="loading" :data="jobList" stripe>
            <el-table-column type="selection" width="55" align="center" />
            <el-table-column label="任务名称" align="left" prop="jobName" />
            <el-table-column label="任务分组" align="left" prop="catalogName" />
            <el-table-column label="输入源" align="left" prop="sourceDatasourceName" />
            <el-table-column label="输出源" align="left" prop="sinkDatasourceName" />
            <el-table-column label="同步方式" align="left" prop="syncTypeName" />
            <el-table-column label="source状态" align="left" prop="sourceStatus">
                <template #default="scope">
                    <el-tooltip content="运行中" placement="top" v-if="scope.row.sourceStatus === 1">
                        <el-button link type="success" plain icon="video-play">运行中</el-button>
                    </el-tooltip>
                    <el-tooltip content="已停止" placement="top" v-if="scope.row.sourceStatus !== 1">
                        <el-button link type="danger" plain icon="video-pause" >已停止</el-button>
                    </el-tooltip>
                </template>
            </el-table-column>
            <el-table-column label="sink状态" align="left" prop="sinkStatus">
                <template #default="scope">
                    <el-tooltip content="运行中" placement="top" v-if="scope.row.sinkStatus === 1">
                        <el-button link type="success" plain icon="video-play">运行中</el-button>
                    </el-tooltip>
                    <el-tooltip content="已停止" placement="top" v-if="scope.row.sinkStatus !== 1">
                        <el-button link type="danger" plain icon="video-pause">已停止</el-button>
                    </el-tooltip>
                </template>
            </el-table-column>
            <el-table-column label="任务描述" align="left" prop="remark" :show-overflow-tooltip="true" width="150"/>
            <el-table-column label="创建时间" align="center" prop="createTime" :show-overflow-tooltip="true" width="180">
                <template #default="scope">
                    <span>{{ parseTime(scope.row.createTime) }}</span>
                </template>
            </el-table-column>
            <el-table-column label="操作" align="center">
                <template #default="scope">
                    <el-button-group class="ml-4">
                        <el-tooltip content="启动任务" placement="top" v-if="scope.row.sourceStatus !== 1 || scope.row.sinkStatus !== 1">
                            <el-button link type="primary" plain icon="switch-button" @click="handleStart(scope.row)" v-hasPermission="['datasync:job:edit']" />
                        </el-tooltip>
                        <el-tooltip content="停止任务" placement="top" v-if="scope.row.sourceStatus === 1 && scope.row.sinkStatus === 1">
                            <el-button link type="primary" plain icon="VideoPause" @click="handleStop(scope.row)" v-hasPermission="['datasync:job:edit']" />
                        </el-tooltip>
                        <el-tooltip content="任务监控" placement="top" v-if="scope.row.sourceStatus === 1 && scope.row.sinkStatus === 1">
                            <el-button link type="primary" plain icon="view" @click="handleMonitor(scope.row)" v-hasPermission="['datasync:job:edit']" />
                        </el-tooltip>
                        <el-tooltip content="编辑" placement="top"  v-if="scope.row.sourceStatus !== 1 || scope.row.sinkStatus !== 1">
                            <el-button link type="primary" icon="Edit" @click="toEditJobPage(scope.row)" v-hasPermission="['datasync:job:edit']"/>
                        </el-tooltip>
                        <el-tooltip content="删除" placement="top" v-if="scope.row.sourceStatus !== 1 || scope.row.sinkStatus !== 1">
                            <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermission="['datasync:job:remove']"/>
                        </el-tooltip>
                    </el-button-group>
                </template>
            </el-table-column>
        </el-table>
        <!-- 分页 -->
        <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList"/>
    </div>
</template>

<script setup name="job">
import * as jobApi from "@/api/datasync/jobApi";

const router = useRouter();
const { proxy } = getCurrentInstance();
const jobList = ref([]);
const loading = ref(true);
const showSearch = ref(true);
const total = ref(0);

const data = reactive({
    form: {},
    queryParams: {
        pageNum: 1,
        pageSize: 10,
        jobName: undefined,
        catalogName: undefined
    }
});

const { queryParams, form } = toRefs(data);

/**
 * 跳转新增页面
 */
function toAddJobPage() {
    router.push(`/datasync/job-manager/addJob`)
}

/**
 * 跳转编辑页面
 */
function toEditJobPage(row) {
    const { jobId } = row;
    router.push(`/datasync/job-manager/editJob/${jobId}`)
}

/** 查询任务列表 */
function getList() {
    loading.value = true;
    jobApi.pageList(queryParams.value)
        .then((response) => {
            jobList.value = response.rows
            total.value = response.total
        })
        .finally(() => {
            loading.value = false;
        });
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
    queryParams.value.pageNum = 1;
    getList();
}

/** 重置按钮操作 */
function resetQuery() {
    proxy.resetForm('queryRef');
    handleQuery();
}
getList();
</script>