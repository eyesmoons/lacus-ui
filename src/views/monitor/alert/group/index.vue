<template>
    <div class="app-container">
        <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="88px">
            <el-form-item label="关键字" prop="searchVal">
                <el-input v-model="queryParams.searchVal" placeholder="组编码/组名称" clearable style="width: 240px" @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="启用状态" prop="enabled">
                <el-select v-model="queryParams.enabled" placeholder="请选择" clearable style="width: 180px">
                    <el-option label="启用" :value="true" />
                    <el-option label="停用" :value="false" />
                </el-select>
            </el-form-item>
            <el-form-item>
                <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
                <el-button icon="Refresh" @click="resetQuery">重置</el-button>
            </el-form-item>
        </el-form>

        <el-row :gutter="10" class="mb8">
            <el-col :span="1.5">
                <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermission="['monitor:alertGroup:add']">新增</el-button>
            </el-col>
            <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>

        <el-table v-loading="loading" :data="groupList">
            <el-table-column label="ID" align="center" prop="id" width="90" />
            <el-table-column label="告警组名称" align="center" prop="groupName" min-width="180" show-overflow-tooltip />
            <el-table-column label="告警组编码" align="center" prop="groupCode" min-width="180" show-overflow-tooltip />
            <el-table-column label="实例数量" align="center" prop="channelCount" width="100" />
            <el-table-column label="启用状态" align="center" prop="enabled" width="100">
                <template #default="scope">
                    <dict-tag :options="enabledOptions" :value="String(scope.row.enabled)" />
                </template>
            </el-table-column>
            <el-table-column label="描述" align="center" prop="description" min-width="200" show-overflow-tooltip />
            <el-table-column label="操作" align="center" width="180">
                <template #default="scope">
                    <el-button link type="primary" @click="handleUpdate(scope.row)" v-hasPermission="['monitor:alertGroup:edit']">编辑</el-button>
                    <el-button link type="danger" @click="handleDelete(scope.row)" v-hasPermission="['monitor:alertGroup:remove']">删除</el-button>
                </template>
            </el-table-column>
        </el-table>

        <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

        <el-dialog :title="title" v-model="open" width="980px" append-to-body>
            <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
                <el-row :gutter="16">
                    <el-col :span="12">
                        <el-form-item label="告警组编码" prop="groupCode">
                            <el-input v-model="form.groupCode" placeholder="请输入告警组编码" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="告警组名称" prop="groupName">
                            <el-input v-model="form.groupName" placeholder="请输入告警组名称" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="是否启用" prop="enabled">
                            <el-switch v-model="form.enabled" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="24">
                        <el-form-item label="描述" prop="description">
                            <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入描述" />
                        </el-form-item>
                    </el-col>
                </el-row>
            </el-form>

            <div class="table-title">绑定告警实例</div>
            <el-table ref="bindingTableRef" :data="instanceOptions" row-key="id" @selection-change="handleSelectionChange" max-height="360">
                <el-table-column type="selection" width="55" />
                <el-table-column label="实例名称" prop="instanceName" min-width="180" />
                <el-table-column label="实例编码" prop="instanceCode" min-width="180" />
                <el-table-column label="渠道类型" prop="typeName" width="120" />
                <el-table-column label="发送顺序" width="120">
                    <template #default="scope">
                        <el-input-number v-model="bindingOrder[scope.row.id]" :min="1" :disabled="!selectedIds.includes(scope.row.id)" style="width: 100%" />
                    </template>
                </el-table-column>
            </el-table>

            <template #footer>
                <div class="dialog-footer">
                    <el-button type="primary" @click="submitForm">确 定</el-button>
                    <el-button @click="cancel">取 消</el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script setup name="AlertGroup">
import * as alertApi from '@/api/monitor/alertApi';

const { proxy } = getCurrentInstance();

const loading = ref(false);
const showSearch = ref(true);
const open = ref(false);
const title = ref('');
const total = ref(0);
const groupList = ref([]);
const instanceOptions = ref([]);
const selectedRows = ref([]);
const selectedIds = ref([]);
const bindingOrder = reactive({});
const bindingTableRef = ref();
const formRef = ref();

