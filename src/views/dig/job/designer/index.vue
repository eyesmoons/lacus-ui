<template>
  <div class="designer-container">
    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-button icon="Back" @click="goBack">返回</el-button>
        <el-divider direction="vertical" />
        <span class="job-title">{{ jobInfo.jobName || '新建任务' }}</span>
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
          <div class="component-group source-group">
            <div class="group-title">
              <el-icon><Folder /></el-icon>
              <span>输入组件 (Source)</span>
            </div>
            <div class="component-list">
              <div
                v-for="source in sourceConnectors"
                :key="source.pluginIdentifier?.pluginName || source.name"
                class="component-item"
                draggable="true"
                @dragstart="handleDragStart($event, 'SOURCE', source)"
              >
                <el-icon><Folder /></el-icon>
                <span>{{ source.pluginIdentifier?.pluginName || source.name || '未知组件' }}</span>
              </div>
              <!-- 空状态占位 -->
              <div v-if="sourceConnectors.length === 0" class="empty-placeholder">
                <el-icon><Folder /></el-icon>
                <span>暂无Source组件</span>
              </div>
            </div>
          </div>

          <!-- Transform 组件 -->
          <div class="component-group transform-group">
            <div class="group-title">
              <el-icon><Operation /></el-icon>
              <span>转换组件 (Transform)</span>
            </div>
            <div class="component-list">
              <div
                v-for="transform in transformConnectors"
                :key="transform.pluginIdentifier?.pluginName || transform.name"
                class="component-item"
                draggable="true"
                @dragstart="handleDragStart($event, 'TRANSFORM', transform)"
              >
                <el-icon><Operation /></el-icon>
                <span>{{ transform.pluginIdentifier?.pluginName || transform.name || '未知组件' }}</span>
              </div>
              <!-- 空状态占位 -->
              <div v-if="transformConnectors.length === 0" class="empty-placeholder">
                <el-icon><Operation /></el-icon>
                <span>暂无转换组件</span>
              </div>
            </div>
          </div>

          <!-- Sink 组件 -->
          <div class="component-group sink-group">
            <div class="group-title">
              <el-icon><Document /></el-icon>
              <span>输出组件 (Sink)</span>
            </div>
            <div class="component-list">
              <div
                v-for="sink in sinkConnectors"
                :key="sink.pluginIdentifier?.pluginName || sink.name"
                class="component-item"
                draggable="true"
                @dragstart="handleDragStart($event, 'SINK', sink)"
              >
                <el-icon><Document /></el-icon>
                <span>{{ sink.pluginIdentifier?.pluginName || sink.name || '未知组件' }}</span>
              </div>
              <!-- 空状态占位 -->
              <div v-if="sinkConnectors.length === 0" class="empty-placeholder">
                <el-icon><Document /></el-icon>
                <span>暂无输出组件</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 中间画布区域 -->
      <div class="canvas-area">
        <div class="canvas-header">
          <h3>任务设计器</h3>
          <div class="canvas-actions">
            <el-button size="small" icon="ZoomIn" @click="zoomIn">放大</el-button>
            <el-button size="small" icon="ZoomOut" @click="zoomOut">缩小</el-button>
            <el-button size="small" icon="Delete" @click="removeEdge(selectedEdge.value)">删除</el-button>
            <el-button size="small" icon="Refresh" @click="resetCanvas">重置</el-button>
            <el-button size="small" icon="Delete" @click="clearCanvas">清空</el-button>
          </div>
        </div>
        <div
          class="canvas-content"
          ref="canvasRef"
          @drop="handleDrop"
          @dragover="handleDragOver"
          @click="handleCanvasClick"
        >
          <!-- 渲染子任务节点 -->
          <div
            v-for="task in tasks"
            :key="task.taskId"
            class="task-node"
            :class="{ selected: selectedTask?.taskId === task.taskId }"
            :style="{
              left: task.position.x + 'px',
              top: task.position.y + 'px',
            }"
            @click.stop="selectTask(task)"
            @mousedown="startDrag(task, $event)"
          >
            <div class="node-header">
              <el-icon>
                <component :is="getNodeIcon(task.connectorType)" />
              </el-icon>
              <span class="node-title">{{ task.taskName }}</span>
              <el-button size="small" type="danger" icon="Close" @click.stop="removeTask(task)" class="remove-btn" />
            </div>
            <div class="node-content">
              <div class="node-type">{{ task.connectorName }}</div>
              <div class="node-status" :class="getStatusClass(task.status)">
                {{ getStatusText(task.status) }}
              </div>
            </div>

            <!-- 连接点 - 四边都有 -->
            <!-- 右侧连接点 -->
            <div
              class="connection-point right"
              @mousedown.stop="
                selectedEdge
                  ? selectedEdge.value
                    ? updateConnectionPoint(task, 'right')
                    : startConnection(task, 'right', $event)
                  : startConnection(task, 'right', $event)
              "
              :class="{
                highlight:
                  selectedEdge &&
                  selectedEdge.value &&
                  (selectedEdge.value.sourceTaskId === task.taskId || selectedEdge.value.sinkTaskId === task.taskId),
              }"
            ></div>
            <!-- 左侧连接点 -->
            <div
              class="connection-point left"
              @mousedown.stop="
                selectedEdge
                  ? selectedEdge.value
                    ? updateConnectionPoint(task, 'left')
                    : startConnection(task, 'left', $event)
                  : startConnection(task, 'left', $event)
              "
              :class="{
                highlight:
                  selectedEdge &&
                  selectedEdge.value &&
                  (selectedEdge.value.sourceTaskId === task.taskId || selectedEdge.value.sinkTaskId === task.taskId),
              }"
            ></div>
            <!-- 顶部连接点 -->
            <div
              class="connection-point top"
              @mousedown.stop="
                selectedEdge
                  ? selectedEdge.value
                    ? updateConnectionPoint(task, 'top')
                    : startConnection(task, 'top', $event)
                  : startConnection(task, 'top', $event)
              "
              :class="{
                highlight:
                  selectedEdge &&
                  selectedEdge.value &&
                  (selectedEdge.value.sourceTaskId === task.taskId || selectedEdge.value.sinkTaskId === task.taskId),
              }"
            ></div>
            <!-- 底部连接点 -->
            <div
              class="connection-point bottom"
              @mousedown.stop="
                selectedEdge
                  ? selectedEdge.value
                    ? updateConnectionPoint(task, 'bottom')
                    : startConnection(task, 'bottom', $event)
                  : startConnection(task, 'bottom', $event)
              "
              :class="{
                highlight:
                  selectedEdge &&
                  selectedEdge.value &&
                  (selectedEdge.value.sourceTaskId === task.taskId || selectedEdge.value.sinkTaskId === task.taskId),
              }"
            ></div>
          </div>

          <!-- 渲染连接线 -->
          <svg class="connections-svg" :style="{ width: '100%', height: '100%' }">
            <!-- 已保存的连接线 -->
            <g
              v-for="edge in edges"
              :key="`${edge.sourceTaskId}-${edge.sinkTaskId}`"
              class="edge-group"
              @click.stop="handleEdgeClick(edge)"
              @mouseover="highlightEdge(edge)"
              @mouseleave="unhighlightEdge(edge)"
            >
              <!-- 实际连接线（曲线） -->
              <path
                :d="getCurvePath(edge)"
                :stroke="edge === selectedEdge ? '#FF4500' : '#409EFF'"
                :stroke-width="edge === selectedEdge ? 3 : 2"
                fill="none"
                marker-end="url(#arrowhead)"
              />

              <!-- 用于点击的宽线（透明） -->
              <path
                :d="getCurvePath(edge)"
                stroke="transparent"
                stroke-width="10"
                fill="none"
                style="cursor: pointer"
              />
            </g>

            <!-- 临时连接线（拖动中） -->
            <path
              v-if="isConnecting"
              :d="getTempCurvePath()"
              stroke="#409EFF"
              stroke-width="2"
              stroke-dasharray="5,5"
              fill="none"
              marker-end="url(#arrowhead)"
            />

            <!-- 箭头标记 -->
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#409EFF" />
              </marker>
            </defs>
          </svg>

          <!-- 空状态提示 -->
          <div v-if="tasks.length === 0" class="empty-canvas">
            <el-empty description="从左侧拖拽组件到此处开始设计任务">
              <template #image>
                <el-icon size="60"><Box /></el-icon>
              </template>
            </el-empty>
          </div>
        </div>
      </div>

      <!-- 右侧属性面板 -->
      <div class="property-panel">
        <div class="panel-header">
          <h3>属性配置</h3>
        </div>
        <div class="panel-content">
          <div v-if="!selectedTask" class="no-selection">
            <el-empty description="请选择一个子任务节点进行配置" />
          </div>
          <div v-else>
            <task-config-form :task="selectedTask" @update="updateTaskConfig" />
          </div>
        </div>
      </div>
    </div>

    <!-- 配置预览对话框 -->
    <el-dialog v-model="previewVisible" title="配置预览" width="60%" top="5vh">
      <monaco-editor v-model="configPreview" language="json" :height="400" :options="{ readOnly: true }" />
    </el-dialog>
  </div>
