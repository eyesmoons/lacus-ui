export function buildRulePayload(form, { isEdit }) {
  const ruleCheckParams = { ...form.ruleCheckParams };
  if (!ruleCheckParams.alertEnabled) {
    delete ruleCheckParams.alertEnabled;
    delete ruleCheckParams.alertOperator;
    delete ruleCheckParams.alertThreshold;
    delete ruleCheckParams.alertGroupCode;
  }
  const payload = {
    ruleName: form.ruleName,
    templateId: form.templateId,
    description: form.description,
    enabled: form.enabled,
    datasourceId: form.datasourceId,
    dbName: form.dbName,
    tableName: form.tableName,
    fieldNames: form.fieldNames,
    ruleCheckParams,
    sparkParams: JSON.stringify(form.sparkParamsObj),
    alertGroupCode: form.alertGroupCode || null,
  };
  if (isEdit) payload.id = form.id;
  return payload;
}
