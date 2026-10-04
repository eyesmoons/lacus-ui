<template>
    <div class="app-container">
        <el-row :gutter="20">
            <!-- 左侧：上传区 -->
            <el-col :span="8">
                <el-card class="box-card">
                    <template #header>
                        <span><i class="el-icon-picture"></i> 查询图片</span>
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
                        <el-form-item label="返回数量">
                            <el-slider v-model="topK" :min="1" :max="20" show-input />
                        </el-form-item>
                        <el-form-item label="向量库">
                            <el-select v-model="vectorIndexId" placeholder="默认向量库" clearable style="width: 100%">
                                <el-option label="默认向量库" value="" />
                            </el-select>
                        </el-form-item>
                    </el-form>

                    <el-button
                        type="primary"
                        @click="performSearch"
                        :loading="searching"
                        :disabled="!selectedFile"
                        style="width: 100%"
                    >
                        <i class="el-icon-search"></i> 开始检索
                    </el-button>
                </el-card>
            </el-col>

            <!-- 右侧：结果区 -->
            <el-col :span="16">
                <el-card class="box-card">
                    <template #header>
                        <div class="card-header">
                            <span><i class="el-icon-grid-3x3-gap"></i> 检索结果</span>
                            <span class="text-muted">共 {{ results.length }} 个结果</span>
                        </div>
                    </template>

                    <el-empty v-if="!searching && results.length === 0" description="上传图片开始检索" />

                    <div v-if="searching" class="search-loading">
                        <el-icon class="is-loading" :size="40"><loading /></el-icon>
                        <p class="text-muted mt-2">正在检索相似图片...</p>
                    </div>

                    <div v-if="results.length > 0" class="result-grid">
                        <el-card
                            v-for="(item, idx) in results"
                            :key="idx"
                            shadow="hover"
                            class="result-item"
                        >
                            <img :src="`/api/lake-intelligence/image/${item.id}`" class="result-image" alt="结果" />
                            <div class="result-info">
                                <el-tag :type="similarityTagType(item.similarity)" size="small">
                                    {{ similarityPct(item.similarity) }}%
                                </el-tag>
                                <div class="text-muted small">#{{ idx + 1 }} · ID: {{ item.id }}</div>
                            </div>
                        </el-card>
                    </div>
                </el-card>
            </el-col>
        </el-row>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import { UploadFilled, Loading } from '@element-plus/icons-vue';
import { searchSimilar } from '@/api/lakeintelligence/search';

const router = useRouter();

const selectedFile = ref(null);
const previewUrl = ref('');
const topK = ref(5);
const vectorIndexId = ref('');
const searching = ref(false);
const results = ref([]);

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

function similarityPct(similarity) {
    if (similarity == null) return 0;
    return Math.round(similarity * 100);
}

function similarityTagType(similarity) {
    const pct = similarityPct(similarity);
    if (pct >= 70) return 'success';
    if (pct >= 40) return 'warning';
    return 'danger';
}

async function performSearch() {
    if (!selectedFile.value) {
        ElMessage.warning('请先上传查询图片');
        return;
    }

    searching.value = true;
    results.value = [];

    try {
        const formData = new FormData();
        formData.append('image', selectedFile.value);
        formData.append('image_id', '');
        formData.append('top_k', topK.value);
        formData.append('collection_name', 'image_collection');

        const result = await searchSimilar(formData);
        results.value = result.results || [];
    } catch (err) {
        ElMessage.error('检索失败：' + err.message);
    } finally {
        searching.value = false;
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

.search-loading {
    text-align: center;
    padding: 40px;
}

.result-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 12px;
}

.result-item {
    text-align: center;
}

.result-image {
    width: 100%;
    height: 140px;
    object-fit: cover;
    border-radius: 4px;
}

.result-info {
    padding: 8px;
}

.small {
    font-size: 12px;
}
</style>
