<template>
    <div class="app-container">
        <el-row :gutter="20">
            <!-- 数据源和数据库 -->
            <el-col :span="4" :xs="24">
                <div class="head-container">
                    <el-input v-model="datasourceName" placeholder="请输入数据源名称" clearable prefix-icon="Search" style="margin-bottom: 20px"/>
                </div>
                <div class="head-container">
                    <el-tree
                            :data="dbTableOptions"
                            :load="loadDatabaseList"
                            class="tree-view structure-tree scroll-bar"
                            :filter-node-method="filterNode"
                            lazy
                            ref="dbTableRef"
                            highlight-current
                            node-key="uniqueFlag"
                            @node-click="handleNodeClick"
                            :props="{ label: 'label', isLeaf: 'isLeaf' }"/>
                </div>
            </el-col>

            <!-- 数据表 -->
            <el-col :span="20" :xs="24">
                <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
                    <el-form-item label="数据表" prop="tableName">
                        <el-input
                                v-model="queryParams.tableName"
                                placeholder="请输入表名"
                                clearable
                                style="width: 240px"
                                @keyup.enter="handleQuery"/>
                    </el-form-item>
                    <el-form-item>
                        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
                        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
                        <el-tooltip :content="virtualBtnTip" placement="top">
                            <el-button
                                    type="warning"
                                    icon="Plus"
                                    :disabled="!isVirtualDs"
                                    v-hasPermission="['metadata:datasource:edit']"
                                    @click="openCreateDb">登记虚拟库表</el-button>
                        </el-tooltip>
                        <template v-if="isVirtualDs && selectedLevel === 2">
                            <el-button type="warning" icon="Edit" v-hasPermission="['metadata:datasource:edit']" @click="openEditDb">编辑虚拟库</el-button>
                            <el-button type="danger" icon="Delete" v-hasPermission="['metadata:datasource:edit']" @click="handleDeleteDb">删除虚拟库</el-button>
                        </template>
                    </el-form-item>
                </el-form>

                <!-- 列表数据 -->
                <el-table v-loading="loading" :data="tableList" stripe border>
                    <el-table-column type="selection" width="50" align="center" />
                    <el-table-column
                            label="数据源"
                            align="left"
                            key="datasourceName"
                            prop="datasourceName"
                            :show-overflow-tooltip="true"
                    />
                    <el-table-column
                            label="数据库"
                            align="left"
                            key="dbName"
                            prop="dbName"
                            :show-overflow-tooltip="true"
                    />
                    <el-table-column
                            label="表名"
                            align="left"
                            key="tableName"
                            prop="tableName"
                            :show-overflow-tooltip="true"
                    />
                    <el-table-column label="类型" align="center" key="tableType" prop="tableType" width="90">
                        <template #default="scope">
                            <el-tag v-if="isVirtualTable(scope.row)" type="warning" size="small">虚拟表</el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column
                            label="备注"
                            align="left"
                            key="comment"
                            prop="comment"
                            :show-overflow-tooltip="true"
                    />
                    <el-table-column label="创建表时间" align="center" prop="tableCreateTime" width="160">
                        <template #default="scope">
                            <span>{{ parseTime(scope.row.tableCreateTime) }}</span>
                        </template>
                    </el-table-column>
                    <el-table-column label="操作" align="center" width="260" class-name="small-padding fixed-width">
                        <template #default="scope">
                            <el-button-group class="ml-4">
                            <el-tooltip content="详情" placement="top">
                                <el-button type="primary" icon="view" v-hasPermission="['metadata:table:query']" @click="handleDetail(scope.row)"/>
                            </el-tooltip>
                            <template v-if="isVirtualTable(scope.row)">
                                <el-tooltip content="编辑" placement="top">
                                    <el-button type="warning" icon="Edit" v-hasPermission="['metadata:datasource:edit']" @click="openEditTable(scope.row)"/>
                                </el-tooltip>
                                <el-tooltip content="新增字段" placement="top">
                                    <el-button type="success" icon="Plus" v-hasPermission="['metadata:datasource:edit']" @click="openAddColumn(scope.row)"/>
                                </el-tooltip>
                                <el-tooltip content="删除" placement="top">
                                    <el-button type="danger" icon="Delete" v-hasPermission="['metadata:datasource:edit']" @click="handleDeleteTable(scope.row)"/>
                                </el-tooltip>
                            </template>
                            </el-button-group>
                        </template>
                    </el-table-column>
                </el-table>
                <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList"/>
            </el-col>
        </el-row>

    <!-- 虚拟库/表登记对话框 -->
    <el-dialog :title="virtualStep === 1 ? '登记虚拟数据库' : '登记虚拟表'" v-model="virtualDialogVisible" width="480px" append-to-body>
      <el-form ref="virtualFormRef" :model="virtualForm" :rules="virtualRules" label-width="90px">
        <template v-if="virtualStep === 1">
          <el-form-item label="数据源" prop="datasourceId">
            <el-input :model-value="currentDsName" disabled />
          </el-form-item>
          <el-form-item label="数据库名" prop="dbName">
            <el-input v-model="virtualForm.dbName" placeholder="请输入虚拟库名" maxlength="128" />
          </el-form-item>
          <el-form-item label="备注" prop="comment">
            <el-input v-model="virtualForm.comment" type="textarea" :rows="2" maxlength="255" />
          </el-form-item>
        </template>
        <template v-else>
          <el-form-item label="数据源" prop="datasourceId">
            <el-input :model-value="currentDsName" disabled />
          </el-form-item>
          <el-form-item label="数据库" prop="dbName">
            <el-input :model-value="virtualForm.dbName" disabled />
          </el-form-item>
          <el-form-item label="表名" prop="tableName">
            <el-input v-model="virtualForm.tableName" placeholder="请输入虚拟表名" maxlength="300" />
          </el-form-item>
          <el-form-item label="备注" prop="comment">
            <el-input v-model="virtualForm.comment" type="textarea" :rows="2" maxlength="500" />
          </el-form-item>
        </template>
      </el-form>
      <template #footer>
        <el-button @click="virtualDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="submitVirtualStep">{{ virtualStep === 1 ? '创建库' : '创建表' }}</el-button>
      </template>
    </el-dialog>

    <!-- 编辑虚拟数据库对话框 -->
    <el-dialog title="编辑虚拟数据库" v-model="editDbDialogVisible" width="480px" append-to-body>
      <el-form ref="editDbFormRef" :model="editDbForm" :rules="virtualRules" label-width="90px">
        <el-form-item label="数据源" prop="datasourceName">
          <el-input :model-value="editDbForm.datasourceName" disabled />
        </el-form-item>
        <el-form-item label="数据库名" prop="dbName">
          <el-input v-model="editDbForm.dbName" placeholder="请输入虚拟库名" maxlength="128" />
        </el-form-item>
        <el-form-item label="备注" prop="comment">
          <el-input v-model="editDbForm.comment" type="textarea" :rows="2" maxlength="255" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDbDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="submitEditDb">保 存</el-button>
      </template>
    </el-dialog>

    <!-- 编辑虚拟表对话框 -->
    <el-dialog title="编辑虚拟表" v-model="editTableDialogVisible" width="480px" append-to-body>
      <el-form ref="editTableFormRef" :model="editTableForm" :rules="virtualRules" label-width="90px">
        <el-form-item label="数据源" prop="datasourceName">
          <el-input :model-value="editTableForm.datasourceName" disabled />
        </el-form-item>
        <el-form-item label="数据库" prop="dbName">
          <el-input :model-value="editTableForm.dbName" disabled />
        </el-form-item>
        <el-form-item label="表名" prop="tableName">
          <el-input v-model="editTableForm.tableName" placeholder="请输入虚拟表名" maxlength="300" />
        </el-form-item>
        <el-form-item label="备注" prop="comment">
          <el-input v-model="editTableForm.comment" type="textarea" :rows="2" maxlength="500" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editTableDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="submitEditTable">保 存</el-button>
      </template>
    </el-dialog>

    <!-- 新增虚拟字段对话框(批量) -->
    <el-dialog title="新增虚拟字段" v-model="addColumnDialogVisible" width="760px" append-to-body>
      <el-form ref="addColumnFormRef" :model="addColumnForm" :rules="addColumnRules" label-width="90px">
        <el-button type="primary" plain icon="Plus" size="small" @click="addColumnForm.columns.push(newColumnRow())" style="margin-bottom:8px;">添加字段</el-button>
        <el-table :data="addColumnForm.columns" stripe border size="small" max-height="360">
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
              <el-button type="danger" link icon="Delete" @click="addColumnForm.columns.splice(scope.$index, 1)" />
            </template>
          </el-table-column>
        </el-table>
      </el-form>
      <template #footer>
        <el-button @click="addColumnDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="submitAddColumn">确 定</el-button>
      </template>
    </el-dialog>
    </div>
