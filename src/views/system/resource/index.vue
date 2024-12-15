<template>
  <div class="app-container">
    <el-row :gutter="20">
      <!-- 左侧目录树 -->
      <el-col :span="6" class="directory-tree">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>/</span>
              <el-button type="primary" link @click="handleAddDirectory">
                <el-icon><Plus /></el-icon>新建目录
              </el-button>
            </div>
          </template>
          <el-input v-model="directorySearchKey" placeholder="搜索目录" clearable class="filter-input">
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-tree
            ref="directoryTreeRef"
            :data="directoryList"
            :props="{
              label: 'name',
              children: 'children',
              disabled: true,
            }"
            :filter-node-method="filterNode"
            node-key="id"
            highlight-current
            default-expand-all
            @node-click="handleNodeClick"
          />
        </el-card>
      </el-col>

      <!-- 右侧文件列表 -->
      <el-col :span="18">
        <el-card>
          <template #header>
            <div class="card-header">
              <div class="left">
                <span>{{ currentDir?.name || '文件列表' }}</span>
              </div>
              <div class="right">
                <el-input v-model="fileSearchKey" placeholder="搜索文件" clearable class="search-input">
                  <template #prefix>
                    <el-icon><Search /></el-icon>
                  </template>
                </el-input>
                <el-button type="primary" @click="handleUpload">
                  <el-icon><Upload /></el-icon>上传文件
                </el-button>
              </div>
            </div>
          </template>

          <el-table v-loading="loading" :data="fileList" style="width: 100%">
            <el-table-column label="文件名" prop="fileName" min-width="200">
              <template #default="{ row }">
                <el-icon v-if="row.type === '1'"><Folder /></el-icon>
                <el-icon v-else><Document /></el-icon>
                {{ row.fileName }}
              </template>
            </el-table-column>
            <el-table-column label="大小" prop="fileSize" width="120">
              <template #default="{ row }">
                {{ formatFileSize(row.fileSize) }}
              </template>
            </el-table-column>
            <el-table-column label="上传时间" prop="createTime" width="180" />
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" @click="handlePreview(row)"> 预览 </el-button>
                <el-button link type="primary" @click="handleDownload(row)"> 下载 </el-button>
                <el-button link type="danger" @click="handleDelete(row)"> 删除 </el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页 -->
          <div class="pagination-container">
            <el-pagination
              v-model:current-page="pagination.pageNum"
              v-model:page-size="pagination.pageSize"
              :page-sizes="[10, 20, 50, 100]"
              :total="pagination.total"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleSizeChange"
              @current-change="handlePageChange"
            />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 新建目录弹窗 -->
    <el-dialog
      v-model="directoryDialog.visible"
      title="新建目录"
      width="500px"
      append-to-body
      :close-on-click-modal="false"
      @close="handleCloseDialog"
    >
      <el-form
        ref="directoryFormRef"
        :model="directoryDialog.form"
        :rules="directoryDialog.rules"
        label-width="80px"
        @submit.prevent="submitDirectory"
      >
        <el-form-item label="目录名称" prop="name">
          <el-input v-model="directoryDialog.form.name" placeholder="请输入目录名称" @keyup.enter="submitDirectory" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleCloseDialog">取 消</el-button>
          <el-button type="primary" :loading="directoryDialog.loading" @click="submitDirectory"> 确 定 </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 文件上传弹窗 -->
    <el-dialog v-model="uploadDialog.visible" title="上传文件" width="500px" append-to-body>
      <el-upload
        class="upload-demo"
        :action="uploadUrl"
        :data="uploadData"
        :before-upload="beforeUpload"
        :on-success="onUploadSuccess"
        :on-error="onUploadError"
        multiple
        drag
      >
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
        <template #tip>
          <div class="el-upload__tip">文件大小不超过100MB</div>
        </template>
      </el-upload>
    </el-dialog>

    <!-- 文件预览弹窗 -->
    <el-dialog v-model="previewDialog.visible" :title="previewDialog.title" width="800px" append-to-body>
      <div v-loading="previewDialog.loading" class="preview-content">
        <component :is="previewDialog.component" v-if="previewDialog.component" :file-data="previewDialog.fileData" />
        <div v-else class="no-preview">该文件类型暂不支持预览</div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Search, Document, Folder, Upload, UploadFilled } from '@element-plus/icons-vue';
import { resourceApi } from '@/api/system/resourceApi';

// 状态定义
const loading = ref(false);
const directoryTreeRef = ref(null);
const directoryFormRef = ref(null);
const directoryList = ref([]);
const fileList = ref([]);
const currentDir = ref(null);
const directorySearchKey = ref('');
const fileSearchKey = ref('');

// 分页参数
const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0,
});

