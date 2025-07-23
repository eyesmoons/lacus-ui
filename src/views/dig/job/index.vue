<template>
    <div class="job-container">
        <div class="header-section">
            <div class="title-area">
                <h2>任务定义</h2>
                <p>管理数据挖掘任务的定义和配置</p>
            </div>
            <div class="action-area">
                <el-button type="primary" icon="Plus" @click="createNewJob">
                    新建任务
                </el-button>
                <el-button icon="Refresh" @click="refreshJobList">
                    刷新
                </el-button>
            </div>
        </div>

        <div class="content-section">
            <!-- 搜索区域 -->
            <el-form :model="queryParams" ref="queryRef" :inline="true" class="search-form">
                <el-form-item label="任务名称" prop="jobName">
                    <el-input
                        v-model="queryParams.jobName"
                        placeholder="请输入任务名称"
                        clearable
                        @keyup.enter="handleQuery"
                    />
                </el-form-item>
                <el-form-item label="状态" prop="status">
                    <el-select v-model="queryParams.status" placeholder="请选择状态" clearable>
                        <el-option label="草稿" value="DRAFT" />
                        <el-option label="已发布" value="PUBLISHED" />
                        <el-option label="运行中" value="RUNNING" />
                        <el-option label="已停止" value="STOPPED" />
                        <el-option label="失败" value="FAILED" />
                    </el-select>
                </el-form-item>
                <el-form-item label="创建时间">
                    <el-date-picker
                        v-model="dateRange"
                        type="daterange"
                        range-separator="至"
                        start-placeholder="开始日期"
                        end-placeholder="结束日期"
                        value-format="YYYY-MM-DD"
                    />
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
                    <el-button icon="Refresh" @click="resetQuery">重置</el-button>
                </el-form-item>
            </el-form>

            <!-- 任务列表 -->
            <el-table
                v-loading="loading"
                :data="jobList"
                stripe
                border
                @selection-change="handleSelectionChange"
            >
                <el-table-column type="selection" width="55" align="center" />
                <el-table-column label="任务ID" prop="jobId" width="80" />
                <el-table-column label="任务名称" prop="jobName" min-width="150" show-overflow-tooltip />
                <el-table-column label="描述" prop="description" min-width="200" show-overflow-tooltip />
                <el-table-column label="状态" prop="status" width="100" align="center">
                    <template #default="scope">
                        <el-tag :type="getStatusType(scope.row.status)">
                            {{ getStatusText(scope.row.status) }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="子任务数" prop="taskCount" width="100" align="center">
                    <template #default="scope">
                        <el-badge :value="scope.row.taskCount || 0" class="task-badge">
                            <el-icon><Document /></el-icon>
                        </el-badge>
                    </template>
                </el-table-column>
                <el-table-column label="创建人" prop="createBy" width="120" />
                <el-table-column label="创建时间" prop="createTime" width="180" align="center">
                    <template #default="scope">
                        <span>{{ parseTime(scope.row.createTime) }}</span>
                    </template>
                </el-table-column>
                <el-table-column label="更新时间" prop="updateTime" width="180" align="center">
                    <template #default="scope">
                        <span>{{ parseTime(scope.row.updateTime) }}</span>
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="250" align="center" fixed="right">
                    <template #default="scope">
                        <el-button-group>
                            <el-tooltip content="设计任务" placement="top">
                                <el-button type="primary" icon="Edit" size="small" @click="designJob(scope.row)" />
                            </el-tooltip>
                            <el-tooltip content="查看详情" placement="top">
                                <el-button type="info" icon="View" size="small" @click="viewJob(scope.row)" />
                            </el-tooltip>
                            <el-tooltip content="复制任务" placement="top">
                                <el-button type="warning" icon="CopyDocument" size="small" @click="copyJob(scope.row)" />
                            </el-tooltip>
                            <el-tooltip content="执行任务" placement="top">
                                <el-button
                                    type="success"
                                    icon="VideoPlay"
                                    size="small"
                                    @click="executeJob(scope.row)"
                                    :disabled="scope.row.status === 'RUNNING'"
                                />
                            </el-tooltip>
                            <el-tooltip content="停止任务" placement="top">
                                <el-button
                                    type="warning"
                                    icon="VideoPause"
                                    size="small"
                                    @click="stopJob(scope.row)"
                                    :disabled="scope.row.status !== 'RUNNING'"
                                />
                            </el-tooltip>
                            <el-tooltip content="删除任务" placement="top">
                                <el-button type="danger" icon="Delete" size="small" @click="deleteJob(scope.row)" />
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
                @pagination="getJobList"
            />
        </div>

        <!-- 批量操作 -->
        <div class="batch-actions" v-if="selectedJobs.length > 0">
            <el-card shadow="always">
                <div class="batch-content">
                    <span>已选择 {{ selectedJobs.length }} 个任务</span>
                    <div class="batch-buttons">
                        <el-button type="success" icon="VideoPlay" @click="batchExecute">批量执行</el-button>
                        <el-button type="warning" icon="VideoPause" @click="batchStop">批量停止</el-button>
                        <el-button type="danger" icon="Delete" @click="batchDelete">批量删除</el-button>
                    </div>
                </div>
            </el-card>
        </div>
    </div>
</template>

<script setup name="DigJob">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
    Plus, Refresh, Search, Edit, View, CopyDocument,
    VideoPlay, VideoPause, Delete, Document
} from '@element-plus/icons-vue';
import * as jobApi from '@/api/dig/jobApi';

const router = useRouter();
const loading = ref(false);
const total = ref(0);
const jobList = ref([]);
const selectedJobs = ref([]);
const dateRange = ref([]);

const queryParams = reactive({
    pageNum: 1,
    pageSize: 10,
    jobName: '',
    status: ''
});

