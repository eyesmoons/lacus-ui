# 修复方案

## 方案：Vite resolve alias 绕过 exports 限制

### 问题

element-plus v2.2.20 的 `package.json` `exports` 字段只暴露了 `./lib/*.js`（一级目录）和 `./lib/*`（一级目录），不支持深层嵌套路径如 `./lib/locale/lang/zh-cn`。Vite 的 `resolveExports` 函数无法通过 `exports` 映射解析该路径。

### 修复

在 `vite.config.js` 中添加 resolve alias，将 `element-plus/lib/locale/lang/zh-cn` 直接映射到实际文件路径：

```js
'element-plus/lib/locale/lang/zh-cn': path.resolve(
    __dirname,
    'node_modules/element-plus/lib/locale/lang/zh-cn.js'
),
```

### 理由

1. `exports` 字段是 element-plus 包本身的配置，无法修改
2. Vite alias 在 `exports` 解析之前生效，能正确绕过限制
3. 改动最小，只涉及 `vite.config.js` 一个文件
4. 不影响 `src/main.js` 中的导入语句
