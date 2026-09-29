import request from '@/utils/request';

// 查询某对象的全部业务属性(bizType: DATASOURCE/DB/TABLE/COLUMN)
export function getBizMeta(bizType, bizId) {
    return request({
        url: `/metadata/bizmeta/${bizType}/${bizId}`,
        method: 'get',
    });
}

// 批量保存业务属性(存在则更新,值为空串则删除该条)
export function saveBizMetaBatch(data) {
    return request({
        url: '/metadata/bizmeta/batch',
        method: 'post',
        data,
    });
}
