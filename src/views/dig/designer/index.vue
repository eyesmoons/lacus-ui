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
              <el-icon><Folder /></el-icon>
              <span>输入组件 (Source)</span>
            </div>
            <div class="component-list">
              <div
                v-for="source in sourceConnectors"
                :key="source.pluginIdentifier.pluginName"
                class="component-item"
                draggable="true"
                @dragstart="handleDragStart($event, 'SOURCE', source)"
              >
                <el-icon><Folder /></el-icon>
                <span>{{ source.pluginIdentifier.pluginName }}</span>
              </div>
            </div>
          </div>
          <!-- Transform 组件 -->
          <div class="component-group">
            <div class="group-title">
              <el-icon><Operation /></el-icon>
              <span>转换组件 (Transform)</span>
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
              <el-icon><Document /></el-icon>
              <span>输出组件 (Sink)</span>
            </div>
            <div class="component-list">
              <div
                v-for="sink in sinkConnectors"
                :key="sink.pluginIdentifier.pluginName"
                class="component-item"
                draggable="true"
                @dragstart="handleDragStart($event, 'SINK', sink)"
              >
                <el-icon><Document /></el-icon>
                <span>{{ sink.pluginIdentifier.pluginName }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 中间画布区域（X6） -->
      <div class="canvas-area">
        <div class="canvas-header">
          <h3>作业设计器</h3>
          <div class="canvas-actions">
            <el-button size="small" icon="ZoomIn" @click="zoomIn">放大</el-button>
            <el-button size="small" icon="ZoomOut" @click="zoomOut">缩小</el-button>
            <el-button size="small" icon="Refresh" @click="resetCanvas">重置</el-button>
            <el-button
              size="small"
              icon="Delete"
              :disabled="!selectedTask && !selectedEdge"
              @click="handleDelete"
              style="margin-left: 12px"
              >删除</el-button
            >
          </div>
        </div>
        <div class="canvas-content" ref="canvasRef" @drop="handleDrop" @dragover="handleDragOver">
          <div ref="x6Container" class="x6-graph-container"></div>
        </div>
      </div>

      <!-- 移除右侧属性面板 -->
      <!-- <div class="property-panel"> ... </div> -->

      <!-- 属性弹框 -->
      <el-drawer
        v-model="showPropertyDialog"
        direction="rtl"
        size="800px"
        :with-header="false"
        custom-class="property-drawer-glass"
        @close="closePropertyDialog"
      >
        <div class="property-drawer-content">
          <div class="dialog-header">
            <h3>属性配置</h3>
            <el-button icon="Close" circle size="small" @click="closePropertyDialog" />
          </div>
          <div class="dialog-body">
            <task-config-form :task="selectedTask" @update="updateTaskConfig" />
          </div>
        </div>
      </el-drawer>
    </div>

    <!-- 配置预览对话框 -->
    <el-dialog v-model="previewVisible" title="配置预览" width="80%" top="5vh">
      <monaco-editor v-model="configPreview" language="json" height="600px" :options="{ readOnly: true }" />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
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
} from '@element-plus/icons-vue';
import * as connectorApi from '@/api/dig/connectorApi';
import * as taskApi from '@/api/dig/taskApi';
import TaskConfigForm from './components/TaskConfigForm.vue';
import MonacoEditor from '@/components/MonacoEditor/index.vue';
import { Graph, Shape } from '@antv/x6';

const route = useRoute();
const router = useRouter();

const sourceConnectors = ref([]);
const transformConnectors = ref([]);
const sinkConnectors = ref([]);
const tasks = ref([]); // 业务数据
const edges = ref([]); // 业务数据
const selectedTask = ref(null);
const previewVisible = ref(false);
const configPreview = ref('');
const canvasRef = ref(null);
const x6Container = ref(null);
let graph = null;
let draggedComponent = null;
let taskIdCounter = 1;
const selectedEdge = ref(null);
const showPropertyDialog = ref(false);

const jobInfo = reactive({
  jobId: null,
  jobName: '',
  description: '',
});

