<template>
  <div class="app-container">
    <el-steps :active="active" finish-status="finish" simple="simple" class="task-header">
      <el-step title="输入源配置" icon="coin"></el-step>
      <el-step title="映射关系配置" icon="connection"></el-step>
      <el-step title="任务参数配置" icon="setting"></el-step>
    </el-steps>

    <!-- 输入源配置 -->
    <div v-show="active === 1" class="layout">
      <div class="select-header">
        <div class="select-header-title">输入源配置</div>
        <el-form :model="form" ref="sourceConfRef">
          <el-row :gutter="10">
            <el-col :span="12" :pull="12">
              <el-form-item label="输入源" prop="sourceDatasourceId">
                <el-select
                  v-model="form.sourceDatasourceId"
                  value-key="datasourceId"
                  @change="selectSourceDatasource($event)"
                  placeholder="请选择输入源"
                  clearable
                  filterable
                >
                  <el-option
                    v-for="item in sourceDatasourceOption"
                    :key="item.datasourceId"
                    :label="item.datasourceName"
                    :value="item.datasourceId"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12" :push="12">
              <el-form-item label="数据库" prop="sourceDbName">
                <el-select
                  v-model="form.sourceDbName"
                  value-key="dbName"
                  @change="selectSourceDb($event)"
                  placeholder="请选择数据库"
                  clearable
                  filterable
                >
                  <el-option
                    v-for="item in sourceDbOption"
                    :key="item.dbName"
                    :label="item.dbName"
                    :value="item.dbName"
                  />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>
      <el-transfer
        :titles="['待接入表', '已选择表']"
        v-model="sourceTable.value"
        :data="sourceTable.data"
        :button-texts="['从待接入列表移除', '添加到待接入列表']"
        @change="sourceTableRightChange($event)"
      ></el-transfer>
    </div>

    <!-- 映射关系配置 -->
    <div v-show="active === 2" class="layout">
      <div class="select-header">
        <div class="select-header-title">输出源配置</div>
        <el-form :model="form" ref="sinkConfRef">
          <el-row :gutter="10">
            <el-col :span="12" :pull="12">
              <el-form-item label="输出源" prop="sinkDatasourceId">
                <el-select
                  v-model="form.sinkDatasourceId"
                  value-key="datasourceId"
                  @change="selectSinkDatasource($event)"
                  placeholder="请选择输出源"
                  clearable
                  filterable
                >
                  <el-option
                    v-for="item in sinkDatasourceOption"
                    :key="item.datasourceId"
                    :label="item.datasourceName"
                    :value="item.datasourceId"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12" :push="12">
              <el-form-item label="数据库" prop="sinkDbName">
                <el-select
                  v-model="form.sinkDbName"
                  value-key="dbName"
                  @change="selectSinkDb($event)"
                  placeholder="请选择数据库"
                  clearable
                  filterable
                >
                  <el-option
                    v-for="item in sinkDbOption"
                    :key="item.dbName"
                    :label="item.dbName"
                    :value="item.dbName"
                  />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>
      <div class="table-mapping">
        <div class="table-div">
          <!-- 输入表 -->
          <div class="left-table table-wrapper">
            <el-table ref="sourceTableRef" :data="sourceTableRight" border style="width: 100%">
              <el-table-column type="index" label="序号" width="60" />
              <el-table-column prop="sourceTableName" label="输入表" />
            </el-table>
          </div>
          <!-- 映射关系line -->
          <div class="line-div">
            <div class="table-wrapper">
              <el-row style="width: 100%; flex-direction: column">
                <el-col v-for="item in sourceTableRight">
                  <el-divider></el-divider>
                </el-col>
              </el-row>
            </div>
          </div>
          <!-- 输出表 -->
          <div class="right-table table-wrapper">
            <el-table ref="sinkTableRef" :data="mappedSinkTable" border style="width: 100%">
              <el-table-column prop="sinkTableName" label="输出表">
                <template #default="scope">
                  <el-select v-model="scope.row.tableName" placeholder="请选择表" clearable filterable>
                    <el-option
                      v-for="(item, index) in sinkTable"
                      :key="item.tableId"
                      :label="item.tableName"
                      :value="item.tableName"
                    />
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column label="操作">
                <template #default="scope">
                  <el-button link type="primary" @click="columnMappingConf(scope.$index, scope.row)">
                    字段映射配置
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </div>
    </div>

    <!-- 任务参数配置 -->
    <div v-show="active === 3" class="layout">
      <el-form ref="taskFormRef" :model="form" :rules="rules" label-width="100px">
        <el-divider direction="vertical"></el-divider>
        <span class="divider-text">基础配置</span>
        <div class="task-params-form">
          <el-row :gutter="24">
            <el-col :span="8" :push="2">
              <el-form-item label="任务名称：" prop="jobName">
                <el-input v-model="form.jobName" placeholder="请输入任务名称" />
              </el-form-item>
            </el-col>
            <el-col :span="8" :push="6">
              <el-form-item label="所属分组：" prop="catalogId">
                <el-select v-model="form.catalogId" placeholder="请选择所属分组">
                  <el-option
                    v-for="item in catalogOption"
                    :key="item.catalogId"
                    :label="item.catalogName"
                    :value="item.catalogId"
                  />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="24">
            <el-col :span="18" :push="2">
              <el-form-item label="任务描述：" prop="remark">
                <el-input v-model="form.remark" placeholder="请输入任务描述" type="textarea" />
              </el-form-item>
            </el-col>
          </el-row>
        </div>
        <el-divider direction="vertical"></el-divider>
        <span class="divider-text">任务参数</span>
        <div class="task-params-form">
          <el-row :gutter="24">
            <el-col :span="10" :push="2">
              <el-form-item label="master：" prop="jobManager">
                <el-select v-model="form.jobManager" placeholder="请选择" clearable>
                  <el-option :value="1" label="1GB" :key="1" />
                  <el-option :value="2" label="2GB" :key="2" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="10" :push="2">
              <el-form-item label="worker：" prop="taskManager">
                <el-select v-model="form.taskManager" placeholder="请选择" clearable>
                  <el-option :value="1" label="1GB" :key="1" />
                  <el-option :value="2" label="2GB" :key="2" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
        </div>
        <el-divider direction="vertical"></el-divider>
        <span class="divider-text">限流配置</span>
        <div class="task-params-form">
          <el-row :gutter="24">
            <el-col :span="10" :push="2">
              <el-form-item label="窗口间隔：" prop="windowSize">
                <el-select v-model="form.windowSize" placeholder="请选择" clearable>
                  <el-option :value="5" label="5秒" :key="5" />
                  <el-option :value="10" label="10秒" :key="10" />
                  <el-option :value="30" label="30秒" :key="30" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="10" :push="2">
              <el-form-item label="最大条数：" prop="maxCount">
                <el-select v-model="form.maxCount" placeholder="请选择" clearable>
                  <el-option :value="2" label="2万条" :key="2" />
                  <el-option :value="5" label="5万条" :key="5" />
                  <el-option :value="10" label="10万条" :key="10" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="24">
            <el-col :span="10" :push="2">
              <el-form-item label="最大数据量：" prop="maxSize">
                <el-select v-model="form.maxSize" placeholder="请选择" clearable>
                  <el-option :value="10" label="10MB" :key="10" />
                  <el-option :value="20" label="20MB" :key="20" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
        </div>
      </el-form>
    </div>
    <div class="task-bottom">
      <el-button v-if="active === 1" style="margin-top: 15px" @click="cancel()">取消</el-button>
      <el-button v-if="active !== 1" style="margin-top: 15px" @click="back()">上一步</el-button>
      <el-button v-if="active !== 3" type="primary" style="margin-top: 15px" @click="next()">下一步</el-button>
      <el-button v-if="active === 3" type="primary" style="margin-top: 15px" @click="saveJob()">提交 </el-button>
    </div>

    <!-- 字段映射弹框 -->
    <el-dialog title="字段映射" v-model="columnMappingDialog" append-to-body style="width: 70%">
      <div class="table-mapping" style="height: 500px; overflow-y: scroll">
        <div class="table-div">
          <!-- 输入源字段 -->
          <div class="left-table table-wrapper">
            <el-table ref="sourceColumnRef" :data="mappedColumn.mappedSourceColumns" border style="width: 100%">
              <el-table-column prop="comment" label="字段备注" />
              <el-table-column prop="dataType" label="字段类型" />
              <el-table-column prop="columnLength" label="字段长度" />
              <el-table-column prop="columnName" label="输入字段" />
            </el-table>
          </div>
          <!-- 映射关系line -->
          <div class="line-div">
            <div class="table-wrapper">
              <el-row style="width: 100%; flex-direction: column">
                <el-col v-for="item in mappedColumn.mappedSourceColumns">
                  <el-divider></el-divider>
                </el-col>
              </el-row>
            </div>
          </div>
          <!-- 输出源字段 -->
          <div class="right-table table-wrapper">
            <el-table ref="sinkColumnRef" :data="mappedColumn.mappedSinkColumns" border style="width: 100%">
              <el-table-column prop="columnName" label="输出字段">
                <template #default="scope">
                  <el-select
                    v-model="scope.row.columnName"
                    placeholder="请选择字段"
                    clearable
                    @change="selectSinkColumn($event, scope.$index, scope.row)"
                    filterable
                  >
                    <el-option
                      v-for="(item, index) in sinkColumns"
                      :key="item.columnId"
                      :label="item.columnName"
                      :value="item.columnName"
                    />
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column prop="comment" label="字段备注" />
              <el-table-column prop="dataType" label="字段类型" />
              <el-table-column prop="columnLength" label="字段长度" />
            </el-table>
          </div>
        </div>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="cancelDialog">取消</el-button>
        <el-button type="primary" @click="doCheckColumnMapping">确定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script setup name="job">
