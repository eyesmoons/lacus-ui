<template>
    <div class="app-container">
        <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="90px">
            <el-form-item label="数据集名称" prop="datasetName">
                <el-input v-model="queryParams.datasetName" placeholder="请输入数据集名称" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="数据源" prop="storageSource" v-if="queryParams.taskType === 'SIMILARITY'">
                <el-select v-model="queryParams.storageSource" placeholder="请选择数据源" clearable>
                    <el-option label="本地文件" value="LOCAL" />
                    <el-option label="HDFS" value="HDFS" />
                    <el-option label="S3" value="S3" />
                    <el-option label="MinIO" value="MINIO" />
                    <el-option label="HTTP" value="HTTP" />
                </el-select>
            </el-form-item>
            <el-form-item label="状态" prop="status">
                <el-select v-model="queryParams.status" placeholder="请选择状态" clearable>
                    <el-option label="处理中" value="PROCESSING" />
                    <el-option label="等待下载" value="WAITING_DOWNLOAD" />
                    <el-option label="下载中" value="DOWNLOADING" />
                    <el-option label="就绪" value="READY" />
                    <el-option label="错误" value="ERROR" />
                </el-select>
            </el-form-item>
            <el-form-item>
                <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
                <el-button icon="Refresh" @click="resetQuery">重置</el-button>
            </el-form-item>
        </el-form>

        <el-row :gutter="10" class="mb8">
            <el-col :span="1.5">
                <el-button type="primary" plain icon="Plus" @click="handleAdd">上传数据集</el-button>
            </el-col>
            <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
        </el-row>

        <el-table v-loading="loading" :data="datasetList" stripe border>
            <el-table-column label="ID" align="center" prop="datasetId" width="80" />
            <el-table-column label="数据集名称" align="left" prop="datasetName" />
            <el-table-column label="描述" align="left" prop="description" show-overflow-tooltip />
            <el-table-column label="数据源" align="center" prop="storageSource" width="100">
                <template #default="scope">
                    <el-tag v-if="scope.row.storageSource === 'LOCAL'">本地</el-tag>
                    <el-tag v-else-if="scope.row.storageSource === 'HDFS'" type="warning">HDFS</el-tag>
                    <el-tag v-else-if="scope.row.storageSource === 'S3'" type="info">S3</el-tag>
                    <el-tag v-else-if="scope.row.storageSource === 'MINIO'" type="info">MinIO</el-tag>
                    <el-tag v-else-if="scope.row.storageSource === 'HTTP'" type="success">HTTP</el-tag>
                    <el-tag v-else>{{ scope.row.storageSource }}</el-tag>
                </template>
            </el-table-column>
            <el-table-column label="图片数量" align="center" prop="imageCount" width="100">
                <template #default="scope">
                    {{ scope.row.imageCount || 0 }}
                </template>
            </el-table-column>
            <el-table-column label="状态" align="center" prop="status" width="120">
                <template #default="scope">
                    <el-tag v-if="scope.row.status === 'READY'" type="success">就绪</el-tag>
                    <el-tag v-else-if="scope.row.status === 'PROCESSING'" type="primary">处理中</el-tag>
                    <el-tag v-else-if="scope.row.status === 'WAITING_DOWNLOAD'" type="warning">等待下载</el-tag>
                    <el-tag v-else-if="scope.row.status === 'DOWNLOADING'" type="primary">下载中</el-tag>
                    <el-tag v-else-if="scope.row.status === 'ERROR'" type="danger">错误</el-tag>
                    <el-tag v-else type="info">{{ scope.row.status }}</el-tag>
                </template>
            </el-table-column>
            <el-table-column label="创建时间" align="center" prop="createTime" width="160">
                <template #default="scope">
                    {{ parseTime(scope.row.createTime) }}
                </template>
            </el-table-column>
            <el-table-column label="操作" align="center" fixed="right" width="200">
                <template #default="scope">
                    <el-button-group class="ml-4">
                        <el-tooltip content="解析" placement="top" v-if="scope.row.status === 'PROCESSING'">
                            <el-button type="primary" icon="Refresh" @click="handleParse(scope.row)" :loading="scope.row.parsing" />
                        </el-tooltip>
                        <el-tooltip content="构建向量" placement="top" v-if="scope.row.status === 'READY'">
                            <el-button type="primary" icon="DataAnalysis" @click="handleBuildVector(scope.row)" />
                        </el-tooltip>
                        <el-tooltip content="删除" placement="top">
                            <el-button type="danger" icon="Delete" @click="handleDelete(scope.row)" />
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
    </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { parseTime } from '@/utils/dateUtil';
import { ElMessage, ElMessageBox } from 'element-plus';
import { deleteDataset, listDatasets, parseDataset } from '@/api/lakeintelligence/dataset';

const router = useRouter();

const loading = ref(false);
const showSearch = ref(true);
const total = ref(0);
const datasetList = ref([]);

const queryParams = reactive({
    pageNum: 1,
    pageSize: 10,
    datasetName: undefined,
    storageSource: undefined,
    status: undefined,
});

function getList() {
    loading.value = true;
    listDatasets(queryParams).then((response) => {
        datasetList.value = response.rows;
        total.value = response.total;
        loading.value = false;
    });
}

function handleQuery() {
    queryParams.pageNum = 1;
    getList();
}

function resetQuery() {
    queryParams.datasetName = undefined;
    queryParams.storageSource = undefined;
    queryParams.status = undefined;
    handleQuery();
}

function handleAdd() {
    router.push('/lake-intelligence/dataset/upload');
}

function handleBuildVector(row) {
    router.push(`/lake-intelligence/similarity/vector/build?datasetId=${row.datasetId}`);
}

function handleParse(row) {
    row.parsing = true;
    parseDataset(row.datasetId).then(() => {
        ElMessage.success('数据集解析成功');
        getList();
    }).catch(() => {
        ElMessage.error('数据集解析失败');
    }).finally(() => {
        row.parsing = false;
    });
}

function handleDelete(row) {
    ElMessageBox.confirm(`确定要删除「${row.datasetName}」数据集吗?`, '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
    })
        .then(() => deleteDataset(row.datasetId))
        .then(() => {
            getList();
            ElMessage.success('删除成功');
        })
        .catch(() => {});
}

onMounted(() => {
    getList();
});
</script>

<style scoped>
.app-container {
    padding: 20px;
}

.mb8 {
    margin-bottom: 8px;
}
</style>
