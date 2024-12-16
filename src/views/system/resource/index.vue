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
            :expand-on-click-node="false"
            class="custom-tree"
          >
            <template #default="{ node, data }">
              <div class="custom-tree-node" :title="data.filePath || data.name">
                <span class="node-label">{{ node.label }}</span>
                <span class="operation-buttons" v-if="data.id !== 0">
                  <el-button link type="danger" size="small" @click.stop="handleDeleteDirectory(data)">
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </span>
              </div>
            </template>
          </el-tree>
        </el-card>
      </el-col>

      <!-- 右侧文件列表 -->
      <el-col :span="18">
        <el-card>
          <template #header>
            <div class="card-header">
              <div class="left">
                <span class="directory-path">
                  {{ currentDir?.filePath || '/' }}
                </span>
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
            <el-table-column label="父路径" prop="pfilePath" width="180" />
            <el-table-column label="大小" prop="fileSize" width="120">
              <template #default="{ row }">
                {{ formatFileSize(row.fileSize) }}
              </template>
            </el-table-column>
            <el-table-column label="上传时间" prop="createTime" width="180">
              <template #default="scope">
                <span>{{ parseTime(scope.row.createTime) }}</span>
              </template>
            </el-table-column>
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
      <el-form ref="directoryFormRef" :model="directoryDialog.form" :rules="directoryDialog.rules" label-width="80px">
        <el-form-item label="父级目录" prop="pid">
          <el-tree-select
            v-model="directoryDialog.form.pid"
            :data="[{ id: 0, name: '/', children: directoryList }]"
            :props="{ label: 'name', children: 'children', value: 'id' }"
            placeholder="请选择父级目录"
            check-strictly
            default-expand-all
            clearable
            :style="{ width: '100%' }"
            popper-class="directory-select-dropdown"
          />
        </el-form-item>
        <el-form-item label="目录名称" prop="name">
          <el-input v-model="directoryDialog.form.name" placeholder="请输入目录名称" />
        </el-form-item>
        <el-form-item label="目录说明" prop="remark">
          <el-input v-model="directoryDialog.form.remark" type="textarea" placeholder="请输入目录说明" :rows="3" />
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
    <el-dialog
      v-model="uploadDialog.visible"
      title="上传文件"
      width="500px"
      append-to-body
      @close="handleCloseUploadDialog"
    >
      <el-form ref="uploadFormRef" :model="uploadDialog.form" :rules="uploadDialog.rules" label-width="80px">
        <el-form-item label="选择文件" prop="file">
          <el-upload
            ref="uploadRef"
            class="upload-demo"
            :action="uploadUrl"
            :headers="uploadHeaders"
            :before-upload="beforeUpload"
            :on-success="onUploadSuccess"
            :on-error="onUploadError"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
            :http-request="customUpload"
            :auto-upload="false"
            :limit="1"
            :multiple="false"
            :file-list="uploadDialog.fileList"
            drag
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
            <template #tip>
              <div class="el-upload__tip">文件大小不超过100MB</div>
            </template>
          </el-upload>
        </el-form-item>
        <el-form-item label="文件别名" prop="aliasName">
          <el-input v-model="uploadDialog.form.aliasName" placeholder="请输入文件别名" />
        </el-form-item>
        <el-form-item label="文件说明" prop="remark">
          <el-input v-model="uploadDialog.form.remark" type="textarea" placeholder="请输入文件说明" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleUploadCancel">取 消</el-button>
          <el-button type="primary" @click="submitUpload" :loading="uploadDialog.loading">确 定</el-button>
        </div>
      </template>
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
import { Plus, Search, Document, Folder, Upload, UploadFilled, Delete } from '@element-plus/icons-vue';
import { resourceApi } from '@/api/system/resourceApi';
import { getToken } from '@/utils/token';
import request from '@/utils/request';

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

// 目录对话框状态
const directoryDialog = reactive({
  visible: false,
  loading: false,
  form: {
    name: '',
    pid: 0,
    remark: '',
  },
  rules: {
    name: [
      { required: true, message: '请输入目录名称', trigger: 'blur' },
      { min: 2, max: 20, message: '长度 2 到 20 个字符', trigger: 'blur' },
    ],
    pid: [{ required: true, message: '请选择父级目录', trigger: 'change' }],
    remark: [{ max: 200, message: '长度不能超过 200 个字符', trigger: 'blur' }],
  },
});

