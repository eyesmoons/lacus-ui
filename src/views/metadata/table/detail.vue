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
                            <el-form-item label="引擎：">{{ metadata.tableInfo.engine }}</el-form-item>
                        </el-col>
                    </el-row>
                    <el-row :gutter="24">
                        <el-col :span="24">
                            <el-form-item label="创建表时间：">{{ parseTime(metadata.tableInfo.tableCreateTime) }}</el-form-item>
                        </el-col>
                    </el-row>
                </el-form>
            </el-tab-pane>
            <el-tab-pane label="字段信息" name="columnInfo">
                <el-table :data="columnList" stripe border>
                    <el-table-column label="字段名" align="left" prop="columnName" />
                    <el-table-column label="备注" align="left" prop="comment" show-overflow-tooltip/>
                    <el-table-column label="数据类型" align="left" prop="dataType" />
                    <el-table-column label="字段类型" align="left" prop="columnType" />
                    <el-table-column label="字段长度" align="left" prop="columnLength" />
                    <el-table-column label="允许为空" align="left" prop="isNullable" />
                    <el-table-column label="默认值" align="left" prop="columnDefault" />
                    <el-table-column label="创建时间" align="left" prop="createTime" >
                        <template #default="scope">
                            <span>{{ parseTime(scope.row.createTime) }}</span>
                        </template>
                    </el-table-column>
                </el-table>
            </el-tab-pane>
        </el-tabs>
    </div>
</template>

<script setup name="TableDetail">
import * as tableApi from '@/api/metadata/tableApi';
import * as columnApi from '@/api/metadata/columnApi';

const route = useRoute();
const {proxy} = getCurrentInstance();
const loading = ref(true);
const activeTab = ref('tableInfo');
const columnList = ref([]);
const metadata = reactive({
    tableInfo: {},
    columnInfo:{}
});

(() => {
    const tableId = route.params && route.params.tableId;
    if (tableId) {
        tableApi.tableDetail(tableId).then((response) => {
            metadata.tableInfo = response;
        });
        columnApi.listTable(tableId).then((response2) => {
            columnList.value = response2;
        });
    }
})();
</script>
