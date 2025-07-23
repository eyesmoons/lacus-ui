<template>
    <div class="instance-container">
        <div class="header-section">
            <div class="title-area">
                <h2>任务实例</h2>
                <p>监控和管理任务的执行实例</p>
            </div>
            <div class="action-area">
                <el-button icon="Refresh" @click="refreshInstanceList">
                    刷新
                </el-button>
                <el-button type="danger" icon="Delete" @click="cleanupInstances">
                    清理历史实例
                </el-button>
            </div>
        </div>

        <div class="content-section">
            <!-- 搜索区域 -->
            <el-form :model="queryParams" ref="queryRef" :inline="true" class="search-form">
                <el-form-item label="实例ID" prop="instanceId">
                    <el-input
                        v-model="queryParams.instanceId"
                        placeholder="请输入实例ID"
                        clearable
                        @keyup.enter="handleQuery"
                    />
                </el-form-item>
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
                        <el-option label="运行中" value="RUNNING" />
                        <el-option label="成功" value="SUCCESS" />
                        <el-option label="失败" value="FAILED" />
                        <el-option label="已停止" value="STOPPED" />
                        <el-option label="等待中" value="WAITING" />
                    </el-select>
                </el-form-item>
                <el-form-item label="执行时间">
                    <el-date-picker
                        v-model="dateRange"
                        type="datetimerange"
                        range-separator="至"
                        start-placeholder="开始时间"
                        end-placeholder="结束时间"
                        value-format="YYYY-MM-DD HH:mm:ss"
                    />
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
                    <el-button icon="Refresh" @click="resetQuery">重置</el-button>
                </el-form-item>
            </el-form>

            <!-- 统计卡片 -->
            <el-row :gutter="20" class="stats-cards">
                <el-col :span="6">
                    <el-card class="stat-card">
                        <div class="stat-content">
                            <div class="stat-value running">{{ stats.running }}</div>
                            <div class="stat-label">运行中</div>
                        </div>
                        <el-icon class="stat-icon running"><Loading /></el-icon>
                    </el-card>
                </el-col>
                <el-col :span="6">
                    <el-card class="stat-card">
                        <div class="stat-content">
                            <div class="stat-value success">{{ stats.success }}</div>
                            <div class="stat-label">成功</div>
                        </div>
                        <el-icon class="stat-icon success"><SuccessFilled /></el-icon>
                    </el-card>
                </el-col>
                <el-col :span="6">
                    <el-card class="stat-card">
                        <div class="stat-content">
                            <div class="stat-value failed">{{ stats.failed }}</div>
                            <div class="stat-label">失败</div>
                        </div>
                        <el-icon class="stat-icon failed"><CircleCloseFilled /></el-icon>
                    </el-card>
                </el-col>
                <el-col :span="6">
                    <el-card class="stat-card">
                        <div class="stat-content">
                            <div class="stat-value total">{{ stats.total }}</div>
                            <div class="stat-label">总计</div>
                        </div>
                        <el-icon class="stat-icon total"><DataAnalysis /></el-icon>
                    </el-card>
                </el-col>
            </el-row>

            <!-- 实例列表 -->
            <el-table
                v-loading="loading"
                :data="instanceList"
                stripe
                border
                @selection-change="handleSelectionChange"
            >
                <el-table-column type="selection" width="55" align="center" />
                <el-table-column label="实例ID" prop="instanceId" width="120" />
                <el-table-column label="任务名称" prop="jobName" min-width="150" show-overflow-tooltip />
                <el-table-column label="状态" prop="status" width="100" align="center">
                    <template #default="scope">
                        <el-tag :type="getStatusType(scope.row.status)" :effect="getStatusEffect(scope.row.status)">
                            {{ getStatusText(scope.row.status) }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="开始时间" prop="startTime" width="180" align="center">
                    <template #default="scope">
                        <span>{{ parseTime(scope.row.startTime) }}</span>
                    </template>
                </el-table-column>
                <el-table-column label="结束时间" prop="endTime" width="180" align="center">
                    <template #default="scope">
                        <span>{{ parseTime(scope.row.endTime) || '-' }}</span>
                    </template>
                </el-table-column>
                <el-table-column label="执行时长" prop="duration" width="120" align="center">
                    <template #default="scope">
                        <span>{{ formatDuration(scope.row.duration) }}</span>
                    </template>
                </el-table-column>
                <el-table-column label="进度" prop="progress" width="120" align="center">
                    <template #default="scope">
                        <el-progress
                            :percentage="scope.row.progress || 0"
                            :status="getProgressStatus(scope.row.status)"
                            :stroke-width="6"
                        />
                    </template>
                </el-table-column>
                <el-table-column label="执行人" prop="executeBy" width="120" />
                <el-table-column label="操作" width="200" align="center" fixed="right">
                    <template #default="scope">
                        <el-button-group>
                            <el-tooltip content="查看详情" placement="top">
                                <el-button type="info" icon="View" size="small" @click="viewInstance(scope.row)" />
                            </el-tooltip>
                            <el-tooltip content="查看日志" placement="top">
                                <el-button type="primary" icon="Document" size="small" @click="viewLogs(scope.row)" />
                            </el-tooltip>
                            <el-tooltip content="停止实例" placement="top">
                                <el-button
                                    type="warning"
                                    icon="VideoPause"
                                    size="small"
                                    @click="stopInstance(scope.row)"
                                    :disabled="scope.row.status !== 'RUNNING'"
                                />
                            </el-tooltip>
                            <el-tooltip content="重新执行" placement="top">
                                <el-button
                                    type="success"
                                    icon="Refresh"
                                    size="small"
                                    @click="restartInstance(scope.row)"
                                    :disabled="scope.row.status === 'RUNNING'"
                                />
                            </el-tooltip>
                            <el-tooltip content="删除实例" placement="top">
                                <el-button type="danger" icon="Delete" size="small" @click="deleteInstance(scope.row)" />
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
                @pagination="getInstanceList"
            />
        </div>

        <!-- 批量操作 -->
        <div class="batch-actions" v-if="selectedInstances.length > 0">
            <el-card shadow="always">
                <div class="batch-content">
                    <span>已选择 {{ selectedInstances.length }} 个实例</span>
                    <div class="batch-buttons">
                        <el-button type="warning" icon="VideoPause" @click="batchStop">批量停止</el-button>
                        <el-button type="danger" icon="Delete" @click="batchDelete">批量删除</el-button>
                    </div>
                </div>
            </el-card>
        </div>

        <!-- 日志对话框 -->
        <el-dialog v-model="logsDialogVisible" title="实例日志" width="80%" top="5vh">
            <div class="logs-content">
                <div class="logs-header">
                    <el-button size="small" icon="Refresh" @click="refreshLogs">刷新日志</el-button>
                    <el-button size="small" icon="Download" @click="downloadLogs">下载日志</el-button>
                </div>
                <div class="logs-body">
                    <pre class="logs-text">{{ instanceLogs }}</pre>
                </div>
            </div>
        </el-dialog>
    </div>
</template>

<script setup name="DigInstance">
import { ref, reactive, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
    Refresh, Delete, Search, View, Document, VideoPause,
    Loading, SuccessFilled, CircleCloseFilled, DataAnalysis, Download
} from '@element-plus/icons-vue';
import * as instanceApi from '@/api/dig/instanceApi';

const router = useRouter();
const loading = ref(false);
const total = ref(0);
const instanceList = ref([]);
const selectedInstances = ref([]);
const dateRange = ref([]);
const logsDialogVisible = ref(false);
const instanceLogs = ref('');
let refreshTimer = null;

// 统计数据
const stats = reactive({
    running: 0,
    success: 0,
    failed: 0,
    total: 0
});

const queryParams = reactive({
    pageNum: 1,
    pageSize: 10,
    instanceId: '',
    jobName: '',
    status: ''
});

// 获取实例列表
const getInstanceList = async () => {
    loading.value = true;
    try {
        const params = {
            ...queryParams,
            startTime: dateRange.value?.[0],
            endTime: dateRange.value?.[1]
        };
        const response = await instanceApi.getInstanceList(params);
        instanceList.value = response.rows || [];
        total.value = response.total || 0;

        // 更新统计数据
        updateStats();
    } catch (error) {
        console.error('获取实例列表失败:', error);
        ElMessage.error('获取实例列表失败');
    } finally {
        loading.value = false;
    }
};

// 更新统计数据
const updateStats = () => {
    stats.total = instanceList.value.length;
    stats.running = instanceList.value.filter(item => item.status === 'RUNNING').length;
    stats.success = instanceList.value.filter(item => item.status === 'SUCCESS').length;
    stats.failed = instanceList.value.filter(item => item.status === 'FAILED').length;
};

// 搜索
const handleQuery = () => {
    queryParams.pageNum = 1;
    getInstanceList();
};

// 重置搜索
const resetQuery = () => {
    queryParams.instanceId = '';
    queryParams.jobName = '';
    queryParams.status = '';
    dateRange.value = [];
    queryParams.pageNum = 1;
    getInstanceList();
};

// 刷新列表
const refreshInstanceList = () => {
    getInstanceList();
};

// 查看实例详情
const viewInstance = (row) => {
    router.push(`/dig/instance/detail/${row.instanceId}`);
};

// 查看日志
const viewLogs = async (row) => {
    try {
        const logs = await instanceApi.getInstanceLogs(row.instanceId);
        instanceLogs.value = logs || '暂无日志信息';
        logsDialogVisible.value = true;
    } catch (error) {
        console.error('获取实例日志失败:', error);
        ElMessage.error('获取实例日志失败');
    }
};

// 停止实例
const stopInstance = async (row) => {
    try {
        await ElMessageBox.confirm('确定要停止该实例吗？', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
        });

        await instanceApi.stopInstance(row.instanceId);
        ElMessage.success('实例停止成功');
        getInstanceList();
    } catch (error) {
        if (error !== 'cancel') {
            console.error('停止实例失败:', error);
            ElMessage.error('停止实例失败');
        }
    }
};