// 上传对话框状态
const uploadDialog = reactive({
  visible: false,
  loading: false,
  fileList: [],
  form: {
    aliasName: '',
    remark: '',
  },
  rules: {
    aliasName: [{ max: 100, message: '长度不能超过 100 个字符', trigger: 'blur' }],
    remark: [{ max: 200, message: '长度不能超过 200 个字符', trigger: 'blur' }],
  },
});

const previewDialog = reactive({
  visible: false,
  title: '',
  loading: false,
  component: null,
  fileData: null,
});

// 修改文件变化处理函数
const handleFileChange = (file, fileList) => {
  console.log('文件变化 - 文件:', file);
  console.log('文件变化 - 文件列表:', fileList);

  // 直接使用传入的 fileList
  uploadDialog.fileList = [...fileList];

  // 如果文件列表超过1个，只保留最新的文件
  if (uploadDialog.fileList.length > 1) {
    uploadDialog.fileList = [uploadDialog.fileList[uploadDialog.fileList.length - 1]];
  }
};

// 修改提交上传的方法
const submitUpload = async () => {
  console.log('开始上传检查');

  // 从 uploadRef 获取文件列表
  const uploadFiles = uploadRef.value?.uploadFiles || [];
  console.log('uploadFiles from ref:', uploadFiles);

  // 优先使用 uploadDialog.fileList，如果为空则使用 uploadFiles
  const fileList = uploadDialog.fileList.length ? uploadDialog.fileList : uploadFiles;
  console.log('最终使用的文件列表:', fileList);

  if (!fileList.length) {
    ElMessage.warning('请选择要上传的文件');
    return;
  }

  try {
    uploadDialog.loading = true; // 设置加载状态
    const file = fileList[0];

    // 确保有文件对象
    if (!file || !file.raw) {
      throw new Error('文件对象无效');
    }

    // 直接调用 customUpload
    await customUpload({
      file: file.raw,
      onProgress: (event) => {
        if (event && event.percent) {
          file.percentage = event.percent;
        }
      },
      onSuccess: (response) => {
        onUploadSuccess(response, file);
      },
      onError: (error) => {
        onUploadError(error, file);
      },
    });
  } catch (error) {
    console.error('上传失败:', error);
    ElMessage.error('文件上传失败: ' + (error.message || '未知错误'));
    uploadDialog.loading = false;
  }
};

// 修改上传成功回调
const onUploadSuccess = (response, file) => {
  console.log('上传成功回调:', response, file);
  try {
    // 重置状态
    uploadDialog.loading = false;
    uploadDialog.visible = false;
    uploadDialog.fileList = [];
    uploadDialog.form = {
      aliasName: '',
      remark: '',
    };

    // 清空上传组件的文件
    if (uploadRef.value) {
      uploadRef.value.clearFiles();
    }

    // 重新加载文件列表
    loadFileList();
  } catch (error) {
    console.error('处理上传成功回调时发生错误:', error);
    ElMessage.error('处理上传结果失败');
  }
};

// 修改上传失败的回调
const onUploadError = (error, file) => {
  console.error('上传失败:', error, file);
  ElMessage.error('文件上传失败: ' + (error.message || '未知错误'));
  uploadDialog.loading = false; // 失败后关闭加载状态
};

// 修改上传前的处理函数
const beforeUpload = (file) => {
  console.log('上传前检查文件:', file);

  if (!currentDir.value || currentDir.value.id === 0) {
    ElMessage.warning('请先选择上传目录');
    return false;
  }

  const isLt100M = file.size / 1024 / 1024 < 100;
  if (!isLt100M) {
    ElMessage.error('文件大小不能超过 100MB');
    return false;
  }

  // 将文件添加到列表中
  uploadDialog.fileList = [
    {
      name: file.name,
      size: file.size,
      raw: file,
      status: 'ready',
    },
  ];

  return true;
};

// 修改上传组件的ref定义
const uploadRef = ref(null);

// 加载目录树
const loadDirectoryTree = async () => {
  try {
    loading.value = true;
    const res = await resourceApi.getDirectoryList();
    directoryList.value = handleTreeData(res || []);
  } catch (error) {
    ElMessage.error('加载目录失败');
  } finally {
    loading.value = false;
  }
};

