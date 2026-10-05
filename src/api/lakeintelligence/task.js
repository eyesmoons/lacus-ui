import request from '@/utils/request';

// ==================== 任务管理 ====================

// 任务列表（分页）
export function listTasks(query) {
    return request({
        url: '/lake-intelligence/tasks',
        method: 'get',
        params: query,
    });
}

// 获取任务详情
export function getTaskDetail(id) {
    return request({
        url: `/lake-intelligence/tasks/${id}`,
        method: 'get',
    });
}

// 查询任务进度
export function getTaskProgress(id) {
    return request({
        url: `/lake-intelligence/tasks/${id}/progress`,
        method: 'get',
    });
}
