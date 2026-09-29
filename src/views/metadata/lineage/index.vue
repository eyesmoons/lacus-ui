<template>
  <div class="app-container lineage-page">
    <div class="lineage-toolbar">
      <el-select
        v-model="selectedTableId"
        filterable
        remote
        clearable
        reserve-keyword
        style="width: 320px"
        placeholder="输入表名搜索并查看血缘"
        :remote-method="searchTables"
        :loading="searchLoading"
        @change="handleTableChange"
      >
        <el-option
          v-for="item in tableOptions"
          :key="item.tableId"
          :label="`${item.tableName}(${item.datasourceName}/${item.dbName})`"
          :value="item.tableId"
        />
      </el-select>
      <el-radio-group v-model="direction" @change="loadGraph">
        <el-radio-button label="full">全链路</el-radio-button>
        <el-radio-button label="upstream">仅上游</el-radio-button>
        <el-radio-button label="downstream">仅下游</el-radio-button>
      </el-radio-group>
      <el-button icon="FullScreen" @click="fitGraph">适应画布</el-button>
    </div>

    <div v-show="truncated" class="lineage-truncated-tip">
      血缘层级超过展示上限({{ depth }} 跳),已截断显示,可缩小方向范围或联系管理员调整深度。
    </div>
    <el-empty
      v-if="!loading && !hasGraphData"
      description="暂无血缘数据:请在上方搜索一张表,或到表详情页登记血缘关系"
    />
    <div v-loading="loading" ref="graphContainer" class="graph-container"></div>

    <!-- 节点点击浮层 -->
    <teleport to="body">
      <div v-if="popoverNode.visible" class="node-popover" :style="popoverStyle">
        <div class="node-popover-title">{{ popoverNode.name }}</div>
        <div class="node-popover-sub">{{ popoverNode.sub }}</div>
        <el-button type="primary" size="small" text @click="goDetail(popoverNode)">查看表详情</el-button>
        <el-button size="small" text @click="expandFrom(popoverNode)">以此为起点展开</el-button>
      </div>
    </teleport>
  </div>
</template>

<script setup name="lineage">
import { Graph } from '@antv/x6';
import * as lineageApi from '@/api/metadata/lineageApi';
import * as tableApi from '@/api/metadata/tableApi';

const route = useRoute();
const router = useRouter();
const graphContainer = ref(null);
const loading = ref(false);
const searchLoading = ref(false);
const tableOptions = ref([]);
const selectedTableId = ref(null);
const direction = ref('full');
const truncated = ref(false);
const hasGraphData = ref(false);
const depth = 5;

let graph = null;
let currentNodeId = null;

// ===== 表搜索 =====
function searchTables(keyword) {
  if (!keyword) {
    tableOptions.value = [];
    return;
  }
  searchLoading.value = true;
  tableApi
    .listTable({ tableName: keyword })
    .then((response) => {
      tableOptions.value = response || [];
    })
    .catch(() => {})
    .finally(() => {
      searchLoading.value = false;
    });
}

function handleTableChange(tableId) {
  if (tableId) {
    loadGraph();
  } else {
    clearGraph();
  }
}

// ===== 图数据加载与渲染 =====
function loadGraph() {
  if (!selectedTableId.value) return;
  loading.value = true;
  lineageApi
    .getLineageGraph(selectedTableId.value, direction.value, depth)
    .then((response) => {
      truncated.value = !!response.truncated;
      renderGraph(response.nodes || [], response.edges || []);
    })
    .catch(() => {})
    .finally(() => {
      loading.value = false;
    });
}

/**
 * BFS 分层布局:当前节点居左,沿数据流方向向右分层;x 按层级递进,y 层内均分
 */
