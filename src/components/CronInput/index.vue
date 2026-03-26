<template>
  <div class="cron-input-wrapper">
    <el-input
      v-model="cronValue"
      placeholder="请输入Cron表达式或点击右侧按钮生成"
      clearable
      @input="handleInput"
    >
      <template #append>
        <el-button icon="Setting" @click="showDialog = true">生成</el-button>
      </template>
    </el-input>

    <el-dialog
      title="Cron表达式生成器"
      v-model="showDialog"
      width="700px"
      append-to-body
    >
      <el-tabs v-model="activeTab" type="border-card">
        <!-- 秒 -->
        <el-tab-pane label="秒" name="second">
          <el-radio-group v-model="cronConfig.second.type" @change="updateCron">
            <el-radio label="*">每秒</el-radio>
            <el-radio label="?">不指定</el-radio>
            <el-radio label="period">
              周期：从
              <el-input-number v-model="cronConfig.second.start" :min="0" :max="59" size="small" style="width: 80px" @change="updateCron" />
              秒开始，每
              <el-input-number v-model="cronConfig.second.interval" :min="1" :max="59" size="small" style="width: 80px" @change="updateCron" />
              秒执行一次
            </el-radio>
            <el-radio label="range">
              范围：从
              <el-input-number v-model="cronConfig.second.rangeStart" :min="0" :max="59" size="small" style="width: 80px" @change="updateCron" />
              到
              <el-input-number v-model="cronConfig.second.rangeEnd" :min="0" :max="59" size="small" style="width: 80px" @change="updateCron" />
              秒
            </el-radio>
          </el-radio-group>
        </el-tab-pane>

        <!-- 分钟 -->
        <el-tab-pane label="分钟" name="minute">
          <el-radio-group v-model="cronConfig.minute.type" @change="updateCron">
            <el-radio label="*">每分钟</el-radio>
            <el-radio label="?">不指定</el-radio>
            <el-radio label="period">
              周期：从
              <el-input-number v-model="cronConfig.minute.start" :min="0" :max="59" size="small" style="width: 80px" @change="updateCron" />
              分开始，每
              <el-input-number v-model="cronConfig.minute.interval" :min="1" :max="59" size="small" style="width: 80px" @change="updateCron" />
              分执行一次
            </el-radio>
            <el-radio label="range">
              范围：从
              <el-input-number v-model="cronConfig.minute.rangeStart" :min="0" :max="59" size="small" style="width: 80px" @change="updateCron" />
              到
              <el-input-number v-model="cronConfig.minute.rangeEnd" :min="0" :max="59" size="small" style="width: 80px" @change="updateCron" />
              分
            </el-radio>
          </el-radio-group>
        </el-tab-pane>

        <!-- 小时 -->
        <el-tab-pane label="小时" name="hour">
          <el-radio-group v-model="cronConfig.hour.type" @change="updateCron">
            <el-radio label="*">每小时</el-radio>
            <el-radio label="?">不指定</el-radio>
            <el-radio label="period">
              周期：从
              <el-input-number v-model="cronConfig.hour.start" :min="0" :max="23" size="small" style="width: 80px" @change="updateCron" />
              时开始，每
              <el-input-number v-model="cronConfig.hour.interval" :min="1" :max="23" size="small" style="width: 80px" @change="updateCron" />
              小时执行一次
            </el-radio>
            <el-radio label="range">
              范围：从
              <el-input-number v-model="cronConfig.hour.rangeStart" :min="0" :max="23" size="small" style="width: 80px" @change="updateCron" />
              到
              <el-input-number v-model="cronConfig.hour.rangeEnd" :min="0" :max="23" size="small" style="width: 80px" @change="updateCron" />
              时
            </el-radio>
          </el-radio-group>
        </el-tab-pane>

        <!-- 日 -->
        <el-tab-pane label="日" name="day">
          <el-radio-group v-model="cronConfig.day.type" @change="updateCron">
            <el-radio label="*">每日</el-radio>
            <el-radio label="?">不指定</el-radio>
            <el-radio label="period">
              周期：从
              <el-input-number v-model="cronConfig.day.start" :min="1" :max="31" size="small" style="width: 80px" @change="updateCron" />
              日开始，每
              <el-input-number v-model="cronConfig.day.interval" :min="1" :max="31" size="small" style="width: 80px" @change="updateCron" />
              日执行一次
            </el-radio>
            <el-radio label="L">本月最后一天</el-radio>
          </el-radio-group>
        </el-tab-pane>

        <!-- 月 -->
        <el-tab-pane label="月" name="month">
          <el-radio-group v-model="cronConfig.month.type" @change="updateCron">
            <el-radio label="*">每月</el-radio>
            <el-radio label="?">不指定</el-radio>
            <el-radio label="period">
              周期：从
              <el-input-number v-model="cronConfig.month.start" :min="1" :max="12" size="small" style="width: 80px" @change="updateCron" />
              月开始，每
              <el-input-number v-model="cronConfig.month.interval" :min="1" :max="12" size="small" style="width: 80px" @change="updateCron" />
              月执行一次
            </el-radio>
          </el-radio-group>
        </el-tab-pane>

        <!-- 周 -->
        <el-tab-pane label="周" name="week">
          <el-radio-group v-model="cronConfig.week.type" @change="updateCron">
            <el-radio label="*">每周</el-radio>
            <el-radio label="?">不指定</el-radio>
            <el-radio label="specific">
              指定：
              <el-checkbox-group v-model="cronConfig.week.values" @change="updateCron" style="display: inline-block; margin-left: 10px;">
                <el-checkbox label="1">周一</el-checkbox>
                <el-checkbox label="2">周二</el-checkbox>
                <el-checkbox label="3">周三</el-checkbox>
                <el-checkbox label="4">周四</el-checkbox>
                <el-checkbox label="5">周五</el-checkbox>
                <el-checkbox label="6">周六</el-checkbox>
                <el-checkbox label="7">周日</el-checkbox>
              </el-checkbox-group>
            </el-radio>
          </el-radio-group>
        </el-tab-pane>
      </el-tabs>

      <div class="cron-result">
        <el-divider content-position="left">生成的Cron表达式</el-divider>
        <div class="cron-expression">
          <el-tag type="success" size="large">{{ generatedCron }}</el-tag>
          <span class="cron-description">{{ cronDescription }}</span>
        </div>
      </div>

      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmCron">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  modelValue: {
    type: String,
    default: '0 0 2 * * ?',
  },
});

