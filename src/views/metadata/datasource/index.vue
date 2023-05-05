<template>
    <div class="app-container">
        <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="90px">
            <el-form-item label="数据源名称" prop="datasourceName">
                <el-input v-model="queryParams.datasourceName" placeholder="请输入数据源名称" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="数据源类型" prop="type">
                <el-select v-model="queryParams.type" placeholder="请输入数据源类型" clearable filterable>
                    <el-option v-for="dict in datasource_type" :key="dict.value" :label="dict.label" :value="dict.label"/>
                </el-select>
            </el-form-item>
            <el-form-item label="ip" prop="ip">
                <el-input v-model="queryParams.ip" placeholder="请输入ip" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="启用状态" prop="status">
                <el-select v-model="queryParams.status" placeholder="启用状态" clearable>
                    <el-option v-for="dict in datasource_status" :key="dict.value" :label="dict.label" :value="dict.value" />
                </el-select>
            </el-form-item>
            <el-form-item>
                <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
                <el-button icon="Refresh" @click="resetQuery">重置</el-button>
            </el-form-item>
        </el-form>

        <el-row :gutter="10" class="mb8">
            <el-col :span="1.5">
                <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermission="['metadata:datasource:add']">新增</el-button>
            </el-col>
            <el-col :span="1.5">
                <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate" v-hasPermission="['metadata:datasource:edit']">修改</el-button>
            </el-col>
            <el-col :span="1.5">
                <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete" v-hasPermission="['metadata:datasource:remove']">删除</el-button>
            </el-col>
            <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
        </el-row>

        <el-table v-loading="loading" :data="datasourceList" stripe @selection-change="handleSelectionChange">
            <el-table-column type="selection" width="55" align="center" />
            <el-table-column label="数据源名称" align="left" prop="datasourceName" />
            <el-table-column label="数据源类型" align="left" prop="type" />
            <el-table-column label="ip/主机名" align="left" prop="ip" />
            <el-table-column label="端口" align="left" prop="port" />
            <el-table-column label="数据库名" align="left" prop="defaultDbName" />
            <el-table-column label="用户名" align="left" prop="username" />
            <el-table-column label="描述" align="left" prop="remark" show-overflow-tooltip/>
            <el-table-column label="启用状态" align="center" prop="status">
                <template #default="scope">
                    <el-switch v-model="scope.row.status" :active-value="1" :inactive-value="0" @change ="handleStatusChange(scope.row)" />
                </template>
            </el-table-column>
            <el-table-column label="创建时间" align="center" prop="createTime" :show-overflow-tooltip="true" width="120">
                <template #default="scope">
                    <span>{{ parseTime(scope.row.createTime) }}</span>
                </template>
            </el-table-column>
            <el-table-column label="操作" align="center">
                <template #default="scope">
                    <el-button-group class="ml-4">
                        <el-tooltip content="测试" placement="top">
                            <el-button link type="primary" icon="VideoPlay" @click="handleTest(scope.row)" v-hasPermission="['metadata:datasource:edit']"/>
                        </el-tooltip>
                        <el-tooltip content="编辑" placement="top">
                            <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermission="['metadata:datasource:edit']"/>
                        </el-tooltip>
                        <el-tooltip content="删除" placement="top">
                            <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermission="['metadata:datasource:remove']"/>
                        </el-tooltip>
                        <el-tooltip content="同步元数据" placement="top">
                            <el-button link type="primary" plain icon="Refresh" @click="handleSync(scope.row)" v-hasPermission="['metadata:datasource:edit']" />
                        </el-tooltip>
                    </el-button-group>
                </template>
            </el-table-column>
        </el-table>

        <!-- 分页 -->
        <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList"/>

        <!-- 添加或修改对话框 -->
        <el-dialog :title="title" v-model="open" width="600px" append-to-body>
            <el-form ref="datasourceRef" :model="form" :rules="rules" label-width="100px">
                <el-form-item label="数据源名称" prop="datasourceName">
                    <el-input v-model="form.datasourceName" placeholder="请输入数据源名称" />
                </el-form-item>
                <el-form-item label="数据源类型" prop="type">
                    <el-select v-model="form.type" placeholder="请选择数据源类型">
                        <el-option v-for="dict in datasource_type" :key="dict.value" :label="dict.label" :value="dict.label" />
                    </el-select>
                </el-form-item>
                <el-form-item label="ip/主机名" prop="ip">
                    <el-input v-model="form.ip" placeholder="请输入ip"/>
                </el-form-item>
                <el-form-item label="端口" prop="port">
                    <el-input v-model="form.port" placeholder="请输入端口"/>
                </el-form-item>
                <el-form-item label="数据库名" prop="defaultDbName">
                    <el-input v-model="form.defaultDbName" placeholder="请输入数据库名"/>
                </el-form-item>
                <el-form-item label="用户名" prop="username">
                    <el-input v-model="form.username" placeholder="请输入用户名"/>
                </el-form-item>
                <el-form-item label="密码" prop="password">
                    <el-input v-model="form.password" placeholder="请输入密码，不修改密码保持空即可" />
                </el-form-item>
                <el-form-item label="描述" prop="remark">
                    <el-input v-model="form.remark" placeholder="请输入描述"/>
                </el-form-item>
                <el-form-item label="连接参数" prop="connectionParams">
                    <el-input v-model="form.connectionParams" placeholder="请输入连接参数"/>
                </el-form-item>
                <el-form-item label="启用状态" prop="status">
                    <el-radio-group v-model="form.status">
                        <el-radio v-for="dict in datasource_status" :key="dict.value" :label="dict.value">{{ dict.label }}</el-radio>
                    </el-radio-group>
                </el-form-item>
            </el-form>
            <template #footer>
                <div class="dialog-footer">
                    <el-button type="primary" @click="submitForm">确 定</el-button>
                    <el-button @click="cancel">取 消</el-button>
                </div>
            </template>
        </el-dialog>

        <!-- 同步元数据弹框 -->
        <el-dialog title="同步元数据" v-model="syncMetaDialog" append-to-body>
            <el-form :model="form">
                <el-form-item label="请选择库表：" :label-width="100">
                    <el-tree class="tree-border"
                            :data="dbTableOptions"
                            lazy
                            :load="loadTables"
                            show-checkbox
                            ref="dbTableRef"
                            node-key="uniqueFlag"
                            empty-text="加载中，请稍候"
                            :props="{label: 'label', isLeaf: 'isLeaf'}">
                    </el-tree>
                </el-form-item>
            </el-form>
            <div slot="footer" class="dialog-footer">
                <el-button @click="cancelSync">取消</el-button>
                <el-button type="primary" @click="syncDbTables">确定</el-button>
            </div>
        </el-dialog>
    </div>