function layout(nodes, edges) {
  const nodeById = new Map(nodes.map((n) => [n.nodeId, n]));
  // 无向邻接表(分层只需拓扑位置,方向由箭头表达)
  const adjacency = new Map(nodes.map((n) => [n.nodeId, []]));
  edges.forEach((e) => {
    if (adjacency.has(e.sourceNodeId) && adjacency.has(e.targetNodeId)) {
      adjacency.get(e.sourceNodeId).push(e.targetNodeId);
      adjacency.get(e.targetNodeId).push(e.sourceNodeId);
    }
  });

  const level = new Map();
  if (currentNodeId != null && nodeById.has(currentNodeId)) {
    level.set(currentNodeId, 0);
    let queue = [currentNodeId];
    while (queue.length) {
      const next = [];
      queue.forEach((id) => {
        (adjacency.get(id) || []).forEach((t) => {
          if (!level.has(t)) {
            level.set(t, level.get(id) + 1);
            next.push(t);
          }
        });
      });
      queue = next;
    }
  }

  // 未连通的孤立节点按序补层
  nodes.forEach((n) => {
    if (!level.has(n.nodeId)) {
      level.set(n.nodeId, 0);
    }
  });

  const byLevel = new Map();
  nodes.forEach((n) => {
    const lv = level.get(n.nodeId);
    if (!byLevel.has(lv)) byLevel.set(lv, []);
    byLevel.get(lv).push(n);
  });

  const X_STEP = 240;
  const Y_STEP = 96;
  const positioned = {};
  byLevel.forEach((group, lv) => {
    group.forEach((n, idx) => {
      positioned[n.nodeId] = { x: lv * X_STEP + 40, y: idx * Y_STEP + 40 };
    });
  });
  return positioned;
}

function nodeSubtitle(node) {
  return `${node.datasourceName || '-'} / ${node.dbName || '-'}`;
}

function renderGraph(nodes, edges) {
  if (!graph) initGraph();
  clearGraph(false);
  if (!nodes.length) {
    hasGraphData.value = false;
    return;
  }
  hasGraphData.value = true;
  const positions = layout(nodes, edges);

  // 记录当前表对应的节点ID,用于高亮与 BFS 起点
  const current = nodes.find(
    (n) => String(n.tableId) === String(selectedTableId.value)
  );
  currentNodeId = current ? current.nodeId : null;

  const isCurrent = (n) => String(n.tableId) === String(selectedTableId.value);

  const graphNodes = nodes.map((n) => ({
    id: `n_${n.nodeId}`,
    x: positions[n.nodeId].x,
    y: positions[n.nodeId].y,
    width: 160,
    height: 48,
    shape: 'lineage-node',
    data: { ...n },
    attrs: {
      body: {
        stroke: isCurrent(n) ? '#1c84c6' : '#dcdfe6',
        strokeWidth: isCurrent(n) ? 2 : 1,
        fill: isCurrent(n) ? '#ecf5ff' : '#ffffff',
        rx: 8,
        ry: 8,
      },
      title: { text: n.nodeName },
      sub: { text: nodeSubtitle(n) },
    },
  }));

  const graphEdges = edges.map((e) => ({
    id: `e_${e.edgeId}`,
    shape: 'edge',
    source: { cell: `n_${e.sourceNodeId}` },
    target: { cell: `n_${e.targetNodeId}` },
    attrs: {
      line: {
        stroke: '#a3b7cc',
        strokeWidth: 1.5,
        targetMarker: { name: 'block', size: 9, fill: '#a3b7cc' },
        sourceMarker: null,
      },
    },
    zIndex: 0,
    data: { edgeId: e.edgeId, sourceFlag: e.sourceFlag },
  }));

  graph.fromJSON({ cells: [...graphNodes, ...graphEdges] });
  graph.centerContent();
}

