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
                    </el-form-item>
                </el-form>

                <!-- 列表数据 -->
                <el-table v-loading="loading" :data="tableList">
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
                    <el-table-column label="操作" align="center" width="150" class-name="small-padding fixed-width">
                        <template #default="scope">
                            <el-tooltip content="详情" placement="top">
                                <el-button link type="primary" icon="Right" v-hasPermission="['metadata:table:query']" @click="handleDetail(scope.row)"/>
                            </el-tooltip>
                        </template>
                    </el-table-column>
                </el-table>
                <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList"/>
            </el-col>
        </el-row>
    </div>
</template>

<script setup name="table">
import * as datasourceApi from '@/api/metadata/datasourceApi';
import * as dbApi from '@/api/metadata/dbApi';
import * as tableApi from "@/api/metadata/tableApi";

const router = useRouter();
const { proxy } = getCurrentInstance();
const tableList = ref([]);
const loading = ref(true);
const showSearch = ref(true);
const total = ref(0);
const dbTableOptions = ref([]);
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

/** 通过条件过滤节点  */
const filterNode = (value, data) => {
    if (!value) return true;
    return data.label.indexOf(value) !== -1;
};

/**
 * 查询数据源下拉树
 */
function loadDatasourceList() {
    datasourceApi.getDatasourceList(null).then((response) => {
        dbTableOptions.value = response;
    }).catch(() => {})
}

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
            resolve(response);
        });
    }, 500);
}

/**
 * 查询数据表列表
 */
function getList() {
    loading.value = true;
    tableApi
        .listTable(queryParams.value)
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
    } else if (nodeLevel === 2) {
        queryParams.value.dbId = data.dbId;
        queryParams.value.datasourceId = null;
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
    router.push(`/metadata/table/detail/${tableId}`);
}

loadDatasourceList();
getList();
</script>
