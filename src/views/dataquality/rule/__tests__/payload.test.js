import { describe, test, expect } from 'vitest';
import { buildRulePayload } from '../payload';

const baseForm = () => ({
  id: 1,
  ruleName: 'r',
  templateId: 1,
  description: '',
  enabled: 1,
  datasourceId: 1,
  dbName: 'db',
  tableName: 't',
  fieldNames: 'f',
  ruleCheckParams: { checkMethod: 'actual_minus_expected', operator: '>' },
  sparkParamsObj: { deployMode: 'LOCAL' },
  alertGroupCode: '',
});

describe('buildRulePayload', () => {
  test('alertEnabled=false 时剔除阈值字段', () => {
    const form = baseForm();
    form.ruleCheckParams = {
      ...form.ruleCheckParams,
      alertEnabled: false,
      alertOperator: '>',
      alertThreshold: 100,
      alertGroupCode: 'DQ_DEFAULT',
    };
    const payload = buildRulePayload(form, { isEdit: true });
    expect(payload.ruleCheckParams).not.toHaveProperty('alertEnabled');
    expect(payload.ruleCheckParams).not.toHaveProperty('alertOperator');
    expect(payload.ruleCheckParams).not.toHaveProperty('alertThreshold');
    expect(payload.ruleCheckParams).not.toHaveProperty('alertGroupCode');
  });

  test('alertEnabled=true 时保留阈值字段', () => {
    const form = baseForm();
    form.ruleCheckParams = {
      ...form.ruleCheckParams,
      alertEnabled: true,
      alertOperator: '>',
      alertThreshold: 100,
      alertGroupCode: 'DQ_DEFAULT',
    };
    const payload = buildRulePayload(form, { isEdit: true });
    expect(payload.ruleCheckParams.alertEnabled).toBe(true);
    expect(payload.ruleCheckParams.alertOperator).toBe('>');
    expect(payload.ruleCheckParams.alertThreshold).toBe(100);
    expect(payload.ruleCheckParams.alertGroupCode).toBe('DQ_DEFAULT');
  });

  test('edit 时带 id，create 时不带 id', () => {
    expect(buildRulePayload(baseForm(), { isEdit: true }).id).toBe(1);
    expect(buildRulePayload(baseForm(), { isEdit: false })).not.toHaveProperty('id');
  });
});
