<template>
    <div class="app-container">
        <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="90px">
            <el-form-item label="分组名称" prop="catelogName">
                <el-input v-model="queryParams.catelogName" placeholder="请输入分组名称" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item>
                <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
                <el-button icon="Refresh" @click="resetQuery">重置</el-button>
            </el-form-item>
        </el-form>

        <el-row :gutter="10" class="mb8">
            <el-col :span="1.5">
                <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermission="['datasync:catelog:add']">新增</el-button>
            </el-col>
            <el-col :span="1.5">
                <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate" v-hasPermission="['datasync:catelog:edit']">修改</el-button>
            </el-col>
            <el-col :span="1.5">
                <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete" v-hasPermission="['datasync:catelog:remove']">删除</el-button>
            </el-col>
            <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
        </el-row>

        <el-table v-loading="loading" :data="jobCatelogList" stripe @selection-change="handleSelectionChange">
            <el-table-column type="selection" width="55" align="center" />
            <el-table-column label="分组名称" align="left" prop="catelogName" />
            <el-table-column label="描述" align="left" prop="remark" show-overflow-tooltip/>
            <el-table-column label="创建时间" align="center" prop="createTime">
                <template #default="scope">
                    <span>{{ parseTime(scope.row.createTime) }}</span>
                </template>
            </el-table-column>
            <el-table-column label="操作" align="center">
                <template #default="scope">
                    <el-button-group class="ml-4">
                        <el-tooltip content="编辑" placement="top">
                            <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermission="['datasync:catelog:edit']"/>
                        </el-tooltip>
                        <el-tooltip content="删除" placement="top">
                            <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermission="['datasync:catelog:remove']"/>
                        </el-tooltip>
                    </el-button-group>
                </template>
            </el-table-column>
        </el-table>

        <!-- 分页 -->
        <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList"/>

        <!-- 添加或修改对话框 -->
        <el-dialog :title="title" v-model="open" width="600px" append-to-body>
            <el-form ref="catelogRef" :model="form" :rules="rules" label-width="100px">
                <el-form-item label="分组名称" prop="catelogName">
                    <el-input v-model="form.catelogName" placeholder="请输入分组名称" clearable/>
                </el-form-item>
                <el-form-item label="描述" prop="remark">
                    <el-input v-model="form.remark" placeholder="请输入描述"/>
                </el-form-item>
            </el-form>
            <template #footer>
                <div class="dialog-footer">
                    <el-button type="primary" @click="submitForm">确 定</el-button>
                    <el-button @click="cancel">取 消</el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script setup name="jobCatelog">
import * as catelogApi from '@/api/datasync/catelogApi';

const { proxy } = getCurrentInstance();
const jobCatelogList = ref([]);
const open = ref(false);
const syncMetaDialog = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const title = ref('');
const data = reactive({
    form: {},
    queryParams: {
        pageNum: 1,
        pageSize: 10,
        catelogName: undefined
    },
    rules: {
        catelogName: [{ required: true, message: '分组名称不能为空', trigger: 'blur' }]
    },
});

const { queryParams, form, rules } = toRefs(data);

function getList() {
    loading.value = true;
    catelogApi
        .pageList(queryParams.value)
        .then((response) => {
            jobCatelogList.value = response.rows;
            total.value = response.total;
        })
        .finally(() => {
            loading.value = false;
        });
}

function cancel() {
    open.value = false;
    reset();
}

function reset() {
    form.value = {
        catelogName: undefined,
        remark: undefined,
    };
    proxy.resetForm('catelogRef');
}

function handleQuery() {
    queryParams.value.pageNum = 1;
    getList();
}

function resetQuery() {
    proxy.resetForm('queryRef');
    handleQuery();
}

function handleSelectionChange(selection) {
    ids.value = selection.map((item) => item.catelogId);
    single.value = selection.length != 1;
    multiple.value = !selection.length;
}

function handleAdd() {
    reset();
    open.value = true;
    title.value = '新增分组';
}

function handleUpdate(row) {
    reset();
    const catelogId = row.catelogId || ids.value;
    catelogApi.detail(catelogId).then((response) => {
        form.value = response;
        open.value = true;
        title.value = '修改分组';
    });
}

function submitForm() {
    proxy.$refs.catelogRef.validate((valid) => {
        if (valid) {
            if (form.value.catelogId !== undefined) {
                catelogApi.edit(form.value).then((response) => {
                    proxy.$modal.msgSuccess('修改成功');
                    open.value = false;
                    getList();
                });
            } else {
                catelogApi.add(form.value).then((response) => {
                    proxy.$modal.msgSuccess('新增成功');
                    open.value = false;
                    getList();
                });
            }
        }
    });
}

function handleDelete(row) {
    const catelogIds = row.catelogId || ids.value;
    proxy.$modal
        .confirm(`是否确认删除ID为"${catelogIds}"的分组吗？`)
        .then(() => catelogApi.remove(catelogIds))
        .then(() => {
            getList();
            proxy.$modal.msgSuccess('删除成功');
        })
        .catch(() => {});
}

getList();
</script>
