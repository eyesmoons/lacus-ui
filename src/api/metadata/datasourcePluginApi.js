import request from '@/utils/request';

export function pageList(query) {
    return request({
        url: `/metadata/datasource/plugin/pageList`,
        method: 'get',
        params: query
    });
}

export function list(name, type) {
    return request({
        url: `/metadata/datasource/plugin/list`,
        method: 'get',
        params: {
            "name": name,
            "type": type
        }
    });
}

export function getByName(name) {
    return request({
        url: `/metadata/datasource/plugin/${name}`,
        method: 'get'
    });
}