const emit = defineEmits(['update:modelValue']);

const showDialog = ref(false);
const activeTab = ref('second');
const cronValue = ref(props.modelValue);

// Cron 配置对象
const cronConfig = ref({
  second: { type: '0', start: 0, interval: 1, rangeStart: 0, rangeEnd: 59 },
  minute: { type: '0', start: 0, interval: 1, rangeStart: 0, rangeEnd: 59 },
  hour: { type: '2', start: 0, interval: 1, rangeStart: 0, rangeEnd: 23 },
  day: { type: '*', start: 1, interval: 1 },
  month: { type: '*', start: 1, interval: 1 },
  week: { type: '?', values: [] },
});

// 生成 Cron 表达式
const generatedCron = computed(() => {
  const parts = [];

  // 秒
  parts.push(getCronPart('second', 0, 59));
  // 分钟
  parts.push(getCronPart('minute', 0, 59));
  // 小时
  parts.push(getCronPart('hour', 0, 23));
  // 日
  parts.push(getDayCronPart());
  // 月
  parts.push(getCronPart('month', 1, 12));
  // 周
  parts.push(getWeekCronPart());

  return parts.join(' ');
});

// 生成 Cron 描述
const cronDescription = computed(() => {
  const config = cronConfig.value;
  const parts = [];

  // 秒
  if (config.second.type === '0') parts.push('每分钟的第0秒');
  else if (config.second.type === '*') parts.push('每秒');
  else if (config.second.type === 'period') parts.push(`每${config.second.interval}秒`);

  // 分钟
  if (config.minute.type === '0') parts.push('每小时的第0分');
  else if (config.minute.type === '*') parts.push('每分钟');
  else if (config.minute.type === 'period') parts.push(`每${config.minute.interval}分钟`);

  // 小时
  if (config.hour.type !== '*' && config.hour.type !== '?') {
    if (config.hour.type === 'period') parts.push(`每${config.hour.interval}小时`);
    else parts.push(`${config.hour.type}点`);
  }

  // 日
  if (config.day.type === '*') parts.push('每天');
  else if (config.day.type === 'L') parts.push('每月最后一天');

  // 周
  if (config.week.type === 'specific' && config.week.values.length > 0) {
    const weekNames = { 1: '周一', 2: '周二', 3: '周三', 4: '周四', 5: '周五', 6: '周六', 7: '周日' };
    const weeks = config.week.values.map(v => weekNames[v]).join('、');
    parts.push(`在${weeks}`);
  }

  return parts.join('，') || '自定义表达式';
});

function getCronPart(field, min, max) {
  const config = cronConfig.value[field];

  if (config.type === '*' || config.type === '?') {
    return config.type;
  } else if (config.type === 'period') {
    return `${config.start}/${config.interval}`;
  } else if (config.type === 'range') {
    return `${config.rangeStart}-${config.rangeEnd}`;
  } else {
    return config.type;
  }
}

function getDayCronPart() {
  const config = cronConfig.value.day;

  if (config.type === '*' || config.type === '?') {
    return config.type;
  } else if (config.type === 'period') {
    return `${config.start}/${config.interval}`;
  } else if (config.type === 'L') {
    return 'L';
  } else {
    return config.type;
  }
}

function getWeekCronPart() {
  const config = cronConfig.value.week;

  if (config.type === '*' || config.type === '?') {
    return config.type;
  } else if (config.type === 'specific' && config.values.length > 0) {
    return config.values.sort().join(',');
  } else {
    return '?';
  }
}

function updateCron() {
  // 日和周不能同时指定，需要互斥
  if (cronConfig.value.day.type !== '?' && cronConfig.value.week.type !== '?') {
    if (activeTab.value === 'day') {
      cronConfig.value.week.type = '?';
    } else if (activeTab.value === 'week') {
      cronConfig.value.day.type = '?';
    }
  }
}

function handleInput(value) {
  emit('update:modelValue', value);
}

function confirmCron() {
  cronValue.value = generatedCron.value;
  emit('update:modelValue', generatedCron.value);
  showDialog.value = false;
}

// 监听外部值变化
watch(() => props.modelValue, (newVal) => {
  cronValue.value = newVal;
});

// 监听内部值变化
watch(cronValue, (newVal) => {
  emit('update:modelValue', newVal);
});
</script>

<style scoped>
.cron-input-wrapper {
  width: 100%;
}

.el-radio,
.el-checkbox {
  display: block;
  margin: 10px 0;
  line-height: 32px;
}

.el-input-number {
  margin: 0 5px;
}

.cron-result {
  margin-top: 20px;
}

.cron-expression {
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 15px;
}

.cron-expression .el-tag {
  font-family: 'Courier New', monospace;
  font-size: 16px;
  padding: 8px 16px;
}

.cron-description {
  color: #606266;
  font-size: 14px;
}

:deep(.el-tabs__content) {
  padding: 20px;
  min-height: 200px;
}

:deep(.el-checkbox-group) {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

:deep(.el-checkbox-group .el-checkbox) {
  margin: 0;
}
</style>