</template>

<script setup name="MetadataTable">
import * as datasourceApi from '@/api/metadata/datasourceApi';
import * as dbApi from '@/api/metadata/dbApi';
import * as tableApi from "@/api/metadata/tableApi";
import * as virtualApi from '@/api/metadata/virtualApi';

const VIRTUAL_DATASOURCE_TYPES = ['KAFKA', 'HDFS'];

const router = useRouter();
const { proxy } = getCurrentInstance();
const tableList = ref([]);
const loading = ref(true);
const showSearch = ref(true);
const total = ref(0);
const dbTableOptions = ref([]);
const datasourceName = ref('');
const currentDsType = ref('');
const currentDsName = ref('');
const currentDsId = ref(null);
const currentDbId = ref(null);
const currentDbName = ref('');
const currentDbComment = ref('');
const selectedLevel = ref(0); // 1=选中数据源, 2=选中虚拟库
const virtualDialogVisible = ref(false);
const virtualFormRef = ref(null);
const virtualStep = ref(1); // 1=建库, 2=建表(由选中层级决定,单步提交)
const virtualForm = reactive({ datasourceId: undefined, dbName: '', tableName: '', comment: '' });
const editDbDialogVisible = ref(false);
const editDbFormRef = ref(null);
const editDbForm = reactive({ dbId: null, datasourceId: null, datasourceName: '', dbName: '', comment: '' });
const editTableDialogVisible = ref(false);
const editTableFormRef = ref(null);
const editTableForm = reactive({ tableId: null, datasourceId: null, datasourceName: '', dbName: '', tableName: '', comment: '' });
const addColumnDialogVisible = ref(false);
const addColumnFormRef = ref(null);
const addColumnForm = reactive({ tableId: null, datasourceId: null, dbName: '', tableName: '', columns: [] });
const addColumnRules = {
  columns: [{ validator: validateColumns, trigger: 'blur' }],
};
const columnTypeOptions = ['string', 'int64', 'float64', 'boolean', 'datetime', 'timestamp'];
const columnTypeNeedsLength = (t) => String(t || '').toLowerCase() === 'string';

