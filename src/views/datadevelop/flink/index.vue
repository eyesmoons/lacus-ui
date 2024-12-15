<template>
    <div class="app-container">
        <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
            <el-form-item label="环境名称" prop="name">
                <el-input v-model="queryParams.name" placeholder="请输入环境名称" clearable @keyup.enter="handleQuery"/>
            </el-form-item>
            <el-form-item>
                <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
                <el-button icon="Refresh" @click="resetQuery">重置</el-button>
            </el-form-item>
        </el-form>

        <el-row :gutter="10" class="mb8">
            <el-col :span="1.5">
                <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermission="['system:env:add']">
                    新增
                </el-button>
            </el-col>
            <el-col :span="1.5">
                <el-button
                    type="success"
                    plain
                    icon="Edit"
                    :disabled="single"
                    @click="handleUpdate"
                    v-hasPermission="['system:env:edit']"
                >修改
                </el-button
                >
            </el-col>
            <el-col :span="1.5">
                <el-button
                    type="danger"
                    plain
                    icon="Delete"
                    :disabled="multiple"
                    @click="handleDelete"
                    v-hasPermission="['system:env:remove']"
                >删除
                </el-button
                >
            </el-col>
            <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>

        <el-table v-loading="loading" :data="envList" @selection-change="handleSelectionChange">
            <el-table-column type="selection" width="55" align="center"/>
            <el-table-column label="环境名称" align="center" prop="name" :show-overflow-tooltip="true"/>
            <el-table-column label="环境配置" align="center" prop="config" width="220" :show-overflow-tooltip="true"/>
            <el-table-column label="描述" align="center" prop="remark" :show-overflow-tooltip="true"/>
            <el-table-column label="创建时间" align="center" prop="createTime" width="180"
                             :show-overflow-tooltip="true">
                <template #default="scope">
                    <span>{{ parseTime(scope.row.createTime) }}</span>
                </template>
            </el-table-column>
            <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
                <template #default="scope">
                    <el-button-group class="mb5">
                        <el-tooltip content="编辑" placement="top">
                            <el-button
                                type="warning"
                                icon="Edit"
                                @click="handleUpdate(scope.row)"
                                v-hasPermission="['system:env:edit']"/>
                        </el-tooltip>
                        <el-tooltip content="删除" placement="top">
                            <el-button
                                type="danger"
                                icon="Delete"
                                @click="handleDelete(scope.row)"
                                v-hasPermission="['system:env:remove']"/>
                        </el-tooltip>
                    </el-button-group>
                </template>
            </el-table-column>
        </el-table>

        <pagination
            v-show="total > 0"
            :total="total"
            v-model:page="queryParams.pageNum"
            v-model:limit="queryParams.pageSize"
            @pagination="getList"
        />

        <!-- 添加或修改公告对话框 -->
        <el-dialog :title="title" v-model="open" width="780px" append-to-body>
            <el-form ref="envRef" :model="form" :rules="rules" label-width="80px">
                <el-row>
                    <el-col :span="24">
                        <el-form-item label="环境名称" prop="name">
                            <el-input v-model="form.name" placeholder="请输入环境名称"/>
                        </el-form-item>
                    </el-col>
                    <el-col :span="24">
                        <el-form-item label="环境配置" prop="config">
                            <el-input :rows="10" type="textarea" placeholder="请输入环境配置内容"
                                      v-model="form.config"/>
                        </el-form-item>
                    </el-col>

                    <el-col :span="24">
                        <el-form-item label="环境描述" prop="remark">
                            <el-input :rows="4" type="textarea" placeholder="请输入内容" v-model="form.remark"/>
                        </el-form-item>
                    </el-col>
                </el-row>
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

<script setup name="Env">
import * as envApi from '@/api/system/envApi';
import {parseTime} from "../../../utils/dateUtil";

const {proxy} = getCurrentInstance();

const envList = ref([]);
const open = ref(false);
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
        name: undefined
    },
    rules: {
        name: [{required: true, message: '环境名称不能为空', trigger: 'blur'}],
        config: [{required: true, message: '配置内容不能为空', trigger: 'change'}],
    },
});

const {queryParams, form, rules} = toRefs(data);

/** 查询公告列表 */
function getList() {
    loading.value = true;
    envApi
        .listEnv(queryParams.value)
        .then((response) => {
            envList.value = response.rows;
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
        envId: undefined,
        name: undefined,
        config: undefined,
        remark: undefined,
    };
    proxy.resetForm('envRef');
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
    ids.value = selection.map((item) => item.envId);
    single.value = selection.length != 1;
    multiple.value = !selection.length;
}

/** 新增按钮操作 */
function handleAdd() {
    reset();
    open.value = true;
    title.value = '添加环境';
}

/** 修改按钮操作 */
function handleUpdate(row) {
    reset();
    const envId = row.envId || ids.value;
    envApi.getEnv(envId).then((response) => {
        form.value = response;
        open.value = true;
        title.value = '修改环境';
    });
}

/** 提交按钮 */
function submitForm() {
    proxy.$refs.envRef.validate((valid) => {
        if (valid) {
            if (form.value.envId !== undefined) {
                envApi.updateEnv(form.value).then((response) => {
                    proxy.$modal.msgSuccess('修改成功');
                    open.value = false;
                    getList();
                });
            } else {
                envApi.addEnv(form.value).then((response) => {
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
    const envIds = row.envId || ids.value;
    proxy.$modal
        .confirm(`是否确认删除？`)
        .then(() => envApi.deleteEnv(envIds))
        .then(() => {
            getList();
            proxy.$modal.msgSuccess('删除成功');
        })
        .catch(() => {
        });
}

getList();
</script>
