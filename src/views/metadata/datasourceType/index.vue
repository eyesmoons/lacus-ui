<template>
    <div class="app-container">
        <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="90px">
            <el-form-item label="名称" prop="typeName">
                <el-input v-model="queryParams.typeName" placeholder="请输入名称" clearable @keyup.enter="handleQuery"/>
            </el-form-item>
            <el-form-item>
                <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
                <el-button icon="Refresh" @click="resetQuery">重置</el-button>
            </el-form-item>
        </el-form>

        <el-row :gutter="10" class="mb8">
            <el-col :span="1.5">
                <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermission="['metadata:datasourceType:add']">新增数据源类型</el-button>
            </el-col>
            <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"/>
        </el-row>

        <el-row>
            <el-col :xs="24" :sm="12" :md="8" :lg="6" v-for="item in datasourceTypeList" :key="item.typeId">
                <el-card style="margin-top: 10px; margin-right: 10px" shadow="hover">
                    <template #header>
                        {{ item.typeName }}
                        <el-button-group class="ml-4" style="float: right">
                            <el-tooltip content="编辑" placement="top">
                                <el-button type="primary" plain link size="small" icon="Edit" @click="handleUpdate(item)" v-hasPermission="['metadata:datasourceType:edit']"/>
                            </el-tooltip>
                            <el-tooltip content="删除" placement="top">
                                <el-button type="danger" plain link size="small" icon="Delete" @click="handleDelete(item)" v-hasPermission="['metadata:datasourceType:remove']"/>
                            </el-tooltip>
                        </el-button-group>
                    </template>
                    <img :src="getImageUrl(item.icon)" style="height: 100px"/>
                </el-card>
            </el-col>
        </el-row>

        <div style="margin-left:35%">
            <!-- 添加或修改对话框 -->
            <el-dialog :title="title" v-model="open" append-to-body style="width: 40%">
                <div class="datasource-body">
                    <el-form ref="datasourceRef" :model="form" :rules="rules" label-width="100px">
                        <div class="datasource-form">
                            <el-row :gutter="24">
                                <el-col :span="22">
                                    <el-form-item label="所属分类" prop="typeName">
                                        <el-select v-model="form.typeCatalog" placeholder="请选择所属分类" clearable>
                                            <el-option v-for="item in catalogOption"
                                                       :key="item.name"
                                                       :label="item.remark"
                                                       :value="item.name"/>
                                        </el-select>
                                    </el-form-item>
                                </el-col>
                            </el-row>
                            <el-row :gutter="24">
                                <el-col :span="22">
                                    <el-form-item label="名称" prop="typeName">
                                        <el-input v-model="form.typeName" placeholder="请输入数据源类型名称"/>
                                    </el-form-item>
                                </el-col>
                            </el-row>
                            <el-row :gutter="24">
                                <el-col :span="22">
                                    <el-form-item label="编码" prop="typeCode">
                                        <el-input v-model="form.typeCode" placeholder="请输入数据源类型编码"/>
                                    </el-form-item>
                                </el-col>
                            </el-row>
                            <el-row :gutter="24">
                                <el-col :span="22">
                                    <el-form-item label="驱动名称" prop="driverName">
                                        <el-input v-model="form.driverName" placeholder="请输入驱动名称"/>
                                    </el-form-item>
                                </el-col>
                            </el-row>
                            <el-row :gutter="24">
                                <el-col :span="22">
                                    <el-form-item label="图标" prop="icon">
                                        <el-input v-model="form.icon" placeholder="请输入图标名称，请提前上传到/assets/images目录"/>
                                    </el-form-item>
                                </el-col>
                            </el-row>
                            <el-row :gutter="24">
                                <el-col :span="22">
                                    <el-form-item label="jdbcUrl" prop="jdbcUrl">
                                        <el-input v-model="form.jdbcUrl" placeholder="请输入jdbc url"/>
                                    </el-form-item>
                                </el-col>
                            </el-row>
                            <el-row :gutter="24">
                                <el-col :span="22">
                                    <el-form-item label="说明" prop="remark">
                                        <el-input v-model="form.remark" placeholder="请输入备注信息"/>
                                    </el-form-item>
                                </el-col>
                            </el-row>
                        </div>
                    </el-form>
                </div>
                <template #footer>
                    <div class="dialog-footer">
                        <el-button type="primary" @click="submitForm">确 定</el-button>
                        <el-button @click="cancel">取 消</el-button>
                    </div>
                </template>
            </el-dialog>
        </div>
    </div>
</template>

<script setup name="datasourceType">
import * as datasourceTypeApi from '@/api/metadata/datasourceTypeApi';
import {ref} from "vue";

const {proxy} = getCurrentInstance();
const {datasource_status, datasource_type} = proxy.useDict('datasource_status', 'datasource_type');
const datasourceTypeList = ref([]);
const open = ref(false);
const title = ref('');
const loading = ref(true);
const showSearch = ref(true);
const ids = ref([]);
const single = ref(true);
const multiple = ref(true);
const catalogOption = ref([])

const data = reactive({
    form: {},
    queryParams: {
        pageNum: 1,
        pageSize: 10,
        typeName: undefined
    },
    rules: {
        typeName: [{required: true, message: '名称不能为空', trigger: 'blur'}],
        typeCode: [{required: true, message: '编码不能为空', trigger: 'blur'}],
        typeCatalog: [{required: true, message: '所属分类不能为空', trigger: 'blur'}],
        driverName: [{required: true, message: '驱动名称不能为空', trigger: 'blur'}]
    },
});

const {queryParams, form, rules} = toRefs(data);

function getImageUrl(imgName) {
    return new URL(`../../../assets/images/${imgName}`, import.meta.url).href
}

/** 查询数据源列表 */
function getList() {
    loading.value = true;
    datasourceTypeApi
        .list(queryParams.value.typeName)
        .then((response) => {
            datasourceTypeList.value = response;
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
        typeId: undefined,
        typeName: undefined
    };
    proxy.resetForm('datasourceRef');
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


/** 新增按钮操作 */
function handleAdd() {
    reset();
    initCatalogOption();
    open.value = true;
    title.value = '新增数据源类型';
}

function initCatalogOption() {
    datasourceTypeApi.listDatasourceCatalog()
        .then((response) => {
            catalogOption.value = response;
        })
}

/** 修改按钮操作 */
function handleUpdate(row) {
    reset();
    const typeId = row.typeId;
    datasourceTypeApi.detail(typeId).then((response) => {
        form.value = response;
        console.log(response)
        open.value = true;
        title.value = '修改数据源类型';
    });
}

/** 提交按钮 */
function submitForm() {
    proxy.$refs.datasourceRef.validate((valid) => {
        if (valid) {
            if (form.value.typeId !== undefined) {
                datasourceTypeApi.update(form.value).then((response) => {
                    proxy.$modal.msgSuccess('修改成功');
                    open.value = false;
                    getList();
                });
            } else {
                datasourceTypeApi.add(form.value).then((response) => {
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
    const typeId = row.typeId;
    const typeName = row.typeName;
    proxy.$modal
        .confirm(`是否确认删除"${typeName}"吗？`)
        .then(() => datasourceTypeApi.remove(typeId))
        .then(() => {
            getList();
            proxy.$modal.msgSuccess('删除成功');
        })
        .catch(() => {
        });
}

getList();
</script>