const enabledOptions = [
    { label: '启用', value: 'true', elTagType: 'success' },
    { label: '停用', value: 'false', elTagType: 'danger' },
];

const data = reactive({
    queryParams: {
        pageNum: 1,
        pageSize: 10,
        searchVal: undefined,
        enabled: undefined,
    },
    form: {
        id: undefined,
        groupCode: '',
        groupName: '',
        description: '',
        enabled: true,
    },
    rules: {
        groupCode: [{ required: true, message: '告警组编码不能为空', trigger: 'blur' }],
        groupName: [{ required: true, message: '告警组名称不能为空', trigger: 'blur' }],
    },
});

const { queryParams, form, rules } = toRefs(data);

function getList() {
    loading.value = true;
    alertApi
        .listGroups(queryParams.value)
        .then((response) => {
            groupList.value = response.rows;
            total.value = response.total;
        })
        .finally(() => {
            loading.value = false;
        });
}

function loadInstances() {
    return alertApi.listChannelInstances({ pageNum: 1, pageSize: 500, enabled: true }).then((response) => {
        instanceOptions.value = response.rows || [];
    });
}

function resetFormData() {
    form.value = {
        id: undefined,
        groupCode: '',
        groupName: '',
        description: '',
        enabled: true,
    };
    selectedRows.value = [];
    selectedIds.value = [];
    Object.keys(bindingOrder).forEach((key) => delete bindingOrder[key]);
    proxy.resetForm('formRef');
    nextTick(() => bindingTableRef.value?.clearSelection());
}

function handleSelectionChange(selection) {
    selectedRows.value = selection;
    selectedIds.value = selection.map((item) => item.id);
    selection.forEach((item, index) => {
        if (!bindingOrder[item.id]) {
            bindingOrder[item.id] = index + 1;
        }
    });
}

function handleQuery() {
    queryParams.value.pageNum = 1;
    getList();
}

function resetQuery() {
    proxy.resetForm('queryRef');
    handleQuery();
}

function handleAdd() {
    resetFormData();
    open.value = true;
    title.value = '新增告警组';
}

function handleUpdate(row) {
    alertApi.getGroup(row.id).then(async (response) => {
        resetFormData();
        form.value = {
            id: response.id,
            groupCode: response.groupCode,
            groupName: response.groupName,
            description: response.description,
            enabled: response.enabled,
        };
        response.channelBindings?.forEach((item) => {
            bindingOrder[item.channelInstanceId] = item.notifyOrder;
        });
        open.value = true;
        title.value = '编辑告警组';
        await nextTick();
        const currentRows = instanceOptions.value.filter((item) => response.channelBindings?.some((binding) => binding.channelInstanceId === item.id));
        currentRows.forEach((item) => bindingTableRef.value?.toggleRowSelection(item, true));
    });
}

function handleDelete(row) {
    proxy.$modal
        .confirm(`是否确认删除告警组“${row.groupName}”？`)
        .then(() => alertApi.deleteGroup(row.id))
        .then(() => {
            proxy.$modal.msgSuccess('删除成功');
            getList();
        })
        .catch(() => {});
}

async function submitForm() {
    await formRef.value.validate();
    if (!selectedRows.value.length) {
        proxy.$modal.msgError('请至少选择一个告警实例');
        return;
    }
    const channelBindings = selectedRows.value
        .map((item) => ({
            channelInstanceId: item.id,
            notifyOrder: bindingOrder[item.id] || 1,
        }))
        .sort((a, b) => a.notifyOrder - b.notifyOrder);
    const payload = {
        ...form.value,
        channelBindings,
    };
    if (payload.id) {
        await alertApi.updateGroup(payload);
        proxy.$modal.msgSuccess('修改成功');
    } else {
        await alertApi.addGroup(payload);
        proxy.$modal.msgSuccess('新增成功');
    }
    open.value = false;
    getList();
}

function cancel() {
    open.value = false;
}

onMounted(async () => {
    await loadInstances();
    getList();
});
</script>

<style scoped>
.table-title {
    font-weight: 600;
    margin: 8px 0 12px;
}
</style>
