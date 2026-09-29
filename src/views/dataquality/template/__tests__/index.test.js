import { describe, test, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { h } from 'vue';

// ---- Mock the template API ----
vi.mock('@/api/dataquality/templateApi', () => ({
  listAllTemplates: vi.fn(),
  addTemplate: vi.fn(() => Promise.resolve()),
  updateTemplate: vi.fn(() => Promise.resolve()),
  deleteTemplate: vi.fn(() => Promise.resolve()),
}));

// ---- Mock element-plus imperative APIs (component imports these) ----
vi.mock('element-plus', () => ({
  ElMessageBox: { confirm: vi.fn(() => Promise.resolve()) },
  ElMessage: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

import { listAllTemplates, updateTemplate, deleteTemplate } from '@/api/dataquality/templateApi';
import { ElMessageBox } from 'element-plus';
import TemplateList from '../index';
import TemplateDialog from '../TemplateDialog.vue';

// ---- Custom stubs (el-table does not expand to a real <table> in jsdom) ----
const ElTableColumnStub = {
  name: 'ElTableColumn',
  props: ['prop', 'label', 'width', 'align', 'minWidth', 'fixed', 'showOverflowTooltip', 'type'],
  render() {
    return null; // parent ElTable reads our props + children
  },
};

const ElTableStub = {
  name: 'ElTable',
  props: ['data', 'v-loading'],
  setup(props, { slots }) {
    const data = () => props.data || [];
    const columns = () => {
      const slotContent = (slots.default && slots.default()) || [];
      const colVnodes = slotContent.filter(
        (v) => v.type && v.type.name === 'ElTableColumn' && v.props,
      );
      return colVnodes.map((v) => ({
        prop: v.props.prop,
        label: v.props.label,
        cell: typeof v.children === 'function' ? v.children : v.children && v.children.default,
      }));
    };
    return () => {
      const cols = columns();
      const rows = data();
      return h('table', {}, [
        h('thead', {}, [h('tr', {}, cols.map((c) => h('th', { key: c.prop }, c.label || '')))]),
        h('tbody', {}, rows.map((row, ri) =>
          h('tr', { key: ri }, cols.map((c) => {
            if (c.cell) {
              const cellVnodes = c.cell({ row, $index: ri });
              return h('td', { key: c.prop }, Array.isArray(cellVnodes) ? cellVnodes : [cellVnodes]);
            }
            return h('td', { key: c.prop }, row[c.prop] != null ? String(row[c.prop]) : '');
          })),
        )),
      ]);
    };
  },
};

const ElInputStub = {
  name: 'ElInput',
  props: ['modelValue'],
  emits: ['update:modelValue'],
  template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
};

const ElSwitchStub = {
  name: 'ElSwitch',
  props: ['modelValue', 'activeValue', 'inactiveValue'],
  emits: ['update:modelValue', 'change'],
  template: '<input type="checkbox" :checked="modelValue === activeValue" @change="onChange" />',
  methods: {
    onChange(e) {
      const val = e.target.checked ? this.activeValue : this.inactiveValue;
      this.$emit('update:modelValue', val);
      this.$emit('change', val);
    },
  },
};

const ElSelectStub = {
  name: 'ElSelect',
  props: ['modelValue'],
  emits: ['update:modelValue'],
  template: '<select :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"><slot /></select>',
};

const ElOptionStub = {
  name: 'ElOption',
  props: ['label', 'value'],
  template: '<option :value="value">{{ label }}</option>',
};

const ElButtonStub = {
  name: 'ElButton',
  props: ['type', 'icon'],
  template: '<button :class="type ? \'el-button--\' + type : \'\'"><slot /></button>',
};

const SimpleContainer = { template: '<div><slot /></div>' };

const stubs = {
  'el-table': ElTableStub,
  'el-table-column': ElTableColumnStub,
  'el-input': ElInputStub,
  'el-switch': ElSwitchStub,
  'el-select': ElSelectStub,
  'el-option': ElOptionStub,
  'el-button': ElButtonStub,
  'el-button-group': SimpleContainer,
  'el-form': { name: 'ElForm', props: ['model', 'inline'], template: '<form><slot /></form>' },
  'el-form-item': { name: 'ElFormItem', props: ['label'], template: '<div><slot /></div>' },
  'el-row': SimpleContainer,
  'el-col': SimpleContainer,
  'el-tag': { name: 'ElTag', props: ['size'], template: '<span><slot /></span>' },
  'el-tooltip': { name: 'ElTooltip', props: ['content'], template: '<div><slot /></div>' },
  'right-toolbar': { name: 'RightToolbar', props: ['modelValue'], emits: ['update:modelValue'], template: '<div></div>' },
  pagination: { name: 'Pagination', template: '<div></div>' },
};

const flush = () => new Promise((r) => setTimeout(r, 0));

const dimensionMap = {
  completeness: '完整性',
  uniqueness: '唯一性',
  timeliness: '及时性',
  validity: '有效性',
  consistency: '一致性',
  stability: '稳定性',
};

const mockTemplates = [
  { id: 1, templateCode: 'NULL_CHECK', templateName: '空值检测', dimension: 'completeness', templateColor: '#f56c6c', sortOrder: 1, enabled: 1, description: '检测空值' },
  { id: 2, templateCode: 'UNIQUE_CHECK', templateName: '唯一性检测', dimension: 'uniqueness', templateColor: '#409eff', sortOrder: 2, enabled: 0, description: '检测重复值' },
  { id: 3, templateCode: 'RANGE_CHECK', templateName: '范围检测', dimension: 'validity', templateColor: '#67c23a', sortOrder: 3, enabled: 1, description: '数值范围' },
];

async function mountAndWait() {
  listAllTemplates.mockResolvedValue([...mockTemplates]);
  const wrapper = mount(TemplateList, { global: { stubs, directives: { loading: {} } } });
  await flush();
  await flush();
  return wrapper;
}

describe('规则模板管理列表页', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('渲染表格列头（编码/名称/维度/图标/排序/启用状态/描述/操作）', async () => {
    const wrapper = await mountAndWait();
    const headers = wrapper.findAll('th').map((th) => th.text());
    expect(headers).toEqual(expect.arrayContaining([
      '模板编码', '模板名称', '维度', '图标', '排序', '启用状态', '描述', '操作',
    ]));
    // 数据行渲染
    expect(wrapper.findAll('tbody tr')).toHaveLength(3);
  });

  test('维度列展示中文映射', async () => {
    const wrapper = await mountAndWait();
    const html = wrapper.html();
    expect(html).toContain('完整性');
    expect(html).toContain('唯一性');
    expect(html).toContain('有效性');
  });

  test('顶部存在「新建模板」按钮', async () => {
    const wrapper = await mountAndWait();
    const createBtn = wrapper.findAll('button').find((b) => b.text().includes('新建模板'));
    expect(createBtn).toBeTruthy();
  });

  test('关键字搜索过滤列表', async () => {
    const wrapper = await mountAndWait();
    expect(wrapper.findAll('tbody tr')).toHaveLength(3);

    const input = wrapper.find('input:not([type="checkbox"])');
    await input.setValue('唯一');
    await flush();

    expect(wrapper.findAll('tbody tr')).toHaveLength(1);
    expect(wrapper.find('tbody').text()).toContain('唯一性检测');
  });

  test('维度下拉过滤列表', async () => {
    const wrapper = await mountAndWait();
    // 第一个 select 是维度
    const dimSelect = wrapper.find('select');
    await dimSelect.setValue('validity');
    await flush();

    expect(wrapper.findAll('tbody tr')).toHaveLength(1);
    expect(wrapper.find('tbody').text()).toContain('范围检测');
  });

  test('启停开关调用 updateTemplate', async () => {
    const wrapper = await mountAndWait();
    // 第一行 enabled=1，切换为关闭 → updateTemplate({ id:1, enabled:0 })
    const checkbox = wrapper.find('input[type="checkbox"]');
    expect(checkbox.element.checked).toBe(true);

    checkbox.element.checked = false;
    await checkbox.trigger('change');
    await flush();

    expect(updateTemplate).toHaveBeenCalledWith({ id: 1, enabled: 0 });
  });

  test('删除经二次确认后调用 deleteTemplate', async () => {
    const wrapper = await mountAndWait();
    const deleteBtn = wrapper.find('.el-button--danger');
    expect(deleteBtn.exists()).toBe(true);

    await deleteBtn.trigger('click');
    await flush();

    expect(ElMessageBox.confirm).toHaveBeenCalled();
    expect(deleteTemplate).toHaveBeenCalledWith(1);
  });

  test('编辑回填对 id 类型不敏感：字符串 editId 仍能匹配数字 id', async () => {
    // 列表返回数字 id 的行，但以字符串 '1' 触发编辑
    listAllTemplates.mockResolvedValue([
      { id: 1, templateCode: 'NULL_CHECK', templateName: '空值检测', dimension: 'completeness', templateColor: '#f56c6c', sortOrder: 1, enabled: 1, description: '检测空值' },
    ]);

    const dialogStubs = {
      ...stubs,
      'el-dialog': { name: 'ElDialog', props: ['modelValue'], template: '<div><slot /></div>' },
      'el-color-picker': { name: 'ElColorPicker', template: '<div></div>' },
      'el-input-number': { name: 'ElInputNumber', template: '<div></div>' },
    };

    const wrapper = mount(TemplateDialog, {
      props: { visible: false, editId: '1' },
      global: { stubs: dialogStubs, directives: { loading: {} } },
    });
    await flush();

    // 打开弹框触发 watch → 回填
    await wrapper.setProps({ visible: true });
    await flush();
    await flush();

    const nameInput = wrapper.findAll('input:not([type="checkbox"])')
      .find((i) => i.element.value === '空值检测');
    expect(nameInput).toBeTruthy();
  });
});
