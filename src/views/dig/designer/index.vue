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
                :key="source.name || source.pluginIdentifier?.pluginName"
                class="component-item"
                draggable="true"
                @dragstart="handleDragStart($event, 'SOURCE', source)"
              >
                <el-icon><Folder /></el-icon>
                <span>{{ source.displayName || source.pluginIdentifier?.pluginName || source.name }}</span>
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
                :key="transform.name || transform.pluginIdentifier?.pluginName"
                class="component-item"
                draggable="true"
                @dragstart="handleDragStart($event, 'TRANSFORM', transform)"
              >
                <el-icon><Operation /></el-icon>
                <span>{{ transform.displayName || transform.pluginIdentifier?.pluginName || transform.name }}</span>
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
                :key="sink.name || sink.pluginIdentifier?.pluginName"
                class="component-item"
                draggable="true"
                @dragstart="handleDragStart($event, 'SINK', sink)"
              >
                <el-icon><Document /></el-icon>
                <span>{{ sink.displayName || sink.pluginIdentifier?.pluginName || sink.name }}</span>
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
        @close="handleTaskConfigClose"
      >
        <div class="property-drawer-content">
          <div class="dialog-header">
            <h3>属性配置</h3>
            <el-button icon="Close" circle size="small" @click="handleTaskConfigClose" />
          </div>
          <div class="dialog-body">
            <task-config-form
              :task="selectedTask"
              :upstream-output-model="upstreamOutputModelForDrawer"
              @update="handleTaskConfigUpdate"
              @close="handleTaskConfigClose"
              @updateTaskId="handleTaskIdUpdate"
            />
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
/** 当前打开配置的节点的上游 Source 的 outputModel（用于 Copy Transform 左侧输入字段） */
const upstreamOutputModelForDrawer = ref(null);

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
  graph.on('node:dblclick', async ({ node }) => {
    const taskData = {
      ...node.getData(),
      taskId: node.id,
      position: { x: node.getPosition().x, y: node.getPosition().y },
    };

    // 使用新的异步方法打开任务配置
    await openTaskConfig(taskData);
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

  // 如果有 jobId，先获取已保存的DAG信息
  const jobId = route.query.jobId;
  if (jobId) {
    await loadJobDagData(jobId);
    // 添加延迟确保数据加载完成
    await nextTick();
    renderGraphFromData();
  }
});

const loadConnectors = async () => {
  try {
    // 使用Promise.allSettled替代Promise.all，确保即使部分接口失败也能继续
    const [sourcesResult, transformsResult, sinksResult] = await Promise.allSettled([
      connectorApi.getSourceConnectors(),
      connectorApi.getTransformConnectors(),
      connectorApi.getSinkConnectors(),
    ]);

    // 处理sources结果
    if (sourcesResult.status === 'fulfilled') {
      sourceConnectors.value = sourcesResult.value || [];
    } else {
      sourceConnectors.value = [];
    }

    // 处理transforms结果
    if (transformsResult.status === 'fulfilled') {
      transformConnectors.value = transformsResult.value || [];
    } else {
      transformConnectors.value = [];
    }

    // 处理sinks结果
    if (sinksResult.status === 'fulfilled') {
      sinkConnectors.value = sinksResult.value || [];
    } else {
      sinkConnectors.value = [];
    }
    // 检查是否所有连接器都加载失败
    const totalConnectors =
      sourceConnectors.value.length + transformConnectors.value.length + sinkConnectors.value.length;
    if (totalConnectors === 0) {
      ElMessage.warning('所有连接器加载失败，请检查网络连接或联系管理员');
    } else if (totalConnectors < 6) {
      // 假设正常情况下应该有较多连接器
      ElMessage.info('部分连接器加载失败，但基本功能可用');
    }
  } catch (error) {
    console.error('加载连接器列表失败:', error);
    ElMessage.error('连接器服务不可用，请稍后再试');
  }
};

