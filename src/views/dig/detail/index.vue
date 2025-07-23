<template>
    <div class="job-detail-container">
        <!-- 头部信息 -->
        <div class="detail-header">
            <div class="header-left">
                <el-button icon="Back" @click="goBack">返回</el-button>
                <el-divider direction="vertical" />
                <div class="job-info">
                    <h2>{{ jobDetail.jobName }}</h2>
                    <div class="job-meta">
                        <el-tag :type="getStatusType(jobDetail.status)">
                            {{ getStatusText(jobDetail.status) }}
                        </el-tag>
                        <span class="meta-item">作业ID: {{ jobDetail.jobId }}</span>
                        <span class="meta-item">创建时间: {{ parseTime(jobDetail.createTime) }}</span>
                    </div>
                </div>
            </div>
            <div class="header-right">
                <el-button icon="Edit" @click="editJob">编辑</el-button>
                <el-button
                    type="success"
                    icon="VideoPlay"
                    @click="executeJob"
                    :disabled="jobDetail.status === 'RUNNING'"
                >
                    执行
                </el-button>
                <el-button
                    type="warning"
                    icon="VideoPause"
                    @click="stopJob"
                    :disabled="jobDetail.status !== 'RUNNING'"
                >
                    停止
                </el-button>
            </div>
        </div>

        <!-- 内容区域 -->
        <div class="detail-content">
            <el-tabs v-model="activeTab" type="border-card">
                <!-- 作业概览 -->
                <el-tab-pane label="作业概览" name="overview">
                    <div class="overview-content">
                        <el-row :gutter="20">
                            <el-col :span="16">
                                <!-- 作业流程图 -->
                                <el-card title="作业流程" class="flow-card">
                                    <div class="flow-diagram">
                                        <div
                                            v-for="task in jobDetail.plugins"
                                            :key="task.taskId"
                                            class="flow-node"
                                            :class="getNodeClass(task.connectorType)"
                                        >
                                            <div class="node-icon">
                                                <el-icon>
                                                    <component :is="getNodeIcon(task.connectorType)" />
                                                </el-icon>
                                            </div>
                                            <div class="node-info">
                                                <div class="node-name">{{ task.taskName }}</div>
                                                <div class="node-type">{{ task.connectorName }}</div>
                                            </div>
                                            <div class="node-status">
                                                <el-tag size="small" :type="getTaskStatusType(task.status)">
                                                    {{ getTaskStatusText(task.status) }}
                                                </el-tag>
                                            </div>
                                        </div>

                                        <!-- 连接线 -->
                                        <div class="flow-connections">
                                            <div
                                                v-for="edge in jobDetail.edges"
                                                :key="`${edge.sourceTaskId}-${edge.sinkTaskId}`"
                                                class="connection-line"
                                            >
                                                <el-icon><Right /></el-icon>
                                            </div>
                                        </div>
                                    </div>
                                </el-card>
                            </el-col>

                            <el-col :span="8">
                                <!-- 基本信息 -->
                                <el-card title="基本信息" class="info-card">
                                    <div class="info-item">
                                        <span class="label">作业名称:</span>
                                        <span class="value">{{ jobDetail.jobName }}</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="label">作业描述:</span>
                                        <span class="value">{{ jobDetail.description || '暂无描述' }}</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="label">任务数量:</span>
                                        <span class="value">{{ jobDetail.plugins?.length || 0 }}</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="label">连接数量:</span>
                                        <span class="value">{{ jobDetail.edges?.length || 0 }}</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="label">创建时间:</span>
                                        <span class="value">{{ parseTime(jobDetail.createTime) }}</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="label">更新时间:</span>
                                        <span class="value">{{ parseTime(jobDetail.updateTime) }}</span>
                                    </div>
                                </el-card>

                                <!-- 执行统计 -->
                                <el-card title="执行统计" class="stats-card">
                                    <div class="stats-grid">
                                        <div class="stat-item">
                                            <div class="stat-value">{{ executionStats.totalRuns }}</div>
                                            <div class="stat-label">总执行次数</div>
                                        </div>
                                        <div class="stat-item">
                                            <div class="stat-value success">{{ executionStats.successRuns }}</div>
                                            <div class="stat-label">成功次数</div>
                                        </div>
                                        <div class="stat-item">
                                            <div class="stat-value error">{{ executionStats.failedRuns }}</div>
                                            <div class="stat-label">失败次数</div>
                                        </div>
                                        <div class="stat-item">
                                            <div class="stat-value">{{ executionStats.avgDuration }}s</div>
                                            <div class="stat-label">平均耗时</div>
                                        </div>
                                    </div>
                                </el-card>
                            </el-col>
                        </el-row>
                    </div>
                </el-tab-pane>

                <!-- 任务配置 -->
                <el-tab-pane label="任务配置" name="tasks">
                    <div class="tasks-content">
                        <el-table :data="jobDetail.plugins" stripe border>
                            <el-table-column prop="taskId" label="任务ID" width="80" />
                            <el-table-column prop="taskName" label="任务名称" min-width="150" />
                            <el-table-column prop="connectorType" label="类型" width="100">
                                <template #default="scope">
                                    <el-tag :type="getConnectorTypeColor(scope.row.connectorType)">
                                        {{ scope.row.connectorType }}
                                    </el-tag>
                                </template>
                            </el-table-column>
                            <el-table-column prop="connectorName" label="连接器" min-width="120" />
                            <el-table-column prop="datasourceId" label="数据源ID" width="100" />
                            <el-table-column label="配置" width="100" align="center">
                                <template #default="scope">
                                    <el-button
                                        type="text"
                                        size="small"
                                        @click="viewTaskConfig(scope.row)"
                                    >
                                        查看配置
                                    </el-button>
                                </template>
                            </el-table-column>
                        </el-table>
                    </div>
                </el-tab-pane>

                <!-- 执行历史 -->
                <el-tab-pane label="执行历史" name="history">
                    <div class="history-content">
                        <el-table :data="executionHistory" stripe border v-loading="historyLoading">
                            <el-table-column prop="executionId" label="执行ID" width="100" />
                            <el-table-column prop="startTime" label="开始时间" width="180">
                                <template #default="scope">
                                    <span>{{ parseTime(scope.row.startTime) }}</span>
                                </template>
                            </el-table-column>
                            <el-table-column prop="endTime" label="结束时间" width="180">
                                <template #default="scope">
                                    <span>{{ parseTime(scope.row.endTime) }}</span>
                                </template>
                            </el-table-column>
                            <el-table-column prop="duration" label="耗时" width="100">
                                <template #default="scope">
                                    <span>{{ scope.row.duration }}s</span>
                                </template>
                            </el-table-column>
                            <el-table-column prop="status" label="状态" width="100" align="center">
                                <template #default="scope">
                                    <el-tag :type="getStatusType(scope.row.status)">
                                        {{ getStatusText(scope.row.status) }}
                                    </el-tag>
                                </template>
                            </el-table-column>
                            <el-table-column label="操作" width="150" align="center">
                                <template #default="scope">
                                    <el-button
                                        type="text"
                                        size="small"
                                        @click="viewExecutionLogs(scope.row)"
                                    >
                                        查看日志
                                    </el-button>
                                </template>
                            </el-table-column>
                        </el-table>

                        <pagination
                            v-show="historyTotal > 0"
                            :total="historyTotal"
                            v-model:page="historyQuery.pageNum"
                            v-model:limit="historyQuery.pageSize"
                            @pagination="getExecutionHistory"
                        />
                    </div>
                </el-tab-pane>

                <!-- 监控指标 -->
                <el-tab-pane label="监控指标" name="metrics">
                    <div class="metrics-content">
                        <el-row :gutter="20">
                            <el-col :span="12">
                                <el-card title="吞吐量趋势">
                                    <div id="throughputChart" style="height: 300px;"></div>
                                </el-card>
                            </el-col>
                            <el-col :span="12">
                                <el-card title="延迟趋势">
                                    <div id="latencyChart" style="height: 300px;"></div>
                                </el-card>
                            </el-col>
                        </el-row>

                        <el-row :gutter="20" style="margin-top: 20px;">
                            <el-col :span="24">
                                <el-card title="资源使用情况">
                                    <div id="resourceChart" style="height: 300px;"></div>
                                </el-card>
                            </el-col>
                        </el-row>
                    </div>
                </el-tab-pane>
            </el-tabs>
        </div>

        <!-- 任务配置对话框 -->
        <el-dialog v-model="configDialogVisible" title="任务配置" width="60%" top="5vh">
            <monaco-editor
                v-model="selectedTaskConfig"
                language="json"
                :height="400"
                :options="{ readOnly: true }"
            />
        </el-dialog>

        <!-- 执行日志对话框 -->
        <el-dialog v-model="logsDialogVisible" title="执行日志" width="80%" top="5vh">
            <div class="logs-content">
                <pre class="logs-text">{{ executionLogs }}</pre>
            </div>
        </el-dialog>
    </div>
