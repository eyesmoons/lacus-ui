<template>
    <div class="app-container">
        <el-tabs v-model="activeTab">
            <el-tab-pane label="基本信息" name="tableInfo">
                <el-form :model="form" label-width="100px">
                    <el-row :gutter="24">
                        <el-col :span="8">
                            <el-form-item label="数据源：">{{ metadata.tableInfo.datasourceName }}</el-form-item>
                        </el-col>
                        <el-col :span="8">
                            <el-form-item label="数据库：">{{ metadata.tableInfo.dbName }}</el-form-item>
                        </el-col>
                        <el-col :span="8">
                            <el-form-item label="表名：">{{ metadata.tableInfo.tableName }}</el-form-item>
                        </el-col>
                    </el-row>
                    <el-row :gutter="24">
                        <el-col :span="8">
                            <el-form-item label="备注：">{{ metadata.tableInfo.comment }}</el-form-item>
                        </el-col>
                        <el-col :span="8">
                            <el-form-item label="类型：">{{ metadata.tableInfo.type }}</el-form-item>
                        </el-col>
                        <el-col :span="8">
                            <el-form-item label="引擎：">{{ displayValue(metadata.tableInfo.engine) }}</el-form-item>
                        </el-col>
                    </el-row>
                    <el-row :gutter="24">
                        <el-col :span="8">
                            <el-form-item label="表类别：">
                                <el-tag v-if="isVirtual" type="warning" size="small">虚拟表</el-tag>
                                <span v-else>普通表</span>
                            </el-form-item>
                        </el-col>
                        <el-col :span="16">
                            <el-form-item label="创建表时间：">{{ parseTime(metadata.tableInfo.tableCreateTime) }}</el-form-item>
                        </el-col>
                    </el-row>
                </el-form>
            </el-tab-pane>
            <el-tab-pane name="columnInfo">
                <template #label>
                  <span>字段信息</span>
                  <el-button
                      v-if="isVirtual"
                      type="primary"
                      size="small"
                      icon="Plus"
                      link
                      v-hasPermission="['metadata:datasource:edit']"
                      @click.stop.prevent="openAddVirtualColumn"
                  >新增字段</el-button>
                </template>
                <el-table :data="columnList" stripe border>
                    <el-table-column label="字段名" align="left" prop="columnName" />
                    <el-table-column label="备注" align="left" prop="comment" show-overflow-tooltip/>
                    <el-table-column label="数据类型" align="left" prop="dataType" />
                    <el-table-column label="字段类型" align="left" prop="columnType" />
                    <el-table-column label="字段长度" align="left" prop="columnLength" />
                    <el-table-column label="允许为空" align="left" prop="isNullable" />
                    <el-table-column label="默认值" align="left" prop="columnDefault" />
                    <!-- 业务元数据:字段级业务含义,可编辑(COLUMN 级 description 键) -->
                    <el-table-column label="业务含义" align="left" min-width="180">
                        <template #default="scope">
                            <div class="biz-column-cell">
                                <span v-if="!editingColumn || editingColumn !== scope.row.columnId" @dblclick="editColumnBiz(scope.row)" class="biz-column-text">
                                    {{ columnBizText[scope.row.columnId] || '-' }}
                                </span>
                                <template v-else>
                                    <el-input
                                        v-model="columnBizInput"
                                        size="small"
                                        maxlength="500"
                                        placeholder="字段业务含义"
                                        @keyup.enter="saveColumnBiz(scope.row)"
                                    />
                                    <el-button type="primary" size="small" icon="Check" circle @click="saveColumnBiz(scope.row)" />
                                    <el-button icon="Close" circle size="small" @click="editingColumn = null" />
                                </template>
                            </div>
                        </template>
                    </el-table-column>
                    <el-table-column label="创建时间" align="left" prop="createTime" >
                        <template #default="scope">
                            <span>{{ parseTime(scope.row.createTime) }}</span>
                        </template>
                    </el-table-column>
                </el-table>
            </el-tab-pane>
            <el-tab-pane label="业务元数据" name="bizMeta" lazy>
                <BusinessMetaPanel
                    v-if="tableId"
                    biz-type="TABLE"
                    :biz-id="tableId"
                    :editable="$permissionChecker.hasPermission('metadata:bizmeta:edit')"
                />
            </el-tab-pane>
            <el-tab-pane label="数据血缘" name="lineage" lazy>
                <LineagePanel v-if="tableId" :table-id="tableId" />
            </el-tab-pane>
        </el-tabs>
    </div>

    <!-- 虚拟表新增字段对话框(批量) -->
    <el-dialog title="新增虚拟字段" v-model="virtualColumnDialogVisible" width="760px" append-to-body>
      <el-form ref="virtualColumnFormRef" :model="virtualColumnForm" :rules="virtualColumnRules" label-width="90px">
        <el-button type="primary" plain icon="Plus" size="small" @click="virtualColumnForm.columns.push(newColumnRow())" style="margin-bottom:8px;">添加字段</el-button>
        <el-table :data="virtualColumnForm.columns" stripe border size="small" max-height="360">
          <el-table-column label="字段名" prop="columnName" min-width="120">
            <template #default="scope">
              <el-form-item :prop="`columns.${scope.$index}.columnName`" :rules="[{ required: true, message: '必填', trigger: 'blur' }]" label-width="0">
                <el-input v-model="scope.row.columnName" placeholder="字段名" maxlength="128" />
              </el-form-item>
            </template>
          </el-table-column>
          <el-table-column label="类型" prop="dataType" width="110">
            <template #default="scope">
              <el-select v-model="scope.row.dataType" @change="scope.row.columnLength = columnTypeNeedsLength(scope.row.dataType) ? 255 : null">
                <el-option v-for="t in columnTypeOptions" :key="t" :label="t" :value="t" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="长度" prop="columnLength" width="90">
            <template #default="scope">
              <el-input-number v-if="columnTypeNeedsLength(scope.row.dataType)" v-model="scope.row.columnLength" :min="1" :max="65535" controls-position="right" size="small" />
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="允许为空" prop="nullable" width="90">
            <template #default="scope">
              <el-switch v-model="scope.row.nullable" />
            </template>
          </el-table-column>
          <el-table-column label="备注" prop="comment" min-width="140">
            <template #default="scope">
              <el-input v-model="scope.row.comment" placeholder="备注" maxlength="255" />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="60" align="center">
            <template #default="scope">
              <el-button type="danger" link icon="Delete" @click="virtualColumnForm.columns.splice(scope.$index, 1)" />
            </template>
          </el-table-column>
        </el-table>
      </el-form>
      <template #footer>
        <el-button @click="virtualColumnDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="submitVirtualColumn">确 定</el-button>
      </template>
    </el-dialog>