onMounted(async () => {
  await loadConnectors();
  await nextTick();
  initGraph();
  // 只有在 onMounted 里绑定一次
  graph.on('node:dblclick', ({ node }) => {
    selectedTask.value = {
      ...node.getData(),
      taskId: node.id,
      position: { x: node.getPosition().x, y: node.getPosition().y },
    };
    showPropertyDialog.value = true;
  });
  // 画布空白点击关闭弹框
  graph.on('blank:click', () => {
    showPropertyDialog.value = false;
    selectedTask.value = null;
    selectedEdge.value = null;
    // 重置所有连线高亮
    graph.getEdges().forEach((e) => {
      e.attr('line/stroke', '#409EFF');
      e.attr('line/strokeWidth', 2);
    });
  });
  // 如果有 jobId，加载现有作业
  const jobId = route.query.jobId;
  if (jobId) {
    await loadJobData(jobId);
    renderGraphFromData();
  }
});

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
    ElMessage.error('加载连接器失败');
  }
};

const loadJobData = async (jobId) => {
  try {
    const jobData = await taskApi.getJobTaskInfo(jobId);
    jobInfo.jobId = jobId;
    jobInfo.jobName = jobData.jobName || `作业_${jobId}`;
    if (jobData.plugins) tasks.value = jobData.plugins;
    if (jobData.edges) edges.value = jobData.edges;
  } catch (error) {
    ElMessage.error('加载作业数据失败');
  }
};

function handleDragStart(event, type, component) {
  draggedComponent = { type, component };
}

function handleDrop(event) {
  event.preventDefault();
  if (!draggedComponent) return;
  const rect = x6Container.value.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  // 创建新节点
  const nodeData = {
    id: `node_${Date.now()}`,
    label: `${draggedComponent.component.pluginIdentifier.pluginName}_${taskIdCounter++}`,
    data: {
      ...draggedComponent.component,
      connectorType: draggedComponent.type,
      taskName: `${draggedComponent.component.pluginIdentifier.pluginName}_${taskIdCounter}`,
      connectorName: draggedComponent.component.pluginIdentifier.pluginName,
      status: 'unconfigured',
    },
    x: x - 80,
    y: y - 40,
    width: 160,
    height: 80,
    ports: getDefaultPorts(),
    attrs: {
      body: {
        fill: '#fff',
        stroke: '#409EFF',
        rx: 12,
        ry: 12,
        strokeWidth: 2,
      },
      label: {
        text: `${draggedComponent.component.pluginIdentifier.pluginName}_${taskIdCounter}`,
        fill: '#222',
        fontSize: 14,
        fontWeight: 600,
      },
    },
  };
  const node = graph.addNode(nodeData);
  node.setData(nodeData.data);
  tasks.value.push({
    ...nodeData.data,
    taskId: nodeData.id,
    position: { x: nodeData.x, y: nodeData.y },
  });
  draggedComponent = null;
}

function handleDragOver(event) {
  event.preventDefault();
}

function getDefaultPorts() {
  return {
    groups: {
      top: {
        position: 'top',
        attrs: {
          circle: {
            r: 6,
            magnet: true,
            stroke: '#409EFF',
            fill: '#fff',
            strokeWidth: 2,
            style: { visibility: 'hidden' },
          },
        },
      },
      right: {
        position: 'right',
        attrs: {
          circle: {
            r: 6,
            magnet: true,
            stroke: '#409EFF',
            fill: '#fff',
            strokeWidth: 2,
            style: { visibility: 'hidden' },
          },
        },
      },
      bottom: {
        position: 'bottom',
        attrs: {
          circle: {
            r: 6,
            magnet: true,
            stroke: '#409EFF',
            fill: '#fff',
            strokeWidth: 2,
            style: { visibility: 'hidden' },
          },
        },
      },
      left: {
        position: 'left',
        attrs: {
          circle: {
            r: 6,
            magnet: true,
            stroke: '#409EFF',
            fill: '#fff',
            strokeWidth: 2,
            style: { visibility: 'hidden' },
          },
        },
      },
    },
    items: [
      { id: 'top', group: 'top' },
      { id: 'right', group: 'right' },
      { id: 'bottom', group: 'bottom' },
      { id: 'left', group: 'left' },
    ],
  };
}

