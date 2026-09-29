import request from '@/utils/request';

export function listChannelTypes() {
    return request({
        url: '/monitor/alert/channelType/list',
        method: 'get',
    });
}

export function listChannelInstances(query) {
    return request({
        url: '/monitor/alert/channelInstance/list',
        method: 'get',
        params: query,
    });
}

export function getChannelInstance(id) {
    return request({
        url: `/monitor/alert/channelInstance/${id}`,
        method: 'get',
    });
}

export function addChannelInstance(data) {
    return request({
        url: '/monitor/alert/channelInstance',
        method: 'post',
        data,
    });
}

export function updateChannelInstance(data) {
    return request({
        url: '/monitor/alert/channelInstance',
        method: 'put',
        data,
    });
}

export function deleteChannelInstance(ids) {
    return request({
        url: `/monitor/alert/channelInstance/${ids}`,
        method: 'delete',
    });
}

export function testChannelInstance(data) {
    return request({
        url: '/monitor/alert/channelInstance/test',
        method: 'post',
        data,
    });
}

export function listChannelInstanceOptions() {
    return request({
        url: '/monitor/alert/channelInstance/options',
        method: 'get',
    });
}

export function listGroups(query) {
    return request({
        url: '/monitor/alert/group/list',
        method: 'get',
        params: query,
    });
}

export function getGroup(id) {
    return request({
        url: `/monitor/alert/group/${id}`,
        method: 'get',
    });
}

export function addGroup(data) {
    return request({
        url: '/monitor/alert/group',
        method: 'post',
        data,
    });
}

export function updateGroup(data) {
    return request({
        url: '/monitor/alert/group',
        method: 'put',
        data,
    });
}

export function deleteGroup(ids) {
    return request({
        url: `/monitor/alert/group/${ids}`,
        method: 'delete',
    });
}

export function listGroupOptions() {
    return request({
        url: '/monitor/alert/group/options',
        method: 'get',
    });
}

export function listRecords(query) {
    return request({
        url: '/monitor/alert/record/list',
        method: 'get',
        params: query,
    });
}

export function getRecord(id) {
    return request({
        url: `/monitor/alert/record/${id}`,
        method: 'get',
    });
}

export function executeAlert(data) {
    return request({
        url: '/monitor/alert/record/execute',
        method: 'post',
        data,
    });
}

export function retryRecord(id) {
    return request({
        url: `/monitor/alert/record/${id}/retry`,
        method: 'post',
    });
}

export function listTaskLogs(taskId) {
    return request({
        url: `/monitor/alert/task/${taskId}/log/list`,
        method: 'get',
    });
}
