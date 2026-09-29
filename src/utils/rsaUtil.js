import JSEncrypt from 'jsencrypt/bin/jsencrypt.min';

// 仅保留公钥：前端只需加密，解密由后端持有私钥完成。
// 切勿在此处加入私钥——前端包对所有人可见，私钥一旦随包发布即等同公开，
// 且会使"记住密码"等客户端存储内容可被任意还原。

const publicKey =
    'MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCh6HkK+rCM37FAzCHVythTc6pxvr551K07CRhdX/NjCddHAuQMOd/57R5fiIwgVNEfCsD1cIyS6A8IWj4DtJLR2t29JehPpqiFSJ4hNtDcLNxNJiYRcCQvyMQeyQIPE5Ljc35c72YwDtQAsIJChsauyLrc+E6HC3gn1JDm18HNXwIDAQAB';

// 加密
export function encrypt(txt) {
    const encryptor = new JSEncrypt();
    encryptor.setPublicKey(publicKey); // 设置公钥
    return encryptor.encrypt(txt); // 对数据进行加密
}