function initGraph() {
  graph = new Graph({
    container: x6Container.value,
    width: x6Container.value.clientWidth,
    height: x6Container.value.clientHeight,
    grid: true,
    background: { color: '#f7faff' },
    connecting: {
      router: 'manhattan',
      connector: 'rounded',
      anchor: 'center',
      connectionPoint: 'anchor',
      allowBlank: false,
      allowLoop: false,
      highlight: true,
      snap: true,
      createEdge() {
        return new Shape.Edge({
          shape: 'edge',
          attrs: {
            line: {
              stroke: '#409EFF',
              strokeWidth: 2,
              targetMarker: {
                name: 'block',
                size: 10,
                fill: '#409EFF',
                stroke: '#409EFF',
              },
              sourceMarker: null,
            },
          },
          zIndex: 1,
          // 不设置 tools，或只保留如 vertices/segments/boundary/button-remove
        });
      },
      allowEdge: true,
      allowNode: false,
      allowMulti: false,
      allowEdgePort: true,
    },
    selecting: {
      enabled: true,
      multiple: false,
      rubberband: false,
      showNodeSelectionBox: true,
      showEdgeSelectionBox: true,
    },
    highlighting: {
      magnetAvailable: {
        name: 'stroke',
        args: {
          attrs: {
            stroke: '#52c41a',
            strokeWidth: 4,
          },
        },
      },
      edgeSelected: {
        name: 'stroke',
        args: {
          attrs: {
            stroke: '#FF4500',
            strokeWidth: 3,
          },
        },
      },
    },
    panning: true,
    mousewheel: true,
  });

  // 只有鼠标悬停节点时显示连接点
  graph.on('node:mouseenter', ({ node }) => {
    node.getPorts().forEach((port) => {
      node.portProp(port.id, 'attrs/circle', { style: { visibility: 'visible' } });
    });
  });
  graph.on('node:mouseleave', ({ node }) => {
    node.getPorts().forEach((port) => {
      node.portProp(port.id, 'attrs/circle', { style: { visibility: 'hidden' } });
    });
  });

  graph.on('node:click', ({ node }) => {
    selectedTask.value = {
      ...node.getData(),
      taskId: node.id,
      position: { x: node.getPosition().x, y: node.getPosition().y },
    };
    selectedEdge.value = null;
  });

  graph.on('blank:click', () => {
    selectedTask.value = null;
    selectedEdge.value = null;
    // 重置所有连线高亮
    graph.getEdges().forEach((e) => {
      e.attr('line/stroke', '#409EFF');
      e.attr('line/strokeWidth', 2);
    });
  });

  graph.on('edge:click', ({ edge }) => {
    selectedEdge.value = edge;
    selectedTask.value = null;
    // 高亮选中
    graph.getEdges().forEach((e) => e.attr('line/stroke', '#409EFF'));
    edge.attr('line/stroke', '#FF4500');
    edge.attr('line/strokeWidth', 3);
  });

  graph.on('edge:unselected', ({ edge }) => {
    edge.attr('line/stroke', '#409EFF');
    edge.attr('line/strokeWidth', 2);
  });

  graph.on('edge:removed', ({ edge }) => {
    // 同步 edges.value
    const id = edge.id;
    const source = edge.getSource();
    const target = edge.getTarget();
    edges.value = edges.value.filter(
      (e) =>
        !(
          e.sourceTaskId === source.cell &&
          e.sinkTaskId === target.cell &&
          e.sourcePosition === source.port &&
          e.sinkPosition === target.port
        ),
    );
    selectedEdge.value = null;
  });

  // 键盘删除
  document.addEventListener('keydown', handleKeyDown);
  // 右键菜单删除
  graph.on('edge:contextmenu', ({ edge, e }) => {
    e.preventDefault();
    graph.removeEdge(edge.id);
  });
}

