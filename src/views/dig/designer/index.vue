<template>
    <div class="designer-container">
        <!-- 工具栏 -->
        <div class="toolbar">
            <div class="toolbar-left">
                <el-button icon="Back" @click="goBack">返回</el-button>
                <el-divider direction="vertical" />
                <span class="job-title">{{ jobInfo.jobName || '新建作业' }}</span>
            </div>
            <div class="toolbar-right">
                <el-button icon="View" @click="previewConfig">预览配置</el-button>
                <el-button icon="Check" @click="validateConfig">验证配置</el-button>
                <el-button type="primary" icon="Document" @click="saveJob">保存</el-button>
                <el-button type="success" icon="VideoPlay" @click="executeJob">执行</el-button>
            </div>
        </div>

        <div class="designer-content">
            <!-- 左侧组件面板 -->
            <div class="component-panel">
                <div class="panel-header">
                    <h3>组件库</h3>
                </div>
                <div class="panel-content">
                    <!-- Source 组件 -->
                    <div class="component-group">
                        <div class="group-title">
                            <el-icon><Download /></el-icon>
                            <span>数据源 (Source)</span>
                        </div>
                        <div class="component-list">
                            <div
                                v-for="source in sourceConnectors"
                                :key="source.pluginIdentifier.pluginName"
                                class="component-item"
                                draggable="true"
                                @dragstart="handleDragStart($event, 'SOURCE', source)"
                            >
                                <el-icon><Database /></el-icon>
                                <span>{{ source.pluginIdentifier.pluginName }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Transform 组件 -->
                    <div class="component-group">
                        <div class="group-title">
                            <el-icon><Operation /></el-icon>
                            <span>数据转换 (Transform)</span>
                        </div>
                        <div class="component-list">
                            <div
                                v-for="transform in transformConnectors"
                                :key="transform.pluginIdentifier.pluginName"
                                class="component-item"
                                draggable="true"
                                @dragstart="handleDragStart($event, 'TRANSFORM', transform)"
                            >
                                <el-icon><Operation /></el-icon>
                                <span>{{ transform.pluginIdentifier.pluginName }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Sink 组件 -->
                    <div class="component-group">
                        <div class="group-title">
                            <el-icon><Upload /></el-icon>
                            <span>数据目标 (Sink)</span>
                        </div>
                        <div class="component-list">
                            <div
                                v-for="sink in sinkConnectors"
                                :key="sink.pluginIdentifier.pluginName"
                                class="component-item"
                                draggable="true"
                                @dragstart="handleDragStart($event, 'SINK', sink)"
                            >
                                <el-icon><Upload /></el-icon>
                                <span>{{ sink.pluginIdentifier.pluginName }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 中间画布区域 -->
            <div class="canvas-area">
                <div class="canvas-header">
                    <h3>作业设计器</h3>
                    <div class="canvas-actions">
                        <el-button size="small" icon="ZoomIn" @click="zoomIn">放大</el-button>
                        <el-button size="small" icon="ZoomOut" @click="zoomOut">缩小</el-button>
                        <el-button size="small" icon="Refresh" @click="resetCanvas">重置</el-button>
                    </div>
                </div>
                <div
                    class="canvas-content"
                    ref="canvasRef"
                    @drop="handleDrop"
                    @dragover="handleDragOver"
                    @click="clearSelection"
                >
                    <!-- 渲染任务节点 -->
                    <div
                        v-for="task in tasks"
                        :key="task.taskId"
                        class="task-node"
                        :class="{ 'selected': selectedTask?.taskId === task.taskId }"
                        :style="{
                            left: task.position.x + 'px',
                            top: task.position.y + 'px'
                        }"
                        @click.stop="selectTask(task)"
                        @mousedown="startDrag(task, $event)"
                    >
                        <div class="node-header">
                            <el-icon>
                                <component :is="getNodeIcon(task.connectorType)" />
                            </el-icon>
                            <span class="node-title">{{ task.taskName }}</span>
                            <el-button
                                size="small"
                                type="danger"
                                icon="Close"
                                @click.stop="removeTask(task)"
                                class="remove-btn"
                            />
                        </div>
                        <div class="node-content">
                            <div class="node-type">{{ task.connectorName }}</div>
                            <div class="node-status" :class="getStatusClass(task.status)">
                                {{ getStatusText(task.status) }}
                            </div>
                        </div>

                        <!-- 连接点 -->
                        <div
                            v-if="task.connectorType !== 'SINK'"
                            class="connection-point output"
                            @mousedown.stop="startConnection(task, 'output', $event)"
                        ></div>
                        <div
                            v-if="task.connectorType !== 'SOURCE'"
                            class="connection-point input"
                            @mousedown.stop="startConnection(task, 'input', $event)"
                        ></div>
                    </div>

                    <!-- 渲染连接线 -->
                    <svg class="connections-svg" :style="{ width: '100%', height: '100%' }">
                        <line
                            v-for="edge in edges"
                            :key="`${edge.sourceTaskId}-${edge.sinkTaskId}`"
                            :x1="getTaskPosition(edge.sourceTaskId).x + 150"
                            :y1="getTaskPosition(edge.sourceTaskId).y + 40"
                            :x2="getTaskPosition(edge.sinkTaskId).x"
                            :y2="getTaskPosition(edge.sinkTaskId).y + 40"
                            stroke="#409EFF"
                            stroke-width="2"
                            marker-end="url(#arrowhead)"
                        />
                        <!-- 箭头标记 -->
                        <defs>
                            <marker id="arrowhead" markerWidth="10" markerHeight="7"
                                    refX="9" refY="3.5" orient="auto">
                                <polygon points="0 0, 10 3.5, 0 7" fill="#409EFF" />
                            </marker>
                        </defs>
                    </svg>
                </div>
            </div>

            <!-- 右侧属性面板 -->
            <div class="property-panel">
                <div class="panel-header">
                    <h3>属性配置</h3>
                </div>
                <div class="panel-content">
                    <div v-if="!selectedTask" class="no-selection">
                        <el-empty description="请选择一个任务节点进行配置" />
                    </div>
                    <div v-else>
                        <task-config-form
                            :task="selectedTask"
                            @update="updateTaskConfig"
                        />
                    </div>
                </div>
            </div>
        </div>

        <!-- 配置预览对话框 -->
        <el-dialog v-model="previewVisible" title="配置预览" width="60%" top="5vh">
            <monaco-editor
                v-model="configPreview"
                language="json"
                :height="400"
                :options="{ readOnly: true }"
            />
        </el-dialog>
    </div>
</template>

<script setup name="SeaTunnelDesigner">
import { ref, reactive, onMounted, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
    Download, Upload, Operation, Database,
    ZoomIn, ZoomOut, Refresh, Back, View,
    Check, Document, VideoPlay, Close
} from '@element-plus/icons-vue';
import * as connectorApi from '@/api/dig/connectorApi';
import * as taskApi from '@/api/dig/taskApi';
import TaskConfigForm from './components/TaskConfigForm.vue';
import MonacoEditor from '@/components/MonacoEditor/index.vue';

const route = useRoute();
const router = useRouter();

// 响应式数据
const sourceConnectors = ref([]);
const transformConnectors = ref([]);
const sinkConnectors = ref([]);
const tasks = ref([]);
const edges = ref([]);
const selectedTask = ref(null);
const previewVisible = ref(false);
const configPreview = ref('');
const canvasRef = ref(null);

// 作业信息
const jobInfo = reactive({
    jobId: null,
    jobName: '',
    description: ''
});

// 拖拽相关
let draggedComponent = null;
let isDragging = false;
let dragOffset = { x: 0, y: 0 };
let taskIdCounter = 1;

// 初始化
onMounted(async () => {
    await loadConnectors();

    // 如果有 jobId，加载现有作业
    const jobId = route.query.jobId;
    if (jobId) {
        await loadJobData(jobId);
    }
});

// 加载连接器
const loadConnectors = async () => {
    try {
        const [sources, transforms, sinks] = await Promise.all([
            connectorApi.getSourceConnectors(),
            connectorApi.getTransformConnectors(),
            connectorApi.getSinkConnectors()
        ]);

        sourceConnectors.value = sources;
        transformConnectors.value = transforms;
        sinkConnectors.value = sinks;
    } catch (error) {
        console.error('加载连接器失败:', error);
        ElMessage.error('加载连接器失败');
    }
};

// 加载作业数据
const loadJobData = async (jobId) => {
    try {
        const jobData = await taskApi.getJobTaskInfo(jobId);
        jobInfo.jobId = jobId;
        jobInfo.jobName = jobData.jobName || `作业_${jobId}`;

        // 转换任务数据
        if (jobData.plugins) {
            tasks.value = jobData.plugins.map(plugin => ({
                ...plugin,
                position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
                status: 'configured'
            }));
        }

        // 转换连接数据
        if (jobData.edges) {
            edges.value = jobData.edges;
        }
    } catch (error) {
        console.error('加载作业数据失败:', error);
        ElMessage.error('加载作业数据失败');
    }
};

// 拖拽开始
const handleDragStart = (event, type, component) => {
    draggedComponent = { type, component };
    event.dataTransfer.effectAllowed = 'copy';
};

// 拖拽结束
const handleDrop = (event) => {
    event.preventDefault();

    if (!draggedComponent) return;

    const rect = canvasRef.value.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // 创建新任务
    const newTask = {
        taskId: taskIdCounter++,
        taskName: `${draggedComponent.component.pluginIdentifier.pluginName}_${taskIdCounter}`,
        jobId: jobInfo.jobId,
        connectorType: draggedComponent.type,
        connectorName: draggedComponent.component.pluginIdentifier.pluginName,
        datasourceId: null,
        taskConfig: '',
        position: { x, y },
        status: 'unconfigured'
    };

    tasks.value.push(newTask);
    draggedComponent = null;
};

const handleDragOver = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
};

// 选择任务
const selectTask = (task) => {
    selectedTask.value = task;
};

// 清除选择
const clearSelection = () => {
    selectedTask.value = null;
};

// 移除任务
const removeTask = (task) => {
    const index = tasks.value.findIndex(t => t.taskId === task.taskId);
    if (index > -1) {
        tasks.value.splice(index, 1);
        // 移除相关连接
        edges.value = edges.value.filter(edge =>
            edge.sourceTaskId !== task.taskId && edge.sinkTaskId !== task.taskId
        );
        if (selectedTask.value?.taskId === task.taskId) {
            selectedTask.value = null;
        }
    }
};

// 更新任务配置
const updateTaskConfig = (config) => {
    if (selectedTask.value) {
        Object.assign(selectedTask.value, config);
        selectedTask.value.status = 'configured';
    }
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

// 获取状态样式
const getStatusClass = (status) => {
    const classMap = {
        'configured': 'status-success',
        'unconfigured': 'status-warning',
        'running': 'status-info',
        'error': 'status-danger'
    };
    return classMap[status] || 'status-default';
};

// 获取状态文本
const getStatusText = (status) => {
    const textMap = {
        'configured': '已配置',
        'unconfigured': '未配置',
        'running': '运行中',
        'error': '错误'
    };
    return textMap[status] || status;
};

// 获取任务位置
const getTaskPosition = (taskId) => {
    const task = tasks.value.find(t => t.taskId === taskId);
    return task ? task.position : { x: 0, y: 0 };
};

// 保存作业
const saveJob = async () => {
    try {
        const jobData = {
            jobId: jobInfo.jobId,
            jobName: jobInfo.jobName || '未命名作业',
            plugins: tasks.value,
            edges: edges.value
        };

        await taskApi.saveJobTaskInfo(jobData);
        ElMessage.success('保存成功');
    } catch (error) {
        console.error('保存失败:', error);
        ElMessage.error('保存失败');
    }
};

// 验证配置
const validateConfig = async () => {
    try {
        const jobData = {
            plugins: tasks.value,
            edges: edges.value
        };

        await taskApi.validateTaskConfig(jobData);
        ElMessage.success('配置验证通过');
    } catch (error) {
        console.error('配置验证失败:', error);
        ElMessage.error('配置验证失败');
    }
};

// 预览配置
const previewConfig = () => {
    const config = {
        plugins: tasks.value,
        edges: edges.value
    };
    configPreview.value = JSON.stringify(config, null, 2);
    previewVisible.value = true;
};

// 执行作业
const executeJob = async () => {
    if (!jobInfo.jobId) {
        ElMessage.warning('请先保存作业');
        return;
    }

    try {
        await taskApi.executeTask(jobInfo.jobId);
        ElMessage.success('作业执行成功');
    } catch (error) {
        console.error('执行失败:', error);
        ElMessage.error('执行失败');
    }
};

// 返回
const goBack = () => {
    router.push('/seatunnel');
};

// 画布操作
const zoomIn = () => {
    // 实现放大逻辑
};

const zoomOut = () => {
    // 实现缩小逻辑
};

const resetCanvas = () => {
    // 实现重置逻辑
};
</script>

<style scoped lang="scss">
.designer-container {
    height: 100vh;
    display: flex;
    flex-direction: column;
    background: var(--el-bg-color-page);

    .toolbar {
        height: 60px;
        background: var(--el-bg-color);
        border-bottom: 1px solid var(--el-border-color);
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0 20px;

        .toolbar-left {
            display: flex;
            align-items: center;

            .job-title {
                font-size: 16px;
                font-weight: 500;
                color: var(--el-text-color-primary);
                margin-left: 10px;
            }
        }
    }

    .designer-content {
        flex: 1;
        display: flex;
        overflow: hidden;

        .component-panel {
            width: 280px;
            background: var(--el-bg-color);
            border-right: 1px solid var(--el-border-color);
            display: flex;
            flex-direction: column;

            .panel-header {
                height: 50px;
                padding: 0 16px;
                display: flex;
                align-items: center;
                border-bottom: 1px solid var(--el-border-color);

                h3 {
                    margin: 0;
                    font-size: 14px;
                    color: var(--el-text-color-primary);
                }
            }

            .panel-content {
                flex: 1;
                overflow-y: auto;
                padding: 16px;

                .component-group {
                    margin-bottom: 20px;

                    .group-title {
                        display: flex;
                        align-items: center;
                        margin-bottom: 12px;
                        font-size: 13px;
                        font-weight: 500;
                        color: var(--el-text-color-regular);

                        .el-icon {
                            margin-right: 6px;
                        }
                    }

                    .component-list {
                        .component-item {
                            display: flex;
                            align-items: center;
                            padding: 8px 12px;
                            margin-bottom: 4px;
                            background: var(--el-fill-color-lighter);
                            border-radius: 6px;
                            cursor: grab;
                            transition: all 0.2s;

                            &:hover {
                                background: var(--el-color-primary-light-9);
                                color: var(--el-color-primary);
                            }

                            &:active {
                                cursor: grabbing;
                            }

                            .el-icon {
                                margin-right: 8px;
                                font-size: 16px;
                            }

                            span {
                                font-size: 12px;
                            }
                        }
                    }
                }
            }
        }

        .canvas-area {
            flex: 1;
            display: flex;
            flex-direction: column;
            background: var(--el-bg-color);

            .canvas-header {
                height: 50px;
                padding: 0 16px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px solid var(--el-border-color);

                h3 {
                    margin: 0;
                    font-size: 14px;
                    color: var(--el-text-color-primary);
                }
            }

            .canvas-content {
                flex: 1;
                position: relative;
                overflow: hidden;
                background:
                    radial-gradient(circle, var(--el-border-color-lighter) 1px, transparent 1px);
                background-size: 20px 20px;

                .task-node {
                    position: absolute;
                    width: 150px;
                    background: var(--el-bg-color);
                    border: 2px solid var(--el-border-color);
                    border-radius: 8px;
                    cursor: move;
                    transition: all 0.2s;

                    &:hover {
                        border-color: var(--el-color-primary);
                        box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
                    }

                    &.selected {
                        border-color: var(--el-color-primary);
                        box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
                    }

                    .node-header {
                        display: flex;
                        align-items: center;
                        padding: 8px 12px;
                        background: var(--el-fill-color-light);
                        border-bottom: 1px solid var(--el-border-color);
                        border-radius: 6px 6px 0 0;

                        .el-icon {
                            margin-right: 6px;
                            color: var(--el-color-primary);
                        }

                        .node-title {
                            flex: 1;
                            font-size: 12px;
                            font-weight: 500;
                            color: var(--el-text-color-primary);
                            overflow: hidden;
                            text-overflow: ellipsis;
                            white-space: nowrap;
                        }

                        .remove-btn {
                            width: 20px;
                            height: 20px;
                            padding: 0;
                            margin-left: 4px;
                        }
                    }

                    .node-content {
                        padding: 8px 12px;

                        .node-type {
                            font-size: 11px;
                            color: var(--el-text-color-regular);
                            margin-bottom: 4px;
                        }

                        .node-status {
                            font-size: 10px;
                            padding: 2px 6px;
                            border-radius: 4px;
                            text-align: center;

                            &.status-success {
                                background: var(--el-color-success-light-9);
                                color: var(--el-color-success);
                            }

                            &.status-warning {
                                background: var(--el-color-warning-light-9);
                                color: var(--el-color-warning);
                            }

                            &.status-info {
                                background: var(--el-color-info-light-9);
                                color: var(--el-color-info);
                            }

                            &.status-danger {
                                background: var(--el-color-danger-light-9);
                                color: var(--el-color-danger);
                            }
                        }
                    }

                    .connection-point {
                        position: absolute;
                        width: 12px;
                        height: 12px;
                        background: var(--el-color-primary);
                        border: 2px solid var(--el-bg-color);
                        border-radius: 50%;
                        cursor: crosshair;

                        &.output {
                            right: -6px;
                            top: 50%;
                            transform: translateY(-50%);
                        }

                        &.input {
                            left: -6px;
                            top: 50%;
                            transform: translateY(-50%);
                        }

                        &:hover {
                            background: var(--el-color-primary-dark-2);
                            transform: translateY(-50%) scale(1.2);
                        }
                    }
                }

                .connections-svg {
                    position: absolute;
                    top: 0;
                    left: 0;
                    pointer-events: none;
                    z-index: 1;
                }
            }
        }

        .property-panel {
            width: 320px;
            background: var(--el-bg-color);
            border-left: 1px solid var(--el-border-color);
            display: flex;
            flex-direction: column;

            .panel-header {
                height: 50px;
                padding: 0 16px;
                display: flex;
                align-items: center;
                border-bottom: 1px solid var(--el-border-color);

                h3 {
                    margin: 0;
                    font-size: 14px;
                    color: var(--el-text-color-primary);
                }
            }

            .panel-content {
                flex: 1;
                overflow-y: auto;
                padding: 16px;

                .no-selection {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 200px;
                }
            }
        }
    }
}
</style>
