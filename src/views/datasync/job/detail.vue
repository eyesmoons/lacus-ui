<template>
  <div class="app-container">
    <el-tabs v-model="activeTab">
      <el-tab-pane label="基本信息" name="jobInfo">
        <el-divider direction="vertical"></el-divider>
        <span class="divider-text">任务信息</span>
        <el-form :model="form" label-width="100px">
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="任务名称：">{{ dataSync.jobInfo.jobName }}</el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="任务描述：">{{ dataSync.jobInfo.remark }}</el-form-item>
            </el-col>
          </el-row>
        </el-form>

        <el-divider direction="vertical"></el-divider>
        <span class="divider-text">输入源</span>
        <el-form :model="form" label-width="100px">
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="数据源：">{{ dataSync.jobInfo.sourceDatasourceName }}</el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="数据库：">{{ dataSync.jobInfo.sourceDbName }}</el-form-item>
            </el-col>
          </el-row>
        </el-form>

        <el-divider direction="vertical"></el-divider>
        <span class="divider-text">输出源</span>
        <el-form :model="form" label-width="100px">
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="数据源：">{{ dataSync.jobInfo.sinkDatasourceName }}</el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="数据库：">{{ dataSync.jobInfo.sinkDbName }}</el-form-item>
            </el-col>
          </el-row>
        </el-form>

        <el-divider direction="vertical"></el-divider>
        <span class="divider-text">映射关系</span>
        <el-table :data="mappingData" border style="width: 100%">
          <el-table-column label="源表" prop="sourceTable" />
          <el-table-column label="目标表" prop="sinkTable" />
        </el-table>
      </el-tab-pane>
      <el-tab-pane label="高级配置" name="columnInfo">
        <el-divider direction="vertical"></el-divider>
        <span class="divider-text">任务参数</span>
        <el-form :model="dataSync.jobInfo" :inline="true" label-position="right">
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="job manager（GB）：">
                <el-input v-model="dataSync.jobInfo.jobManager" disabled />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="task manager（GB）：">
                <el-input v-model="dataSync.jobInfo.taskManager" disabled />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>

        <el-divider direction="vertical"></el-divider>
        <span class="divider-text">限流配置</span>
        <el-form :model="dataSync.jobInfo" :inline="true" label-position="right">
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="窗口间隔（秒）：">
                <el-input v-model="dataSync.jobInfo.windowSize" disabled />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="最大条数（万条）：">
                <el-input v-model="dataSync.jobInfo.maxCount" disabled />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="24">
            <el-col :span="24">
              <el-form-item label="最大数据量（MB）：">
                <el-input v-model="dataSync.jobInfo.maxSize" disabled />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup name="jobDetail">
import * as jobApi from '@/api/datasync/jobApi';

const route = useRoute();
const { proxy } = getCurrentInstance();
const loading = ref(true);
const activeTab = ref('jobInfo');
const columnList = ref([]);
const dataSync = reactive({
  jobInfo: {},
});
const mappingData = ref([]);

(() => {
  const jobId = route.params && route.params.jobId;
  if (jobId) {
    jobApi.detail(jobId).then((response) => {
      dataSync.jobInfo = response;
      // 处理映射关系数据
      const mappedTables = response.mappedTable || {};
      const sourceTables = mappedTables.mappedSourceTables || [];
      const sinkTables = mappedTables.mappedSinkTables || [];

      mappingData.value = sourceTables.map((source, index) => ({
        sourceTable: `${source.dbName}.${source.tableName}`,
        sinkTable: sinkTables[index] ? `${sinkTables[index].dbName}.${sinkTables[index].tableName}` : '',
      }));
    });
  }
})();
</script>

<style>
.el-divider--vertical {
  border-left: 2px #1c84c6 solid;
  margin: 0 5px;
}

.divider-text {
  display: inline-block;
  margin-top: 10px;
}
</style>