import * as datasourceApi from '@/api/metadata/datasourceApi';
import * as dbApi from '@/api/metadata/dbApi';
import * as tableApi from '@/api/metadata/tableApi';
import * as catalogApi from '@/api/datasync/catalogApi';
import * as jobApi from '@/api/datasync/jobApi';
import * as columnApi from '@/api/metadata/columnApi';
import { ref } from 'vue';

const router = useRouter();
const { proxy } = getCurrentInstance();
const route = useRoute();
const active = ref(1);
const checkedTableMappings = ref([]);
const columnMappingDialog = ref(false);
const sourceDatasourceOption = ref([]);
const sinkDatasourceOption = ref([]);
const sourceDbOption = ref([]);
const sinkDbOption = ref([]);
const leftTable = ref([]);
const sourceTableRight = ref([]);
const rightTable = ref([]);
const sourceTable = ref({});
const sinkTable = ref([]);
const mappedSinkTable = ref([]);
const sourceConfRef = ref(null);
const sinkConfRef = ref(null);
const sinkTableRef = ref(null);
const sourceTableRef = ref(null);
const sourceColumnRef = ref(null);
const sinkColumnRef = ref(null);
const taskFormRef = ref(null);
const catalogOption = ref([]);
const mappedColumn = ref({});
const sinkColumns = ref([]);
const jobId = ref(null);
const jobDetail = ref({});
const data = reactive({
  form: {},
  rules: {
    jobName: [{ required: true, message: '任务名称不能为空', trigger: 'blur' }],
    catalogName: [{ required: true, message: '分组名称不能为空', trigger: 'blur' }],
  },
});

