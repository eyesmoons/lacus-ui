<template>
    <div class="app-container">
        <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="88px">
            <el-form-item label="关键字" prop="searchVal">
                <el-input v-model="queryParams.searchVal" placeholder="实例编码/名称" clearable style="width: 220px" @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="渠道类型" prop="channelTypeId">
                <el-select v-model="queryParams.channelTypeId" placeholder="请选择渠道类型" clearable style="width: 220px">
                    <el-option v-for="item in channelTypes" :key="item.id" :label="item.typeName" :value="item.id" />
                </el-select>
            </el-form-item>
            <el-form-item label="启用状态" prop="enabled">
                <el-select v-model="queryParams.enabled" placeholder="请选择" clearable style="width: 160px">
                    <el-option label="启用" :value="true" />
                    <el-option label="停用" :value="false" />
                </el-select>
            </el-form-item>
            <el-form-item label="测试状态" prop="testStatus">
                <el-select v-model="queryParams.testStatus" placeholder="请选择" clearable style="width: 180px">
                    <el-option v-for="item in testStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
            </el-form-item>
            <el-form-item>
                <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
                <el-button icon="Refresh" @click="resetQuery">重置</el-button>
            </el-form-item>
        </el-form>

        <el-row :gutter="10" class="mb8">
            <el-col :span="1.5">
                <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermission="['monitor:alertChannel:add']">新增</el-button>
            </el-col>
            <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>

        <el-table v-loading="loading" :data="instanceList">
            <el-table-column label="ID" align="center" prop="id" width="90" />
            <el-table-column label="实例名称" align="center" prop="instanceName" min-width="180" show-overflow-tooltip />
            <el-table-column label="实例编码" align="center" prop="instanceCode" min-width="180" show-overflow-tooltip />
            <el-table-column label="渠道类型" align="center" prop="typeName" width="120" />
            <el-table-column label="启用状态" align="center" prop="enabled" width="100">
                <template #default="scope">
                    <dict-tag :options="enabledOptions" :value="String(scope.row.enabled)" />
                </template>
            </el-table-column>
            <el-table-column label="测试状态" align="center" prop="testStatus" width="120">
                <template #default="scope">
                    <dict-tag :options="testStatusOptions" :value="scope.row.testStatus" />
                </template>
            </el-table-column>
            <el-table-column label="最近测试时间" align="center" prop="lastTestTime" width="180">
                <template #default="scope">
                    <span>{{ parseTime(scope.row.lastTestTime) }}</span>
                </template>
            </el-table-column>
            <el-table-column label="操作" align="center" width="240" class-name="small-padding fixed-width">
                <template #default="scope">
                    <el-button link type="primary" @click="handleUpdate(scope.row)" v-hasPermission="['monitor:alertChannel:edit']">编辑</el-button>
                    <el-button link type="success" @click="handleTestSaved(scope.row)" v-hasPermission="['monitor:alertChannel:test']">测试发送</el-button>
                    <el-button link type="danger" @click="handleDelete(scope.row)" v-hasPermission="['monitor:alertChannel:remove']">删除</el-button>
                </template>
            </el-table-column>
        </el-table>

        <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

        <el-dialog :title="title" v-model="open" width="860px" append-to-body>
            <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
                <el-row :gutter="16">
                    <el-col :span="12">
                        <el-form-item label="实例编码" prop="instanceCode">
                            <el-input v-model="form.instanceCode" placeholder="请输入实例编码" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="实例名称" prop="instanceName">
                            <el-input v-model="form.instanceName" placeholder="请输入实例名称" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="渠道类型" prop="channelTypeId">
                            <el-select v-model="form.channelTypeId" placeholder="请选择渠道类型" style="width: 100%" @change="handleTypeChange">
                                <el-option v-for="item in channelTypes" :key="item.id" :label="item.typeName" :value="item.id" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="是否启用" prop="enabled">
                            <el-switch v-model="form.enabled" />
                        </el-form-item>
                    </el-col>
                </el-row>
            </el-form>
            <schema-form ref="schemaFormRef" v-model="channelConfig" :schema="currentSchema" />
            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="handleTestDraft" v-hasPermission="['monitor:alertChannel:test']">测试发送</el-button>
                    <el-button type="primary" @click="submitForm">确 定</el-button>
                    <el-button @click="cancel">取 消</el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script setup name="AlertChannel">
import * as alertApi from '@/api/monitor/alertApi';
import SchemaForm from '../components/SchemaForm.vue';

const { proxy } = getCurrentInstance();

const loading = ref(false);
const showSearch = ref(true);
const open = ref(false);
const title = ref('');
const total = ref(0);
const instanceList = ref([]);
const channelTypes = ref([]);
const channelConfig = ref({});
const formRef = ref();
const schemaFormRef = ref();