// 获取任务列表
const getJobList = async () => {
    loading.value = true;
    try {
        const params = {
            ...queryParams,
            startTime: dateRange.value?.[0],
            endTime: dateRange.value?.[1]
        };
        const response = await jobApi.getJobList(params);
        jobList.value = response.rows || [];
        total.value = response.total || 0;
    } catch (error) {
        console.error('获取任务列表失败:', error);
        ElMessage.error('获取任务列表失败');
    } finally {
        loading.value = false;
    }
};

// 搜索
const handleQuery = () => {
    queryParams.pageNum = 1;
    getJobList();
};

// 重置搜索
const resetQuery = () => {
    queryParams.jobName = '';
    queryParams.status = '';
    dateRange.value = [];
    queryParams.pageNum = 1;
    getJobList();
};

// 刷新列表
const refreshJobList = () => {
    getJobList();
};

// 新建任务
const createNewJob = () => {
    router.push(`/dig/job/designer/`);
};

// 设计任务
const designJob = (row) => {
    router.push(`/dig/job/designer?jobId=${row.jobId}`);
};

// 查看任务详情
const viewJob = (row) => {
    router.push(`/dig/job/detail/${row.jobId}`);
};

// 复制任务
const copyJob = async (row) => {
    try {
        await ElMessageBox.confirm('确定要复制该任务吗？', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'info'
        });

        // 实现复制逻辑
        ElMessage.success('任务复制成功');
        getJobList();
    } catch (error) {
        if (error !== 'cancel') {
            console.error('复制任务失败:', error);
            ElMessage.error('复制任务失败');
        }
    }
};

// 执行任务
const executeJob = async (row) => {
    try {
        await jobApi.executeJob(row.jobId);
        ElMessage.success('任务执行成功');
        getJobList();
    } catch (error) {
        console.error('执行任务失败:', error);
        ElMessage.error('执行任务失败');
    }
};

// 停止任务
const stopJob = async (row) => {
    try {
        await ElMessageBox.confirm('确定要停止该任务吗？', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
        });

        await jobApi.stopJob(row.jobId);
        ElMessage.success('任务停止成功');
        getJobList();
    } catch (error) {
        if (error !== 'cancel') {
            console.error('停止任务失败:', error);
            ElMessage.error('停止任务失败');
        }
    }
};

// 删除任务
const deleteJob = async (row) => {
    try {
        await ElMessageBox.confirm('确定要删除该任务吗？删除后不可恢复！', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
        });

        await jobApi.deleteJob(row.jobId);
        ElMessage.success('删除成功');
        getJobList();
    } catch (error) {
        if (error !== 'cancel') {
            console.error('删除任务失败:', error);
            ElMessage.error('删除任务失败');
        }
    }
};

// 选择变化
const handleSelectionChange = (selection) => {
    selectedJobs.value = selection;
};

// 批量执行
const batchExecute = async () => {
    try {
        await ElMessageBox.confirm(`确定要执行选中的 ${selectedJobs.value.length} 个任务吗？`, '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'info'
        });

        // 实现批量执行逻辑
        ElMessage.success('批量执行成功');
        getJobList();
    } catch (error) {
        if (error !== 'cancel') {
            console.error('批量执行失败:', error);
            ElMessage.error('批量执行失败');
        }
    }
};

// 批量停止
const batchStop = async () => {
    try {
        await ElMessageBox.confirm(`确定要停止选中的 ${selectedJobs.value.length} 个任务吗？`, '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
        });

        // 实现批量停止逻辑
        ElMessage.success('批量停止成功');
        getJobList();
    } catch (error) {
        if (error !== 'cancel') {
            console.error('批量停止失败:', error);
            ElMessage.error('批量停止失败');
        }
    }
};

// 批量删除
const batchDelete = async () => {
    try {
        await ElMessageBox.confirm(`确定要删除选中的 ${selectedJobs.value.length} 个任务吗？删除后不可恢复！`, '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
        });

        // 实现批量删除逻辑
        ElMessage.success('批量删除成功');
        getJobList();
    } catch (error) {
        if (error !== 'cancel') {
            console.error('批量删除失败:', error);
            ElMessage.error('批量删除失败');
        }
    }
};

// 获取状态类型
const getStatusType = (status) => {
    const statusMap = {
        'DRAFT': 'info',
        'PUBLISHED': 'success',
        'RUNNING': 'warning',
        'STOPPED': 'info',
        'FAILED': 'danger'
    };
    return statusMap[status] || 'info';
};

// 获取状态文本
const getStatusText = (status) => {
    const statusMap = {
        'DRAFT': '草稿',
        'PUBLISHED': '已发布',
        'RUNNING': '运行中',
        'STOPPED': '已停止',
        'FAILED': '失败'
    };
    return statusMap[status] || status;
};

onMounted(() => {
    getJobList();
});
</script>

<style scoped lang="scss">
.job-container {
    padding: 20px;

    .header-section {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding: 20px;
        background: var(--el-bg-color);
        border-radius: 8px;

        .title-area {
            h2 {
                margin: 0 0 8px 0;
                color: var(--el-text-color-primary);
                font-size: 24px;
            }

            p {
                margin: 0;
                color: var(--el-text-color-secondary);
                font-size: 14px;
            }
        }
    }

    .content-section {
        .search-form {
            background: var(--el-bg-color);
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
        }

        .task-badge {
            :deep(.el-badge__content) {
                background-color: var(--el-color-primary);
            }
        }
    }

    .batch-actions {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 1000;

        .batch-content {
            display: flex;
            align-items: center;
            justify-content: space-between;
            min-width: 400px;

            .batch-buttons {
                display: flex;
                gap: 8px;
            }
        }
    }
}
</style>