const { queryParams, form, rules } = toRefs(data);

/**
 * 初始化步骤
 */
function initSteps() {
  active.value = 1;
}

/**
 * 下一步
 */
function next() {
  if (active.value++ > 2) active.value = 1;
  // 第二步初始化输出源
  if (active.value === 2) {
    if (sourceTableRight.value.length > 0) {
      listSinkDatasource();
    } else {
      // 没有选择表，则停留在第一步
      active.value = 1;
      proxy.$message({ message: '请选择需要接入的表', type: 'error' });
    }
  } else if (active.value === 3) {
    preCheck();
  }
}

/**
 * 预检查
 */
function preCheck() {
  for (let i = 0; i < sinkTableRef.value.data.length; i++) {
    let item = sinkTableRef.value.data[i];
    item.sourceTableName = sourceTableRef.value.data[i].sourceTableName;
    item.sinkTableName = sinkTableRef.value.data[i].tableName;
  }
  form.value.tableMappings = sinkTableRef.value.data;
  if (jobId.value) {
    form.value.jobId = jobId.value;
  }
  jobApi.preCheck(form.value).then((response) => {
    checkedTableMappings.value = response;
    // 初始化分组下拉框
    initCatalogOption();
  });
}

/**
 * 保存任务信息
 */
function saveJob() {
  form.value.tableMappings = checkedTableMappings.value;
  if (jobId.value) {
    form.value.jobId = jobId.value;
    jobApi.update(form.value).then((response) => {
      proxy.$message({ message: '任务更新成功', type: 'success' });
      router.push('/datasync/job');
    });
  } else {
    jobApi.add(form.value).then((response) => {
      proxy.$message({ message: '任务保存成功', type: 'success' });
      router.push('/datasync/job');
    });
  }
}

/**
 * 初始化分组下拉框
 */