</template>

<script setup name="TableDetail">
import * as tableApi from '@/api/metadata/tableApi';
import * as columnApi from '@/api/metadata/columnApi';
import * as businessMetaApi from '@/api/metadata/businessMetaApi';
import * as virtualApi from '@/api/metadata/virtualApi';
import BusinessMetaPanel from './components/BusinessMetaPanel.vue';
import LineagePanel from './components/LineagePanel.vue';
const route = useRoute();
const {proxy} = getCurrentInstance();
const loading = ref(true);
const activeTab = ref('tableInfo');
const tableId = computed(() => route.params && route.params.tableId);
const columnList = ref([]);
const metadata = reactive({
    tableInfo: {},
    columnInfo:{}
});

// ===== 虚拟表兼容展示 =====
// tableType 为 VIRTUAL_*(KAFKA/HDFS)即虚拟表;兼容旧布尔别名 isVirtual
const isVirtual = computed(() => {
    const t = metadata.tableInfo;
    if (t.tableType) return String(t.tableType).startsWith('VIRTUAL');
    return t.isVirtual === true || t.isVirtual === 1;
});
function displayValue(v) {
    return v === null || v === undefined || v === '' ? '-' : v;
}

// ===== 字段级业务元数据(双击编辑,COLUMN 级 description 键)=====
const editingColumn = ref(null);
const columnBizInput = ref('');
const columnBizText = reactive({});

function editColumnBiz(row) {
    if (!proxy.$permissionChecker.hasPermission('metadata:bizmeta:edit')) {
        proxy.$modal.msgWarning('暂无业务元数据编辑权限');
        return;
    }
    editingColumn.value = row.columnId;
    columnBizInput.value = columnBizText[row.columnId] || '';
}