function validateColumns(rule, value, callback) {
    const cols = addColumnForm.columns || [];
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
const virtualRules = {
  dbName: [{ required: true, message: '请输入虚拟库名', trigger: 'blur' }],
  tableName: [{ required: true, message: '请输入虚拟表名', trigger: 'blur' }],
};
const isVirtualDs = computed(() => VIRTUAL_DATASOURCE_TYPES.includes(String(currentDsType.value).toUpperCase()));
const virtualBtnTip = computed(() => {
    if (!currentDsId.value) return '请先在左侧选中虚拟数据源或虚拟库';
    if (!isVirtualDs.value) return '仅虚拟数据源(KAFKA/HDFS)支持登记虚拟库表';
    return selectedLevel.value === 2 ? `在虚拟库「${currentDbName.value}」下登记虚拟表` : '在选中虚拟数据源下登记虚拟数据库';
});
const data = reactive({
    form: {},
    queryParams: {
        pageNum: 1,
        pageSize: 10,
        tableName: undefined
    },
    rules: {}
});

const { queryParams, form, rules } = toRefs(data);

/** 虚拟表判断:tableType 为 VIRTUAL_*(KAFKA/HDFS)即虚拟表;兼容旧布尔别名 isVirtual */
function isVirtualTable(row) {
    if (row.tableType) return String(row.tableType).startsWith('VIRTUAL');
    return row.isVirtual === true || row.isVirtual === 1;
}

/** 通过条件过滤节点  */
const filterNode = (value, data) => {
    if (!value) return true;
    return data.label.indexOf(value) !== -1;
};

/**
 * 查询数据源下拉树
 */
function loadDatasourceList() {
    datasourceApi.getDatasourceList(queryParams.datasourceName, null).then((response) => {
        dbTableOptions.value = response;
    }).catch(() => {})
}

/**
 * 通过名称筛选数据源
 */
watch(datasourceName, (val) => {
    proxy.$refs.dbTableRef.filter(val);
});

/**
 * 根据数据源ID查询数据库列表
 * @param node
 * @param resolve
 */
function loadDatabaseList(node, resolve) {
    const data = node.data;
    if (node.level === 0) {
        return resolve([{ name: '' }]);
    }
    if (node.level > 1) return resolve([]);
    setTimeout(() => {
        dbApi.getDatasourceList(data.datasourceId).then((response) => {
            // 给库节点补父数据源信息,供虚拟登记按层级分支(选中数据源→建库,选中库→建表)
            const parentDsId = data.datasourceId;
            const parentDsName = data.datasourceName;
            const parentDsType = data.type;
            const children = (response || []).map((d) => ({
                ...d,
                parentDsId,
                parentDsName,
                parentDsType,
            }));
            resolve(children);
        });
    }, 500);
}

/**
 * 查询数据表列表
 */
function getList() {
    loading.value = true;
    tableApi
        .pageList(queryParams.value)
        .then((response) => {
            tableList.value = response.rows;
            total.value = response.total;
        })
        .finally(() => {
            loading.value = false;
        });
}

/**
 * 左侧树节点单击事件
 * @param data
 */
function handleNodeClick(data) {
    const nodeLevel = data.nodeLevel;
    if (nodeLevel === 1) {
        queryParams.value.datasourceId = data.datasourceId;
        queryParams.value.dbId = null;
        currentDsType.value = data.type;
        currentDsName.value = data.datasourceName;
        currentDsId.value = data.datasourceId;
        currentDbId.value = null;
        currentDbName.value = '';
        currentDbComment.value = '';
        selectedLevel.value = 1;
    } else if (nodeLevel === 2) {
        queryParams.value.dbId = data.dbId;
        queryParams.value.datasourceId = null;
        currentDbId.value = data.dbId;
        currentDbName.value = data.dbName;
        currentDbComment.value = data.comment || '';
        currentDsId.value = data.parentDsId;
        currentDsType.value = data.parentDsType;
        currentDsName.value = data.parentDsName;
        selectedLevel.value = 2;
    }
    handleQuery();
}

/**
 * 表单搜索
 */
function handleQuery() {
    queryParams.value.pageNum = 1;
    getList();
}

/**
 * 表单重置
 */
function resetQuery() {
    queryParams.value.datasourceId = null;
    queryParams.value.dbId = null;
    proxy.resetForm('queryRef');
    handleQuery();
}

function handleDetail(row) {
    const { tableId } = row;
    router.push(`/metadata/table-manager/detail/${tableId}`);
}

function openCreateDb() {
    // 按左侧选中层级分支:选中数据源→建库;选中虚拟库→建表
    virtualStep.value = selectedLevel.value === 2 ? 2 : 1;
    virtualForm.datasourceId = currentDsId.value;
    virtualForm.dbName = currentDbName.value || '';
    virtualForm.tableName = '';
    virtualForm.comment = '';
    virtualDialogVisible.value = true;
}

function submitVirtualStep() {
    if (virtualStep.value === 1) {
        proxy.$refs.virtualFormRef.validate((valid) => {
            if (!valid) return;
            virtualApi.createDb({
                datasourceId: virtualForm.datasourceId,
                dbName: virtualForm.dbName,
                comment: virtualForm.comment,
            }).then(() => {
                proxy.$modal.msgSuccess('建库成功');
                virtualDialogVisible.value = false;
                // 刷新左侧树:重新加载数据源列表(展开的库树由懒加载更新)
                loadDatasourceList();
                getList();
            }).catch(() => {});
        });
        return;
    }
    proxy.$refs.virtualFormRef.validate((valid) => {
        if (!valid) return;
        virtualApi.createTable({
            datasourceId: virtualForm.datasourceId,
            dbName: virtualForm.dbName,
            tableName: virtualForm.tableName,
            comment: virtualForm.comment,
        }).then(() => {
            proxy.$modal.msgSuccess('建表成功');
            virtualDialogVisible.value = false;
            getList();
        }).catch(() => {});
    });
}

// ==================== 虚拟库:编辑/删除 ====================

function openEditDb() {
    editDbForm.dbId = currentDbId.value;
    editDbForm.datasourceId = currentDsId.value;
    editDbForm.datasourceName = currentDsName.value;
    editDbForm.dbName = currentDbName.value;
    editDbForm.comment = currentDbComment.value;
    editDbDialogVisible.value = true;
}

function submitEditDb() {
    proxy.$refs.editDbFormRef.validate((valid) => {
        if (!valid) return;
        virtualApi.updateDb(editDbForm.dbId, {
            dbName: editDbForm.dbName,
            comment: editDbForm.comment,
        }).then(() => {
            proxy.$modal.msgSuccess('编辑虚拟库成功');
            editDbDialogVisible.value = false;
            loadDatasourceList();
            getList();
        }).catch(() => {});
    });
}

function handleDeleteDb() {
    proxy.$modal.confirm(`确认删除虚拟库「${currentDbName.value}」及其下所有虚拟表/字段吗?`).then(() => {
        return virtualApi.deleteDb(currentDbId.value);
    }).then(() => {
        proxy.$modal.msgSuccess('删除虚拟库成功');
        currentDbId.value = null;
        currentDbName.value = '';
        selectedLevel.value = 1;
        loadDatasourceList();
        getList();
    }).catch(() => {});
}

// ==================== 虚拟表:编辑/删除/新增字段 ====================

function openEditTable(row) {
    editTableForm.tableId = row.tableId;
    editTableForm.datasourceId = row.datasourceId;
    editTableForm.datasourceName = row.datasourceName;
    editTableForm.dbName = row.dbName;
    editTableForm.tableName = row.tableName;
    editTableForm.comment = row.comment;
    editTableDialogVisible.value = true;
}

function submitEditTable() {
    proxy.$refs.editTableFormRef.validate((valid) => {
        if (!valid) return;
        virtualApi.updateTable(editTableForm.tableId, {
            tableName: editTableForm.tableName,
            comment: editTableForm.comment,
        }).then(() => {
            proxy.$modal.msgSuccess('编辑虚拟表成功');
            editTableDialogVisible.value = false;
            getList();
        }).catch(() => {});
    });
}

function handleDeleteTable(row) {
    proxy.$modal.confirm(`确认删除虚拟表「${row.tableName}」及其下所有虚拟字段吗?`).then(() => {
        return virtualApi.deleteTable(row.tableId);
    }).then(() => {
        proxy.$modal.msgSuccess('删除虚拟表成功');
        getList();
    }).catch(() => {});
}

function openAddColumn(row) {
    addColumnForm.tableId = row.tableId;
    addColumnForm.datasourceId = row.datasourceId;
    addColumnForm.dbName = row.dbName;
    addColumnForm.tableName = row.tableName;
    addColumnForm.columns = [newColumnRow()];
    addColumnDialogVisible.value = true;
}

function submitAddColumn() {
    proxy.$refs.addColumnFormRef.validate((valid) => {
        if (!valid) return;
        const cols = (addColumnForm.columns || []).map((c) => ({
            columnName: c.columnName,
            dataType: c.dataType,
            comment: c.comment,
            nullable: c.nullable,
            columnLength: columnTypeNeedsLength(c.dataType) ? c.columnLength : null,
        }));
        virtualApi.createColumnsBatch({
            datasourceId: addColumnForm.datasourceId,
            dbName: addColumnForm.dbName,
            tableName: addColumnForm.tableName,
            columns: cols,
        }).then(() => {
            proxy.$modal.msgSuccess('新增字段成功');
            addColumnDialogVisible.value = false;
        }).catch(() => {});
    });
}

loadDatasourceList();
getList();
</script>