function initCatalogOption() {
  catalogApi.list(null).then((response) => {
    catalogOption.value = response;
  });
}

/**
 * 上一步
 */
function back() {
  if (active.value === 1) {
    this.$router.go(-1);
  } else {
    active.value--;
  }
}

function cancel() {
  history.go(-1);
}

/**
 * 输入源下拉框
 */
function listSourceDatasource() {
  datasourceApi
    .getDatasourceList(null, 1)
    .then((response) => {
      sourceDatasourceOption.value = response;
    })
    .catch(() => {});
}

/**
 * 输出源下拉框
 */
function listSinkDatasource() {
  datasourceApi
    .getDatasourceList(null, 2)
    .then((response) => {
      sinkDatasourceOption.value = response;
    })
    .catch(() => {});
}

/**
 * 输入源下拉框选中事件
 * @param e
 */
function selectSourceDatasource(e) {
  form.sourceDatasourceId = e;
  if (e === '') {
    sourceDbOption.value = [];
  } else {
    dbApi.getDatasourceList(e).then((response) => {
      sourceDbOption.value = response;
    });
  }
}

/**
 * 输出源下拉框选中事件
 * @param e
 */
function selectSinkDatasource(e) {
  form.sinkDatasourceId = e;
  if (e === '') {
    sinkDbOption.value = [];
  } else {
    dbApi.getDatasourceList(e).then((response) => {
      sinkDbOption.value = response;
    });
  }
}

/**
 * 输入数据库下拉框选中事件
 * @param e
 */
function selectSourceDb(e) {
  form.sourceDbName = e;
  let tableQuery = {
    datasourceId: form.sourceDatasourceId,
    dbName: e,
  };
  tableApi.listTable(tableQuery).then((response) => {
    leftTable.value = response;
    leftTable.value = leftTable.value.map((item) => {
      return {
        ...item,
        key: item.dbName + '.' + item.tableName,
        label: item.dbName + '.' + item.tableName,
      };
    });
    sourceTable.value = {
      data: leftTable.value,
      value: rightTable.value,
    };
  });
}

/**
 * 输出数据库下拉框选中事件
 * @param e
 */
function selectSinkDb(e) {
  form.sinkDbName = e;
  let tableQuery = {
    datasourceId: form.sinkDatasourceId,
    dbName: e,
  };
  tableApi.listTable(tableQuery).then((response) => {
    sinkTable.value = response;
  });
}

// 右侧列表元素变化
function sourceTableRightChange(data) {
  sourceTableRight.value = [];
  mappedSinkTable.value = [];
  for (let i in data) {
    let sourceTable = {
      sourceTableName: data[i],
    };
    sourceTableRight.value.push(sourceTable);
    mappedSinkTable.value.push(sourceTable);
  }
}

/**
 * 字段映射配置
 * @param index
 * @param row
 */
function columnMappingConf(index, row) {
  columnMappingDialog.value = true;
  let sourceTableName = sourceTableRight.value[index].sourceTableName;
  // 解析出源表的数据库名和表名
  let [sourceDb, sourceTable] = sourceTableName.split('.');

  // 先获取目标表字段列表
  columnApi.listTableByName(form.value.sinkDatasourceId, form.value.sinkDbName, row.tableName).then((response) => {
    sinkColumns.value = response.map((col) => ({
      columnId: col.columnId,
      columnName: col.columnName,
      comment: col.comment,
      dataType: col.dataType,
      columnLength: col.columnLength,
      tableName: col.tableName,
      dbName: col.dbName,
      datasourceId: col.datasourceId,
    }));

    // 检查是否已有保存的映射关系
    if (row.columnMapping && row.columnMapping.mappedSourceColumns?.length) {
      mappedColumn.value = row.columnMapping;
      return;
    }

    // 获取源表字段
    columnApi
      .listTableByName(
        form.value.sourceDatasourceId,
        sourceDb || form.value.sourceDbName,
        sourceTable || sourceTableName,
      )
      .then((sourceColumns) => {
        // 转换字段数据格式
        const formattedSourceColumns = sourceColumns.map((col) => ({
          columnName: col.columnName,
          comment: col.comment,
          dataType: col.dataType,
          columnLength: col.columnLength,
          tableName: col.tableName,
        }));

        // 获取映射关系
        let query = {
          sourceDatasourceId: form.value.sourceDatasourceId,
          sourceDbName: form.value.sourceDbName,
          sourceTableName: sourceTableName,
          sinkDatasourceId: form.value.sinkDatasourceId,
          sinkDbName: form.value.sinkDbName,
          sinkTableName: row.tableName,
          jobId: jobId.value,
        };

        jobApi.listMappedColumn(query).then((response) => {
          // 如果有已保存的映射关系就用映射关系,否则创建空的映射关系
          mappedColumn.value = {
            mappedSourceColumns: formattedSourceColumns,
            mappedSinkColumns: formattedSourceColumns.map(() => ({
              columnName: '',
              comment: '',
              dataType: '',
              columnLength: '',
              tableName: row.tableName,
              dbName: form.value.sinkDbName,
              datasourceId: form.value.sinkDatasourceId,
            })),
          };

          // 如果有已保存的映射关系，则填充已保存的值
          if (response.mappedSinkColumns?.length) {
            mappedColumn.value.mappedSinkColumns = response.mappedSinkColumns;
          }
        });
      });
  });
}