</template>

<script setup name="datasource">
import * as datasourceApi from '@/api/metadata/datasourceApi';
import * as schemaApi from "@/api/metadata/schemaApi";

const { proxy } = getCurrentInstance();
const { datasource_status, datasource_type} = proxy.useDict('datasource_status', 'datasource_type');
const datasourceList = ref([]);
const open = ref(false);
const syncMetaDialog = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const title = ref('');
const dbTableOptions = ref([]);
const checkedKeys = ref([]);
const expandedKeys = ref([]);
const dbTableRef = ref(null);

const data = reactive({
    form: {},
    queryParams: {
        pageNum: 1,
        pageSize: 10,
        datasourceName: undefined,
        type: undefined,
        ip: undefined,
        status: undefined,
    },
    rules: {
        datasourceName: [{ required: true, message: '数据源名称不能为空', trigger: 'blur' }],
        type: [{ required: true, message: '数据源类型不能为空', trigger: 'blur' }],
        ip: [{ required: true, message: 'ip不能为空', trigger: 'blur' }],
        port: [{ required: true, message: '端口不能为空', trigger: 'blur' }],
        defaultDbName: [{ required: true, message: '数据库不能为空', trigger: 'blur' }],
        username: [{ required: true, message: '用户名不能为空', trigger: 'blur' }],
    },
});

const { queryParams, form, rules } = toRefs(data);

/** 查询数据源列表 */
function getList() {
    loading.value = true;
    datasourceApi
        .listDatasource(queryParams.value)
        .then((response) => {
            datasourceList.value = response.rows;
            total.value = response.total;
        })
        .finally(() => {
            loading.value = false;
        });
}

/** 取消按钮 */
function cancel() {
    open.value = false;
    reset();
}

/** 表单重置 */
function reset() {
    form.value = {
        datasourceId: undefined,
        datasourceName: undefined,
        type: undefined,
        ip: undefined,
        port: 0,
        status: '0',
        remark: undefined,
    };
    proxy.resetForm('datasourceRef');
}