const enabledOptions = [
    { label: '启用', value: 'true', elTagType: 'success' },
    { label: '停用', value: 'false', elTagType: 'danger' },
];
const testStatusOptions = [
    { label: '未测试', value: 'UNTESTED', elTagType: 'info' },
    { label: '成功', value: 'SUCCESS', elTagType: 'success' },
    { label: '失败', value: 'FAILED', elTagType: 'danger' },
];

const data = reactive({
    queryParams: {
        pageNum: 1,
        pageSize: 10,
        searchVal: undefined,
        channelTypeId: undefined,
        enabled: undefined,
        testStatus: undefined,
    },
    form: {
        id: undefined,
        channelTypeId: undefined,
        instanceCode: '',
        instanceName: '',
        enabled: true,
    },
    rules: {
        instanceCode: [{ required: true, message: '实例编码不能为空', trigger: 'blur' }],
        instanceName: [{ required: true, message: '实例名称不能为空', trigger: 'blur' }],
        channelTypeId: [{ required: true, message: '渠道类型不能为空', trigger: 'change' }],
    },
});

const { queryParams, form, rules } = toRefs(data);

const currentSchema = computed(() => {
    const selected = channelTypes.value.find((item) => item.id === form.value.channelTypeId);
    if (!selected?.configSchema) {
        return [];
    }
    try {
        return JSON.parse(selected.configSchema) || [];
    } catch (error) {
        console.error('解析渠道Schema失败', error);
        return [];
    }
});

function getList() {
    loading.value = true;
    alertApi
        .listChannelInstances(queryParams.value)
        .then((response) => {
            instanceList.value = response.rows;
            total.value = response.total;
        })
        .finally(() => {
            loading.value = false;
        });
}

function loadChannelTypes() {
    return alertApi.listChannelTypes().then((response) => {
        channelTypes.value = response || [];
    });
}

function resetFormData() {
    form.value = {
        id: undefined,
        channelTypeId: channelTypes.value[0]?.id,
        instanceCode: '',
        instanceName: '',
        enabled: true,
    };
    channelConfig.value = {};
    proxy.resetForm('formRef');
}

function handleTypeChange() {
    channelConfig.value = {};
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
    title.value = '新增告警实例';
}

function handleUpdate(row) {
    alertApi.getChannelInstance(row.id).then((response) => {
        form.value = {
            id: response.id,
            channelTypeId: response.channelTypeId,
            instanceCode: response.instanceCode,
            instanceName: response.instanceName,
            enabled: response.enabled,
        };
        channelConfig.value = response.config || {};
        open.value = true;
        title.value = '编辑告警实例';
    });
}

function handleDelete(row) {
    proxy.$modal
        .confirm(`是否确认删除告警实例“${row.instanceName}”？`)
        .then(() => alertApi.deleteChannelInstance(row.id))
        .then(() => {
            proxy.$modal.msgSuccess('删除成功');
            getList();
        })
        .catch(() => {});
}

function handleTestSaved(row) {
    alertApi
        .testChannelInstance({
            instanceId: row.id,
            testTitle: 'Alert Test',
            testContent: 'this is a test message',
        })
        .then((response) => {
            const message = response.success ? '测试发送成功' : `测试发送失败：${response.errorMessage || response.responseSummary || ''}`;
            response.success ? proxy.$modal.msgSuccess(message) : proxy.$modal.msgError(message);
            getList();
        });
}

async function handleTestDraft() {
    await formRef.value.validate();
    await schemaFormRef.value?.validate();
    const response = await alertApi.testChannelInstance({
        instanceId: form.value.id,
        channelTypeId: form.value.channelTypeId,
        config: channelConfig.value,
        testTitle: 'Alert Test',
        testContent: 'this is a test message',
    });
    const message = response.success ? '测试发送成功' : `测试发送失败：${response.errorMessage || response.responseSummary || ''}`;
    response.success ? proxy.$modal.msgSuccess(message) : proxy.$modal.msgError(message);
}

async function submitForm() {
    await formRef.value.validate();
    await schemaFormRef.value?.validate();
    const payload = {
        ...form.value,
        config: channelConfig.value,
    };
    if (payload.id) {
        await alertApi.updateChannelInstance(payload);
        proxy.$modal.msgSuccess('修改成功');
    } else {
        await alertApi.addChannelInstance(payload);
        proxy.$modal.msgSuccess('新增成功');
    }
    open.value = false;
    getList();
}

function cancel() {
    open.value = false;
}

onMounted(async () => {
    await loadChannelTypes();
    if (!form.value.channelTypeId && channelTypes.value.length) {
        form.value.channelTypeId = channelTypes.value[0].id;
    }
    getList();
});
</script>