function initGraph() {
  Graph.registerNode(
    'lineage-node',
    {
      inherit: 'rect',
      width: 160,
      height: 48,
      markup: [
        { tagName: 'rect', selector: 'body' },
        { tagName: 'text', selector: 'title' },
        { tagName: 'text', selector: 'sub' },
      ],
      attrs: {
        body: { rx: 8, ry: 8, fill: '#ffffff', stroke: '#dcdfe6', cursor: 'pointer' },
        title: {
          text: '',
          x: 10,
          y: 12,
          fontSize: 13,
          fontWeight: 600,
          fill: '#303133',
          cursor: 'pointer',
        },
        sub: {
          text: '',
          x: 10,
          y: 30,
          fontSize: 11,
          fill: '#909399',
          cursor: 'pointer',
        },
      },
    },
    true
  );

  graph = new Graph({
    container: graphContainer.value,
    width: graphContainer.value.clientWidth,
    height: graphContainer.value.clientHeight,
    grid: { size: 16, visible: true, type: 'dot', args: { color: '#e4e7ed' } },
    background: { color: '#fafbfd' },
    interacting: false, // 只读浏览:节点不可拖改,画布平移缩放仍可用
    panning: { enabled: true, modifiers: [] },
    mousewheel: { enabled: true, modifiers: null, minScale: 0.2, maxScale: 2 },
  });

  graph.on('node:click', ({ e, node }) => {
    const data = node.getData() || {};
    popoverNode.value = {
      visible: true,
      nodeId: data.nodeId,
      tableId: data.tableId,
      name: data.nodeName,
      sub: nodeSubtitle(data),
    };
    mousePos.value = { x: e.clientX, y: e.clientY };
  });
  graph.on('blank:click', () => {
    popoverNode.value = { visible: false };
  });
}

function fitGraph() {
  if (graph && hasGraphData.value) {
    graph.zoomToFit({ padding: 24, maxScale: 1 });
  }
}

/** 从浮层选中的节点重新展开血缘 */
function expandFrom(node) {
  popoverNode.value = { visible: false };
  const hit = tableOptions.value.find((t) => String(t.tableId) === String(node.tableId));
  if (hit) {
    selectedTableId.value = hit.tableId;
  } else {
    tableOptions.value = [
      { tableId: node.tableId, tableName: node.name, datasourceName: '', dbName: '' },
    ];
    selectedTableId.value = node.tableId;
  }
  loadGraph();
}

function goDetail(node) {
  popoverNode.value = { visible: false };
  router.push(`/metadata/table-manager/detail/${node.tableId}`);
}

function clearGraph(hidePopover = true) {
  if (hidePopover) popoverNode.value = { visible: false };
  hasGraphData.value = false;
  if (graph) graph.fromJSON({ cells: [] });
}

// ===== 节点浮层 =====
const popoverNode = ref({ visible: false });
const mousePos = ref({ x: 0, y: 0 });
const popoverStyle = computed(() => ({
  left: `${mousePos.value.x + 8}px`,
  top: `${mousePos.value.y + 8}px`,
}));

onMounted(() => {
  // 支持从表详情页带 tableId 直接进入
  const tableId = route.query.tableId;
  if (tableId) {
    tableApi
      .tableDetail(tableId)
      .then((detail) => {
        const row = {
          tableId: Number(tableId),
          tableName: detail.tableName,
          datasourceName: detail.datasourceName,
          dbName: detail.dbName,
        };
        tableOptions.value = [row];
        selectedTableId.value = row.tableId;
        loadGraph();
      })
      .catch(() => {});
  }
});

onBeforeUnmount(() => {
  if (graph) {
    graph.dispose();
    graph = null;
  }
});
</script>

<style scoped>
.lineage-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}
.graph-container {
  height: calc(100vh - 220px);
  min-height: 420px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
}
.lineage-truncated-tip {
  margin-bottom: 8px;
  padding: 6px 12px;
  background: #fdf6ec;
  border: 1px solid #faecd8;
  border-radius: 4px;
  color: #b88230;
  font-size: 13px;
}
.node-popover {
  position: fixed;
  z-index: 3000;
  padding: 12px 16px;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}
.node-popover-title {
  font-weight: 600;
  margin-bottom: 2px;
}
.node-popover-sub {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}
</style>
