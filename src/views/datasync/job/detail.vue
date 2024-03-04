<template>
    <div class="app-container">
        <el-tabs v-model="activeTab">
            <el-tab-pane label="基本信息" name="jobInfo">
                <div class="tip custom-block">任务信息</div>
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

                <div class="tip custom-block">输入源</div>
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

                <div class="tip custom-block">输出源</div>
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

                <div class="tip custom-block">映射关系</div>
                <el-table>

                </el-table>
            </el-tab-pane>
            <el-tab-pane label="高级配置" name="columnInfo">
                <div class="tip custom-block">任务参数</div>
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

                <div class="tip custom-block">限流配置</div>
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
const {proxy} = getCurrentInstance();
const loading = ref(true);
const activeTab = ref('jobInfo');
const columnList = ref([]);
const dataSync = reactive({
    jobInfo: {}
});

(() => {
    const jobId = route.params && route.params.jobId;
    if (jobId) {
        jobApi.detail(jobId).then((response) => {
            dataSync.jobInfo = response;
        })
    }
})();
</script>

<style>

.custom-block.tip {
    padding: 1px 10px;
    background-color: #ffffff;
    border-radius: 1px;
    border-left: 3px solid var(--el-color-primary);
    margin: 5px 0;
}

</style>