function handleKeyDown(e) {
  if ((e.key === 'Delete' || e.key === 'Backspace') && selectedEdge.value) {
    graph.removeEdge(selectedEdge.value.id);
    selectedEdge.value = null;
  }
}

function handleDelete() {
  if (selectedEdge.value) {
    graph.removeEdge(selectedEdge.value.id);
    selectedEdge.value = null;
  } else if (selectedTask.value) {
    graph.removeNode(selectedTask.value.taskId);
    selectedTask.value = null;
  }
}

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeyDown);
});

function renderGraphFromData() {
  if (!graph) return;
  graph.clearCells();
  // 渲染节点
  tasks.value.forEach((task) => {
    graph.addNode({
      id: task.taskId,
      x: task.position.x,
      y: task.position.y,
      width: 160,
      height: 80,
      label: task.taskName,
      data: task,
      ports: getDefaultPorts(),
      attrs: {
        body: {
          fill: '#fff',
          stroke: '#409EFF',
          rx: 12,
          ry: 12,
          strokeWidth: 2,
        },
        label: {
          text: task.taskName,
          fill: '#222',
          fontSize: 14,
          fontWeight: 600,
        },
      },
    });
  });
  // 渲染边
  edges.value.forEach((edge) => {
    graph.addEdge({
      shape: 'edge',
      source: { cell: edge.sourceTaskId, port: edge.sourcePosition },
      target: { cell: edge.sinkTaskId, port: edge.sinkPosition },
      attrs: {
        line: {
          stroke: '#409EFF',
          strokeWidth: 2,
          targetMarker: {
            name: 'block',
            size: 10,
            fill: '#409EFF',
            stroke: '#409EFF',
          },
          sourceMarker: null,
        },
      },
    });
  });
}

function updateTaskConfig(config) {
  if (selectedTask.value) {
    Object.assign(selectedTask.value, config);
    // 同步到 X6 节点
    const node = graph.getCellById(selectedTask.value.taskId);
    if (node) node.setData(selectedTask.value);
  }
}

function saveJob() {
  // 组装 tasks/edges 数据
  // ... 保持原有逻辑 ...
  ElMessage.success('保存成功（示例）');
}
function validateConfig() {
  ElMessage.success('配置验证通过（示例）');
}
function previewConfig() {
  const config = {
    plugins: tasks.value,
    edges: edges.value,
  };
  configPreview.value = JSON.stringify(config, null, 2);
  previewVisible.value = true;
}
function executeJob() {
  ElMessage.success('作业执行成功（示例）');
}
function goBack() {
  router.push('/dig/job');
}
function zoomIn() {
  if (graph) graph.zoom(0.1);
}
function zoomOut() {
  if (graph) graph.zoom(-0.1);
}
function resetCanvas() {
  if (graph) graph.zoomTo(1);
}

function closePropertyDialog() {
  showPropertyDialog.value = false;
  selectedTask.value = null;
}
</script>

