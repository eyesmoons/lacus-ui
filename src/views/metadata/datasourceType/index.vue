<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="90px">
      <el-form-item label="名称" prop="name">
        <el-input v-model="queryParams.name" placeholder="请输入名称" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
    </el-row>

    <el-row :gutter="20">
      <el-col :xs="24" :sm="12" :md="8" :lg="6" v-for="item in datasourceTypeList" :key="item.typeId">
        <el-card class="datasource-card" shadow="hover" @click="handleCardClick(item)">
          <template #header>
            <div class="card-header">
              <span class="card-title">{{ item.name }}</span>
            </div>
          </template>
          <div class="card-content">
            <div class="image-container">
              <img :src="getImageUrl(item.icon)" :alt="item.name" />
            </div>
            <div class="info-container">
              <div class="info-item" v-if="item.remark">
                <el-tooltip :content="item.remark" placement="top" :show-after="500">
                  <span class="remark-text">{{ item.remark }}</span>
                </el-tooltip>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailDialogVisible" :title="selectedType?.name + ' 详情'" width="50%" destroy-on-close>
      <el-descriptions :column="1" border>
        <el-descriptions-item label="名称">{{ selectedType?.name }}</el-descriptions-item>
        <el-descriptions-item label="类型">{{ selectedType?.typeName }}</el-descriptions-item>
        <el-descriptions-item label="驱动名称">{{ selectedType?.driverName }}</el-descriptions-item>
        <el-descriptions-item label="备注">{{ selectedType?.remark }}</el-descriptions-item>
        <el-descriptions-item label="连接参数">
          <div v-if="parsedConnectionParams.length > 0">
            <el-descriptions :column="1" border>
              <el-descriptions-item v-for="(param, index) in parsedConnectionParams" :key="index" :label="param.name">
                <div class="param-content">
                  <span>{{ param.description }}</span>
                  <el-tag size="small" :type="param.required ? 'danger' : 'info'">
                    {{ param.required ? '必填' : '选填' }}
                  </el-tag>
                </div>
              </el-descriptions-item>
            </el-descriptions>
          </div>
          <el-empty v-else description="暂无连接参数" />
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <el-pagination
      class="pagination-container"
      v-model:current-page="queryParams.pageNum"
      v-model:page-size="queryParams.pageSize"
      :page-sizes="[10, 20, 50, 100]"
      :total="total"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
      layout="total, sizes, prev, pager, next, jumper"
    />
  </div>
</template>

<script setup name="datasourceType">
import * as datasourceApi from '@/api/metadata/datasourceApi';
import * as datasourcePluginApi from '@/api/metadata/datasourcePluginApi';
import { ref, computed } from 'vue';

const { proxy } = getCurrentInstance();
const { datasource_status, datasource_type } = proxy.useDict('datasource_status', 'datasource_type');
const datasourceTypeList = ref([]);
const loading = ref(true);
const showSearch = ref(true);
const total = ref(0);

const data = reactive({
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    name: undefined,
  },
});

const { queryParams } = toRefs(data);

// 详情弹窗相关
const detailDialogVisible = ref(false);
const selectedType = ref(null);
const parsedConnectionParams = computed(() => {
  if (!selectedType.value?.connectionParams) return [];
  try {
    const params = JSON.parse(selectedType.value.connectionParams);
    if (Array.isArray(params)) {
      return params;
    } else if (typeof params === 'object') {
      return Object.entries(params).map(([name, config]) => ({
        name,
        description: config.description || name,
        required: config.required || false,
        ...config,
      }));
    }
    return [];
  } catch (e) {
    console.error('解析连接参数失败:', e);
    return [];
  }
});

function getImageUrl(imgName) {
  return new URL(`../../../assets/images/${imgName}`, import.meta.url).href;
}

/** 查询数据源列表 */
function getList() {
  loading.value = true;
  datasourcePluginApi
    .pageList(queryParams.value)
    .then((response) => {
      datasourceTypeList.value = response.rows;
      total.value = response.total;
    })
    .finally(() => {
      loading.value = false;
    });
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.value.pageNum = 1;
  getList();
}

/** 重置按钮操作 */
function resetQuery() {
  proxy.resetForm('queryRef');
  handleQuery();
}

/** 处理每页显示条数变化 */
function handleSizeChange(val) {
  queryParams.value.pageSize = val;
  getList();
}

/** 处理页码变化 */
function handleCurrentChange(val) {
  queryParams.value.pageNum = val;
  getList();
}

/** 点击卡片 */
function handleCardClick(item) {
  selectedType.value = item;
  detailDialogVisible.value = true;
}

getList();
</script>

<style lang="scss" scoped>
.datasource-card {
  margin-bottom: 20px;
  transition: all 0.3s;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .card-title {
      font-size: 16px;
      font-weight: bold;
      color: #303133;
    }
  }

  .card-content {
    .image-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100px;
      margin-bottom: 15px;

      img {
        max-height: 100%;
        max-width: 100%;
        object-fit: contain;
      }
    }

    .info-container {
      .info-item {
        margin-bottom: 8px;
        color: #606266;
        font-size: 14px;

        .remark-text {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
          color: #909399;
          font-size: 13px;
          cursor: pointer;
        }
      }
    }
  }
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.param-content {
  display: flex;
  justify-content: space-between;
  align-items: center;

  span {
    margin-right: 10px;
  }
}

:deep(.el-descriptions__cell) {
  padding: 12px !important;
}
</style>