// 加载作业的DAG信息
const loadJobDagData = async (jobId) => {
  try {
    const response = await taskApi.getJobDag(jobId);

    // 处理可能的响应包装
    const dagData = response.data || response;
    // 更新作业信息
    jobInfo.jobId = jobId;

    // 创建ID映射表，用于更新边的引用
    const idMapping = {};

    // 更新任务数据 - 使用plugins字段，为null的taskId生成新ID
    if (dagData.plugins && Array.isArray(dagData.plugins)) {
      tasks.value = dagData.plugins.map((task, index) => {
        let newTaskId;
        if (!task.taskId || task.taskId === 'null') {
          // 为没有taskId的节点生成新ID
          newTaskId = `node_${Date.now()}_${index}`;
          // 记录ID映射关系
          if (task.taskId) {
            idMapping[task.taskId] = newTaskId;
          }
        } else {
          newTaskId = String(task.taskId);
        }

        // 解析 connectorConfig 字段
        let parsedTaskConfig = {};
        if (task.connectorConfig) {
          try {
            parsedTaskConfig = JSON.parse(task.connectorConfig);
          } catch (error) {
            console.warn('解析任务配置失败:', error, task.connectorConfig);
            parsedTaskConfig = {};
          }
        }

        return {
          ...task,
          taskId: newTaskId,
          taskConfig: parsedTaskConfig, // 将解析后的配置赋值给 taskConfig（仅用于兼容）
          position: task.position || { x: 100 + index * 200, y: 100 },
          // connectorConfig 保持接口原样（字符串），TaskConfigForm 从中解析 outputModel.fields 做输出模型回显
        };
      });
    } else {
      console.log('没有找到任务数据或数据格式不正确');
      console.log('dagData.plugins:', dagData.plugins);
    }

    // 更新边数据 - 支持 edges/relations/relationList 等字段，兼容多种边字段名及嵌套 job
    const rawEdges =
      dagData.edges ??
      dagData.relations ??
      dagData.relationList ??
      dagData.edgeList ??
      (dagData.job && (dagData.job.relations ?? dagData.job.edges));
    if (rawEdges && Array.isArray(rawEdges)) {
      // 对边进行去重，避免重复的sourceTaskId和sinkTaskId组合
      const uniqueRawEdges = [];
      const seenRawEdges = new Set();

      rawEdges.forEach((edge) => {
        let sourceTaskId = String(edge.sourceTaskId ?? edge.sourceId ?? edge.source ?? '');
        let sinkTaskId = String(edge.sinkTaskId ?? edge.sinkId ?? edge.sink ?? edge.target ?? '');

        const edgeKey = `${sourceTaskId}-${sinkTaskId}`;
        if (!seenRawEdges.has(edgeKey)) {
          seenRawEdges.add(edgeKey);
          uniqueRawEdges.push(edge);
        }
      });

      edges.value = uniqueRawEdges
        .map((edge) => {
          let sourceTaskId = String(edge.sourceTaskId ?? edge.sourceId ?? edge.source ?? '');
          let sinkTaskId = String(edge.sinkTaskId ?? edge.sinkId ?? edge.sink ?? edge.target ?? '');

          if (idMapping[sourceTaskId]) sourceTaskId = idMapping[sourceTaskId];
          if (idMapping[sinkTaskId]) sinkTaskId = idMapping[sinkTaskId];

          return {
            sourceTaskId,
            sinkTaskId,
            sourcePosition: edge.sourcePosition ?? edge.sourcePort ?? 'right',
            sinkPosition: edge.sinkPosition ?? edge.sinkPort ?? edge.targetPort ?? 'left',
          };
        })
        .filter((e) => e.sourceTaskId && e.sinkTaskId);
    } else {
      console.log('没有找到关系数据或数据格式不正确');
      console.log('dagData.edges/relations:', rawEdges);
    }
  } catch (error) {
    console.error('加载作业DAG数据失败:', error);
    console.error('错误详情:', error.response || error);
    ElMessage.error('加载作业DAG数据失败');
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
    label: `${
      draggedComponent.component.displayName ||
      draggedComponent.component.pluginIdentifier?.pluginName ||
      draggedComponent.component.name
    }_${taskIdCounter++}`,
    data: {
      ...draggedComponent.component,
      connectorType: draggedComponent.type,
      taskName: `${
        draggedComponent.component.displayName ||
        draggedComponent.component.pluginIdentifier?.pluginName ||
        draggedComponent.component.name
      }_${taskIdCounter}`,
      connectorName: draggedComponent.component.name || draggedComponent.component.pluginIdentifier?.pluginName,
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
        text: `${
          draggedComponent.component.displayName ||
          draggedComponent.component.pluginIdentifier?.pluginName ||
          draggedComponent.component.name
        }_${taskIdCounter}`,
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
    taskId: nodeData.id, // 使用前端生成的taskId
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
    const source = edge.getSource();
    const target = edge.getTarget();
    edges.value = edges.value.filter((e) => !(e.sourceTaskId === source.cell && e.sinkTaskId === target.cell));
    selectedEdge.value = null;
  });

  // 处理边创建事件
  graph.on('edge:connected', ({ edge }) => {
    const source = edge.getSource();
    const target = edge.getTarget();

    // 检查是否已经存在相同的边，避免重复添加
    const sourceTaskId = source.cell;
    const sinkTaskId = target.cell;
    const existingEdgeIndex = edges.value.findIndex(
      (e) => e.sourceTaskId === sourceTaskId && e.sinkTaskId === sinkTaskId,
    );

    if (existingEdgeIndex === -1) {
      // 添加到edges.value
      edges.value.push({
        sourceTaskId: sourceTaskId,
        sinkTaskId: sinkTaskId,
        sourcePosition: source.port,
        sinkPosition: target.port,
      });
    }
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
  if (!graph) {
    console.log('graph未初始化，无法渲染');
    return;
  }

  graph.clearCells();

  // 渲染节点（id 统一为字符串，与边的 sourceTaskId/sinkTaskId 一致）
  tasks.value.forEach((task) => {
    const nodeId = String(task.taskId ?? '');
    graph.addNode({
      id: nodeId,
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

  // 渲染边（cell 与节点 id 一致为字符串）
  edges.value.forEach((edge, idx) => {
    const sourceId = String(edge.sourceTaskId ?? '');
    const targetId = String(edge.sinkTaskId ?? '');
    if (!sourceId || !targetId) return;
    graph.addEdge({
      id: `edge_${sourceId}_${targetId}_${idx}`,
      shape: 'edge',
      source: { cell: sourceId, port: edge.sourcePosition },
      target: { cell: targetId, port: edge.sinkPosition },
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

function saveJob() {
  try {
    // 验证是否有任务数据
    if (tasks.value.length === 0) {
      ElMessage.warning('请先添加任务节点');
      return;
    }

    // 获取当前作业ID
    const jobId = route.query.jobId;
    if (!jobId) {
      ElMessage.error('作业ID不能为空');
      return;
    }

    // 验证所有连接的节点是否都已保存配置
    const invalidEdges = edges.value.filter((edge) => !edge.sourceTaskId || !edge.sinkTaskId);

    if (invalidEdges.length > 0) {
      ElMessage.warning('请先保存所有任务节点的配置，然后再保存DAG关系');
      return;
    }

    // 组装DAG数据（节点和边的关系）
    // 对边进行去重，避免重复的sourceTaskId和sinkTaskId组合
    const uniqueEdges = [];
    const seenEdges = new Set();

    edges.value
      .filter((edge) => edge.sourceTaskId && edge.sinkTaskId) // 只保存有效的边
      .forEach((edge) => {
        const edgeKey = `${edge.sourceTaskId}-${edge.sinkTaskId}`;
        if (!seenEdges.has(edgeKey)) {
          seenEdges.add(edgeKey);
          uniqueEdges.push({
            sourceTaskId: edge.sourceTaskId,
            sinkTaskId: edge.sinkTaskId,
          });
        }
      });

    const dagData = {
      jobId: parseInt(jobId),
      relations: uniqueEdges,
    };

    console.log(
      '有效的边:',
      edges.value.filter((edge) => edge.sourceTaskId && edge.sinkTaskId),
    );

    // 调用保存DAG API
    taskApi
      .saveDag(dagData)
      .then((response) => {
        if (!response) return;
        ElMessage.success('作业保存成功');

        // 如果API返回了边的ID信息，更新边的后端ID
        const data = response.data ?? response;
        if (data && Array.isArray(data.relations)) {
          data.relations.forEach((relation) => {
            const edge = edges.value.find(
              (e) => e.sourceTaskId === relation.sourceTaskId && e.sinkTaskId === relation.sinkTaskId,
            );
            if (edge) {
              // 更新边的ID（如果有的话）
              if (relation.edgeId) {
                edge.edgeId = relation.edgeId;
              }
            }
          });
        }
      })
      .catch((error) => {
        console.error('保存作业失败:', error);
      });
  } catch (error) {
    console.error('保存作业时发生错误:', error);
  }
}
function validateConfig() {
  try {
    // 验证是否有任务数据
    if (tasks.value.length === 0) {
      ElMessage.warning('请先添加任务节点');
      return;
    }

    // 获取当前作业ID
    const jobId = route.query.jobId;
    if (!jobId) {
      ElMessage.error('作业ID不能为空');
      return;
    }

    // 组装验证数据
    const validateData = {
      jobId: parseInt(jobId),
      tasks: tasks.value.map((task) => ({
        taskName: task.taskName,
        connectorType: task.connectorType,
        connectorName: task.connectorName,
        datasourceId: task.datasourceId || 0,
        taskConfig: task.taskConfig || '',
        datasourceConfig: task.datasourceConfig || {},
        outputModel: task.outputModel || null,
      })),
      edges: edges.value,
    };

    // 调用验证API
    taskApi
      .validateTaskConfig(validateData)
      .then((response) => {
        ElMessage.success('配置验证通过');
      })
      .catch((error) => {
        console.error('配置验证失败:', error);
        ElMessage.error('配置验证失败');
      });
  } catch (error) {
    console.error('验证配置时发生错误:', error);
    ElMessage.error('配置验证失败');
  }
}
function previewConfig() {
  const config = {
    plugins: tasks.value,
    edges: edges.value,
  };
  configPreview.value = JSON.stringify(config, null, 2);
  previewVisible.value = true;
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

// 根据连线计算当前节点的上游节点的 outputModel（用于 Copy Transform 和 SINK 组件左侧输入字段）
// 支持多级连接：如果上游是 Transform，则继续向上追溯；否则直接使用 Source 的 outputModel
function computeUpstreamOutputModel(currentTaskId) {
  if (!currentTaskId) return null;

  // 递归查找上游输出模型
  function findUpstreamOutput(taskId, visited = []) {
    // 防止循环引用
    if (visited.includes(taskId)) return null;
    visited.push(taskId);

    const incoming = edges.value.filter((e) => e.sinkTaskId === taskId);
    if (incoming.length === 0) return null;

    // 查找第一个上游任务
    const upstreamTaskId = incoming[0].sourceTaskId;
    const upstreamTask = tasks.value.find((t) => t.taskId === upstreamTaskId);

    if (!upstreamTask?.connectorConfig) return null;

    try {
      const parsed =
        typeof upstreamTask.connectorConfig === 'string'
          ? JSON.parse(upstreamTask.connectorConfig)
          : upstreamTask.connectorConfig;

      // 如果上游是 Transform 类型，继续向上查找
      if (upstreamTask.connectorType === 'TRANSFORM') {
        // 如果 Transform 有自己的 outputModel，优先使用
        if (parsed?.outputModel) {
          // 检查 outputModel 是否是新格式（包含 fields 数组和 relation 映射）
          if (typeof parsed.outputModel === 'object' && !Array.isArray(parsed.outputModel)) {
            // 如果包含 fields 数组，认为是新格式
            if (Array.isArray(parsed.outputModel.fields)) {
              return parsed.outputModel;
            }
            // 如果包含 tableName 或 table 字段，认为是标准格式
            else if (parsed.outputModel.tableName || parsed.outputModel.table) {
              return parsed.outputModel;
            } else {
              // 否则是字段映射格式，提取字段名作为输出字段，并保留原始映射关系
              const fields = Object.keys(parsed.outputModel);
              return {
                tableName: '',
                fields: fields,
                relation: parsed.outputModel, // 保留原始的字段映射关系
              };
            }
          }
        }
        // 否则继续向上追溯
        return findUpstreamOutput(upstreamTaskId, visited);
      } else {
        // 如果是 Source 或其他类型，直接返回其 outputModel
        return parsed?.outputModel ?? null;
      }
    } catch (error) {
      console.error('解析上游任务配置失败:', error);
      return null;
    }
  }

  return findUpstreamOutput(currentTaskId);
}

// 打开属性配置弹框
// 双击节点处理函数：已存在任务先拉取详情并更新 connectorConfig，再打开弹框，避免第一次打开时输出模型「正在加载字段...」
const openTaskConfig = async (task) => {
  try {
    // 设置选中的任务
    selectedTask.value = {
      ...task,
      taskName: task.taskName || task.label || '未命名任务',
      connectorType: task.connectorType || 'SOURCE',
      connectorName: task.connectorName || task.name,
      dynamicFormConfig: [], // 初始化为空数组
    };

    // Copy Transform 等需要上游输出：根据连线取上游 Source 的 outputModel，供字段映射左侧列表使用
    upstreamOutputModelForDrawer.value = computeUpstreamOutputModel(task.taskId);

    const isExistingTask = task.taskId && task.taskId !== 'null' && !String(task.taskId).startsWith('node_');

    if (isExistingTask) {
      // 已存在任务：先拉取任务配置并写入 selectedTask.connectorConfig，再打开弹框，保证 TaskConfigForm 首次即拿到完整数据
      await loadTaskConfig(task.taskId);
    } else {
      await loadDynamicFormConfig(selectedTask.value);
    }

    showPropertyDialog.value = true;
  } catch (error) {
    console.error('打开任务配置失败:', error);
    ElMessage.error(`打开任务配置失败: ${error.message || '未知错误'}`);
    showPropertyDialog.value = false;
    selectedTask.value = null;
    upstreamOutputModelForDrawer.value = null;
  }
};

// 加载动态表单配置
const loadDynamicFormConfig = async (task) => {
  try {
    const connectorType = task.connectorType;
    const connectorName = task.connectorName;

    // 调用后端接口获取动态表单配置
    const formConfig = await connectorApi.getConnectorForm(connectorType, connectorName);

    if (!formConfig || (Array.isArray(formConfig) && formConfig.length === 0)) {
      console.warn('动态表单配置为空或无效');
      ElMessage.warning('该连接器暂无可配置项');
      return;
    }

    // 确保每个字段都有必要的属性
    let processedConfig = formConfig;
    if (Array.isArray(formConfig)) {
      processedConfig = formConfig.map((field, index) => {
        const processedField = {
          ...field,
          // 确保字段名存在
          fieldName: field.fieldName || field.enName || field.field || field.name || `field_${index}`,
          enName: field.enName || field.fieldName || field.field || field.name || `field_${index}`,
          // 确保字段标签存在
          cnName:
            field.cnName || field.label || field.displayName || field.fieldName || field.enName || `字段${index + 1}`,
          // 确保字段类型存在
          formType: field.formType || field.type || 'text',
          // 确保分组标签存在
          tag: field.tag || '基本配置',
          // 确保排序值存在
          order:
            field.order !== undefined
              ? field.order
              : field.fieldOrder !== undefined
              ? field.fieldOrder
              : field.sort !== undefined
              ? field.sort
              : index,
        };

        return processedField;
      });
    }

    // 将动态表单配置传递给TaskConfigForm组件
    if (selectedTask.value) {
      selectedTask.value.dynamicFormConfig = processedConfig;
    }
  } catch (error) {
    console.error('加载动态表单配置失败:', error);
    console.error('错误详情:', error.response || error.message);
    ElMessage.error(`加载动态表单配置失败: ${error.message || '未知错误'}`);
    throw error;
  }
};

// 加载任务配置
const loadTaskConfig = async (taskId) => {
  try {
    // 先尝试通过API获取任务详情
    let taskData = null;
    try {
      taskData = await taskApi.getTaskDetail(taskId);
    } catch (error) {
      console.warn('通过API获取任务详情失败，将尝试从作业DAG数据中查找:', error);
    }

    // 如果API获取失败或未找到任务，尝试从当前作业DAG数据中查找
    if (!taskData) {
      const taskInDag = tasks.value.find((t) => t.taskId === taskId);
      if (taskInDag) {
        taskData = taskInDag;
      }
    }

    // 检查返回的数据是否有效
    if (!taskData) {
      console.warn('任务不存在或返回null，切换到新任务模式');
      // 如果任务不存在，则按新任务处理
      await loadDynamicFormConfig(selectedTask.value);
      return;
    }

    // 更新选中任务的配置数据：用新对象替换 selectedTask，保证 TaskConfigForm 的 watch 能检测到变化并一次渲染正确
    if (selectedTask.value) {
      const connectorConfigStr =
        typeof taskData.connectorConfig === 'string'
          ? taskData.connectorConfig
          : JSON.stringify(taskData.connectorConfig ?? {});

      selectedTask.value = {
        ...selectedTask.value,
        connectorConfig: connectorConfigStr,
        taskName: taskData.taskName ?? selectedTask.value.taskName,
        connectorType: taskData.connectorType ?? selectedTask.value.connectorType,
        connectorName: taskData.connectorName ?? selectedTask.value.connectorName,
      };

      await loadDynamicFormConfig(selectedTask.value);
    }
  } catch (error) {
    console.error('加载任务配置失败:', error);

    // 如果是404或任务不存在的错误，则按新任务处理
    if (error.response?.status === 404 || error.message?.includes('not found')) {
      console.log('任务不存在，按新任务处理');
      await loadDynamicFormConfig(selectedTask.value);
    } else {
      ElMessage.error('加载任务配置失败');
    }
  }
};

// 处理任务配置更新
const handleTaskConfigUpdate = (taskData) => {
  if (selectedTask.value && graph) {
    // 更新节点数据
    Object.assign(selectedTask.value, taskData);

    // 同步到 tasks（后端 DAG 数据源），保证 Copy Transform 打开时能直接读到上游 Source 的 outputModel
    const idx = tasks.value.findIndex((t) => t.taskId === selectedTask.value.taskId);
    if (idx >= 0) {
      tasks.value[idx] = { ...tasks.value[idx], ...taskData };
    }

    // 更新画布中的节点
    try {
      const node = graph.getCellById(selectedTask.value.taskId);
      if (node && typeof node.setData === 'function') {
        node.setData(selectedTask.value);
      }
    } catch (error) {
      console.error('更新画布节点失败:', error);
    }
  }
};

// 处理关闭任务配置弹框
const handleTaskConfigClose = () => {
  showPropertyDialog.value = false;
  selectedTask.value = null;
  upstreamOutputModelForDrawer.value = null;
};

// 处理任务ID更新
const handleTaskIdUpdate = ({ oldTaskId, newTaskId }) => {
  // 更新所有相关边的ID
  edges.value.forEach((edge) => {
    if (edge.sourceTaskId === oldTaskId) {
      edge.sourceTaskId = newTaskId;
    }
    if (edge.sinkTaskId === oldTaskId) {
      edge.sinkTaskId = newTaskId;
    }
  });
};
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