<style scoped lang="scss">
.designer-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%);
  box-shadow: 0 4px 32px 0 rgba(64, 158, 255, 0.04);

  .toolbar {
    height: 60px;
    background: rgba(255, 255, 255, 0.95);
    border-bottom: 1px solid var(--el-border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 32px;
    box-shadow: 0 2px 8px 0 rgba(64, 158, 255, 0.06);
    border-radius: 0 0 12px 12px;
    z-index: 2;

    .toolbar-left {
      display: flex;
      align-items: center;

      .job-title {
        font-size: 14px;
        color: #222;
        margin-left: 10px;
        letter-spacing: 1px;
      }
    }
    .toolbar-right {
      .el-button {
        margin-left: 10px;
        border-radius: 8px;
        font-weight: 500;
        transition: box-shadow 0.2s;
        box-shadow: 0 1px 4px 0 rgba(64, 158, 255, 0.04);
        &:hover {
          box-shadow: 0 4px 12px 0 rgba(64, 158, 255, 0.12);
        }
      }
    }
  }

  .designer-content {
    flex: 1;
    display: flex;
    overflow: hidden;
    border-radius: 16px;
    box-shadow: 0 8px 32px 0 rgba(64, 158, 255, 0.06);

    .component-panel {
      width: 260px;
      background: #f7faff;
      border-right: 1px solid #e0e7ef;
      display: flex;
      flex-direction: column;
      box-shadow: 2px 0 8px 0 rgba(64, 158, 255, 0.04);
      .panel-header {
        height: 50px;
        padding: 0 18px;
        display: flex;
        align-items: center;
        border-bottom: 1px solid #e0e7ef;
        background: #fff;
        h3 {
          margin: 0;
          font-size: 15px;
          color: #409eff;
          font-weight: 600;
          letter-spacing: 1px;
        }
      }
      .panel-content {
        flex: 1;
        overflow-y: auto;
        padding: 16px 10px 10px 10px;
        .component-group {
          margin-bottom: 18px;
          background: #fff;
          border-radius: 8px;
          box-shadow: 0 1px 4px 0 rgba(64, 158, 255, 0.04);
          padding: 10px 8px 6px 8px;
          .group-title {
            display: flex;
            align-items: center;
            margin-bottom: 8px;
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
              padding: 8px 10px;
              margin-bottom: 4px;
              background: #f3f8ff;
              border-radius: 6px;
              cursor: grab;
              transition: all 0.2s;
              border: 1px solid transparent;
              font-size: 13px;
              font-weight: 500;
              box-shadow: 0 1px 2px 0 rgba(64, 158, 255, 0.03);
              &:hover {
                background: #e6f0ff;
                color: #409eff;
                border: 1px solid #b3d8ff;
                box-shadow: 0 2px 8px 0 rgba(64, 158, 255, 0.1);
              }
              &:active {
                cursor: grabbing;
              }
              .el-icon {
                margin-right: 8px;
                font-size: 16px;
              }
              span {
                font-size: 13px;
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
      background: linear-gradient(135deg, #f7faff 0%, #eaf1fb 100%);
      position: relative;
      z-index: 1;

      .canvas-header {
        height: 54px;
        padding: 0 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid var(--el-border-color);
        background: rgba(255, 255, 255, 0.85);
        h3 {
          margin: 0;
          font-size: 15px;
          color: #409eff;
          font-weight: 600;
        }
        .canvas-actions {
          .el-button {
            margin-left: 8px;
            border-radius: 8px;
            font-weight: 500;
            transition: box-shadow 0.2s;
            box-shadow: 0 1px 4px 0 rgba(64, 158, 255, 0.04);
            &:hover {
              box-shadow: 0 4px 12px 0 rgba(64, 158, 255, 0.12);
            }
          }
        }
      }

      .canvas-content {
        flex: 1;
        position: relative;
        overflow: auto;
        background: radial-gradient(circle, #e3eaf5 1px, transparent 1px);
        background-size: 22px 22px;
        border-radius: 0 0 16px 16px;

        .task-node {
          position: absolute;
          width: 160px;
          background: linear-gradient(120deg, #fff 70%, #f3f8ff 100%);
          border: 2px solid #e0e7ef;
          border-radius: 12px;
          cursor: move;
          transition: all 0.2s;
          box-shadow: 0 2px 12px 0 rgba(64, 158, 255, 0.08);
          &:hover {
            border-color: #409eff;
            box-shadow: 0 4px 16px 0 rgba(64, 158, 255, 0.18);
          }
          &.selected {
            border-color: #409eff;
            box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.18);
          }
          .node-header {
            display: flex;
            align-items: center;
            padding: 10px 14px;
            background: #f7faff;
            border-bottom: 1px solid #e0e7ef;
            border-radius: 10px 10px 0 0;
            .el-icon {
              margin-right: 8px;
              color: #409eff;
            }
            .node-title {
              flex: 1;
              font-size: 14px;
              font-weight: 600;
              color: #222;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
            .remove-btn {
              width: 22px;
              height: 22px;
              padding: 0;
              margin-left: 6px;
            }
          }
          .node-content {
            padding: 10px 14px;
            .node-type {
              font-size: 12px;
              color: #409eff;
              margin-bottom: 6px;
            }
            .node-status {
              font-size: 11px;
              padding: 3px 8px;
              border-radius: 5px;
              text-align: center;
              font-weight: 500;
              &.status-success {
                background: #e6f9f0;
                color: #13ce66;
              }
              &.status-warning {
                background: #fff7e6;
                color: #e6a23c;
              }
              &.status-info {
                background: #e8f4ff;
                color: #409eff;
              }
              &.status-danger {
                background: #ffeaea;
                color: #f56c6c;
              }
            }
          }
          .connection-point {
            position: absolute;
            width: 14px;
            height: 14px;
            background: #409eff;
            border: 2px solid #fff;
            border-radius: 50%;
            cursor: crosshair;
            box-shadow: 0 2px 8px 0 rgba(64, 158, 255, 0.1);
            transition: background 0.2s, transform 0.2s;
            z-index: 2;
            &.top {
              left: 50%;
              top: -7px;
              transform: translateX(-50%);
            }
            &.right {
              right: -7px;
              top: 50%;
              transform: translateY(-50%);
            }
            &.bottom {
              left: 50%;
              bottom: -7px;
              transform: translateX(-50%);
            }
            &.left {
              left: -7px;
              top: 50%;
              transform: translateY(-50%);
            }
            &:hover {
              background: #337ecc;
              transform: scale(1.25);
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
      width: 340px;
      background: linear-gradient(120deg, #f0f4fa 60%, #e6eaf3 100%);
      border-left: 1px solid var(--el-border-color);
      display: flex;
      flex-direction: column;
      box-shadow: -2px 0 8px 0 rgba(64, 158, 255, 0.04);
      .panel-header {
        height: 54px;
        padding: 0 20px;
        display: flex;
        align-items: center;
        border-bottom: 1px solid var(--el-border-color);
        background: rgba(255, 255, 255, 0.85);
        h3 {
          margin: 0;
          font-size: 15px;
          color: #409eff;
          font-weight: 600;
        }
      }
      .panel-content {
        flex: 1;
        overflow-y: auto;
        padding: 20px 18px 18px 18px;
        .no-selection {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 220px;
          color: #bfcbd9;
          font-size: 15px;
        }
      }
    }
  }
}
.x6-graph-container {
  width: 100%;
  height: 100%;
  min-height: 600px;
  background: #f7faff;
}

.property-dialog-mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 1000;
  background: rgba(30, 40, 60, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.3s;
}
.property-dialog-content {
  background: rgba(255, 255, 255, 0.92);
  border-radius: 20px;
  box-shadow: 0 12px 48px 0 rgba(64, 158, 255, 0.18), 0 1.5px 8px 0 rgba(64, 158, 255, 0.08);
  padding: 0 0 28px 0;
  min-width: 360px;
  max-width: 420px;
  min-height: 220px;
  overflow: hidden;
  animation: dialog-pop-in 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(18px) saturate(180%);
  -webkit-backdrop-filter: blur(18px) saturate(180%);
}
@keyframes dialog-pop-in {
  0% {
    opacity: 0;
    transform: translateY(40px) scale(0.98);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 22px 28px 0 28px;
  h3 {
    margin: 0;
    font-size: 20px;
    color: #409eff;
    font-weight: 800;
    letter-spacing: 1px;
  }
  .el-button {
    background: transparent;
    border: none;
    box-shadow: none;
    transition: background 0.2s;
    &:hover {
      background: #f2f6fc;
    }
  }
}
.dialog-body {
  padding: 22px 28px 0 28px;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.property-drawer-glass {
  background: rgba(255, 255, 255, 0.92) !important;
  box-shadow: 0 12px 48px 0 rgba(64, 158, 255, 0.18), 0 1.5px 8px 0 rgba(64, 158, 255, 0.08) !important;
  border-radius: 20px 0 0 20px !important;
  backdrop-filter: blur(18px) saturate(180%);
  -webkit-backdrop-filter: blur(18px) saturate(180%);
  padding: 0 !important;
}
.property-drawer-content {
  width: 100%;
  min-height: 220px;
  padding: 0 0 8px 0;
  overflow: hidden;
}
</style>