/**
 * 填充当行其他字段
 * @param columnName
 * @param index
 * @param row
 */
function selectSinkColumn(columnName, index, row) {
  if (!columnName) {
    // 当清空选择时，重置所有相关字段
    row.comment = '';
    row.dataType = '';
    row.columnLength = '';
    row.tableName = '';
    row.dbName = '';
    row.datasourceId = '';
    return;
  }

  // 当选择新字段时，填充相关信息
  let resultColumn = sinkColumns.value.find((item) => item.columnName === columnName);
  row.comment = resultColumn.comment;
  row.dataType = resultColumn.dataType;
  row.columnLength = resultColumn.columnLength;
  row.tableName = resultColumn.tableName;
  row.dbName = resultColumn.dbName;
  row.datasourceId = resultColumn.datasourceId;
}

/**
 * 取消字段映射
 */
function cancelDialog() {
  columnMappingDialog.value = false;
}

/**
 * 字段映射确定按钮
 */
function doCheckColumnMapping() {
  let sourceTableName = sourceColumnRef.value.data[0].tableName;
  let sinkTableName;
  let mappedColumns = {
    sourceColumns: sourceColumnRef.value.data,
    sinkColumns: sinkColumnRef.value.data,
  };

  sinkColumnRef.value.data.forEach((v, i) => {
    if (v.tableName != null) {
      sinkTableName = v.tableName;
    }
  });

  if (sinkTableName === null || sinkTableName === undefined) {
    proxy.$message({ message: '至少选择一个字段', type: 'error' });
    return;
  }

  // 保存映射关系到对应的表配置中
  sinkTableRef.value.data.forEach((item) => {
    if (item.tableName === sinkTableName) {
      // 保存完整的映射关系
      item.columnMapping = {
        mappedSourceColumns: mappedColumns.sourceColumns,
        mappedSinkColumns: mappedColumns.sinkColumns,
      };
      item.sourceColumns = mappedColumns.sourceColumns;
      item.sinkColumns = mappedColumns.sinkColumns;
      item.sourceTableName = sourceTableName;
      item.sinkTableName = sinkTableName;
    }
  });

  columnMappingDialog.value = false;
}

initSteps();
listSourceDatasource();

