import { describe, test, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { h, cloneVNode } from 'vue';

// ---- Mock the report API ----
vi.mock('@/api/dataquality/reportApi', () => ({
  getReportAggregate: vi.fn(),
}));

// ---- Mock echarts (needs DOM dimensions jsdom cannot provide) ----
const chartInstances = [];
vi.mock('echarts', () => ({
  init: vi.fn(() => {
    const instance = { setOption: vi.fn(), resize: vi.fn(), dispose: vi.fn() };
    chartInstances.push(instance);
    return instance;
  }),
}));

// ---- Mock element-plus imperative APIs (component imports these) ----
vi.mock('element-plus', () => ({
  ElMessage: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

import { getReportAggregate } from '@/api/dataquality/reportApi';
import { ElMessage } from 'element-plus';
import * as echarts from 'echarts';
import ReportIndex from '../index';

// ---- Custom stubs ----
// Radio group coordinates its radio-button children: clicking a button emits
// update:modelValue + change carrying that button's label, mirroring how
// element-plus drives v-model + @change on <el-radio-group>.
const ElRadioGroupStub = {
  name: 'ElRadioGroup',
  props: ['modelValue', 'size'],
  emits: ['update:modelValue', 'change'],
  setup(props, { emit, slots }) {
    return () => {
      const children = (slots.default && slots.default()) || [];
      return h('div', { class: 'el-radio-group' }, children.map((child) => {
        const label = child.props && child.props.label;
        return cloneVNode(child, {
          onClick: () => {
            emit('update:modelValue', label);
            emit('change', label);
          },
        });
      }));
    };
  },
};

const ElRadioButtonStub = {
  name: 'ElRadioButton',
  props: ['label'],
  emits: ['click'],
  template: '<button class="el-radio-button" @click="$emit(\'click\')"><slot /></button>',
};

const ElDatePickerStub = {
  name: 'ElDatePicker',
  props: ['modelValue', 'type', 'rangeSeparator', 'startPlaceholder', 'endPlaceholder', 'valueFormat'],
  emits: ['update:modelValue'],
  template: '<div class="el-date-picker" />',
};

const ElButtonStub = {
  name: 'ElButton',
  props: ['type', 'icon'],
  emits: ['click'],
  template: '<button :class="type ? \'el-button--\' + type : \'\'" @click="$emit(\'click\')"><slot /></button>',
};

const ElCardStub = {
  name: 'ElCard',
  props: ['shadow'],
  template: '<div class="el-card"><div class="el-card__header" v-if="$slots.header"><slot name="header" /></div><div class="el-card__body"><slot /></div></div>',
};

const SimpleContainer = { template: '<div><slot /></div>' };

const stubs = {
  'el-radio-group': ElRadioGroupStub,
  'el-radio-button': ElRadioButtonStub,
  'el-date-picker': ElDatePickerStub,
  'el-button': ElButtonStub,
  'el-card': ElCardStub,
  'el-form': { name: 'ElForm', props: ['model', 'inline', 'labelWidth'], template: '<form><slot /></form>' },
  'el-form-item': { name: 'ElFormItem', props: ['label'], template: '<div><slot /></div>' },
  'el-row': SimpleContainer,
  'el-col': SimpleContainer,
};

const flush = () => new Promise((r) => setTimeout(r, 0));

const mockReportData = {
  overview: { total: 100, passed: 80, failed: 20, passRate: 80, execSuccess: 90, execFailed: 10 },
  trend: {
    granularity: 'day',
    buckets: [
      { time: '2026-08-23', count: 50, passRate: 80 },
      { time: '2026-08-24', count: 50, passRate: 80 },
    ],
  },
  distribution: {
    byRule: [{ ruleName: '规则A', fails: 10 }, { ruleName: '规则B', fails: 5 }],
    byDimension: [{ dimension: '完整性', fails: 8 }, { dimension: '唯一性', fails: 7 }],
  },
};

async function mountAndWait() {
  chartInstances.length = 0;
  getReportAggregate.mockResolvedValue({ data: mockReportData });
  const wrapper = mount(ReportIndex, { global: { stubs, directives: { loading: {} } } });
  await flush();
  await flush();
  return wrapper;
}

describe('数据质量报告页', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    chartInstances.length = 0;
  });

  test('默认近7天加载：卡片展示总量/通过/失败', async () => {
    const wrapper = await mountAndWait();

    // getReportAggregate 被调用（默认近 7 天）
    expect(getReportAggregate).toHaveBeenCalled();

    // 6 个概览卡片
    const statNums = wrapper.findAll('.stat-num');
    expect(statNums).toHaveLength(6);
    expect(statNums[0].text()).toBe('100'); // 检测总量
    expect(statNums[1].text()).toBe('80');  // 通过
    expect(statNums[2].text()).toBe('20');  // 失败
  });

  test('自定义时间校验：起始>结束时警告且不调用接口', async () => {
    const wrapper = await mountAndWait();

    // 初始挂载已调用一次（近 7 天）
    expect(getReportAggregate).toHaveBeenCalledTimes(1);

    // 切换到自定义区间，且起始 > 结束
    wrapper.vm.queryParams.range = 'custom';
    wrapper.vm.customRange = ['2026-08-20 00:00:00', '2026-08-10 00:00:00'];
    await flush();

    // 点击「查询」按钮触发 loadAll
    const queryBtn = wrapper.findAll('button').find((b) => b.text().includes('查询'));
    expect(queryBtn).toBeTruthy();
    await queryBtn.trigger('click');
    await flush();

    // 校验警告被触发
    expect(ElMessage.warning).toHaveBeenCalledWith('起始时间不能晚于结束时间');
    // 接口未被再次调用（buildParams 返回 null，loadAll 提前 return）
    expect(getReportAggregate).toHaveBeenCalledTimes(1);
  });

  test('无数据时通过率展示 em-dash', async () => {
    getReportAggregate.mockResolvedValue({
      data: {
        overview: { total: 0, passed: 0, failed: 0, passRate: null, execSuccess: 0, execFailed: 0 },
        trend: { buckets: [] },
        distribution: { byRule: [], byDimension: [] },
      },
    });
    const wrapper = mount(ReportIndex, { global: { stubs, directives: { loading: {} } } });
    await flush();
    await flush();

    // passRate 为 null 时渲染 em-dash
    expect(wrapper.text()).toContain('—');
  });

  test('分布切换：按规则 -> 按维度改变图表渲染数据', async () => {
    const wrapper = await mountAndWait();

    // 趋势图第 1 个 init，分布图第 2 个 init
    expect(chartInstances.length).toBeGreaterThanOrEqual(2);
    const distChart = chartInstances[1];

    // 初始为「按规则」，xAxis 数据为规则名
    const ruleCall = distChart.setOption.mock.calls.at(-1);
    expect(ruleCall[0].xAxis.data).toEqual(['规则A', '规则B']);

    // 找到「按维度」单选按钮并点击
    const dimBtn = wrapper.findAll('.el-radio-button').find((b) => b.text().includes('按维度'));
    expect(dimBtn).toBeTruthy();
    await dimBtn.trigger('click');
    await flush();

    // distType 已切换
    expect(wrapper.vm.distType).toBe('dimension');

    // 分布图按维度重新渲染，xAxis 数据为维度名
    const dimCall = distChart.setOption.mock.calls.at(-1);
    expect(dimCall[0].xAxis.data).toEqual(['完整性', '唯一性']);
  });

  test('空->数据->空->数据循环后图表重新初始化（不复用脱离 DOM 的旧实例）', async () => {
    const wrapper = await mountAndWait();

    // 初始挂载（total>0）后 echarts.init 已被调用（趋势图 + 分布图）
    const initCallsBefore = echarts.init.mock.calls.length;
    expect(initCallsBefore).toBeGreaterThanOrEqual(2);

    // 总量降至 0：v-if 移除图表 div，watch 应 dispose + 置空实例
    wrapper.vm.overview = {
      total: 0, passed: 0, failed: 0, passRate: null, execSuccess: 0, execFailed: 0,
    };
    await flush();
    await flush();

    // 再次查询：接口返回 total>0，loadAll 重新渲染图表。
    // 关键：实例已被释放，init 必须再次调用（否则 setOption 会渲染到脱离 DOM 的节点，图表空白）。
    await wrapper.vm.loadAll();
    await flush();
    await flush();

    // 空->数据过渡后 init 调用次数多于初始次数，
    // 证明实例已被释放并在新 div 上重新初始化（而非向脱离 DOM 的节点渲染）
    expect(echarts.init.mock.calls.length).toBeGreaterThan(initCallsBefore);
  });
});
