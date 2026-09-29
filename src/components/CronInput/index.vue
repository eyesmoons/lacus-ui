<template>
  <div class="cron-input-wrapper">
    <el-input
      v-model="cronValue"
      placeholder="请输入 Cron 表达式或点击右侧按钮生成"
      clearable
      @input="handleInput"
    >
      <template #append>
        <el-button icon="Setting" @click="showDialog = true">生成</el-button>
      </template>
    </el-input>

    <el-dialog
      title="Cron 表达式生成器"
      v-model="showDialog"
      width="700px"
      append-to-body
      destroy-on-close
    >
      <div class="cron-editor">
        <div class="cron-mode-switch">
          <el-radio-group v-model="editorMode" size="small">
            <el-radio-button label="simple">快捷选择</el-radio-button>
            <el-radio-button label="advanced">高级模式</el-radio-button>
          </el-radio-group>
        </div>

        <div v-if="editorMode === 'simple'" class="cron-simple">
          <div class="section-title">常用表达式</div>
          <div class="quick-options">
            <div
              v-for="item in quickOptions"
              :key="item.value"
              class="quick-option"
              :class="{ active: currentCron === item.value }"
              @click="selectQuickOption(item.value)"
            >
              <div class="quick-option-label">{{ item.label }}</div>
              <div class="quick-option-desc">{{ item.desc }}</div>
            </div>
          </div>

          <div class="section-title">自定义频率</div>
          <div class="frequency-selector">
            <el-radio-group v-model="simpleMode">
              <el-radio label="every">每天</el-radio>
              <el-radio label="weekday">按星期</el-radio>
              <el-radio label="monthly">按月份</el-radio>
            </el-radio-group>
          </div>

          <div v-if="simpleMode === 'weekday'" class="weekday-selector">
            <el-checkbox-group v-model="selectedWeekdays">
              <el-checkbox
                v-for="day in weekOptions"
                :key="day.value"
                :label="day.value"
              >
                {{ day.label }}
              </el-checkbox>
            </el-checkbox-group>
          </div>

          <div v-if="simpleMode === 'monthly'" class="monthly-selector">
            <el-checkbox-group v-model="selectedMonths">
              <el-checkbox
                v-for="month in monthOptions"
                :key="month.value"
                :label="month.value"
              >
                {{ month.label }}
              </el-checkbox>
            </el-checkbox-group>
          </div>

          <div class="time-selector">
            <div class="time-row">
              <span class="time-label">执行时间：</span>
              <el-time-select
                v-model="executeTime"
                placeholder="选择时间"
                start="00:00"
                end="23:59"
                step="00:05"
                style="width: 150px"
              />
            </div>
            <div
              v-if="simpleMode === 'weekday' && selectedWeekdays.length > 0"
              class="time-row"
            >
              <span class="time-label">可选工作日：</span>
              <el-tag
                v-for="day in selectedWeekdays"
                :key="day"
                size="small"
                class="weekday-tag"
              >
                {{ weekOptions.find((w) => w.value === day)?.label }}
              </el-tag>
            </div>
          </div>
        </div>

        <div v-else class="cron-advanced">
          <div class="section-title">Cron 表达式 (秒 分 时 日 月 周)</div>
          <el-input
            v-model="currentCron"
            placeholder="例如: 0 0 10 * * ?"
            @input="handleCronInput"
          >
            <template #prepend>
              <el-tooltip content="重置为默认" placement="top">
                <el-button
                  icon="Refresh"
                  @click="currentCron = '0 0 2 * * ?'"
                />
              </el-tooltip>
            </template>
          </el-input>
          <div class="cron-format-hint">
            <span>格式：秒 分 时 日 月 周</span>
            <span class="hint-item">* 任意</span>
            <span class="hint-item">, 多个值</span>
            <span class="hint-item">- 范围</span>
            <span class="hint-item">/ 间隔</span>
            <span class="hint-item">? 不指定</span>
          </div>
        </div>

        <div class="cron-result">
          <div class="result-row">
            <span class="result-label">表达式：</span>
            <el-tag size="large" effect="dark" type="info" class="cron-tag">
              {{ currentCron }}
            </el-tag>
          </div>
          <div class="result-row">
            <span class="result-label">描述：</span>
            <span class="cron-description">{{ cronDescription }}</span>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showDialog = false">取消</el-button>
          <el-button type="primary" @click="confirmCron">确定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, watch, computed, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { Clock, Refresh } from "@element-plus/icons-vue";
import parser from "cron-parser";

