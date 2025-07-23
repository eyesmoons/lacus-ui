<template>
    <div class="test-container">
        <el-card>
            <template #header>
                <div class="card-header">
                    <span>数据挖掘 API 测试</span>
                </div>
            </template>
            
            <el-tabs v-model="activeTab" type="border-card">
                <!-- 连接器测试 -->
                <el-tab-pane label="连接器测试" name="connector">
                    <el-row :gutter="20">
                        <el-col :span="8">
                            <el-button type="primary" @click="testSourceConnectors" :loading="loading.source">
                                测试获取Source连接器
                            </el-button>
                        </el-col>
                        <el-col :span="8">
                            <el-button type="success" @click="testTransformConnectors" :loading="loading.transform">
                                测试获取Transform连接器
                            </el-button>
                        </el-col>
                        <el-col :span="8">
                            <el-button type="warning" @click="testSinkConnectors" :loading="loading.sink">
                                测试获取Sink连接器
                            </el-button>
                        </el-col>
                    </el-row>
                </el-tab-pane>

                <!-- 任务测试 -->
                <el-tab-pane label="任务测试" name="job">
                    <el-row :gutter="20">
                        <el-col :span="8">
                            <el-button type="info" @click="testJobList" :loading="loading.jobs">
                                测试获取任务列表
                            </el-button>
                        </el-col>
                        <el-col :span="8">
                            <el-button type="danger" @click="testCreateJob" :loading="loading.create">
                                测试创建任务
                            </el-button>
                        </el-col>
                        <el-col :span="8">
                            <el-button type="success" @click="testExecuteJob" :loading="loading.execute">
                                测试执行任务
                            </el-button>
                        </el-col>
                    </el-row>
                </el-tab-pane>

                <!-- 子任务测试 -->
                <el-tab-pane label="子任务测试" name="task">
                    <el-row :gutter="20">
                        <el-col :span="8">
                            <el-button type="primary" @click="testTaskList" :loading="loading.tasks">
                                测试获取子任务列表
                            </el-button>
                        </el-col>
                        <el-col :span="8">
                            <el-button type="success" @click="testCreateTask" :loading="loading.createTask">
                                测试创建子任务
                            </el-button>
                        </el-col>
                        <el-col :span="8">
                            <el-button type="warning" @click="testBatchCreateTasks" :loading="loading.batchCreate">
                                测试批量创建子任务
                            </el-button>
                        </el-col>
                    </el-row>
                </el-tab-pane>

                <!-- 实例测试 -->
                <el-tab-pane label="实例测试" name="instance">
                    <el-row :gutter="20">
                        <el-col :span="8">
                            <el-button type="info" @click="testInstanceList" :loading="loading.instances">
                                测试获取实例列表
                            </el-button>
                        </el-col>
                        <el-col :span="8">
                            <el-button type="warning" @click="testStopInstance" :loading="loading.stop">
                                测试停止实例
                            </el-button>
                        </el-col>
                        <el-col :span="8">
                            <el-button type="danger" @click="testDeleteInstance" :loading="loading.delete">
                                测试删除实例
                            </el-button>
                        </el-col>
                    </el-row>
                </el-tab-pane>
            </el-tabs>
            
            <el-divider />
            
            <div class="result-area">
                <div class="result-header">
                    <h3>测试结果:</h3>
                    <el-button size="small" @click="clearResult">清空结果</el-button>
                </div>
                <el-input
                    v-model="testResult"
                    type="textarea"
                    :rows="20"
                    placeholder="测试结果将显示在这里..."
                    readonly
                />
            </div>
        </el-card>
    </div>
</template>

