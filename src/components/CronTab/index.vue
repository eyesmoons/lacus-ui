<template>
  <div class="cron-tab">
    <el-input v-model="cronExpression" placeholder="请输入Cron表达式，如：0 0 12 * * ?" clearable>
      <template #append>
        <el-button @click="openCronModal">生成</el-button>
      </template>
    </el-input>

    <el-dialog v-model="dialogVisible" title="Cron表达式生成器" width="800px" append-to-body>
      <el-tabs v-model="activeTab">
        <el-tab-pane label="秒" name="second">
          <el-radio-group v-model="second.type">
            <el-radio label="1">每秒</el-radio>
            <el-radio label="2">周期</el-radio>
            <el-radio label="3">间隔</el-radio>
            <el-radio label="4">指定</el-radio>
          </el-radio-group>
          <div v-show="second.type == '2'">
            从 <el-input-number v-model="second.start" :min="0" :max="59" /> 到
            <el-input-number v-model="second.end" :min="0" :max="59" />
          </div>
          <div v-show="second.type == '3'">
            从 <el-input-number v-model="second.start" :min="0" :max="59" /> 开始，每
            <el-input-number v-model="second.interval" :min="1" :max="59" /> 秒执行一次
          </div>
          <div v-show="second.type == '4'">
            <el-checkbox-group v-model="second.specificValues">
              <el-checkbox v-for="i in 60" :key="i - 1" :label="i - 1">{{ i - 1 }}</el-checkbox>
            </el-checkbox-group>
          </div>
        </el-tab-pane>

        <el-tab-pane label="分" name="minute">
          <el-radio-group v-model="minute.type">
            <el-radio label="1">每分</el-radio>
            <el-radio label="2">周期</el-radio>
            <el-radio label="3">间隔</el-radio>
            <el-radio label="4">指定</el-radio>
          </el-radio-group>
          <div v-show="minute.type == '2'">
            从 <el-input-number v-model="minute.start" :min="0" :max="59" /> 到
            <el-input-number v-model="minute.end" :min="0" :max="59" />
          </div>
          <div v-show="minute.type == '3'">
            从 <el-input-number v-model="minute.start" :min="0" :max="59" /> 开始，每
            <el-input-number v-model="minute.interval" :min="1" :max="59" /> 分执行一次
          </div>
          <div v-show="minute.type == '4'">
            <el-checkbox-group v-model="minute.specificValues">
              <el-checkbox v-for="i in 60" :key="i - 1" :label="i - 1">{{ i - 1 }}</el-checkbox>
            </el-checkbox-group>
          </div>
        </el-tab-pane>

        <el-tab-pane label="时" name="hour">
          <el-radio-group v-model="hour.type">
            <el-radio label="1">每时</el-radio>
            <el-radio label="2">周期</el-radio>
            <el-radio label="3">间隔</el-radio>
            <el-radio label="4">指定</el-radio>
          </el-radio-group>
          <div v-show="hour.type == '2'">
            从 <el-input-number v-model="hour.start" :min="0" :max="23" /> 到
            <el-input-number v-model="hour.end" :min="0" :max="23" />
          </div>
          <div v-show="hour.type == '3'">
            从 <el-input-number v-model="hour.start" :min="0" :max="23" /> 开始，每
            <el-input-number v-model="hour.interval" :min="1" :max="23" /> 小时执行一次
          </div>
          <div v-show="hour.type == '4'">
            <el-checkbox-group v-model="hour.specificValues">
              <el-checkbox v-for="i in 24" :key="i - 1" :label="i - 1">{{ i - 1 }}</el-checkbox>
            </el-checkbox-group>
          </div>
        </el-tab-pane>

        <el-tab-pane label="日" name="day">
          <el-radio-group v-model="day.type">
            <el-radio label="1">每日</el-radio>
            <el-radio label="2">周期</el-radio>
            <el-radio label="3">间隔</el-radio>
            <el-radio label="4">指定</el-radio>
            <el-radio label="5">不指定</el-radio>
            <el-radio label="6">本月最后一天</el-radio>
          </el-radio-group>
          <div v-show="day.type == '2'">
            从 <el-input-number v-model="day.start" :min="1" :max="31" /> 到
            <el-input-number v-model="day.end" :min="1" :max="31" />
          </div>
          <div v-show="day.type == '3'">
            从 <el-input-number v-model="day.start" :min="1" :max="31" /> 开始，每
            <el-input-number v-model="day.interval" :min="1" :max="31" /> 天执行一次
          </div>
          <div v-show="day.type == '4'">
            <el-checkbox-group v-model="day.specificValues">
              <el-checkbox v-for="i in 31" :key="i" :label="i">{{ i }}</el-checkbox>
            </el-checkbox-group>
          </div>
        </el-tab-pane>

        <el-tab-pane label="月" name="month">
          <el-radio-group v-model="month.type">
            <el-radio label="1">每月</el-radio>
            <el-radio label="2">周期</el-radio>
            <el-radio label="3">间隔</el-radio>
            <el-radio label="4">指定</el-radio>
          </el-radio-group>
          <div v-show="month.type == '2'">
            从 <el-input-number v-model="month.start" :min="1" :max="12" /> 到
            <el-input-number v-model="month.end" :min="1" :max="12" />
          </div>
          <div v-show="month.type == '3'">
            从 <el-input-number v-model="month.start" :min="1" :max="12" /> 开始，每
            <el-input-number v-model="month.interval" :min="1" :max="12" /> 月执行一次
          </div>
          <div v-show="month.type == '4'">
            <el-checkbox-group v-model="month.specificValues">
              <el-checkbox v-for="i in 12" :key="i" :label="i">{{ i }}</el-checkbox>
            </el-checkbox-group>
          </div>
        </el-tab-pane>

        <el-tab-pane label="周" name="week">
          <el-radio-group v-model="week.type">
            <el-radio label="1">每周</el-radio>
            <el-radio label="2">周期</el-radio>
            <el-radio label="3">间隔</el-radio>
            <el-radio label="4">指定</el-radio>
            <el-radio label="5">不指定</el-radio>
          </el-radio-group>
          <div v-show="week.type == '2'">
            从 <el-input-number v-model="week.start" :min="1" :max="7" /> 到
            <el-input-number v-model="week.end" :min="1" :max="7" />
          </div>
          <div v-show="week.type == '3'">
            从 <el-input-number v-model="week.start" :min="1" :max="7" /> 开始，每
            <el-input-number v-model="week.interval" :min="1" :max="7" /> 周执行一次
          </div>
          <div v-show="week.type == '4'">
            <el-checkbox-group v-model="week.specificValues">
              <el-checkbox v-for="i in 7" :key="i" :label="i">{{ weekDays[i - 1] }}</el-checkbox>
            </el-checkbox-group>
          </div>
        </el-tab-pane>
      </el-tabs>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleConfirm">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['update:modelValue']);