</template>

<script setup name="DigJobDesigner">
import { ref, reactive, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  Download,
  Upload,
  Operation,
  Folder,
  ZoomIn,
  ZoomOut,
  Refresh,
  Back,
  View,
  Check,
  Document,
  VideoPlay,
  Close,
  Delete,
  Box,
} from '@element-plus/icons-vue';
import * as connectorApi from '@/api/dig/connectorApi';
import * as jobApi from '@/api/dig/jobApi';
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
const selectedEdge = ref(null);
const previewVisible = ref(false);
const configPreview = ref('');
const canvasRef = ref(null);
const isConnecting = ref(false);
const tempConnectionLine = ref({ x1: 0, y1: 0, x2: 0, y2: 0 });
const canvasScale = ref(1);

// 作业信息
const jobInfo = reactive({
  jobId: null,
  jobName: '',
  description: '',
});

// 拖拽相关
let draggedComponent = null;
let isDragging = false;
let dragOffset = { x: 0, y: 0 };
let taskIdCounter = 1;

// 初始化
onMounted(async () => {
  await loadConnectors();

  // 如果有 jobId，加载现有任务
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
      connectorApi.getSinkConnectors(),
    ]);

    sourceConnectors.value = sources;
    transformConnectors.value = transforms;
    sinkConnectors.value = sinks;
  } catch (error) {
    console.error('加载连接器失败:', error);
    ElMessage.error('加载连接器失败');
  }
};