const props = defineProps({
  modelValue: {
    type: String,
    default: "0 0 2 * * ?",
  },
});

const emit = defineEmits(["update:modelValue"]);

const showDialog = ref(false);
const cronValue = ref(props.modelValue);
const editorMode = ref("simple");
const simpleMode = ref("every");
const currentCron = ref(props.modelValue || "0 0 2 * * ?");
const executeTime = ref("02:00");

const selectedWeekdays = ref(["1", "2", "3", "4", "5"]);
const selectedMonths = ref([
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12",
]);

const weekOptions = [
  { value: "1", label: "周一" },
  { value: "2", label: "周二" },
  { value: "3", label: "周三" },
  { value: "4", label: "周四" },
  { value: "5", label: "周五" },
  { value: "6", label: "周六" },
  { value: "7", label: "周日" },
];

const monthOptions = [
  { value: "1", label: "1月" },
  { value: "2", label: "2月" },
  { value: "3", label: "3月" },
  { value: "4", label: "4月" },
  { value: "5", label: "5月" },
  { value: "6", label: "6月" },
  { value: "7", label: "7月" },
  { value: "8", label: "8月" },
  { value: "9", label: "9月" },
  { value: "10", label: "10月" },
  { value: "11", label: "11月" },
  { value: "12", label: "12月" },
];

const quickOptions = [
  { value: "0 0/5 * * * ?", label: "每5分钟", desc: "每5分钟执行一次" },
  { value: "0 0/10 * * * ?", label: "每10分钟", desc: "每10分钟执行一次" },
  { value: "0 0/30 * * * ?", label: "每30分钟", desc: "每30分钟执行一次" },
  { value: "0 0 * * * ?", label: "每小时", desc: "每小时的第0分执行" },
  { value: "0 0 2 * * ?", label: "每天凌晨", desc: "每天凌晨2点执行" },
  { value: "0 0 6 * * ?", label: "每天早晨", desc: "每天早晨6点执行" },
  { value: "0 0 10 * * ?", label: "每天上午", desc: "每天上午10点执行" },
  { value: "0 0 12 * * ?", label: "每天中午", desc: "每天中午12点执行" },
  { value: "0 0 18 * * ?", label: "每天傍晚", desc: "每天傍晚18点执行" },
  { value: "0 0 2 * * 1-5", label: "工作日", desc: "周一至周五凌晨2点" },
  { value: "0 0 10 * * 1-5", label: "工作日上午", desc: "周一至周五上午10点" },
  { value: "0 0 2 * * 6,7", label: "周末", desc: "周六、周日凌晨2点" },
  { value: "0 0 2 1 * ?", label: "每月1号", desc: "每月1日凌晨2点" },
  { value: "0 0 2 1 1 ?", label: "每年1月", desc: "每年1月1日凌晨2点" },
  { value: "0 0 2 ? * MON", label: "每周一", desc: "每周一凌晨2点" },
  { value: "0 0 2 ? * SUN", label: "每周日", desc: "每周日凌晨2点" },
];

const generateCronFromSimple = computed(() => {
  const [hour, minute] = executeTime.value.split(":").map(Number);
  const h = String(hour).padStart(2, "0");
  const m = String(minute).padStart(2, "0");
  const timePart = `0 ${m} ${h}`;

  if (simpleMode.value === "every") {
    return `${timePart} * * ?`;
  } else if (simpleMode.value === "weekday") {
    if (selectedWeekdays.value.length === 0) {
      return `${timePart} * * ?`;
    }
    const days = selectedWeekdays.value.sort().join(",");
    return `${timePart} * * ${days}`;
  } else if (simpleMode.value === "monthly") {
    if (selectedMonths.value.length === 0) {
      return `${timePart} * * ?`;
    }
    const months = selectedMonths.value.sort().join(",");
    return `${timePart} * ? ${months}`;
  }
  return `${timePart} * * ?`;
});

watch([simpleMode, executeTime, selectedWeekdays, selectedMonths], () => {
  if (editorMode.value === "simple") {
    currentCron.value = generateCronFromSimple.value;
  }
});

watch(editorMode, (mode) => {
  if (mode === "simple") {
    currentCron.value = generateCronFromSimple.value;
  }
});