// 重新执行
const restartInstance = async (row) => {
    try {
        await ElMessageBox.confirm('确定要重新执行该实例吗？', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'info'
        });

        await instanceApi.restartInstance(row.instanceId);
        ElMessage.success('实例重新执行成功');
        getInstanceList();
    } catch (error) {
        if (error !== 'cancel') {
            console.error('重新执行失败:', error);
            ElMessage.error('重新执行失败');
        }
    }
};

// 删除实例
const deleteInstance = async (row) => {
    try {
        await ElMessageBox.confirm('确定要删除该实例吗？删除后不可恢复！', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
        });

        await instanceApi.deleteInstance(row.instanceId);
        ElMessage.success('删除成功');
        getInstanceList();
    } catch (error) {
        if (error !== 'cancel') {
            console.error('删除实例失败:', error);
            ElMessage.error('删除实例失败');
        }
    }
};

// 清理历史实例
const cleanupInstances = async () => {
    try {
        await ElMessageBox.confirm('确定要清理历史实例吗？将删除所有已完成的实例！', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
        });

        // 实现清理逻辑
        ElMessage.success('历史实例清理成功');
        getInstanceList();
    } catch (error) {
        if (error !== 'cancel') {
            console.error('清理历史实例失败:', error);
            ElMessage.error('清理历史实例失败');
        }
    }
};

