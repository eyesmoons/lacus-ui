<template>
    <div class="app-container">
        <el-row :gutter="20">
            <el-col :span="16">
                <el-card class="box-card">
                    <template #header>
                        <div class="card-header">
                            <span><i class="el-icon-upload2"></i> 数据集上传</span>
                            <el-button class="button" text @click="$router.push('/lake-intelligence/dataset/list')">
                                <i class="el-icon-back"></i> 返回数据集列表
                            </el-button>
                        </div>
                    </template>
                    <p class="text-muted mb-4">创建新的图片数据集，支持本地、HDFS、S3/MinIO、HTTP 等多种数据源</p>

                    <el-form ref="datasetFormRef" :model="form" :rules="rules" label-width="120px">
                        <el-divider content-position="left">基本信息</el-divider>
                        <el-form-item label="数据集名称" prop="datasetName">
                            <el-input v-model="form.datasetName" placeholder="例如：产品图片库" />
                        </el-form-item>
                        <el-form-item label="描述" prop="description">
                            <el-input v-model="form.description" type="textarea" placeholder="数据集用途说明（可选）" />
                        </el-form-item>

                        <el-divider content-position="left">数据源类型</el-divider>
                        <el-form-item label="选择数据源" prop="storageSource">
                            <el-radio-group v-model="form.storageSource">
                                <el-radio-button label="LOCAL"><i class="el-icon-folder-opened"></i> 本地文件</el-radio-button>
                                <el-radio-button label="HDFS"><i class="el-icon-coin"></i> HDFS</el-radio-button>
                                <el-radio-button label="S3"><i class="el-icon-cloudy"></i> S3</el-radio-button>
                                <el-radio-button label="MINIO"><i class="el-icon-server"></i> MinIO</el-radio-button>
                                <el-radio-button label="HTTP"><i class="el-icon-link"></i> HTTP</el-radio-button>
                            </el-radio-group>
                        </el-form-item>

                        <div v-if="form.storageSource === 'LOCAL'">
                            <el-upload
                                ref="uploadRef"
                                class="upload-zone"
                                drag
                                action="#"
                                :auto-upload="false"
                                :limit="1"
                                accept=".zip"
                                :on-change="handleFileChange"
                                :on-exceed="handleExceed"
                            >
                                <i class="el-icon-upload"></i>
                                <div class="el-upload__text">拖拽文件到此处或 <em>点击上传</em></div>
                                <template #tip>
                                    <div class="el-upload__tip">只支持 .zip 格式文件，最大 500MB</div>
                                </template>
                            </el-upload>
                        </div>

                        <div v-if="form.storageSource === 'HDFS'">
                            <el-form-item label="HDFS URI" prop="hdfsUri">
                                <el-input v-model="form.hdfsUri" placeholder="hdfs://namenode:8020/path/to/dataset" />
                            </el-form-item>
                            <el-form-item label="用户名">
                                <el-input v-model="form.username" placeholder="hdfs 用户名" />
                            </el-form-item>
                        </div>

                        <div v-if="form.storageSource === 'S3'">
                            <el-form-item label="Bucket URI" prop="bucketUri">
                                <el-input v-model="form.bucketUri" placeholder="s3://bucket-name/path/to/dataset" />
                            </el-form-item>
                            <el-form-item label="Access Key">
                                <el-input v-model="form.accessKey" placeholder="S3 Access Key" />
                            </el-form-item>
                            <el-form-item label="Secret Key">
                                <el-input v-model="form.secretKey" type="password" placeholder="S3 Secret Key" />
                            </el-form-item>
                            <el-form-item label="Region">
                                <el-input v-model="form.region" placeholder="us-east-1" />
                            </el-form-item>
                        </div>

                        <div v-if="form.storageSource === 'MINIO'">
                            <el-form-item label="Endpoint" prop="endpoint">
                                <el-input v-model="form.endpoint" placeholder="http://minio:9000" />
                            </el-form-item>
                            <el-form-item label="Bucket URI" prop="bucketUri">
                                <el-input v-model="form.bucketUri" placeholder="bucket-name/path/to/dataset" />
                            </el-form-item>
                            <el-form-item label="Access Key">
                                <el-input v-model="form.accessKey" placeholder="MinIO Access Key" />
                            </el-form-item>
                            <el-form-item label="Secret Key">
                                <el-input v-model="form.secretKey" type="password" placeholder="MinIO Secret Key" />
                            </el-form-item>
                        </div>

                        <div v-if="form.storageSource === 'HTTP'">
                            <el-form-item label="下载 URL" prop="downloadUrl">
                                <el-input v-model="form.downloadUrl" placeholder="https://example.com/dataset.zip" />
                            </el-form-item>
                        </div>

                        <el-form-item>
                            <el-button type="primary" @click="handleTestConnection" :loading="testing" v-if="form.storageSource !== 'LOCAL'">
                                测试连接
                            </el-button>
                        </el-form-item>

                        <el-divider content-position="left">提交</el-divider>
                        <el-form-item>
                            <el-button type="primary" @click="handleSubmit" :loading="submitting">创建数据集</el-button>
                            <el-button @click="$router.push('/lake-intelligence/dataset/list')">取消</el-button>
                        </el-form-item>
                    </el-form>
                </el-card>
            </el-col>
        </el-row>
    </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { createDataset, probeSource, uploadDatasetFile } from '@/api/lakeintelligence/dataset';

