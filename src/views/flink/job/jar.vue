<template>
    <div class="app-container">
        <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
            <el-card class="box-card">
                <template #header>
                    <div class="card-header">
                        <span>基本信息</span>
                    </div>
                </template>

                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="任务名称" prop="jobName">
                            <el-input v-model="form.jobName" placeholder="请输入任务名称"/>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="任务类型" prop="jobType">
                            <el-select v-model="form.jobType" placeholder="请选择任务类型" disabled>
                                <el-option label="JAR包" value="JAR"/>
                            </el-select>
                        </el-form-item>
                    </el-col>
                </el-row>

                <el-row :gutter="20">
                    <el-col :span="24">
                        <el-form-item label="任务说明" prop="remark">
                            <el-input v-model="form.remark" type="textarea" placeholder="请输入任务说明"/>
                        </el-form-item>
                    </el-col>
                </el-row>
            </el-card>

            <!-- 在 sql.vue 和 jar.vue 中修改运行配置部分 -->
            <el-card class="box-card" style="margin-top: 20px">
                <template #header>
                    <div class="card-header">
                        <span>运行配置</span>
                    </div>
                </template>

                <el-form :model="form" label-width="140px">
                    <el-row :gutter="20">
                        <el-col :span="12">
                            <el-form-item label="JobManager内存">
                                <el-input v-model="form.jobmanager" style="width: 100%">
                                    <template #append>GB</template>
                                </el-input>
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item label="TaskManager内存">
                                <el-input v-model="form.taskmanager" style="width: 100%">
                                    <template #append>GB</template>
                                </el-input>
                            </el-form-item>
                        </el-col>
                    </el-row>

                    <el-row :gutter="20">
                        <el-col :span="12">
                            <el-form-item label="Slot个数">
                                <el-input
                                    v-model="form.slot"
                                    type="number"
                                    :min="1"
                                    :max="20"
                                    style="width: 100%"
                                />
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item label="并行度">
                                <el-input
                                    v-model="form.parallelism"
                                    type="number"
                                    :min="1"
                                    :max="20"
                                    style="width: 100%"
                                />
                            </el-form-item>
                        </el-col>
                    </el-row>

                    <el-row :gutter="20">
                        <el-col :span="12">
                            <el-form-item label="队列">
                                <el-input v-model="form.queue" placeholder="请输入队列名称"/>
                            </el-form-item>
                        </el-col>
                    </el-row>

                    <el-col :span="12">
                        <el-form-item label="部署模式" prop="deployMode">
                            <el-select v-model="form.deployMode" placeholder="请选择部署模式">
                                <el-option label="Local" value="LOCAL"/>
                                <el-option label="Standalone" value="STANDALONE"/>
                                <el-option label="Yarn-per-job" value="YARN_PER"/>
                                <el-option label="Yarn-application" value="YARN_APPLICATION"/>
                            </el-select>
                        </el-form-item>
                    </el-col>
                </el-form>
            </el-card>

            <el-card class="box-card" style="margin-top: 20px">
                <template #header>
                    <div class="card-header">
                        <span>JAR配置</span>
                    </div>
                </template>

                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="主JAR包" prop="mainJarPath">
                            <el-select
                                v-model="form.mainJarPath"
                                placeholder="请选择主JAR包"
                                style="width: 100%"
                                filterable
                            >
                                <el-option
                                    v-for="jar in jarList"
                                    :key="jar.jarId"
                                    :label="jar.jarName"
                                    :value="jar.jarPath"
                                />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="扩展JAR包" prop="extJarPath">
                            <el-select
                                v-model="form.extJarPath"
                                placeholder="请选择扩展JAR包"
                                style="width: 100%"
                                multiple
                                filterable
                                collapse-tags
                                collapse-tags-tooltip
                            >
                                <el-option
                                    v-for="jar in jarList"
                                    :key="jar.jarId"
                                    :label="jar.jarName"
                                    :value="jar.jarPath"
                                />
                            </el-select>
                        </el-form-item>
                    </el-col>
                </el-row>

                <el-row :gutter="20">
                    <el-col :span="24">
                        <el-form-item label="主类名" prop="mainClass">
                            <el-input v-model="form.mainClass" placeholder="请输入主类名"/>
                        </el-form-item>
                    </el-col>
                </el-row>

                <el-row :gutter="20">
                    <el-col :span="24">
                        <el-form-item label="自定义参数" prop="customArgs">
                            <el-input v-model="form.customArgs" type="textarea" placeholder="请输入自定义参数"/>
                        </el-form-item>
                    </el-col>
                </el-row>
            </el-card>

            <div class="bottom-button">
                <el-button type="primary" @click="submitForm">提交</el-button>
                <el-button @click="cancel">取消</el-button>
            </div>
        </el-form>
    </div>
</template>

<script setup name="FlinkJarJob">
import * as jobApi from '@/api/flink/jobApi';
import {getCurrentInstance, ref} from 'vue';
import {useRoute, useRouter} from 'vue-router';

const {proxy} = getCurrentInstance();
const router = useRouter();
const route = useRoute();

const jobId = ref(route.params.jobId);
const jarList = ref([]);

// 获取JAR包列表
function getJarList() {
    jobApi.listJars().then(response => {
        jarList.value = response.data;
    });
}

// 在组件挂载时获取JAR包列表
onMounted(() => {
    getJarList();
});

// 表单参数
const form = ref({
    jobName: undefined,
    jobType: 'JAR',
    deployMode: 'Local',
    mainJarPath: undefined,
    extJarPath: undefined,
    mainClass: undefined,
    customArgs: undefined,
    jobmanager: 1,
    taskmanager: 1,
    slot: 1,
    parallelism: 1,
    queue: 'default',
    remark: undefined,
});

// 表单校验规则
const rules = {
    jobName: [{required: true, message: '请输入任务名称', trigger: 'blur'}],
    deployMode: [{required: true, message: '请选择部署模式', trigger: 'change'}],
    mainJarPath: [{required: true, message: '请输入主JAR包路径', trigger: 'blur'}],
    mainClass: [{required: true, message: '请输入主类名', trigger: 'blur'}],
};

/** 提交按钮 */
function submitForm() {
    proxy.$refs.formRef.validate((valid) => {
        if (valid) {
            if (jobId.value) {
                jobApi.editJarJob(form.value).then((response) => {
                    proxy.$modal.msgSuccess('修改成功');
                    router.push('/flink/job');
                });
            } else {
                jobApi.addJarJob(form.value).then((response) => {
                    proxy.$modal.msgSuccess('新增成功');
                    router.push('/flink/job');
                });
            }
        }
    });
}

/** 取消按钮 */
function cancel() {
    router.push('/flink/job');
}

// 获取详情
if (jobId.value) {
    jobApi.getJobDetail(jobId.value).then((response) => {
        form.value = response.data;
    });
}
</script>

<style scoped>
.box-card {
    margin-bottom: 20px;
}

.card-header {
    font-weight: bold;
}

.bottom-button {
    margin-top: 20px;
    text-align: center;
}
</style>