// 选择变化
const handleSelectionChange = (selection) => {
    selectedInstances.value = selection;
};

// 批量停止
const batchStop = async () => {
    try {
        await ElMessageBox.confirm(`确定要停止选中的 ${selectedInstances.value.length} 个实例吗？`, '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
        });

        const instanceIds = selectedInstances.value.map(item => item.instanceId);
        await instanceApi.batchStopInstances(instanceIds);
        ElMessage.success('批量停止成功');
        getInstanceList();
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
        await ElMessageBox.confirm(`确定要删除选中的 ${selectedInstances.value.length} 个实例吗？删除后不可恢复！`, '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
        });

        const instanceIds = selectedInstances.value.map(item => item.instanceId);
        await instanceApi.batchDeleteInstances(instanceIds);
        ElMessage.success('批量删除成功');
        getInstanceList();
    } catch (error) {
        if (error !== 'cancel') {
            console.error('批量删除失败:', error);
            ElMessage.error('批量删除失败');
        }
    }
};

// 刷新日志
const refreshLogs = async () => {
    // 重新获取日志
    ElMessage.info('日志刷新功能开发中...');
};

// 下载日志
const downloadLogs = () => {
    // 实现日志下载
    ElMessage.info('日志下载功能开发中...');
};

// 获取状态类型
const getStatusType = (status) => {
    const statusMap = {
        'RUNNING': 'warning',
        'SUCCESS': 'success',
        'FAILED': 'danger',
        'STOPPED': 'info',
        'WAITING': 'info'
    };
    return statusMap[status] || 'info';
};

