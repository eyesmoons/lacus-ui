<template>
  <div class="lineage-panel">
    <el-row :gutter="16">
      <!-- 上游 -->
      <el-col :span="12">
        <div class="lineage-block">
          <div class="lineage-block-title">
            <span>上游依赖({{ upstreamList.length }})</span>
            <el-button
              type="primary"
              size="mini"
              icon="Plus"
              plain
              v-hasPermission="['metadata:lineage:edit']"
              @click="openAdd('UPSTREAM')"
              >登记上游</el-button
            >
          </div>
          <el-table :data="upstreamList" size="small" stripe border v-loading="loading">
            <el-table-column label="表名" align="left" prop="nodeName" show-overflow-tooltip />
            <el-table-column label="数据源/库" align="left" show-overflow-tooltip>
              <template #default="scope">{{ scope.row.datasourceName }} / {{ scope.row.dbName }}</template>
            </el-table-column>
            <el-table-column label="来源" align="center" width="70">
              <template #default="scope">
                <el-tag size="small" :type="scope.row.sourceFlag === 'AUTO' ? 'info' : 'success'">{{
                  scope.row.sourceFlag === 'AUTO' ? '采集' : '手动'
                }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" align="center" width="100">
              <template #default="scope">
                <el-button
                  type="primary"
                  icon="Edit"
                  size="mini"
                  text
                  v-if="scope.row.sourceFlag === 'MANUAL'"
                  v-hasPermission="['metadata:lineage:edit']"
                  @click="openEdit('UPSTREAM', scope.row)"
                />
                <el-button
                  type="danger"
                  icon="Delete"
                  size="mini"
                  text
                  v-if="scope.row.sourceFlag === 'MANUAL'"
                  v-hasPermission="['metadata:lineage:edit']"
                  @click="handleDelete(scope.row)"
                />
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-col>
      <!-- 下游 -->
      <el-col :span="12">
        <div class="lineage-block">
          <div class="lineage-block-title">
            <span>下游影响({{ downstreamList.length }})</span>
            <el-button
              type="primary"
              size="mini"
              icon="Plus"
              plain
              v-hasPermission="['metadata:lineage:edit']"
              @click="openAdd('DOWNSTREAM')"
              >登记下游</el-button
            >
          </div>
          <el-table :data="downstreamList" size="small" stripe border v-loading="loading">
            <el-table-column label="表名" align="left" prop="nodeName" show-overflow-tooltip />
            <el-table-column label="数据源/库" align="left" show-overflow-tooltip>
              <template #default="scope">{{ scope.row.datasourceName }} / {{ scope.row.dbName }}</template>
            </el-table-column>
            <el-table-column label="来源" align="center" width="70">
              <template #default="scope">
                <el-tag size="small" :type="scope.row.sourceFlag === 'AUTO' ? 'info' : 'success'">{{
                  scope.row.sourceFlag === 'AUTO' ? '采集' : '手动'
                }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" align="center" width="100">
              <template #default="scope">
                <el-button
                  type="primary"
                  icon="Edit"
                  size="mini"
                  text
                  v-if="scope.row.sourceFlag === 'MANUAL'"
                  v-hasPermission="['metadata:lineage:edit']"
                  @click="openEdit('DOWNSTREAM', scope.row)"
                />
                <el-button
                  type="danger"
                  icon="Delete"
                  size="mini"
                  text
                  v-if="scope.row.sourceFlag === 'MANUAL'"
                  v-hasPermission="['metadata:lineage:edit']"
                  @click="handleDelete(scope.row)"
                />
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-col>
    </el-row>

    <div class="lineage-footer">
      <el-button
        type="primary"
        plain
        icon="Share"
        v-hasPermission="['metadata:lineage:view']"
        @click="goGraphPage"
        >在血缘图中查看</el-button
      >
    </div>

    <!-- 登记血缘对话框 -->
    <el-dialog :title="addTitle" v-model="addOpen" width="520px" append-to-body>
      <el-form ref="addRef" :model="addForm" :rules="addRules" label-width="90px">
        <el-form-item :label="addForm.direction === 'UPSTREAM' ? '上游表' : '下游表'" prop="relatedTableId">
          <div class="cascade-selects">
            <el-select
              v-model="addForm.dsId"
              placeholder="数据源"
              filterable
              style="width: 32%"
              @change="onDsChange"
            >
              <el-option
                v-for="item in dsOptions"
                :key="item.datasourceId"
                :label="item.datasourceName"
                :value="item.datasourceId"
              />
            </el-select>
            <el-select
              v-model="addForm.dbName"
              placeholder="数据库"
              filterable
              clearable
              style="width: 32%"
              :disabled="!addForm.dsId"
              @change="onDbChange"
            >
              <el-option
                v-for="item in dbOptions"
                :key="item.dbId"
                :label="item.dbName"
                :value="item.dbName"
              />
            </el-select>
            <el-select
              v-model="addForm.relatedTableId"
              placeholder="表"
              filterable
              clearable
              style="width: 32%"
              :disabled="!addForm.dbName"
              :loading="tableLoading"
            >
              <el-option
                v-for="item in tableOptions"
                :key="item.tableId"
                :label="item.tableName"
                :value="item.tableId"
              />
            </el-select>
          </div>
        </el-form-item>
        <el-form-item label="依赖类型" prop="depType">
          <el-radio-group v-model="addForm.depType">
            <el-radio label="DIRECT">直接依赖</el-radio>
            <el-radio label="TRANSFORM">转换依赖</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="addForm.remark" type="textarea" :rows="2" placeholder="选填" maxlength="255" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="submitAdd">确 定</el-button>
        <el-button @click="addOpen = false">取 消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="LineagePanel">
import * as lineageApi from '@/api/metadata/lineageApi';
import * as tableApi from '@/api/metadata/tableApi';
import * as datasourceApi from '@/api/metadata/datasourceApi';
import * as dbApi from '@/api/metadata/dbApi';

const props = defineProps({
  tableId: { type: [String, Number], required: true },
});

const { proxy } = getCurrentInstance();
const router = useRouter();
const loading = ref(false);
const upstreamList = ref([]);
const downstreamList = ref([]);

const addOpen = ref(false);
const addRef = ref(null);
const tableLoading = ref(false);
const tableOptions = ref([]);
const dsOptions = ref([]);
const dbOptions = ref([]);
const addForm = reactive({
  direction: 'UPSTREAM',
  dsId: undefined,
  dbName: undefined,
  relatedTableId: undefined,
  depType: 'DIRECT',
  remark: undefined,
  editingEdgeId: undefined,
});
const addRules = {
  relatedTableId: [{ required: true, message: '请选择关联表', trigger: 'change' }],
};
const addTitle = computed(() =>
  addForm.editingEdgeId
    ? (addForm.direction === 'UPSTREAM' ? '编辑上游血缘' : '编辑下游血缘')
    : (addForm.direction === 'UPSTREAM' ? '登记上游血缘' : '登记下游血缘')
);

function load() {
  if (!props.tableId) return;
  loading.value = true;
  Promise.all([
    lineageApi.getLineageGraph(props.tableId, 'upstream', 1),
    lineageApi.getLineageGraph(props.tableId, 'downstream', 1),
  ])
    .then(([up, down]) => {
      // depth=1 时返回的直接邻居即上下游表;edges 携带 sourceFlag/edgeId 供展示与删除
      const upEdges = up.edges || [];
      const downEdges = down.edges || [];
      const nodeById = {};
      (up.nodes || []).concat(down.nodes || []).forEach((n) => {
        nodeById[n.nodeId] = n;
      });
      upstreamList.value = upEdges.map((e) => ({
        ...nodeById[e.sourceNodeId],
        edgeId: e.edgeId,
        sourceFlag: e.sourceFlag,
        depType: e.depType,
        remark: e.remark,
      }));
      downstreamList.value = downEdges.map((e) => ({
        ...nodeById[e.targetNodeId],
        edgeId: e.edgeId,
        sourceFlag: e.sourceFlag,
        depType: e.depType,
        remark: e.remark,
      }));
    })
    .catch(() => {})
    .finally(() => {
      loading.value = false;
    });
}

/** 三级联动:加载数据源列表 */
function loadDsOptions(selectedId) {
  datasourceApi
    .getDatasourceList('', null)
    .then((list) => {
      dsOptions.value = list || [];
      if (selectedId != null) {
        addForm.dsId = selectedId;
        onDsChange();
      }
    })
    .catch(() => {});
}

/** 切换数据源 → 加载其数据库列表,清空表 */
function onDsChange() {
  addForm.dbName = undefined;
  addForm.relatedTableId = undefined;
  tableOptions.value = [];
  if (!addForm.dsId) {
    dbOptions.value = [];
    return;
  }
  dbApi
    .getDatasourceList(addForm.dsId)
    .then((list) => {
      dbOptions.value = list || [];
    })
    .catch(() => {});
}

/** 切换数据库 → 加载该库下的表列表 */
function onDbChange() {
  addForm.relatedTableId = undefined;
  if (!addForm.dsId || !addForm.dbName) {
    tableOptions.value = [];
    return;
  }
  tableLoading.value = true;
  tableApi
    .listTable({ datasourceId: addForm.dsId, dbName: addForm.dbName })
    .then((response) => {
      tableOptions.value = (response || []).filter(
        (t) => String(t.tableId) !== String(props.tableId)
      );
    })
    .catch(() => {})
    .finally(() => {
      tableLoading.value = false;
    });
}

function openAdd(direction) {
  addForm.direction = direction;
  addForm.dsId = undefined;
  addForm.dbName = undefined;
  addForm.relatedTableId = undefined;
  addForm.depType = 'DIRECT';
  addForm.remark = undefined;
  addForm.editingEdgeId = undefined;
  dbOptions.value = [];
  tableOptions.value = [];
  loadDsOptions();
  addOpen.value = true;
}

function openEdit(direction, row) {
  addForm.direction = direction;
  addForm.depType = row.depType || 'DIRECT';
  addForm.remark = row.remark;
  addForm.editingEdgeId = row.edgeId;
  // 编辑时按当前行关联表三级预填(数据源/库/表),可改选
  loadDsOptions(row.datasourceId);
  dbApi
    .getDatasourceList(row.datasourceId)
    .then((list) => {
      dbOptions.value = list || [];
      if (row.dbName) {
        addForm.dbName = row.dbName;
        onDbChange();
      }
    })
    .catch(() => {});
  addForm.relatedTableId = row.tableId;
  addOpen.value = true;
}

function submitAdd() {
  proxy.$refs.addRef.validate((valid) => {
    if (!valid) return;
    if (addForm.editingEdgeId) {
      const data = { depType: addForm.depType, remark: addForm.remark };
      if (addForm.direction === 'UPSTREAM') {
        data.sourceTableId = addForm.relatedTableId;
      } else {
        data.targetTableId = addForm.relatedTableId;
      }
      lineageApi
        .updateLineageEdge(addForm.editingEdgeId, data)
        .then(() => {
          proxy.$modal.msgSuccess('修改成功');
          addOpen.value = false;
          load();
        })
        .catch(() => {});
      return;
    }
    // 本地去重:同一(源,目标)已存在时提示且不提交
    const exists =
      addForm.direction === 'UPSTREAM'
        ? upstreamList.value.some((r) => String(r.tableId) === String(addForm.relatedTableId))
        : downstreamList.value.some((r) => String(r.tableId) === String(addForm.relatedTableId));
    if (exists) {
      proxy.$modal.msgWarning('该血缘关系已存在');
      return;
    }
    const data =
      addForm.direction === 'UPSTREAM'
        ? { sourceTableId: addForm.relatedTableId, targetTableId: props.tableId }
        : { sourceTableId: props.tableId, targetTableId: addForm.relatedTableId };
    data.depType = addForm.depType;
    data.remark = addForm.remark;
    lineageApi
      .addLineageEdge(data)
      .then(() => {
        proxy.$modal.msgSuccess('登记成功');
        addOpen.value = false;
        load();
      })
      .catch(() => {});
  });
}

function handleDelete(row) {
  proxy.$modal
    .confirm(`确认删除与"${row.nodeName}"的血缘关系吗?`)
    .then(() => lineageApi.deleteLineageEdge(row.edgeId))
    .then(() => {
      proxy.$modal.msgSuccess('删除成功');
      load();
    })
    .catch(() => {});
}

function goGraphPage() {
  router.push(`/metadata/lineage?tableId=${props.tableId}`);
}

watch(
  () => props.tableId,
  () => load()
);
load();
</script>

<style scoped>
.lineage-block-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-weight: 600;
}
.lineage-footer {
  margin-top: 12px;
}
.cascade-selects {
  display: flex;
  gap: 6px;
  width: 100%;
}
</style>