<script setup name="DigTest">
import { ref, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import * as connectorApi from '@/api/dig/connectorApi';
import * as jobApi from '@/api/dig/jobApi';
import * as taskApi from '@/api/dig/taskApi';
import * as instanceApi from '@/api/dig/instanceApi';

const activeTab = ref('connector');
const testResult = ref('');
const loading = reactive({
    source: false,
    transform: false,
    sink: false,
    jobs: false,
    create: false,
    execute: false,
    tasks: false,
    createTask: false,
    batchCreate: false,
    instances: false,
    stop: false,
    delete: false
});

// 添加测试结果
const addResult = (title, data) => {
    const timestamp = new Date().toLocaleString();
    const result = `[${timestamp}] ${title}\n${JSON.stringify(data, null, 2)}\n${'='.repeat(80)}\n\n`;
    testResult.value += result;
};

// 清空结果
const clearResult = () => {
    testResult.value = '';
};

// 连接器测试
const testSourceConnectors = async () => {
    loading.source = true;
    try {
        const result = await connectorApi.getSourceConnectors();
        addResult('获取Source连接器成功', result);
        ElMessage.success('获取Source连接器成功');
    } catch (error) {
        addResult('获取Source连接器失败', error);
        ElMessage.error('获取Source连接器失败');
    } finally {
        loading.source = false;
    }
};

const testTransformConnectors = async () => {
    loading.transform = true;
    try {
        const result = await connectorApi.getTransformConnectors();
        addResult('获取Transform连接器成功', result);
        ElMessage.success('获取Transform连接器成功');
    } catch (error) {
        addResult('获取Transform连接器失败', error);
        ElMessage.error('获取Transform连接器失败');
    } finally {
        loading.transform = false;
    }
};

const testSinkConnectors = async () => {
    loading.sink = true;
    try {
        const result = await connectorApi.getSinkConnectors();
        addResult('获取Sink连接器成功', result);
        ElMessage.success('获取Sink连接器成功');
    } catch (error) {
        addResult('获取Sink连接器失败', error);
        ElMessage.error('获取Sink连接器失败');
    } finally {
        loading.sink = false;
    }
};

// 任务测试
const testJobList = async () => {
    loading.jobs = true;
    try {
        const result = await jobApi.getJobList({
            pageNum: 1,
            pageSize: 10
        });
        addResult('获取任务列表成功', result);
        ElMessage.success('获取任务列表成功');
    } catch (error) {
        addResult('获取任务列表失败', error);
        ElMessage.error('获取任务列表失败');
    } finally {
        loading.jobs = false;
    }
};

const testCreateJob = async () => {
    loading.create = true;
    try {
        const jobData = {
            jobName: '测试任务_' + Date.now(),
            description: '这是一个测试任务'
        };
        
        const result = await jobApi.createJob(jobData);
        addResult('创建任务成功', result);
        ElMessage.success('创建任务成功');
    } catch (error) {
        addResult('创建任务失败', error);
        ElMessage.error('创建任务失败');
    } finally {
        loading.create = false;
    }
};

const testExecuteJob = async () => {
    loading.execute = true;
    try {
        // 假设有一个任务ID为1
        const result = await jobApi.executeJob(1);
        addResult('执行任务成功', result);
        ElMessage.success('执行任务成功');
    } catch (error) {
        addResult('执行任务失败', error);
        ElMessage.error('执行任务失败');
    } finally {
        loading.execute = false;
    }
};

// 子任务测试
const testTaskList = async () => {
    loading.tasks = true;
    try {
        // 假设有一个任务ID为1
        const result = await taskApi.getTaskList(1);
        addResult('获取子任务列表成功', result);
        ElMessage.success('获取子任务列表成功');
    } catch (error) {
        addResult('获取子任务列表失败', error);
        ElMessage.error('获取子任务列表失败');
    } finally {
        loading.tasks = false;
    }
};

const testCreateTask = async () => {
    loading.createTask = true;
    try {
        const taskData = {
            taskName: '测试子任务_' + Date.now(),
            jobId: 1,
            connectorType: 'SOURCE',
            connectorName: 'MySQL',
            datasourceId: 1,
            taskConfig: JSON.stringify({
                host: 'localhost',
                port: 3306,
                database: 'test',
                username: 'root',
                password: 'password'
            })
        };
        
        const result = await taskApi.createTask(taskData);
        addResult('创建子任务成功', result);
        ElMessage.success('创建子任务成功');
    } catch (error) {
        addResult('创建子任务失败', error);
        ElMessage.error('创建子任务失败');
    } finally {
        loading.createTask = false;
    }
};

const testBatchCreateTasks = async () => {
    loading.batchCreate = true;
    try {
        const tasks = [
            {
                taskName: '批量子任务1_' + Date.now(),
                connectorType: 'SOURCE',
                connectorName: 'MySQL',
                datasourceId: 1,
                taskConfig: '{}'
            },
            {
                taskName: '批量子任务2_' + Date.now(),
                connectorType: 'SINK',
                connectorName: 'Elasticsearch',
                datasourceId: 2,
                taskConfig: '{}'
            }
        ];
        
        const result = await taskApi.batchCreateTasks(1, tasks);
        addResult('批量创建子任务成功', result);
        ElMessage.success('批量创建子任务成功');
    } catch (error) {
        addResult('批量创建子任务失败', error);
        ElMessage.error('批量创建子任务失败');
    } finally {
        loading.batchCreate = false;
    }
};

// 实例测试
const testInstanceList = async () => {
    loading.instances = true;
    try {
        const result = await instanceApi.getInstanceList({
            pageNum: 1,
            pageSize: 10
        });
        addResult('获取实例列表成功', result);
        ElMessage.success('获取实例列表成功');
    } catch (error) {
        addResult('获取实例列表失败', error);
        ElMessage.error('获取实例列表失败');
    } finally {
        loading.instances = false;
    }
};

const testStopInstance = async () => {
    loading.stop = true;
    try {
        // 假设有一个实例ID为1
        const result = await instanceApi.stopInstance(1);
        addResult('停止实例成功', result);
        ElMessage.success('停止实例成功');
    } catch (error) {
        addResult('停止实例失败', error);
        ElMessage.error('停止实例失败');
    } finally {
        loading.stop = false;
    }
};

const testDeleteInstance = async () => {
    loading.delete = true;
    try {
        // 假设有一个实例ID为1
        const result = await instanceApi.deleteInstance(1);
        addResult('删除实例成功', result);
        ElMessage.success('删除实例成功');
    } catch (error) {
        addResult('删除实例失败', error);
        ElMessage.error('删除实例失败');
    } finally {
        loading.delete = false;
    }
};
</script>

<style scoped lang="scss">
.test-container {
    padding: 20px;
    
    .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        
        span {
            font-size: 18px;
            font-weight: 500;
        }
    }
    
    .result-area {
        margin-top: 20px;
        
        .result-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
            
            h3 {
                margin: 0;
                color: var(--el-text-color-primary);
            }
        }
    }
    
    .el-button {
        width: 100%;
        margin-bottom: 10px;
    }
}
</style>