const router = useRouter();

const datasetFormRef = ref(null);
const uploadRef = ref(null);
const submitting = ref(false);
const testing = ref(false);

const form = reactive({
    datasetName: '',
    description: '',
    storageSource: 'LOCAL',
    hdfsUri: '',
    username: '',
    bucketUri: '',
    accessKey: '',
    secretKey: '',
    region: '',
    endpoint: '',
    downloadUrl: '',
});

const rules = {
    datasetName: [{ required: true, message: '请输入数据集名称', trigger: 'blur' }],
    storageSource: [{ required: true, message: '请选择数据源', trigger: 'change' }],
};

function handleFileChange(file) {
    // 文件已选中，无需额外操作
}

function handleExceed() {
    ElMessage.warning('只能上传一个文件，请先删除已选文件');
}

function handleTestConnection() {
    testing.value = true;
    const uri = form.storageSource === 'HDFS' ? form.hdfsUri
        : form.storageSource === 'S3' ? form.bucketUri
        : form.storageSource === 'MINIO' ? form.endpoint
        : form.downloadUrl;
    probeSource(uri).then(() => {
        ElMessage.success('连接测试成功');
    }).catch(() => {
        ElMessage.error('连接测试失败');
    }).finally(() => {
        testing.value = false;
    });
}

async function handleSubmit() {
    await datasetFormRef.value.validate();
    submitting.value = true;
    try {
        let payload = {
            datasetName: form.datasetName,
            description: form.description,
            storageSource: form.storageSource,
            status: 'PROCESSING',
        };

        if (form.storageSource === 'LOCAL') {
            const file = uploadRef.value.uploadFiles[0]?.raw;
            if (!file) {
                ElMessage.error('请选择要上传的文件');
                submitting.value = false;
                return;
            }
            const result = await uploadDatasetFile(file);
            payload.sourceConfig = JSON.stringify({
                localPath: result.localPath,
                fileName: result.fileName,
            });
            payload.status = 'READY';
        } else if (form.storageSource === 'HDFS') {
            payload.sourceConfig = JSON.stringify({
                uri: form.hdfsUri,
                username: form.username,
            });
        } else if (form.storageSource === 'S3') {
            payload.sourceConfig = JSON.stringify({
                uri: form.bucketUri,
                accessKey: form.accessKey,
                secretKey: form.secretKey,
                region: form.region,
            });
        } else if (form.storageSource === 'MINIO') {
            payload.sourceConfig = JSON.stringify({
                endpoint: form.endpoint,
                bucketUri: form.bucketUri,
                accessKey: form.accessKey,
                secretKey: form.secretKey,
            });
        } else if (form.storageSource === 'HTTP') {
            payload.sourceConfig = JSON.stringify({
                uri: form.downloadUrl,
            });
        }

        await createDataset(payload);
        ElMessage.success('数据集创建成功');
        router.push('/lake-intelligence/dataset/list');
    } catch (err) {
        ElMessage.error('创建失败：' + (err.message || '未知错误'));
    } finally {
        submitting.value = false;
    }
}
</script>

<style scoped>
.app-container {
    padding: 20px;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.text-muted {
    color: #909399;
}

.mb-4 {
    margin-bottom: 16px;
}
</style>
