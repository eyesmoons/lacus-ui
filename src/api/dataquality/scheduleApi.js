import request from '@/utils/request';

export function getScheduleList(params) {
  return request({ url: '/dq/schedule/list', method: 'get', params });
}
export function getSchedule(jobId) {
  return request({ url: `/dq/schedule/${jobId}`, method: 'get' });
}
export function addSchedule(data) {
  return request({ url: '/dq/schedule', method: 'post', data });
}
export function updateSchedule(data) {
  return request({ url: '/dq/schedule', method: 'put', data });
}
export function pauseSchedule(jobId) {
  return request({ url: '/dq/schedule/pause', method: 'post', data: { jobId } });
}
export function resumeSchedule(jobId) {
  return request({ url: '/dq/schedule/resume', method: 'post', data: { jobId } });
}
export function runSchedule(jobId) {
  return request({ url: '/dq/schedule/run', method: 'post', data: { jobId } });
}
export function deleteSchedule(jobId) {
  return request({ url: `/dq/schedule/${jobId}`, method: 'delete' });
}
export function getOptionalRules() {
  return request({ url: '/dq/schedule/rules', method: 'get' });
}
export function validateCron(expr) {
  return request({ url: '/dq/schedule/cron-validate', method: 'get', params: { cron: expr } });
}
export function getAlertGroupOptions() {
  return request({ url: '/dq/schedule/alert-groups', method: 'get' });
}