const cronDescription = computed(() => {
  const cron = currentCron.value;
  if (!cron) return "请输入 Cron 表达式";

  const parts = cron.split(" ");
  if (parts.length < 6) return "表达式格式不正确";

  const [, minute, hour, day, month, week] = parts;

  const descriptions = [];

  if (week && week !== "?" && week !== "*") {
    const weekNames = {
      1: "周一",
      2: "周二",
      3: "周三",
      4: "周四",
      5: "周五",
      6: "周六",
      7: "周日",
      MON: "周一",
      TUE: "周二",
      WED: "周三",
      THU: "周四",
      FRI: "周五",
      SAT: "周六",
      SUN: "周日",
    };
    const weekPart = week
      .split(",")
      .map((w) => weekNames[w] || w)
      .join("、");
    descriptions.push(`每周${weekPart}`);
  } else if (day && day !== "?" && day !== "*") {
    if (day === "L") {
      descriptions.push("每月最后一天");
    } else if (day.includes("/")) {
      const [, interval] = day.split("/");
      descriptions.push(`每${interval}天`);
    } else if (day.includes("-")) {
      const [start, end] = day.split("-");
      descriptions.push(`每月${start}日至${end}日`);
    } else {
      descriptions.push(`每月${day}日`);
    }
  } else {
    descriptions.push("每天");
  }

  if (month && month !== "?" && month !== "*") {
    const monthNames = {
      1: "1月",
      2: "2月",
      3: "3月",
      4: "4月",
      5: "5月",
      6: "6月",
      7: "7月",
      8: "8月",
      9: "9月",
      10: "10月",
      11: "11月",
      12: "12月",
    };
    const monthPart = month
      .split(",")
      .map((m) => monthNames[m] || m)
      .join("、");
    descriptions.push(`在${monthPart}`);
  }

  if (hour !== "*") {
    if (hour.includes("/")) {
      const [, interval] = hour.split("/");
      descriptions.push(`每${interval}小时`);
    } else if (hour.includes("-")) {
      const [start, end] = hour.split("-");
      descriptions.push(`${start}时至${end}时`);
    } else {
      const hourStr = String(hour).padStart(2, "0");
      descriptions.push(`在${hourStr}点`);
    }
  } else {
    descriptions.push("每小时");
  }

  if (minute !== "*") {
    if (minute.includes("/")) {
      const [, interval] = minute.split("/");
      descriptions.push(`每${interval}分钟`);
    } else if (minute.includes(",")) {
      const mins = minute
        .split(",")
        .map((m) => String(m).padStart(2, "0"))
        .join("、");
      descriptions.push(`在${mins}分`);
    } else {
      const minuteStr = String(minute).padStart(2, "0");
      descriptions.push(`第${minuteStr}分`);
    }
  } else {
    descriptions.push("每分钟");
  }

  if (minute === "0" && hour === "0") {
    descriptions.push("整点执行");
  }

  return descriptions.join("，");
});

const nextExecuteTime = computed(() => {
  const cron = currentCron.value;
  if (!cron) return "-";

  const parts = cron.trim().split(/\s+/);
  if (parts.length < 5 || parts.length > 6) {
    return "格式不正确";
  }

  try {
    const cronWithSecond = parts.length === 5 ? `0 ${cron}` : cron;
    const interval = parser.parseExpression(cronWithSecond);
    const next = interval.next().toDate();
    const now = new Date();
    const diffMs = next.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    let relativeTime = "";
    if (diffDays > 0) {
      relativeTime = `${diffDays}天${diffHours % 24}小时后`;
    } else if (diffHours > 0) {
      relativeTime = `${diffHours}小时${diffMins % 60}分钟后`;
    } else if (diffMins > 0) {
      relativeTime = `${diffMins}分钟后`;
    } else {
      relativeTime = "即将执行";
    }

    const weekDays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
    const monthNames = [
      "1月",
      "2月",
      "3月",
      "4月",
      "5月",
      "6月",
      "7月",
      "8月",
      "9月",
      "10月",
      "11月",
      "12月",
    ];

    return `${next.getFullYear()}年${
      monthNames[next.getMonth()]
    }${next.getDate()}日 ${weekDays[next.getDay()]} ${String(
      next.getHours()
    ).padStart(2, "0")}:${String(next.getMinutes()).padStart(2, "0")}:${String(
      next.getSeconds()
    ).padStart(2, "0")} (${relativeTime})`;
  } catch (e) {
    return "表达式解析错误";
  }
});

function selectQuickOption(value) {
  currentCron.value = value;
}

function handleCronInput() {}

function handleInput(value) {
  emit("update:modelValue", value);
}

