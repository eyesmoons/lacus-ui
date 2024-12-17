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
              <el-input v-model="form.jobName" placeholder="请输入任务名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="任务类型" prop="jobType">
              <el-select v-model="form.jobType" placeholder="请选择任务类型" disabled>
                <el-option label="JAR包" value="JAR" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="部署模式" prop="deployMode">
              <el-select v-model="form.deployMode" placeholder="请选择部署模式">
                <el-option label="Local" value="LOCAL" />
                <el-option label="Standalone" value="STANDALONE" />
                <el-option label="Yarn-per-job" value="YARN_PER" />
                <el-option label="Yarn-application" value="YARN_APPLICATION" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="任务说明" prop="remark">
              <el-input v-model="form.remark" type="textarea" placeholder="请输入任务说明" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-card>

      <!-- 运行配置卡片 -->
      <el-card class="box-card" style="margin-top: 20px">
        <template #header>
          <div class="card-header">
            <span>运行配置</span>
          </div>
        </template>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="JobManager内存">
              <el-input v-model="form.jobManager" style="width: 100%">
                <template #append>GB</template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="TaskManager内存">
              <el-input v-model="form.taskManager" style="width: 100%">
                <template #append>GB</template>
              </el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Slot个数">
              <el-input v-model="form.slot" type="number" :min="1" :max="20" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="并行度">
              <el-input v-model="form.parallelism" type="number" :min="1" :max="20" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="队列">
              <el-input v-model="form.queue" placeholder="请输入队列名称" />
            </el-form-item>
          </el-col>
        </el-row>
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
              <el-tree-select
                v-model="form.mainJarPath"
                :data="jarTreeData"
                placeholder="请选择主JAR包"
                style="width: 100%"
                filterable
                check-strictly
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="扩展JAR包" prop="extJarPath">
              <el-tree-select
                v-model="form.extJarPath"
                :data="jarTreeData"
                placeholder="请选择扩展JAR包"
                style="width: 100%"
                multiple
                filterable
                check-strictly
                collapse-tags
                collapse-tags-tooltip
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="主类名" prop="mainClassName">
              <el-input v-model="form.mainClassName" placeholder="请输入主类名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="程序参数" prop="customArgs">
              <el-input v-model="form.customArgs" placeholder="请输入程序参数" />
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
import { getCurrentInstance, ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { queryResourceList } from '@/api/system/resourceApi';

const { proxy } = getCurrentInstance();
const router = useRouter();
const route = useRoute();

const jobId = ref(route.params.jobId);

// JAR包树形数据
const jarTreeData = ref([]);

// 获取JAR包树形列表
const getJarTreeData = async () => {
  try {
    const res = await queryResourceList({
      fileName: '.jar', // 只查询jar文件
    });

    // 过滤出只包含jar文件的数据
    const jarFiles = res.filter((item) => item.isDirectory === 0 && item.fileName.endsWith('.jar'));

    // 构建树形结构
    const buildTree = (items, parentId) => {
      if (!Array.isArray(items)) {
        console.error('Invalid items:', items);
        return [];
      }

      const result = [];

      // 如果是根节点，找出所��顶级目录
      if (parentId === '0') {
        // 获取所有唯一的父目录路径
        const uniquePaths = new Set();
        jarFiles.forEach((item) => {
          const parentPath = item.filePath.split('/')[1]; // 获取第一级目录
          if (parentPath) {
            uniquePaths.add('/' + parentPath);
          }
        });

        // 为每个顶级目录创建一个节点
        uniquePaths.forEach((path) => {
          const dirName = path.split('/').pop();
          // 查找对应的目录项
          const dirItem = items.find((item) => item.filePath === path);
          const node = {
            value: dirItem?.id || path, // 优先使用目录的ID
            label: dirName,
            children: buildTree(jarFiles, path),
          };
          result.push(node);
        });
      } else {
        // 对于非根节点，查找当前目录下的所有文件和子目录
        const currentLevelItems = new Map(); // 使用Map来去重

        jarFiles.forEach((item) => {
          const itemParentPath = item.filePath.substring(0, item.filePath.lastIndexOf('/'));
          if (itemParentPath === parentId) {
            // 如果是jar文件
            if (item.isDirectory === 0 && item.fileName.endsWith('.jar')) {
              currentLevelItems.set(item.filePath, {
                value: item.id, // 使用资源ID
                label: item.fileName,
              });
            } else if (item.isDirectory === 1) {
              // 如果是目录，检查是否包含jar文件
              const hasJarFiles = jarFiles.some(
                (file) => file.filePath.startsWith(item.filePath + '/') && file.fileName.endsWith('.jar'),
              );
              if (hasJarFiles) {
                currentLevelItems.set(item.filePath, {
                  value: item.id, // 使用目录的ID
                  label: item.fileName,
                  children: buildTree(jarFiles, item.filePath),
                });
              }
            }
          }
        });

        // 将Map转换为数组
        result.push(...currentLevelItems.values());
      }

      return result;
    };

    const treeData = buildTree(res, '0');
    console.log('Final Tree Data:', treeData);
    jarTreeData.value = treeData;
  } catch (error) {
    console.error('获取JAR包列表失败:', error);
  }
};

// 表单参数
const form = ref({
  jobName: undefined,
  jobType: 'JAR',
  deployMode: 'LOCAL',
  mainJarPath: undefined,
  extJarPath: undefined,
  mainClassName: undefined,
  customArgs: undefined,
  jobManager: 1,
  taskManager: 1,
  slot: 1,
  parallelism: 1,
  queue: 'default',
  remark: undefined,
});

// 表单校验规则
const rules = {
  jobName: [{ required: true, message: '请输入任务名称', trigger: 'blur' }],
  deployMode: [{ required: true, message: '请选择部署模式', trigger: 'change' }],
  mainJarPath: [{ required: true, message: '请选择主JAR包', trigger: 'change' }],
  mainClassName: [{ required: true, message: '请输入主类名', trigger: 'blur' }],
};

/** 提交按钮 */
function submitForm() {
  proxy.$refs.formRef.validate((valid) => {
    if (valid) {
      // 处理表单数据
      const submitData = {
        ...form.value,
        // 将扩展JAR包ID数组转换为逗号分隔的字符串
        extJarPath: Array.isArray(form.value.extJarPath) ? form.value.extJarPath.join(',') : form.value.extJarPath,
      };

      if (jobId.value) {
        jobApi.editJarJob(submitData).then(() => {
          proxy.$modal.msgSuccess('修改成功');
          router.push('/flink/job');
        });
      } else {
        jobApi.addJarJob(submitData).then(() => {
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
    const data = response.data;
    // 如果扩展JAR包是字符串，转换为数组
    if (typeof data.extJarPath === 'string' && data.extJarPath) {
      data.extJarPath = data.extJarPath.split(',');
    }
    form.value = data;
  });
}

// 在组件挂载时获取JAR包树形数据
onMounted(() => {
  getJarTreeData();
});
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