// 对话框状态
const directoryDialog = reactive({
  visible: false,
  loading: false,
  form: {
    name: '',
    pid: 0,
  },
  rules: {
    name: [
      { required: true, message: '请输入目录名称', trigger: 'blur' },
      { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' },
    ],
  },
});

const uploadDialog = reactive({
  visible: false,
});

const previewDialog = reactive({
  visible: false,
  title: '',
  loading: false,
  component: null,
  fileData: null,
});

// 加载目录树
const loadDirectoryTree = async () => {
  try {
    loading.value = true;
    const res = await resourceApi.getDirectoryList();
    console.log('目录树原始数据:', res);
    directoryList.value = handleTreeData(res || []);
    console.log('处理后的目录树数据:', directoryList.value);
  } catch (error) {
    console.error('加载目录失败:', error);
    ElMessage.error('加载目录失败');
  } finally {
    loading.value = false;
  }
};

// 处理树形数据
const handleTreeData = (data) => {
  if (!Array.isArray(data)) {
    console.warn('目录数据不是数组格式:', data);
    return [];
  }

  const buildTree = (items, parentId = 0) => {
    const result = [];
    items.forEach((item) => {
      if (item.pid === parentId) {
        const node = { ...item };
        const children = buildTree(items, item.id);
        if (children.length) {
          node.children = children;
        }
        result.push(node);
      }
    });
    return result;
  };

  return buildTree(data);
};

// 加载文件列表
const loadFileList = async () => {
  try {
    loading.value = true;
    const params = {
      pid: currentDir.value?.id || 0,
      fileName: fileSearchKey.value,
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize,
    };
    const res = await resourceApi.getFileList(params);
    fileList.value = res.rows;
    pagination.total = res.total;
  } catch (error) {
    ElMessage.error('加载文件列表失败');
  } finally {
    loading.value = false;
  }
};

// 目录树节点点击
const handleNodeClick = (data) => {
  currentDir.value = data;
  loadFileList();
};

// 目录树过滤
const filterNode = (value, data) => {
  if (!value) return true;
  return data.name.toLowerCase().includes(value.toLowerCase());
};

// 新建目录
const handleAddDirectory = () => {
  directoryDialog.form = {
    name: '',
    pid: currentDir.value?.id || 0,
  };
  directoryDialog.visible = true;
  // 等待 DOM 更新后聚焦输入框
  nextTick(() => {
    directoryFormRef.value?.clearValidate();
  });
};

// 提交新建目录
const submitDirectory = async () => {
  if (!directoryFormRef.value || directoryDialog.loading) return;

  try {
    directoryDialog.loading = true;
    await directoryFormRef.value.validate();
    await resourceApi.createDirectory({
      name: directoryDialog.form.name,
      pid: directoryDialog.form.pid,
    });
    ElMessage.success('创建目录成功');
    directoryDialog.visible = false;
    loadDirectoryTree();
  } catch (error) {
    console.error('创建目录失败:', error);
    ElMessage.error('创建目录失败');
  } finally {
    directoryDialog.loading = false;
  }
};

// 关闭对话框时重置表单
const handleCloseDialog = () => {
  directoryDialog.visible = false;
  directoryDialog.loading = false;
  nextTick(() => {
    directoryFormRef.value?.resetFields();
  });
};

// 文件上传相关
const uploadUrl = `${import.meta.env.VITE_APP_BASE_API}/system/resource/upload`;
const uploadData = computed(() => ({
  pid: currentDir.value?.id || 0,
}));

const handleUpload = () => {
  uploadDialog.visible = true;
};

const beforeUpload = (file) => {
  const isLt100M = file.size / 1024 / 1024 < 100;
  if (!isLt100M) {
    ElMessage.error('文件大小不能超过 100MB!');
    return false;
  }
  return true;
};

const onUploadSuccess = () => {
  ElMessage.success('上传成功');
  loadFileList();
  uploadDialog.visible = false;
};

const onUploadError = () => {
  ElMessage.error('上传失败');
};

// 文件预览
const handlePreview = async (file) => {
  previewDialog.title = file.fileName;
  previewDialog.loading = true;
  previewDialog.visible = true;

  try {
    const res = await resourceApi.previewFile(file.id);
    const ext = file.fileName.split('.').pop().toLowerCase();

    // 根据文件类型设置预览组件
    switch (ext) {
      case 'pdf':
        previewDialog.component = 'pdf-preview';
        break;
      case 'txt':
      case 'csv':
        previewDialog.component = 'text-preview';
        break;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        previewDialog.component = 'image-preview';
        break;
      default:
        previewDialog.component = null;
    }

    previewDialog.fileData = res.data;
  } catch (error) {
    ElMessage.error('预览失败');
  } finally {
    previewDialog.loading = false;
  }
};

// 文件下载
const handleDownload = async (file) => {
  try {
    const res = await resourceApi.downloadFile(file.id);
    const blob = new Blob([res]);
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = file.fileName;
    link.click();
    window.URL.revokeObjectURL(link.href);
  } catch (error) {
    ElMessage.error('下载失败');
  }
};

// 删除文件
const handleDelete = async (file) => {
  try {
    await ElMessageBox.confirm('确定要删除该文件吗？', '提示', {
      type: 'warning',
    });
    await resourceApi.deleteResource(file.id);
    ElMessage.success('删除成功');
    loadFileList();
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败');
    }
  }
};

// 格式化文件大小
const formatFileSize = (size) => {
  if (!size) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let index = 0;
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024;
    index++;
  }
  return `${size.toFixed(2)} ${units[index]}`;
};

// 监听搜索关键字变化
watch(directorySearchKey, (val) => {
  directoryTreeRef.value?.filter(val);
});

watch(fileSearchKey, () => {
  loadFileList();
});

// 处理分页变化
const handlePageChange = (newPage) => {
  pagination.pageNum = newPage;
  loadFileList();
};

const handleSizeChange = (newSize) => {
  pagination.pageSize = newSize;
  pagination.pageNum = 1;
  loadFileList();
};

// 初始化
onMounted(() => {
  loadDirectoryTree();
  loadFileList();
});
</script>

<style lang="scss" scoped>
.app-container {
  padding: 20px;

  .directory-tree {
    .filter-input {
      margin-bottom: 15px;
    }
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .right {
      display: flex;
      align-items: center;
      gap: 10px;

      .search-input {
        width: 200px;
      }
    }
  }

  .pagination-container {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }

  .preview-content {
    min-height: 400px;

    .no-preview {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 400px;
      color: #909399;
    }
  }

  :deep(.el-upload-dragger) {
    width: 100%;
  }
}
</style>