// 处理形数据
const handleTreeData = (data) => {
  if (!Array.isArray(data)) {
    console.warn('录数据不是数组格式:', data);
    return [];
  }

  const buildTree = (items, parentId = 0, parentPath = '/') => {
    const result = [];
    items.forEach((item) => {
      if (item.pid === parentId) {
        const currentPath = parentPath + item.name + '/';
        const node = {
          ...item,
          filePath: currentPath, // 添加完整路径
          children: buildTree(items, item.id, currentPath),
        };
        if (node.children.length === 0) {
          delete node.children;
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
    console.log('加载文件列表，参数:', params);
    const res = await resourceApi.getFileList(params);
    fileList.value = res.rows;
    pagination.total = res.total;
    console.log('文件列表加载完成');
  } catch (error) {
    console.error('加载文件列表失败:', error);
    ElMessage.error('加载文件列表失败');
  } finally {
    loading.value = false;
  }
};

// 目录节点点击
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
    remark: '',
  };
  directoryDialog.visible = true;
  // 等待 DOM 更新后聚���输入框
  nextTick(() => {
    directoryFormRef.value?.clearValidate();
  });
};

// 提交新目录
const submitDirectory = async () => {
  if (!directoryFormRef.value || directoryDialog.loading) return;

  try {
    directoryDialog.loading = true;
    await directoryFormRef.value.validate();
    await resourceApi.createDirectory({
      name: directoryDialog.form.name,
      pid: directoryDialog.form.pid,
      remark: directoryDialog.form.remark,
    });
    ElMessage.success('创建目录功');
    directoryDialog.visible = false;
    await loadDirectoryTree();
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

// 修改上传URL的计算属性
const uploadUrl = computed(() => {
  const baseUrl = import.meta.env.VITE_APP_BASE_API;
  const pid = currentDir.value?.id || 0;
  return `${baseUrl}/system/resource/upload/${pid}`;
});

// 文件预览
const handlePreview = async (file) => {
  previewDialog.title = file.fileName;
  previewDialog.loading = true;
  previewDialog.visible = true;

  try {
    const res = await resourceApi.previewFile(file.id);
    const ext = file.fileName.split('.').pop().toLowerCase();

    // 根据件类型设置预览组件
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
    await loadFileList();
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

// 添加删除目录的处理函数
const handleDeleteDirectory = async (data) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除目录 "${data.name}" 吗？删除后将无法恢复且会同时删除该目录下的所有文件和目录。`,
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      },
    );

    await resourceApi.deleteResource(data.id);
    ElMessage.success('删除成功');

    // 重新加载目录树
    await loadDirectoryTree();

    // 如果删除的是当前选中的目录，则重置当前目录
    if (currentDir.value?.id === data.id) {
      currentDir.value = null;
      // 重新加载文件列表
      await loadFileList();
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除目录失败:', error);
      ElMessage.error('删除目录失败');
    }
  }
};

// 初始化
onMounted(() => {
  loadDirectoryTree();
  loadFileList();
});

// 修改上传配置
const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${getToken()}`,
}));

// 修改取消按钮的处理函数
const handleUploadCancel = async () => {
  console.log('点击取消按钮');
  // 直接关闭对话框并重置状态
  uploadDialog.visible = false;
  uploadDialog.loading = false;
  uploadDialog.fileList = [];
  uploadDialog.form = {
    aliasName: '',
    remark: '',
  };

  // 清空上传组件的���件
  if (uploadRef.value) {
    uploadRef.value.clearFiles();
  }

  // 等待状态重置后刷新列表
  await nextTick();
  await loadFileList();
  console.log('列表已刷新');
};

// 修改关闭对话框的处理函数
const handleCloseUploadDialog = async () => {
  console.log('关闭上传对话框');
  // 如果正在上传，不允许关闭
  if (uploadDialog.loading) {
    ElMessage.warning('文件正在上传中，请稍候...');
    return;
  }

  // 重置状态
  uploadDialog.visible = false;
  uploadDialog.loading = false;
  uploadDialog.fileList = [];
  uploadDialog.form = {
    aliasName: '',
    remark: '',
  };

  // 清空上传组件的文件
  if (uploadRef.value) {
    uploadRef.value.clearFiles();
  }

  // 等待状态重置后刷新列表
  await nextTick();
  await loadFileList();
  console.log('列表已刷新');
};

// 修改上传按钮的处理函数
const handleUpload = () => {
  if (!currentDir.value || currentDir.value.id === 0) {
    ElMessage.warning('不能在根目录上传文件，请选择一个目录');
    return;
  }
  // 重置表单和文件
  uploadDialog.form.aliasName = '';
  uploadDialog.form.remark = '';
  uploadDialog.loading = false;
  if (uploadRef.value) {
    uploadRef.value.clearFiles();
  }
  uploadDialog.visible = true;
};

// 修改自定义上传方法
const customUpload = async (options) => {
  const { file, onProgress, onSuccess, onError } = options;

  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('aliasName', uploadDialog.form.aliasName || '');
    formData.append('remark', uploadDialog.form.remark || '');
    formData.append('pid', currentDir.value?.id || 0);

    console.log('开始上传文件:', {
      fileName: file.name,
      fileSize: file.size,
      formData: {
        aliasName: uploadDialog.form.aliasName,
        remark: uploadDialog.form.remark,
        pid: currentDir.value?.id,
      },
    });

    // 使用 resourceApi.uploadFile 上传
    const response = await resourceApi.uploadFile(formData, (event) => {
      console.log('上传进度:', event);
      onProgress(event);
    });

    console.log('上传响应:', response);

    // 检查响应是否有效
    if (!response) {
      throw new Error('服务器无响应');
    }

    // 根据后端返回的 code 判断是否成功
    if (response.code === 0) {
      console.log('上传成功，处理响应:', response);
      onSuccess(response);
      ElMessage.success('上传成功');
      uploadDialog.visible = false;
      uploadDialog.loading = false;
      await loadFileList();
    } else {
      throw new Error(response.msg || '上传失败');
    }
  } catch (error) {
    console.error('上传失败:', error);
    onError(error);
    ElMessage.error(error.message || '上传失败');
  } finally {
    uploadDialog.loading = false;
  }
};
</script>

<style lang="scss">
.directory-select-dropdown {
  .el-tree-select__popper {
    max-height: 100px !important;
  }

  .el-tree {
    max-height: 300px;
    overflow-y: auto;
  }

  .el-scrollbar__wrap {
    max-height: 300px !important;
  }

  // 美化滚动条
  .el-tree::-webkit-scrollbar {
    width: 6px;
  }

  .el-tree::-webkit-scrollbar-thumb {
    background: #c0c4cc;
    border-radius: 3px;
  }

  .el-tree::-webkit-scrollbar-track {
    background: #f5f7fa;
  }
}
</style>

<style lang="scss" scoped>
.app-container {
  padding: 20px;

  .directory-tree {
    .filter-input {
      margin-bottom: 12px;
    }

    :deep(.custom-tree) {
      // 基础节点样式
      .el-tree-node {
        padding: 2px 0;
        position: relative;
      }

      // 节点内容样式
      .el-tree-node__content {
        height: 28px;
        border-radius: 3px;
        transition: all 0.3s;
        position: relative;

        &:hover {
          .operation-buttons {
            display: inline-flex;
            z-index: 1;
          }
        }
      }

      // 选中状态
      .el-tree-node.is-current > .el-tree-node__content {
        background-color: #e6f2ff;
        color: #409eff;
        font-weight: 500;
      }

      // 层级缩进和连接线
      .el-tree-node__children {
        padding-left: 16px;
        position: relative;

        &::before {
          content: '';
          position: absolute;
          left: 8px;
          top: 0;
          bottom: 0;
          width: 1px;
          background-color: #dcdfe6;
        }
      }

      // 子节点连接线
      .el-tree-node:not(:last-child)::after {
        content: '';
        position: absolute;
        left: -8px;
        top: 28px;
        width: 16px;
        height: 1px;
        background-color: #dcdfe6;
      }

      // 图标样式
      .el-icon {
        margin-right: 4px;
        font-size: 14px;
        color: #909399;

        // 文件夹图标特殊颜色
        &.folder {
          color: #fac858;
        }
      }

      // 文本样式
      .el-tree-node__label {
        font-size: 13px;
        color: #606266;
      }

      // 展开/折叠图标
      .el-tree-node__expand-icon {
        padding: 4px;

        &.expanded {
          transform: rotate(90deg);
        }

        &:hover {
          background-color: #e4e7ed;
          border-radius: 2px;
        }
      }

      // 悬停效果增强
      .el-tree-node:hover > .el-tree-node__content {
        background-color: #f0f2f5;
        .el-tree-node__label {
          color: #409eff;
        }
      }

      // 添加自定义节点样式
      .custom-tree-node {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        min-width: 0;

        .node-label {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          margin-right: 24px;
        }

        .operation-buttons {
          display: none;
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          background-color: inherit;

          .el-button {
            padding: 2px 4px;

            .el-icon {
              font-size: 14px;
            }
          }
        }
      }

      // 删除之前的hover式
      .custom-tree-node:hover {
        .operation-buttons {
          display: none; // 防止重复触发
        }
      }
    }
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .left {
      flex: 1;
      margin-right: 16px;
      overflow: hidden;

      .directory-path {
        font-size: 14px;
        color: #606266;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        display: block;
      }
    }

    .right {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-shrink: 0;

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