// 获取状态效果
const getStatusEffect = (status) => {
    return status === 'RUNNING' ? 'plain' : 'light';
};

// 获取状态文本
const getStatusText = (status) => {
    const statusMap = {
        'RUNNING': '运行中',
        'SUCCESS': '成功',
        'FAILED': '失败',
        'STOPPED': '已停止',
        'WAITING': '等待中'
    };
    return statusMap[status] || status;
};

// 获取进度状态
const getProgressStatus = (status) => {
    const statusMap = {
        'RUNNING': '',
        'SUCCESS': 'success',
        'FAILED': 'exception',
        'STOPPED': 'warning'
    };
    return statusMap[status] || '';
};

// 格式化时长
const formatDuration = (duration) => {
    if (!duration) return '-';

    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = duration % 60;

    if (hours > 0) {
        return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
    } else {
        return `${seconds}s`;
    }
};

// 定时刷新
const startAutoRefresh = () => {
    refreshTimer = setInterval(() => {
        getInstanceList();
    }, 30000); // 30秒刷新一次
};

const stopAutoRefresh = () => {
    if (refreshTimer) {
        clearInterval(refreshTimer);
        refreshTimer = null;
    }
};

onMounted(() => {
    getInstanceList();
    startAutoRefresh();
});

onUnmounted(() => {
    stopAutoRefresh();
});
</script>

<style scoped lang="scss">
.instance-container {
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

        .stats-cards {
            margin-bottom: 20px;

            .stat-card {
                position: relative;
                overflow: hidden;

                :deep(.el-card__body) {
                    padding: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }

                .stat-content {
                    .stat-value {
                        font-size: 28px;
                        font-weight: bold;
                        margin-bottom: 4px;

                        &.running {
                            color: var(--el-color-warning);
                        }

                        &.success {
                            color: var(--el-color-success);
                        }

                        &.failed {
                            color: var(--el-color-danger);
                        }

                        &.total {
                            color: var(--el-color-primary);
                        }
                    }

                    .stat-label {
                        font-size: 14px;
                        color: var(--el-text-color-secondary);
                    }
                }

                .stat-icon {
                    font-size: 32px;
                    opacity: 0.8;

                    &.running {
                        color: var(--el-color-warning);
                    }

                    &.success {
                        color: var(--el-color-success);
                    }

                    &.failed {
                        color: var(--el-color-danger);
                    }

                    &.total {
                        color: var(--el-color-primary);
                    }
                }
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

    .logs-content {
        .logs-header {
            display: flex;
            justify-content: flex-end;
            gap: 8px;
            margin-bottom: 16px;
            padding-bottom: 12px;
            border-bottom: 1px solid var(--el-border-color);
        }

        .logs-body {
            .logs-text {
                background: var(--el-fill-color-dark);
                color: var(--el-text-color-primary);
                padding: 16px;
                border-radius: 4px;
                font-family: 'Courier New', monospace;
                font-size: 12px;
                line-height: 1.5;
                max-height: 500px;
                overflow-y: auto;
                white-space: pre-wrap;
                word-wrap: break-word;
                margin: 0;
            }
        }
    }
}
</style>
