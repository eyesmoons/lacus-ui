<template>
    <div class="app-container">
        <el-row :gutter="20">
            <el-col :span="16">
                <el-card class="box-card">
                    <template #header>
                        <div class="card-header">
                            <span><i class="el-icon-upload2"></i> 图片库上传</span>
                            <el-button class="button" text @click="$router.push('/lake-intelligence/similarity/dataset/list')">
                                <i class="el-icon-back"></i> 返回数据集列表
                            </el-button>
                        </div>
                    </template>
                    <p class="text-muted mb-4">创建新的图片数据集，支持本地、HDFS、S3/MinIO、HTTP 等多种数据源</p>

                    <el-form ref="datasetFormRef" :model="form" :rules="rules" label-width="120px">
                        <!-- 基本信息 -->
                        <el-divider content-position="left">基本信息</el-divider>
                        <el-form-item label="数据集名称" prop="datasetName">
                            <el-input v-model="form.datasetName" placeholder="例如：产品图片库" />
                        </el-form-item>
                        <el-form-item label="描述" prop="description">
                            <el-input v-model="form.description" type="textarea" placeholder="数据集用途说明（可选）" />
                        </el-form-item>

                        <!-- 数据源类型 -->
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

                        <!-- LOCAL: 文件上传 -->
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
                                <el-icon class="el-icon--upload"><upload-filled /></el-icon>
                                <div class="el-upload__text">点击或拖拽文件到此处上传</div>
                                <template #tip>
                                    <div class="el-upload__tip">支持 .zip 格式，最大 500MB</div>
                                </template>
                            </el-upload>
                        </div>

                        <!-- HDFS -->
                        <div v-if="form.storageSource === 'HDFS'">
                            <el-form-item label="HDFS URI" prop="hdfsUri">
                                <el-input v-model="form.hdfsUri" placeholder="hdfs://namenode:8020/path/to/images" />
                            </el-form-item>
                            <el-form-item label="用户名">
                                <el-input v-model="form.hdfsUser" placeholder="hdfs" />
                            </el-form-item>
                        </div>

                        <!-- S3 -->
                        <div v-if="form.storageSource === 'S3'">
                            <el-form-item label="Bucket URI" prop="s3Uri">
                                <el-input v-model="form.s3Uri" placeholder="s3://bucket-name/path/to/images" />
                            </el-form-item>
                            <el-form-item label="Access Key">
                                <el-input v-model="form.s3AccessKey" placeholder="AKIAIOSFODNN7EXAMPLE" />
                            </el-form-item>
                            <el-form-item label="Secret Key">
                                <el-input v-model="form.s3SecretKey" type="password" placeholder="..." show-password />
                            </el-form-item>
                            <el-form-item label="Region">
                                <el-input v-model="form.s3Region" placeholder="us-east-1" />
                            </el-form-item>
                        </div>

                        <!-- MinIO -->
                        <div v-if="form.storageSource === 'MINIO'">
                            <el-form-item label="Endpoint" prop="minioEndpoint">
                                <el-input v-model="form.minioEndpoint" placeholder="http://minio-server:9000" />
                            </el-form-item>
                            <el-form-item label="Bucket URI" prop="minioUri">
                                <el-input v-model="form.minioUri" placeholder="minio://bucket-name/path/to/images" />
                            </el-form-item>
                            <el-form-item label="Access Key">
                                <el-input v-model="form.minioAccessKey" placeholder="minioadmin" />
                            </el-form-item>
                            <el-form-item label="Secret Key">
                                <el-input v-model="form.minioSecretKey" type="password" placeholder="minioadmin" show-password />
                            </el-form-item>
                        </div>

                        <!-- HTTP -->
                        <div v-if="form.storageSource === 'HTTP'">
                            <el-form-item label="下载 URL" prop="httpUrl">
                                <el-input v-model="form.httpUrl" placeholder="https://example.com/dataset.zip" />
                                <div class="el-upload__tip">支持直接下载 zip 文件的 HTTP/HTTPS 链接</div>
                            </el-form-item>
                        </div>

                        <!-- 测试连接结果 -->
                        <el-alert
                            v-if="probeResult"
                            :title="probeResult.title"
                            :type="probeResult.type"
                            :description="probeResult.description"
                            show-icon
                            closable
                            class="mt-3"
                        />
                    </el-form>

                    <!-- 操作按钮 -->
                    <div class="dialog-footer">
                        <el-button @click="testConnection" :loading="testLoading">
                            <i class="el-icon-connection"></i> 测试连接
                        </el-button>
                        <el-button type="primary" @click="handleSubmit" :loading="submitLoading">
                            <i class="el-icon-plus"></i> 创建图片库
                        </el-button>
                    </div>
                </el-card>
            </el-col>
        </el-row>
    </div>
</template>

<script setup>
import { ref, reactive, getCurrentInstance } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { createDataset, probeSource, uploadDatasetFile } from '@/api/lakeintelligence/dataset';
import { UploadFilled } from '@element-plus/icons-vue';

const router = useRouter();
const { proxy } = getCurrentInstance();

const datasetFormRef = ref(null);
const uploadRef = ref(null);
const selectedFile = ref(null);
const testLoading = ref(false);
const submitLoading = ref(false);
const probeResult = ref(null);