// 加载任务数据
const loadJobData = async (jobId) => {
  try {
    const jobData = await jobApi.getJobDetail(jobId);
    jobInfo.jobId = jobId;
    jobInfo.jobName = jobData.jobName || `任务_${jobId}`;
    jobInfo.description = jobData.description || '';

    // 加载子任务
    const jobTasks = await taskApi.getJobTasks(jobId);
    if (jobTasks && jobTasks.length > 0) {
      tasks.value = jobTasks.map((task) => ({
        ...task,
        position: task.position || {
          x: Math.random() * 400 + 100,
          y: Math.random() * 300 + 100,
        },
        status: task.status || 'unconfigured',
      }));
    }

    // 加载连接关系（如果有的话）
    if (jobData.edges) {
      edges.value = jobData.edges;
    }
  } catch (error) {
    console.error('加载任务数据失败:', error);
    ElMessage.error('加载任务数据失败');
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

  // 创建新子任务
  const newTask = {
    taskId: taskIdCounter++,
    taskName: `${draggedComponent.component.pluginIdentifier.pluginName}_${taskIdCounter}`,
    jobId: jobInfo.jobId,
    connectorType: draggedComponent.type,
    connectorName: draggedComponent.component.pluginIdentifier.pluginName,
    datasourceId: null,
    taskConfig: '',
    position: { x, y },
    status: 'unconfigured',
  };

  tasks.value.push(newTask);
  draggedComponent = null;

  ElMessage.success('子任务添加成功');
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

// 处理画布点击
const handleCanvasClick = () => {
  // 清除任务和连接线选择
  selectedTask.value = null;
  if (selectedEdge) {
    selectedEdge.value = null;
  }
};

// 处理连接线点击
const handleEdgeClick = (edge) => {
  // 确保selectedEdge不为null后再设置选中的连接线
  if (selectedEdge) {
    selectedEdge.value = edge;
  }
  // 清除任务选择
  selectedTask.value = null;

  // 高亮源任务和目标任务的连接点，以便用户可以重新选择
  highlightConnectionPoints(edge);
};

// 高亮连接线
const highlightEdge = (edge) => {
  // 可以添加高亮效果，如果需要的话
};

// 取消高亮连接线
const unhighlightEdge = (edge) => {
  // 可以移除高亮效果，如果需要的话
};

// 高亮连接点
const highlightConnectionPoints = (edge) => {
  // 找到源任务和目标任务
  const sourceTask = tasks.value.find((task) => task.taskId === edge.sourceTaskId);
  const sinkTask = tasks.value.find((task) => task.taskId === edge.sinkTaskId);

  if (sourceTask && sinkTask && selectedEdge) {
    // 设置当前选中的连接线，以便在点击连接点时可以更新它
    selectedEdge.value = edge;
  }
};

// 更新连接线的连接点
const updateConnectionPoint = (task, position) => {
  if (!selectedEdge || !selectedEdge.value) return;

  // 检查是源任务还是目标任务
  if (selectedEdge.value.sourceTaskId === task.taskId) {
    // 更新源连接点
    selectedEdge.value.sourcePosition = position;
    ElMessage.success('源连接点已更新');
  } else if (selectedEdge.value.sinkTaskId === task.taskId) {
    // 更新目标连接点
    selectedEdge.value.sinkPosition = position;
    ElMessage.success('目标连接点已更新');
  }

  // 强制重新渲染连接线
  edges.value = [...edges.value];

  // 更新完成后清除选中状态
  setTimeout(() => {
    if (selectedEdge) {
      selectedEdge.value = null;
    }
  }, 500);
};

// 删除连接线
const removeEdge = (edge) => {
  // 从数组中移除连接线
  const index = edges.value.findIndex((e) => e.sourceTaskId === edge.sourceTaskId && e.sinkTaskId === edge.sinkTaskId);

  if (index !== -1) {
    edges.value.splice(index, 1);
    if (selectedEdge) {
      selectedEdge.value = null;
    }
    ElMessage.success('连接线已删除');
  }
};

// 移除任务
const removeTask = (task) => {
  const index = tasks.value.findIndex((t) => t.taskId === task.taskId);
  if (index > -1) {
    tasks.value.splice(index, 1);
    // 移除相关连接
    edges.value = edges.value.filter((edge) => edge.sourceTaskId !== task.taskId && edge.sinkTaskId !== task.taskId);
    if (selectedTask.value?.taskId === task.taskId) {
      selectedTask.value = null;
    }
    ElMessage.success('子任务删除成功');
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
    SOURCE: Folder,
    TRANSFORM: Operation,
    SINK: Upload,
  };
  return iconMap[type] || Folder;
};

// 获取状态样式
const getStatusClass = (status) => {
  const classMap = {
    configured: 'status-success',
    unconfigured: 'status-warning',
    running: 'status-info',
    error: 'status-danger',
  };
  return classMap[status] || 'status-default';
};

// 获取状态文本
const getStatusText = (status) => {
  const textMap = {
    configured: '已配置',
    unconfigured: '未配置',
    running: '运行中',
    error: '错误',
  };
  return textMap[status] || status;
};

// 获取任务位置
const getTaskPosition = (taskId) => {
  const task = tasks.value.find((t) => t.taskId === taskId);
  return task ? task.position : { x: 0, y: 0 };
};

// 获取连接点坐标
const getConnectionPoint = (taskId, position) => {
  const task = tasks.value.find((t) => t.taskId === taskId);
  if (!task) return { x: 0, y: 0 };

  const taskPos = task.position;
  const taskWidth = 150; // 任务节点宽度
  const taskHeight = 80; // 任务节点高度

  switch (position) {
    case 'right':
      return { x: taskPos.x + taskWidth, y: taskPos.y + taskHeight / 2 };
    case 'left':
      return { x: taskPos.x, y: taskPos.y + taskHeight / 2 };
    case 'top':
      return { x: taskPos.x + taskWidth / 2, y: taskPos.y };
    case 'bottom':
      return { x: taskPos.x + taskWidth / 2, y: taskPos.y + taskHeight };
    default:
      // 默认使用右侧连接点
      return { x: taskPos.x + taskWidth, y: taskPos.y + taskHeight / 2 };
  }
};

// 获取曲线路径
const getCurvePath = (edge) => {
  const source = getConnectionPoint(edge.sourceTaskId, edge.sourcePosition);
  const target = getConnectionPoint(edge.sinkTaskId, edge.sinkPosition);

  // 计算控制点的距离（曲线的弯曲程度）
  const distance = Math.sqrt(Math.pow(target.x - source.x, 2) + Math.pow(target.y - source.y, 2));
  const controlPointDistance = Math.min(distance * 0.5, 150); // 控制曲线弯曲程度，最大150px

  // 根据连接点位置确定控制点
  let controlPoint1, controlPoint2;

  if (edge.sourcePosition === 'right' && edge.sinkPosition === 'left') {
    // 从右到左的连接
    controlPoint1 = { x: source.x + controlPointDistance, y: source.y };
    controlPoint2 = { x: target.x - controlPointDistance, y: target.y };
  } else if (edge.sourcePosition === 'left' && edge.sinkPosition === 'right') {
    // 从左到右的连接，需要绕一个更大的路径
    controlPoint1 = { x: source.x - controlPointDistance, y: source.y };
    controlPoint2 = { x: target.x + controlPointDistance, y: target.y };
  } else if (['top', 'bottom'].includes(edge.sourcePosition) && ['top', 'bottom'].includes(edge.sinkPosition)) {
    // 从上到下或从下到上的连接
    controlPoint1 = {
      x: source.x,
      y: source.y + (edge.sourcePosition === 'top' ? -controlPointDistance : controlPointDistance),
    };
    controlPoint2 = {
      x: target.x,
      y: target.y + (edge.sinkPosition === 'top' ? -controlPointDistance : controlPointDistance),
    };
  } else if (['left', 'right'].includes(edge.sourcePosition) && ['top', 'bottom'].includes(edge.sinkPosition)) {
    // 从左/右到上/下的连接
    controlPoint1 = {
      x: source.x + (edge.sourcePosition === 'left' ? -controlPointDistance : controlPointDistance),
      y: source.y,
    };
    controlPoint2 = {
      x: target.x,
      y: target.y + (edge.sinkPosition === 'top' ? -controlPointDistance : controlPointDistance),
    };
  } else if (['top', 'bottom'].includes(edge.sourcePosition) && ['left', 'right'].includes(edge.sinkPosition)) {
    // 从上/下到左/右的连接
    controlPoint1 = {
      x: source.x,
      y: source.y + (edge.sourcePosition === 'top' ? -controlPointDistance : controlPointDistance),
    };
    controlPoint2 = {
      x: target.x + (edge.sinkPosition === 'left' ? -controlPointDistance : controlPointDistance),
      y: target.y,
    };
  } else {
    // 默认情况，简单的曲线
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    controlPoint1 = { x: source.x + dx / 3, y: source.y + dy / 3 };
    controlPoint2 = { x: source.x + (dx * 2) / 3, y: source.y + (dy * 2) / 3 };
  }

  // 返回SVG路径
  return `M ${source.x} ${source.y} C ${controlPoint1.x} ${controlPoint1.y}, ${controlPoint2.x} ${controlPoint2.y}, ${target.x} ${target.y}`;
};

// 获取临时连接线的曲线路径
const getTempCurvePath = () => {
  if (!isConnecting.value) return '';

  const source = { x: tempConnectionLine.value.x1, y: tempConnectionLine.value.y1 };
  const target = { x: tempConnectionLine.value.x2, y: tempConnectionLine.value.y2 };

  // 计算控制点的距离（曲线的弯曲程度）
  const distance = Math.sqrt(Math.pow(target.x - source.x, 2) + Math.pow(target.y - source.y, 2));
  const controlPointDistance = Math.min(distance * 0.5, 150); // 控制曲线弯曲程度，最大150px

  // 根据连接源的位置确定控制点
  let controlPoint1, controlPoint2;

  if (connectionType === 'right') {
    // 从右侧连接点出发
    controlPoint1 = { x: source.x + controlPointDistance, y: source.y };
    controlPoint2 = { x: target.x - controlPointDistance / 2, y: target.y };
  } else if (connectionType === 'left') {
    // 从左侧连接点出发
    controlPoint1 = { x: source.x - controlPointDistance, y: source.y };
    controlPoint2 = { x: target.x + controlPointDistance / 2, y: target.y };
  } else if (connectionType === 'top') {
    // 从顶部连接点出发
    controlPoint1 = { x: source.x, y: source.y - controlPointDistance };
    controlPoint2 = { x: target.x, y: target.y + controlPointDistance / 2 };
  } else if (connectionType === 'bottom') {
    // 从底部连接点出发
    controlPoint1 = { x: source.x, y: source.y + controlPointDistance };
    controlPoint2 = { x: target.x, y: target.y - controlPointDistance / 2 };
  } else {
    // 默认情况，简单的曲线
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    controlPoint1 = { x: source.x + dx / 3, y: source.y + dy / 3 };
    controlPoint2 = { x: source.x + (dx * 2) / 3, y: source.y + (dy * 2) / 3 };
  }

  // 返回SVG路径
  return `M ${source.x} ${source.y} C ${controlPoint1.x} ${controlPoint1.y}, ${controlPoint2.x} ${controlPoint2.y}, ${target.x} ${target.y}`;
};

// 保存任务
const saveJob = async () => {
  try {
    if (!jobInfo.jobName) {
      jobInfo.jobName = '未命名任务';
    }

    let jobId = jobInfo.jobId;

    // 如果是新任务，先创建任务
    if (!jobId) {
      const jobData = {
        jobName: jobInfo.jobName,
        description: jobInfo.description,
      };
      const result = await jobApi.createJob(jobData);
      jobId = result.jobId;
      jobInfo.jobId = jobId;
    }

    // 保存子任务
    if (tasks.value.length > 0) {
      await taskApi.batchCreateTasks(jobId, tasks.value);
    }

    ElMessage.success('保存成功');
  } catch (error) {
    console.error('保存失败:', error);
    ElMessage.error('保存失败');
  }
};

// 验证配置
const validateConfig = async () => {
  try {
    if (tasks.value.length === 0) {
      ElMessage.warning('请至少添加一个子任务');
      return;
    }

    const jobData = {
      tasks: tasks.value,
      edges: edges.value,
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
    jobInfo: jobInfo,
    tasks: tasks.value,
    edges: edges.value,
  };
  configPreview.value = JSON.stringify(config, null, 2);
  previewVisible.value = true;
};

// 执行任务
const executeJob = async () => {
  if (!jobInfo.jobId) {
    ElMessage.warning('请先保存任务');
    return;
  }

  try {
    await jobApi.executeJob(jobInfo.jobId);
    ElMessage.success('任务执行成功');
  } catch (error) {
    console.error('执行失败:', error);
    ElMessage.error('执行失败');
  }
};

// 返回
const goBack = () => {
  router.push('/dig/job');
};

// 清空画布
const clearCanvas = async () => {
  try {
    await ElMessageBox.confirm('确定要清空画布吗？此操作不可恢复！', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });

    tasks.value = [];
    edges.value = [];
    selectedTask.value = null;
    selectedEdge.value = null;
    ElMessage.success('画布已清空');
  } catch (error) {
    // 用户取消操作
  }
};

// 画布操作
const zoomIn = () => {
  canvasScale.value = Math.min(canvasScale.value + 0.1, 2);
};
const zoomOut = () => {
  canvasScale.value = Math.max(canvasScale.value - 0.1, 0.2);
};
const resetCanvas = () => {
  canvasScale.value = 1;
};

// 连接相关方法（预留）
// 连接相关变量
let connectionSource = null;
let connectionType = null;

// 开始连接
const startConnection = (task, position, event) => {
  isConnecting.value = true;
  connectionSource = task;
  connectionType = position;

  // 设置初始连接点位置
  const rect = canvasRef.value.getBoundingClientRect();
  const connectionPoint = getConnectionPoint(task.taskId, position);

  // 设置临时连接线的起始点
  tempConnectionLine.value = {
    x1: connectionPoint.x,
    y1: connectionPoint.y,
    x2: event.clientX - rect.left,
    y2: event.clientY - rect.top,
  };

  // 添加鼠标移动和鼠标抬起事件监听
  document.addEventListener('mousemove', handleMouseMoveWhileConnecting);
  document.addEventListener('mouseup', handleMouseUpWhileConnecting);
};

// 鼠标移动时更新连接线
const handleMouseMoveWhileConnecting = (event) => {
  if (!isConnecting.value) return;

  const rect = canvasRef.value.getBoundingClientRect();
  // 更新临时连接线的终点
  tempConnectionLine.value = {
    ...tempConnectionLine.value,
    x2: event.clientX - rect.left,
    y2: event.clientY - rect.top,
  };
};

// 鼠标抬起时完成连接
const handleMouseUpWhileConnecting = (event) => {
  if (!isConnecting.value) return;

  // 移除事件监听
  document.removeEventListener('mousemove', handleMouseMoveWhileConnecting);
  document.removeEventListener('mouseup', handleMouseUpWhileConnecting);

  // 检查是否在有效的连接点上释放
  const targetTask = findTaskAtPosition(event);
  const rect = canvasRef.value.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;

  if (targetTask && targetTask.taskId !== connectionSource.taskId) {
    // 确定目标连接点位置
    const targetPosition = determineTargetPosition(targetTask, mouseX, mouseY);

    // 创建连接，包含源和目标的连接点位置信息
    createConnection(
      connectionSource.taskId,
      targetTask.taskId,
      connectionType, // 源连接点位置
      targetPosition, // 目标连接点位置
    );
  }

  // 重置连接状态
  isConnecting.value = false;
  connectionSource = null;
  connectionType = null;
};

// 在指定位置查找任务节点
const findTaskAtPosition = (event) => {
  const rect = canvasRef.value.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  // 检查是否点击在任务节点上
  return tasks.value.find((task) => {
    const taskPos = task.position;
    return (
      x >= taskPos.x &&
      x <= taskPos.x + 150 && // 任务宽度为150px
      y >= taskPos.y &&
      y <= taskPos.y + 80
    ); // 假设任务高度约为80px
  });
};

// 确定目标连接点位置
const determineTargetPosition = (task, mouseX, mouseY) => {
  const taskPos = task.position;
  const taskWidth = 150; // 任务节点宽度
  const taskHeight = 80; // 任务节点高度

  // 计算鼠标位置相对于任务中心的位置
  const centerX = taskPos.x + taskWidth / 2;
  const centerY = taskPos.y + taskHeight / 2;

  // 计算鼠标与任务中心的水平和垂直距离
  const dx = mouseX - centerX;
  const dy = mouseY - centerY;

  // 确定最近的边
  // 使用斜率比较法确定最近的边
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);

  if (absX > absY) {
    // 水平方向距离更大，选择左侧或右侧边
    return dx > 0 ? 'right' : 'left';
  } else {
    // 垂直方向距离更大，选择顶部或底部边
    return dy > 0 ? 'bottom' : 'top';
  }
};

// 创建连接
const createConnection = (sourceTaskId, sinkTaskId, sourcePosition, sinkPosition) => {
  // 检查是否已存在相同的连接
  const existingEdge = edges.value.find((edge) => edge.sourceTaskId === sourceTaskId && edge.sinkTaskId === sinkTaskId);

  if (!existingEdge) {
    edges.value.push({
      sourceTaskId,
      sinkTaskId,
      sourcePosition: sourcePosition || 'right', // 默认使用右侧连接点
      sinkPosition: sinkPosition || 'left', // 默认使用左侧连接点
    });
    ElMessage.success('连接创建成功');
  }
};

// 实现拖拽移动逻辑
const startDrag = (task, event) => {
  if (isConnecting.value) return; // 如果正在连接，不启动拖拽

  // 清除选中的连接线
  if (selectedEdge) {
    selectedEdge.value = null;
  }

  isDragging = true;

  // 计算鼠标点击位置与节点左上角的偏移
  const rect = canvasRef.value.getBoundingClientRect();
  dragOffset.x = event.clientX - rect.left - task.position.x;
  dragOffset.y = event.clientY - rect.top - task.position.y;

  // 添加鼠标移动和鼠标抬起事件监听
  const handleMouseMove = (moveEvent) => {
    if (!isDragging) return;

    const canvasRect = canvasRef.value.getBoundingClientRect();
    const newX = moveEvent.clientX - canvasRect.left - dragOffset.x;
    const newY = moveEvent.clientY - canvasRect.top - dragOffset.y;

    // 更新任务位置
    task.position.x = Math.max(0, newX);
    task.position.y = Math.max(0, newY);

    // 强制重新渲染连接线
    edges.value = [...edges.value];
  };

  const handleMouseUp = () => {
    isDragging = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
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
                        font-size: 16px;
                        font-weight: 800;
                        color: #3a71a8;

                        .el-icon {
                            margin-right: 6px;
                        }
                    }

                    .component-list {
                        height: 155px;
                        overflow-y: auto;

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

                .empty-canvas {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    text-align: center;
                    color: var(--el-text-color-secondary);
                }

                .task-node {
                    position: absolute;
                    width: 150px;
                    height: 80px;
                    border-radius: 8px;
                    background: #fff;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
                    border: 2px solid #e4e7ed;
                    transition: border-color 0.2s;
                    cursor: pointer;
                    z-index: 2;
                }

                .task-node.selected {
                    border-color: #409EFF;
                }

                .connection-point {
                    width: 14px;
                    height: 14px;
                    border-radius: 50%;
                    background: #fff;
                    border: 2px solid #409EFF;
                    position: absolute;
                    z-index: 3;
                    display: none;
                    transition: background 0.2s, border-color 0.2s;
                }

                .task-node:hover .connection-point {
                    display: block;
                }

                .connection-point.active {
                    background: #409EFF;
                    border-color: #409EFF;
                }

                .edge-path {
                    stroke: #bfcbd9;
                    stroke-width: 2;
                    fill: none;
                    cursor: pointer;
                    transition: stroke 0.2s;
                }

                .edge-path.selected {
                    stroke: #409EFF;
                    stroke-width: 3;
                }
            }
        }
    }
}
</style>
