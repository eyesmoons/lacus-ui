<template>
  <div class="rule-container">
    <!-- 搜索区域 -->
    <el-form :model="queryParams" ref="queryRef" :inline="true" class="search-form" v-show="showSearch">
      <el-form-item label="模板名称" prop="templateName">
        <el-input v-model="queryParams.templateName" placeholder="请输入模板名称" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="维度" prop="dimension">
        <el-select v-model="queryParams.dimension" placeholder="请选择维度" clearable style="width: 140px">
          <el-option v-for="d in dimensionOptions" :key="d.value" :label="d.label" :value="d.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="启用状态" prop="enabled">
        <el-select v-model="queryParams.enabled" placeholder="请选择状态" clearable style="width: 120px">
          <el-option label="启用" :value="1" />
          <el-option label="禁用" :value="0" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">查询</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" icon="Plus" @click="openCreate">新建模板</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="loadList" />
    </el-row>

    <!-- 模板列表 -->
    <el-table v-loading="loading" :data="filteredList" stripe border>
      <el-table-column label="模板编码" prop="templateCode" min-width="160" show-overflow-tooltip />
      <el-table-column label="模板名称" prop="templateName" min-width="180" show-overflow-tooltip />
      <el-table-column label="维度" prop="dimension" width="120" align="center">
        <template #default="scope">
          <el-tag size="small">{{ dimensionLabel(scope.row.dimension) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="图标" width="100" align="center">
        <template #default="scope">
          <span
            v-if="scope.row.templateColor"
            class="tpl-icon-preview"
            :style="{ backgroundColor: scope.row.templateColor }"
            :title="scope.row.templateIcon || ''"
          />
          <span v-else>—</span>
        </template>
      </el-table-column>
      <el-table-column label="排序" prop="sortOrder" width="80" align="center" />
      <el-table-column label="启用状态" prop="enabled" width="100" align="center">
        <template #default="scope">
          <el-switch
            v-model="scope.row.enabled"
            :active-value="1"
            :inactive-value="0"
            @change="handleToggleEnabled(scope.row)"
          />
        </template>
      </el-table-column>
      <el-table-column label="描述" prop="description" min-width="200" show-overflow-tooltip />
      <el-table-column label="操作" width="160" align="center" fixed="right">
        <template #default="scope">
          <el-button-group>
            <el-tooltip content="编辑" placement="top">
              <el-button type="warning" icon="Edit" @click="openEdit(scope.row.id)" />
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button type="danger" icon="Delete" @click="handleDelete(scope.row)" />
            </el-tooltip>
          </el-button-group>
        </template>
      </el-table-column>
    </el-table>

    <TemplateDialog
      v-model:visible="dialogVisible"
      :editId="editId"
      @success="loadList"
    />
  </div>
</template>

<script setup name="DqRuleTemplate">
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { listAllTemplates, updateTemplate, deleteTemplate } from '@/api/dataquality/templateApi';
import TemplateDialog from './TemplateDialog.vue';

const loading = ref(false);
const templateList = ref([]);
const showSearch = ref(true);
const dialogVisible = ref(false);
const editId = ref(null);

// 维度中文映射（与 rule 页保持一致）
const dimensionMap = {
  completeness: '完整性',
  uniqueness: '唯一性',
  timeliness: '及时性',
  validity: '有效性',
  consistency: '一致性',
  stability: '稳定性',
};
const dimensionOptions = Object.entries(dimensionMap).map(([value, label]) => ({ value, label }));
const dimensionLabel = (v) => dimensionMap[v] || v || '—';

const queryParams = reactive({
  templateName: '',
  dimension: '',
  enabled: '',
});

// 前端过滤（listAllTemplates 返回全量，本地按查询条件过滤）
const filteredList = computed(() => {
  return templateList.value.filter((t) => {
    if (queryParams.templateName && !(t.templateName || '').includes(queryParams.templateName)) return false;
    if (queryParams.dimension && t.dimension !== queryParams.dimension) return false;
    if (queryParams.enabled !== '' && queryParams.enabled != null && t.enabled !== queryParams.enabled) return false;
    return true;
  });
});

const loadList = async () => {
  loading.value = true;
  try {
    const res = await listAllTemplates();
    templateList.value = Array.isArray(res) ? res : (res.rows || []);
  } catch (e) {
    ElMessage.error('获取模板列表失败');
  } finally {
    loading.value = false;
  }
};

const handleQuery = () => { loadList(); };
const resetQuery = () => {
  queryParams.templateName = '';
  queryParams.dimension = '';
  queryParams.enabled = '';
  loadList();
};

// 打开弹框：Task 9 接通 TemplateDialog 后，dialogVisible/editId 由该组件消费
const openCreate = () => { editId.value = null; dialogVisible.value = true; };
const openEdit = (id) => { editId.value = id; dialogVisible.value = true; };

const handleToggleEnabled = async (row) => {
  try {
    await updateTemplate({ id: row.id, enabled: row.enabled });
    ElMessage.success(row.enabled ? '已启用' : '已禁用');
  } catch (e) {
    // 回滚
    row.enabled = row.enabled ? 0 : 1;
    ElMessage.error('操作失败');
  }
};

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除模板「${row.templateName}」吗？删除后不可恢复！`, '提示', {
      confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning',
    });
    await deleteTemplate(row.id);
    ElMessage.success('删除成功');
    loadList();
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('删除失败');
  }
};

onMounted(() => { loadList(); });
</script>

<style scoped>
.rule-container {
  padding: 20px;
}

.rule-container .search-form {
  margin-bottom: 8px;
}

.tpl-icon-preview {
  display: inline-block;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  vertical-align: middle;
}
</style>