const form = reactive({
    datasetName: '',
    description: '',
    storageSource: 'LOCAL',
    hdfsUri: '',
    hdfsUser: '',
    s3Uri: '',
    s3AccessKey: '',
    s3SecretKey: '',
    s3Region: 'us-east-1',
    minioEndpoint: '',
    minioUri: '',
    minioAccessKey: '',
    minioSecretKey: '',
    httpUrl: '',
});

const rules = {
    datasetName: [{ required: true, message: '请输入数据集名称', trigger: 'blur' }],
    storageSource: [{ required: true, message: '请选择数据源类型', trigger: 'change' }],
};

function handleFileChange(file) {
    if (!file.name.endsWith('.zip')) {
        ElMessage.warning('仅支持 .zip 格式文件');
        uploadRef.value.clearFiles();
        return;
    }
    if (file.size > 500 * 1024 * 1024) {
        ElMessage.warning('文件大小超过 500MB 限制');
        uploadRef.value.clearFiles();
        return;
    }
    selectedFile.value = file.raw;
}

function handleExceed() {
    ElMessage.warning('只能上传一个文件，请先移除已选文件');
}

function getUri() {
    switch (form.storageSource) {
        case 'LOCAL':
            return selectedFile.value ? selectedFile.value.name : '';
        case 'HDFS':
            return form.hdfsUri;
        case 'S3':
            return form.s3Uri;
        case 'MINIO':
            return form.minioUri;
        case 'HTTP':
            return form.httpUrl;
        default:
            return '';
    }
}

function getSourceConfig() {
    const config = { storageSource: form.storageSource };
    switch (form.storageSource) {
        case 'LOCAL':
            config.uri = selectedFile.value ? selectedFile.value.name : '';
            break;
        case 'HDFS':
            config.uri = form.hdfsUri;
            config.credentials = { user: form.hdfsUser };
            break;
        case 'S3':
            config.uri = form.s3Uri;
            config.credentials = {
                accessKey: form.s3AccessKey,
                secretKey: form.s3SecretKey,
                region: form.s3Region,
            };
            break;
        case 'MINIO':
            config.uri = form.minioUri;
            config.credentials = {
                accessKey: form.minioAccessKey,
                secretKey: form.minioSecretKey,
                endpoint: form.minioEndpoint,
            };
            break;
        case 'HTTP':
            config.uri = form.httpUrl;
            break;
    }
    return config;
}

async function testConnection() {
    const uri = getUri();
    if (!uri) {
        ElMessage.warning('请先填写数据源地址');
        return;
    }
    testLoading.value = true;
    probeResult.value = null;
    try {
        const res = await probeSource(uri);
        if (res.accessible) {
            probeResult.value = {
                title: '连接成功',
                type: 'success',
                description: `发现 ${res.file_count || res.count || 0} 个图片文件${res.total_size_human ? '，总大小 ' + res.total_size_human : ''}`,
            };
        } else {
            probeResult.value = {
                title: '连接失败',
                type: 'error',
                description: res.error || '未知错误',
            };
        }
    } catch (err) {
        probeResult.value = {
            title: '测试失败',
            type: 'error',
            description: err.message,
        };
    } finally {
        testLoading.value = false;
    }
}

async function handleSubmit() {
    try {
        await proxy.$refs.datasetFormRef.validate();
    } catch (e) {
        return;
    }

    if (form.storageSource === 'LOCAL' && !selectedFile.value) {
        ElMessage.warning('请选择要上传的文件');
        return;
    }

    const uri = getUri();
    if (!uri) {
        ElMessage.warning('请先选择文件或填写数据源地址');
        return;
    }

    submitLoading.value = true;
    try {
        let localPath = null;
        let imageCount = 0;

        // 本地上传：先上传文件
        if (form.storageSource === 'LOCAL' && selectedFile.value) {
            const uploadRes = await uploadDatasetFile(selectedFile.value, (progressEvent) => {
                if (progressEvent.total) {
                    const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    ElMessage.success(`上传进度：${percent}%`);
                }
            });
            localPath = uploadRes.localPath || uploadRes.data?.localPath;
            imageCount = uploadRes.imageCount || uploadRes.data?.imageCount || 0;
        }

        // 创建数据集
        const sourceConfig = JSON.parse(JSON.stringify(getSourceConfig()));
        if (localPath) {
            sourceConfig.localPath = localPath;
        }
        const payload = {
            datasetName: form.datasetName,
            description: form.description,
            storageSource: form.storageSource,
            sourceConfig: JSON.stringify(sourceConfig),
            taskType: 'SIMILARITY',
            status: localPath ? 'READY' : 'PROCESSING',
            creatorId: 'current-user',
        };
        const result = await createDataset(payload);
        ElMessage.success('数据集创建成功！');
        setTimeout(() => {
            router.push('/lake-intelligence/similarity/dataset/list');
        }, 1000);
    } catch (err) {
        ElMessage.error('创建失败：' + err.message);
    } finally {
        submitLoading.value = false;
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

.mt-3 {
    margin-top: 12px;
}

.dialog-footer {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
    gap: 10px;
}

.upload-zone {
    width: 100%;
}

.upload-zone :deep(.el-upload-dragger) {
    width: 100%;
    padding: 40px 0;
}
</style>