(() => {
  jobId.value = route.params && route.params.jobId;
  if (jobId.value) {
    jobApi.detail(jobId.value).then((response) => {
      jobDetail.value = response;
      form.value.sourceDatasourceId = jobDetail.value.sourceDatasourceId;
      form.value.sourceDbName = jobDetail.value.sourceDbName;
      form.value.sinkDatasourceId = jobDetail.value.sinkDatasourceId;
      form.value.sinkDbName = jobDetail.value.sinkDbName;
      form.value.jobName = jobDetail.value.jobName;
      form.value.catalogId = jobDetail.value.catalogId;
      form.value.remark = jobDetail.value.remark;
      form.value.jobManager = jobDetail.value.jobManager;
      form.value.taskManager = jobDetail.value.taskManager;
      form.value.windowSize = jobDetail.value.windowSize;
      form.value.maxCount = jobDetail.value.maxCount;
      form.value.maxSize = jobDetail.value.maxSize;

      let mappedTable = jobDetail.value.mappedTable;
      let mappedSourceDbTables = mappedTable.mappedSourceTables;
      let mappedSinkDbTables = mappedTable.mappedSinkTables;

      // 处理源表和目标表的映射关系
      for (let i in mappedSourceDbTables) {
        let sourceTable = {
          sourceTableName: mappedSourceDbTables[i].dbName + '.' + mappedSourceDbTables[i].tableName,
        };
        sourceTableRight.value.push(sourceTable);
        rightTable.value.push(mappedSourceDbTables[i].dbName + '.' + mappedSourceDbTables[i].tableName);
      }

      selectSourceDatasource(jobDetail.value.sourceDatasourceId);
      selectSourceDb(jobDetail.value.sourceDbName);

      // 处理目标表和字段映射
      for (let i in mappedSinkDbTables) {
        let sinkTable = {
          tableId: mappedSinkDbTables[i].metaTableId,
          tableName: mappedSinkDbTables[i].tableName,
          // 保存字段映射关系
          columnMapping: {
            mappedSourceColumns: mappedSinkDbTables[i].sourceColumns || [],
            mappedSinkColumns: mappedSinkDbTables[i].sinkColumns || [],
          },
          sourceColumns: mappedSinkDbTables[i].sourceColumns,
          sinkColumns: mappedSinkDbTables[i].sinkColumns,
          sourceTableName: mappedSourceDbTables[i].dbName + '.' + mappedSourceDbTables[i].tableName,
          sinkTableName: mappedSinkDbTables[i].tableName,
        };
        mappedSinkTable.value.push(sinkTable);
      }

      selectSinkDatasource(jobDetail.value.sinkDatasourceId);
      selectSinkDb(jobDetail.value.sinkDbName);
    });
  }
})();
</script>

<style>
.task-header {
  box-shadow: 0 2px 10px 0 rgba(0, 0, 0, 0.1);
  z-index: 10;
  text-align: center;
  padding: 15px 10px;
  background: #ffffff;
}

.layout {
  height: calc(100vh - 220px);
}

.select-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 15px 0;
  border: 1px dashed #d2dae2;
  margin-top: 5px;
}

.select-header-title {
  padding-bottom: 5px;
  font-size: 12px;
  font-weight: bold;
}

.el-transfer-panel {
  width: 42%;
}

.el-transfer {
  width: 100%;
  height: 80%;
  margin-top: 10px;
  display: flex;
  justify-content: space-between;
}

.el-transfer__buttons {
  display: flex;
  vertical-align: middle;
  padding: 0 30px;
  flex-direction: column;
  justify-content: center;
  width: 16%;
}

.el-transfer-panel__body {
  height: 80%;
}

.el-transfer__button {
  margin: 5px 0 !important;
}

.task-bottom {
  padding: 16px;
  margin-top: 5px;
  position: fixed;
  bottom: 0;
  right: 0;
}

.el-transfer-panel__list {
  height: 100%;
}

.table-mapping {
  width: 100%;
  height: 80%;
  margin-top: 10px;
  display: flex;
  justify-content: space-between;
  overflow-y: scroll;
}

.table-div {
  display: flex;
  justify-content: space-between;
  padding-bottom: 15px;
  width: 100%;
  height: max-content;
}

.left-table {
  width: 42%;
  margin-top: 15px;
}

.table-wrapper {
  overflow: hidden;
}

.right-table {
  width: 42%;
  margin-top: 15px;
}

.table-div .line-div {
  width: 14%;
  display: flex;
  flex-direction: column;
}

.line-div .table-wrapper {
  border: none;
  margin-top: 65px;
}

.line-div .el-divider--horizontal {
  margin: 23px 0;
  border-top-color: #7a7c7f;
}

.line-div .el-divider--horizontal::before {
  position: absolute;
  top: -5px;
  z-index: 1;
  left: 0;
  display: inline-block;
  content: '';
  border-top: 5px solid transparent;
  border-right: 10px solid #7a7c7f;
  border-bottom: 5px solid transparent;
}

.line-div .el-divider--horizontal::after {
  position: absolute;
  top: -5px;
  z-index: 1;
  right: 0;
  display: inline-block;
  content: '';
  border-top: 5px solid transparent;
  border-left: 10px solid #7a7c7f;
  border-bottom: 5px solid transparent;
}

.table-div .el-table .cell {
  height: 30px;
  line-height: 30px;
}

.table-div .el-table .el-select .el-input__inner {
  height: 26px;
  line-height: 26px;
}

.task-params-form {
  margin-top: 15px;
  border: 1px dashed #e2dcd2;
  padding: 15px 20px;
}

.layout .el-divider--vertical {
  border-left: 2px #1c84c6 solid;
  margin: 0 5px;
}

.layout .divider-text {
  display: inline-block;
  margin-top: 10px;
}
</style>