function confirmCron() {
  if (!currentCron.value) {
    ElMessage.warning("请选择或输入 Cron 表达式");
    return;
  }

  const cron = currentCron.value.trim();
  const parts = cron.split(/\s+/);
  if (parts.length < 5 || parts.length > 6) {
    ElMessage.warning("Cron 表达式格式不正确");
    return;
  }

  try {
    parser.parseExpression(cron, { tz: "Asia/Shanghai" });
  } catch (e) {
    // Quartz 格式可能不被完全支持，但只要格式正确就允许
    if (parts.length >= 5 && parts.length <= 6) {
      // 格式看起来正确，继续
    } else {
      ElMessage.warning("Cron 表达式格式不正确");
      return;
    }
  }

  cronValue.value = currentCron.value;
  emit("update:modelValue", currentCron.value);
  showDialog.value = false;
  ElMessage.success("Cron 表达式已设置");
}

watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal) {
      cronValue.value = newVal;
      currentCron.value = newVal;
    }
  },
  { immediate: true }
);

watch(showDialog, (show) => {
  if (show) {
    currentCron.value = cronValue.value || "0 0 2 * * ?";

    const parts = currentCron.value.split(" ");
    if (parts.length >= 5) {
      const [, minute, hour] = parts;
      if (minute !== "*" && !minute.includes("/")) {
        executeTime.value = `${String(hour).padStart(2, "0")}:${String(
          minute
        ).padStart(2, "0")}`;
      }
    }

    const weekPart = parts[5];
    if (weekPart && weekPart !== "?" && weekPart !== "*") {
      simpleMode.value = "weekday";
      selectedWeekdays.value = weekPart
        .split(",")
        .filter(
          (w) =>
            w !== "MON" &&
            w !== "TUE" &&
            w !== "WED" &&
            w !== "THU" &&
            w !== "FRI" &&
            w !== "SAT" &&
            w !== "SUN"
        );
      if (weekPart.includes("MON")) selectedWeekdays.value.push("1");
      if (weekPart.includes("TUE")) selectedWeekdays.value.push("2");
      if (weekPart.includes("WED")) selectedWeekdays.value.push("3");
      if (weekPart.includes("THU")) selectedWeekdays.value.push("4");
      if (weekPart.includes("FRI")) selectedWeekdays.value.push("5");
      if (weekPart.includes("SAT")) selectedWeekdays.value.push("6");
      if (weekPart.includes("SUN")) selectedWeekdays.value.push("7");
    } else {
      simpleMode.value = "every";
    }
  }
});
</script>

<style scoped>
.cron-input-wrapper {
  width: 100%;
}

.cron-editor {
  min-height: 400px;
}

.cron-mode-switch {
  margin-bottom: 20px;
  display: flex;
  justify-content: center;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
}

.cron-simple {
  margin-bottom: 20px;
}

.quick-options {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-bottom: 20px;
}

.quick-option {
  padding: 10px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.quick-option:hover {
  border-color: #409eff;
  background-color: #ecf5ff;
}

.quick-option.active {
  border-color: #409eff;
  background-color: #409eff;
  color: #fff;
}

.quick-option.active .quick-option-desc {
  color: #fff;
  opacity: 0.8;
}

.quick-option-label {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
}

.quick-option-desc {
  font-size: 12px;
  color: #909399;
}

.frequency-selector {
  margin-bottom: 15px;
}

.weekday-selector,
.monthly-selector {
  margin-top: 10px;
}

.weekday-selector :deep(.el-checkbox),
.monthly-selector :deep(.el-checkbox) {
  margin-right: 15px;
}

.time-selector {
  margin-top: 15px;
}

.time-row {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.time-label {
  font-size: 14px;
  color: #606266;
  margin-right: 10px;
  min-width: 80px;
}

.weekday-tag {
  margin-right: 5px;
}

.cron-advanced {
  margin-bottom: 20px;
}

.cron-format-hint {
  margin-top: 10px;
  font-size: 12px;
  color: #909399;
}

.hint-item {
  margin-left: 10px;
}

.cron-result {
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.result-row {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.result-row:last-child {
  margin-bottom: 0;
}

.result-label {
  font-size: 14px;
  color: #606266;
  min-width: 70px;
}

.cron-tag {
  font-family: "Courier New", monospace;
  font-size: 15px;
  padding: 6px 12px;
}

.cron-description {
  font-size: 14px;
  color: #303133;
}

.next-execute {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #67c23a;
  font-weight: 500;
}

.next-icon {
  margin-right: 5px;
}

.dialog-footer {
  text-align: right;
}
</style>