const cronExpression = ref(props.modelValue);
const dialogVisible = ref(false);
const activeTab = ref('second');

const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

const second = ref({
  type: '1',
  start: 0,
  end: 0,
  interval: 1,
  specificValues: [],
});

const minute = ref({
  type: '1',
  start: 0,
  end: 0,
  interval: 1,
  specificValues: [],
});

const hour = ref({
  type: '1',
  start: 0,
  end: 0,
  interval: 1,
  specificValues: [],
});

const day = ref({
  type: '1',
  start: 1,
  end: 1,
  interval: 1,
  specificValues: [],
});

const month = ref({
  type: '1',
  start: 1,
  end: 1,
  interval: 1,
  specificValues: [],
});

const week = ref({
  type: '5',
  start: 1,
  end: 1,
  interval: 1,
  specificValues: [],
});

watch(
  () => props.modelValue,
  (newValue) => {
    cronExpression.value = newValue;
  },
);

watch(cronExpression, (newValue) => {
  emit('update:modelValue', newValue);
});

const openCronModal = () => {
  dialogVisible.value = true;
};

const handleConfirm = () => {
  const result = [];

  // 秒
  if (second.value.type === '1') {
    result.push('*');
  } else if (second.value.type === '2') {
    result.push(`${second.value.start}-${second.value.end}`);
  } else if (second.value.type === '3') {
    result.push(`${second.value.start}/${second.value.interval}`);
  } else if (second.value.type === '4') {
    result.push(second.value.specificValues.join(','));
  }

  // 分
  if (minute.value.type === '1') {
    result.push('*');
  } else if (minute.value.type === '2') {
    result.push(`${minute.value.start}-${minute.value.end}`);
  } else if (minute.value.type === '3') {
    result.push(`${minute.value.start}/${minute.value.interval}`);
  } else if (minute.value.type === '4') {
    result.push(minute.value.specificValues.join(','));
  }

  // 时
  if (hour.value.type === '1') {
    result.push('*');
  } else if (hour.value.type === '2') {
    result.push(`${hour.value.start}-${hour.value.end}`);
  } else if (hour.value.type === '3') {
    result.push(`${hour.value.start}/${hour.value.interval}`);
  } else if (hour.value.type === '4') {
    result.push(hour.value.specificValues.join(','));
  }

  // 日
  if (day.value.type === '1') {
    result.push('*');
  } else if (day.value.type === '2') {
    result.push(`${day.value.start}-${day.value.end}`);
  } else if (day.value.type === '3') {
    result.push(`${day.value.start}/${day.value.interval}`);
  } else if (day.value.type === '4') {
    result.push(day.value.specificValues.join(','));
  } else if (day.value.type === '5') {
    result.push('?');
  } else if (day.value.type === '6') {
    result.push('L');
  }

  // 月
  if (month.value.type === '1') {
    result.push('*');
  } else if (month.value.type === '2') {
    result.push(`${month.value.start}-${month.value.end}`);
  } else if (month.value.type === '3') {
    result.push(`${month.value.start}/${month.value.interval}`);
  } else if (month.value.type === '4') {
    result.push(month.value.specificValues.join(','));
  }

  // 周
  if (week.value.type === '1') {
    result.push('*');
  } else if (week.value.type === '2') {
    result.push(`${week.value.start}-${week.value.end}`);
  } else if (week.value.type === '3') {
    result.push(`${week.value.start}/${week.value.interval}`);
  } else if (week.value.type === '4') {
    result.push(week.value.specificValues.join(','));
  } else if (week.value.type === '5') {
    result.push('?');
  }

  cronExpression.value = result.join(' ');
  dialogVisible.value = false;
};
</script>

<style scoped>
.cron-tab {
  width: 100%;
}

.el-checkbox-group {
  margin-top: 10px;
}

.el-checkbox {
  margin-right: 8px;
  margin-bottom: 8px;
}

.el-input-number {
  width: 100px;
  margin: 0 8px;
}
</style>