</template>

<script setup name="SeaTunnelDetail">
import { ref, reactive, onMounted, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import {
    Back, Edit, VideoPlay, VideoPause, Right,
    Database, Operation, Upload
} from '@element-plus/icons-vue';
import * as taskApi from '@/api/dig/taskApi';
import MonacoEditor from '@/components/MonacoEditor/index.vue';
import * as echarts from 'echarts';

const route = useRoute();
const router = useRouter();

// 响应式数据
const activeTab = ref('overview');
const jobDetail = ref({});
const executionStats = ref({
    totalRuns: 0,
    successRuns: 0,
    failedRuns: 0,
    avgDuration: 0
});
const executionHistory = ref([]);
const historyLoading = ref(false);
const historyTotal = ref(0);
const configDialogVisible = ref(false);
const logsDialogVisible = ref(false);
const selectedTaskConfig = ref('');
const executionLogs = ref('');

const historyQuery = reactive({
    pageNum: 1,
    pageSize: 10
});

// 初始化
onMounted(async () => {
    const jobId = route.params.jobId;
    if (jobId) {
        await loadJobDetail(jobId);
        await getExecutionHistory();
    }
});

// 加载作业详情
const loadJobDetail = async (jobId) => {
    try {
        const detail = await taskApi.getJobTaskInfo(jobId);
        jobDetail.value = detail;

        // 模拟执行统计数据
        executionStats.value = {
            totalRuns: 25,
            successRuns: 22,
            failedRuns: 3,
            avgDuration: 45.6
        };
    } catch (error) {
        console.error('加载作业详情失败:', error);
        ElMessage.error('加载作业详情失败');
    }
};

// 获取执行历史
const getExecutionHistory = async () => {
    historyLoading.value = true;
    try {
        // 模拟执行历史数据
        const mockHistory = [
            {
                executionId: 'exec_001',
                startTime: new Date(Date.now() - 3600000),
                endTime: new Date(Date.now() - 3500000),
                duration: 100,
                status: 'SUCCESS'
            },
            {
                executionId: 'exec_002',
                startTime: new Date(Date.now() - 7200000),
                endTime: new Date(Date.now() - 7100000),
                duration: 100,
                status: 'FAILED'
            }
        ];

        executionHistory.value = mockHistory;
        historyTotal.value = mockHistory.length;
    } catch (error) {
        console.error('获取执行历史失败:', error);
        ElMessage.error('获取执行历史失败');
    } finally {
        historyLoading.value = false;
    }
};

// 返回
const goBack = () => {
    router.push('/seatunnel');
};

// 编辑作业
const editJob = () => {
    router.push(`/seatunnel/designer?jobId=${jobDetail.value.jobId}`);
};

// 执行作业
const executeJob = async () => {
    try {
        await taskApi.executeTask(jobDetail.value.jobId);
        ElMessage.success('作业执行成功');
        await loadJobDetail(jobDetail.value.jobId);
    } catch (error) {
        console.error('执行作业失败:', error);
        ElMessage.error('执行作业失败');
    }
};

// 停止作业
const stopJob = async () => {
    try {
        await taskApi.stopTask(jobDetail.value.jobId);
        ElMessage.success('作业停止成功');
        await loadJobDetail(jobDetail.value.jobId);
    } catch (error) {
        console.error('停止作业失败:', error);
        ElMessage.error('停止作业失败');
    }
};

// 查看任务配置
const viewTaskConfig = (task) => {
    selectedTaskConfig.value = JSON.stringify(task, null, 2);
    configDialogVisible.value = true;
};

// 查看执行日志
const viewExecutionLogs = async (execution) => {
    try {
        const logs = await taskApi.getTaskLogs(execution.executionId);
        executionLogs.value = logs || '暂无日志信息';
        logsDialogVisible.value = true;
    } catch (error) {
        console.error('获取执行日志失败:', error);
        ElMessage.error('获取执行日志失败');
    }
};

// 获取状态类型
const getStatusType = (status) => {
    const statusMap = {
        'RUNNING': 'success',
        'STOPPED': 'info',
        'FAILED': 'danger',
        'SUCCESS': 'success',
        'FINISHED': 'success'
    };
    return statusMap[status] || 'info';
};

// 获取状态文本
const getStatusText = (status) => {
    const statusMap = {
        'RUNNING': '运行中',
        'STOPPED': '已停止',
        'FAILED': '失败',
        'SUCCESS': '成功',
        'FINISHED': '完成'
    };
    return statusMap[status] || status;
};

// 获取节点图标
const getNodeIcon = (type) => {
    const iconMap = {
        'SOURCE': Database,
        'TRANSFORM': Operation,
        'SINK': Upload
    };
    return iconMap[type] || Database;
};

// 获取节点样式类
const getNodeClass = (type) => {
    return `node-${type.toLowerCase()}`;
};

// 获取任务状态类型
const getTaskStatusType = (status) => {
    return getStatusType(status);
};

// 获取任务状态文本
const getTaskStatusText = (status) => {
    return getStatusText(status);
};

// 获取连接器类型颜色
const getConnectorTypeColor = (type) => {
    const colorMap = {
        'SOURCE': 'success',
        'TRANSFORM': 'warning',
        'SINK': 'danger'
    };
    return colorMap[type] || 'info';
};
</script>

<style scoped lang="scss">
.job-detail-container {
    padding: 20px;

    .detail-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding: 20px;
        background: var(--el-bg-color);
        border-radius: 8px;

        .header-left {
            display: flex;
            align-items: center;

            .job-info {
                margin-left: 16px;

                h2 {
                    margin: 0 0 8px 0;
                    color: var(--el-text-color-primary);
                    font-size: 24px;
                }

                .job-meta {
                    display: flex;
                    align-items: center;
                    gap: 16px;

                    .meta-item {
                        font-size: 14px;
                        color: var(--el-text-color-secondary);
                    }
                }
            }
        }
    }

    .detail-content {
        .overview-content {
            .flow-card {
                margin-bottom: 20px;

                .flow-diagram {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                    padding: 20px;
                    overflow-x: auto;

                    .flow-node {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        padding: 16px;
                        background: var(--el-fill-color-light);
                        border-radius: 8px;
                        min-width: 120px;

                        &.node-source {
                            border-left: 4px solid var(--el-color-success);
                        }

                        &.node-transform {
                            border-left: 4px solid var(--el-color-warning);
                        }

                        &.node-sink {
                            border-left: 4px solid var(--el-color-danger);
                        }

                        .node-icon {
                            margin-bottom: 8px;

                            .el-icon {
                                font-size: 24px;
                                color: var(--el-color-primary);
                            }
                        }

                        .node-info {
                            text-align: center;
                            margin-bottom: 8px;

                            .node-name {
                                font-size: 14px;
                                font-weight: 500;
                                color: var(--el-text-color-primary);
                                margin-bottom: 4px;
                            }

                            .node-type {
                                font-size: 12px;
                                color: var(--el-text-color-secondary);
                            }
                        }
                    }

                    .flow-connections {
                        .connection-line {
                            display: flex;
                            align-items: center;
                            color: var(--el-color-primary);

                            .el-icon {
                                font-size: 20px;
                            }
                        }
                    }
                }
            }

            .info-card, .stats-card {
                height: fit-content;

                .info-item {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 12px;

                    .label {
                        font-weight: 500;
                        color: var(--el-text-color-regular);
                    }

                    .value {
                        color: var(--el-text-color-primary);
                    }
                }

                .stats-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 16px;

                    .stat-item {
                        text-align: center;

                        .stat-value {
                            font-size: 24px;
                            font-weight: bold;
                            color: var(--el-text-color-primary);
                            margin-bottom: 4px;

                            &.success {
                                color: var(--el-color-success);
                            }

                            &.error {
                                color: var(--el-color-danger);
                            }
                        }

                        .stat-label {
                            font-size: 12px;
                            color: var(--el-text-color-secondary);
                        }
                    }
                }
            }
        }

        .tasks-content, .history-content, .metrics-content {
            padding: 20px;
        }

        .logs-content {
            .logs-text {
                background: var(--el-fill-color-dark);
                color: var(--el-text-color-primary);
                padding: 16px;
                border-radius: 4px;
                font-family: 'Courier New', monospace;
                font-size: 12px;
                line-height: 1.5;
                max-height: 400px;
                overflow-y: auto;
                white-space: pre-wrap;
                word-wrap: break-word;
            }
        }
    }
}
</style>