function resetTreeChecked() {
    checkedKeys.value = [];
    expandedKeys.value = [];
}

/** 搜索按钮操作 */
function handleQuery() {
    queryParams.value.pageNum = 1;
    getList();
}

/** 重置按钮操作 */
function resetQuery() {
    proxy.resetForm('queryRef');
    handleQuery();
}

/** 多选框选中数据 */
function handleSelectionChange(selection) {
    ids.value = selection.map((item) => item.datasourceId);
    single.value = selection.length != 1;
    multiple.value = !selection.length;
}

/** 新增按钮操作 */
function handleAdd() {
    reset();
    open.value = true;
    title.value = '新增数据源';
}

function handleTest(row) {
    reset();
    const datasourceId = row.datasourceId || ids.value;
    datasourceApi.testDatasource(datasourceId).then((response) => {
        if (response) {
            proxy.$modal.msgSuccess("测试成功");
        } else {
            proxy.$modal.msgError("测试失败");
        }
    }).catch(() => {});
}

/** 修改按钮操作 */
function handleUpdate(row) {
    reset();
    const datasourceId = row.datasourceId || ids.value;
    datasourceApi.getDatasource(datasourceId).then((response) => {
        form.value = response;
        open.value = true;
        title.value = '修改数据源';
    });
}

function handleStatusChange(row) {
    const text = row.status ? '启用' : '停用';
    proxy.$modal
        .confirm(`确认要"${text}""${row.datasourceName}"数据源吗?`)
        .then(() => datasourceApi.changeStatus(row.datasourceId, row.status))
        .then(() => {
            proxy.$modal.msgSuccess(`${text}成功`);
        })
        .catch(() => {
            row.status = row.status === '0' ? '1' : '0';
        });
}

/** 提交按钮 */
function submitForm() {
    proxy.$refs.datasourceRef.validate((valid) => {
        if (valid) {
            if (form.value.datasourceId !== undefined) {
                datasourceApi.updateDatasource(form.value).then((response) => {
                    proxy.$modal.msgSuccess('修改成功');
                    open.value = false;
                    getList();
                });
            } else {
                datasourceApi.addDatasource(form.value).then((response) => {
                    proxy.$modal.msgSuccess('新增成功');
                    open.value = false;
                    getList();
                });
            }
        }
    });
}

/** 删除按钮操作 */
function handleDelete(row) {
    const datasourceIds = row.datasourceId || ids.value;
    proxy.$modal
        .confirm(`是否确认删除ID为"${datasourceIds}"的数据项？`)
        .then(() => datasourceApi.deleteDatasource(datasourceIds))
        .then(() => {
            getList();
            proxy.$modal.msgSuccess('删除成功');
        })
        .catch(() => {});
}

function handleSync(row) {
    form.value.datasourceId = row.datasourceId;
    getSchemaDbList(row.datasourceId);
    syncMetaDialog.value = true;
}

function getSchemaDbList(datasourceId) {
    schemaApi.getSchemaDbList(datasourceId).then((response) => {
        dbTableOptions.value = response.schemaDbList;
        checkedKeys.value = response.checkedKeys;
        expandedKeys.value = response.expandedKeys;
    }).catch(() => {})
}

function loadTables(node, resolve) {
    const data = node.data;
    if (node.level === 0) {
        return resolve([{ name: '' }]);
    }
    if (node.level > 1) return resolve([]);
    setTimeout(() => {
        schemaApi.getSchemaTableList(data.datasourceId, data.dbName).then((response) => {
            resolve(response);
        });
    }, 500);
}

function cancelSync() {
    syncMetaDialog.value = false;
    reset();
    resetTreeChecked();
}

function syncDbTables() {
    form.value.dbTables = getAllCheckedKeys();
    schemaApi.syncDbTables(form.value).then((response) => {
        proxy.$modal.msgSuccess('同步成功');
        syncMetaDialog.value = false;
        resetTreeChecked();
        getList();
    });
}

function getAllCheckedKeys() {
    // 目前被选中的节点
    const checkedKeys = dbTableRef.value.getCheckedKeys();
    // 半选中的节点
    const halfCheckedKeys = dbTableRef.value.getHalfCheckedKeys();
    checkedKeys.unshift.apply(checkedKeys, halfCheckedKeys);
    return checkedKeys;
}
getList();
</script>
