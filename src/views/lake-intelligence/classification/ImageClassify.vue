<template>
    <div class="app-container">
        <el-row :gutter="20">
            <!-- 左侧：上传区 -->
            <el-col :span="8">
                <el-card class="box-card">
                    <template #header>
                        <span><i class="el-icon-picture"></i> 待分类图片</span>
                    </template>

                    <el-upload
                        class="image-uploader"
                        action="#"
                        :auto-upload="false"
                        :show-file-list="false"
                        accept="image/jpeg,image/png,image/bmp"
                        :on-change="handleImageChange"
                    >
                        <img v-if="previewUrl" :src="previewUrl" class="preview-image" />
                        <div v-else class="upload-placeholder">
                            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
                            <div class="el-upload__text">点击上传图片</div>
                            <div class="el-upload__tip">支持 JPG/PNG/BMP</div>
                        </div>
                    </el-upload>

                    <el-form label-width="100px" class="mt-3">
                        <el-form-item label="使用模型">
                            <el-select v-model="modelId" placeholder="选择分类模型" style="width: 100%">
                                <el-option
                                    v-for="m in modelOptions"
                                    :key="m.modelId"
                                    :label="m.modelName"
                                    :value="m.modelId"
                                />
                            </el-select>
                        </el-form-item>
                    </el-form>

                    <el-button
                        type="primary"
                        @click="performClassify"
                        :loading="classifying"
                        :disabled="!selectedFile || !modelId"
                        style="width: 100%"
                    >
                        <i class="el-icon-cpu"></i> 开始分类
                    </el-button>
                </el-card>
            </el-col>

            <!-- 右侧：结果区 -->
            <el-col :span="16">
                <el-card class="box-card">
                    <template #header>
                        <div class="card-header">
                            <span><i class="el-icon-data-analysis"></i> 分类结果</span>
                        </div>
                    </template>

                    <el-empty v-if="!classifying && !result" description="上传图片开始分类" />

                    <div v-if="classifying" class="classify-loading">
                        <el-icon class="is-loading" :size="40"><loading /></el-icon>
                        <p class="text-muted mt-2">正在推理...</p>
                    </div>

                    <div v-if="result" class="result-container">
                        <!-- 主结果 -->
                        <el-card shadow="hover" class="main-result">
                            <div class="result-main">
                                <el-tag :type="confidenceTagType(result.confidence)" size="large" class="result-tag">
                                    {{ result.class_name }}
                                </el-tag>
                                <div class="confidence-display">
                                    <span class="confidence-label">置信度</span>
                                    <span class="confidence-value">{{ (result.confidence * 100).toFixed(1) }}%</span>
                                </div>
                            </div>
                        </el-card>

                        <!-- 进度条可视化 -->
                        <el-card shadow="never" class="mt-3">
                            <template #header>
                                <span>置信度分布</span>
                            </template>
                            <div class="prob-bars">
                                <div v-for="(prob, idx) in result.probabilities" :key="idx" class="prob-row">
                                    <span class="prob-label">{{ result.class_names ? result.class_names[idx] : '类别 ' + idx }}</span>
                                    <el-progress
                                        :percentage="Math.round(prob * 100)"
                                        :stroke-width="16"
                                        :color="idx === result.class_id ? '#67C23A' : '#909399'"
                                    />
                                </div>
                            </div>
                        </el-card>
                    </div>
                </el-card>
            </el-col>
        </el-row>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { UploadFilled, Loading } from '@element-plus/icons-vue';
import { classifyImage } from '@/api/lakeintelligence/classify';
import { listModels } from '@/api/lakeintelligence/model';

const route = useRoute();

const selectedFile = ref(null);
const previewUrl = ref('');
const modelId = ref(null);
const classifying = ref(false);
const result = ref(null);
const modelOptions = ref([]);

function handleImageChange(file) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/bmp'];
    if (!allowedTypes.includes(file.raw.type)) {
        ElMessage.warning('仅支持 JPG/PNG/BMP 格式图片');
        return;
    }
    if (file.raw.size > 10 * 1024 * 1024) {
        ElMessage.warning('图片大小超过 10MB 限制');
        return;
    }
    selectedFile.value = file.raw;
    const reader = new FileReader();
    reader.onload = (e) => {
        previewUrl.value = e.target.result;
    };
    reader.readAsDataURL(file.raw);
}

function confidenceTagType(confidence) {
    if (confidence >= 0.8) return 'success';
    if (confidence >= 0.5) return 'warning';
    return 'danger';
}

async function performClassify() {
    if (!selectedFile.value) {
        ElMessage.warning('请先上传图片');
        return;
    }
    if (!modelId.value) {
        ElMessage.warning('请选择分类模型');
        return;
    }

    classifying.value = true;
    result.value = null;

    try {
        const formData = new FormData();
        formData.append('image', selectedFile.value);
        formData.append('model_id', modelId.value);

        const res = await classifyImage(formData);
        result.value = {
            class_name: res.class_name,
            class_id: res.class_id,
            confidence: res.confidence,
            probabilities: res.probabilities || [],
            class_names: res.class_names || [],
        };
    } catch (err) {
        ElMessage.error('分类失败：' + err.message);
    } finally {
        classifying.value = false;
    }
}

function loadModels() {
    listModels({ pageNum: 1, pageSize: 100, taskType: 'CLASSIFICATION' }).then((response) => {
        const list = response.rows || response.list || response || [];
        modelOptions.value = list;
        if (list.length > 0 && !modelId.value) {
            modelId.value = list[0].modelId;
        }
    }).catch(() => {
        ElMessage.error('加载模型列表失败');
    });
}

onMounted(() => {
    loadModels();
});
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

.mt-3 {
    margin-top: 12px;
}

.mt-2 {
    margin-top: 8px;
}

.image-uploader {
    width: 100%;
}

.image-uploader :deep(.el-upload) {
    width: 100%;
    border: 1px dashed #d9d9d9;
    border-radius: 6px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: border-color 0.3s;
}

.image-uploader :deep(.el-upload:hover) {
    border-color: #409EFF;
}

.preview-image {
    width: 100%;
    max-height: 200px;
    object-fit: contain;
    display: block;
}

.upload-placeholder {
    padding: 40px 20px;
    text-align: center;
    color: #909399;
}

.upload-placeholder .el-icon--upload {
    font-size: 40px;
    margin-bottom: 8px;
}

.classify-loading {
    text-align: center;
    padding: 40px;
}

.result-container {
    padding: 10px 0;
}

.main-result {
    text-align: center;
}

.result-main {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
}

.result-tag {
    font-size: 24px;
    padding: 8px 24px;
    height: auto;
}

.confidence-display {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.confidence-label {
    font-size: 12px;
    color: #909399;
}

.confidence-value {
    font-size: 28px;
    font-weight: bold;
    color: #303133;
}

.prob-bars {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.prob-row {
    display: flex;
    align-items: center;
    gap: 12px;
}

.prob-label {
    min-width: 80px;
    font-size: 13px;
    color: #606266;
}
</style>