function saveColumnBiz(row) {
    const value = (columnBizInput.value || '').trim();
    businessMetaApi
        .saveBizMetaBatch({
            bizType: 'COLUMN',
            bizId: row.columnId,
            items: [{ objKey: 'description', objValue: value }],
        })
        .then(() => {
            proxy.$modal.msgSuccess(`已保存字段「${row.columnName}」的业务含义`);
            if (value) {
                columnBizText[row.columnId] = value;
            } else {
                delete columnBizText[row.columnId];
            }
            editingColumn.value = null;
        })
        .catch(() => {});
}

(() => {
    const id = tableId.value;
    if (id) {
        tableApi.tableDetail(id).then((response) => {
            metadata.tableInfo = response;
        });
        columnApi.listColumn(id).then((response2) => {
            columnList.value = response2;
            loadColumnBizMeta(response2);
        });
    }
})();

// 加载各字段的业务含义(COLUMN 级 description 键,失败静默)
function loadColumnBizMeta(columns) {
    if (!columns || !columns.length || !route.params.tableId) return;
    columns.forEach((col) => {
        businessMetaApi
            .getBizMeta('COLUMN', col.columnId)
            .then((list) => {
                const desc = (list || []).find((m) => m.objKey === 'description');
                if (desc && desc.objValue) {
                    columnBizText[col.columnId] = desc.objValue;
                }
            })
            .catch(() => {});
    });
}

// ===== 虚拟表新增字段 =====
const virtualColumnDialogVisible = ref(false);
const virtualColumnFormRef = ref(null);
const virtualColumnForm = reactive({ columns: [] });
const virtualColumnRules = {
    columns: [{ validator: validateColumns, trigger: 'blur' }],
};
const columnTypeOptions = ['string', 'int64', 'float64', 'boolean', 'datetime', 'timestamp'];
const columnTypeNeedsLength = (t) => String(t || '').toLowerCase() === 'string';

function validateColumns(rule, value, callback) {
    const cols = virtualColumnForm.columns || [];
    if (cols.length === 0) {
        callback(new Error('请至少添加一个字段'));
        return;
    }
    for (let i = 0; i < cols.length; i++) {
        const c = cols[i];
        if (!c.columnName || !c.columnName.trim()) {
            callback(new Error(`第${i + 1}行字段名不能为空`));
            return;
        }
        if (columnTypeNeedsLength(c.dataType) && (!c.columnLength || c.columnLength <= 0)) {
            callback(new Error(`第${i + 1}行字符串类型需指定有效长度`));
            return;
        }
    }
    callback();
}
function newColumnRow() {
    return { columnName: '', dataType: 'string', columnLength: 255, nullable: true, comment: '' };
}

function openAddVirtualColumn() {
    virtualColumnForm.columns = [newColumnRow()];
    virtualColumnDialogVisible.value = true;
}

function submitVirtualColumn() {
    proxy.$refs.virtualColumnFormRef.validate((valid) => {
        if (!valid) return;
        const info = metadata.tableInfo || {};
        const cols = (virtualColumnForm.columns || []).map((c) => ({
            columnName: c.columnName,
            dataType: c.dataType,
            comment: c.comment,
            nullable: c.nullable,
            columnLength: columnTypeNeedsLength(c.dataType) ? c.columnLength : null,
        }));
        virtualApi.createColumnsBatch({
            datasourceId: info.datasourceId,
            dbName: info.dbName,
            tableName: info.tableName,
            columns: cols,
        }).then(() => {
            proxy.$modal.msgSuccess('新增字段成功');
            virtualColumnDialogVisible.value = false;
            if (route.params.tableId) {
                columnApi.listColumn(route.params.tableId).then((resp) => {
                    columnList.value = resp;
                    loadColumnBizMeta(resp);
                });
            }
        }).catch(() => {});
    });
}
</script>

<style scoped>
.biz-column-cell {
    display: flex;
    align-items: center;
    gap: 4px;
}
.biz-column-text {
    cursor: default;
    min-height: 18px;
    display: inline-block;
    min-width: 60px;
}
</style>
