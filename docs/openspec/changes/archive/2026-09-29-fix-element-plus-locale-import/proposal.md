# 修复 element-plus 中文语言包导入失败

## 问题描述

Vite 开发服务器启动时报错：

```
[plugin:vite:import-analysis] No known conditions for "./lib/locale/lang/zh-cn" entry in "element-plus" package
```

该错误出现在 `src/main.js` 第 5 行：

```js
import locale from 'element-plus/lib/locale/lang/zh-cn';
```

## 根因分析

element-plus v2.2.20 的 `package.json` `exports` 字段配置如下：

```json
{
  "./lib/*.js": { "require": "./lib/*.js" },
  "./lib/*":   { "require": "./lib/*.js" },
  "./*":       "./*"
}
```

Vite 在解析 `element-plus/lib/locale/lang/zh-cn` 时，按 `exports` 匹配规则查找：
- `./lib/*.js` 只匹配 `lib/` 一级目录下的 `.js` 文件
- `./lib/*` 同样只匹配一级目录
- `./*` 是通配，但 Vite 的 import-analysis 插件在 Node ESM 模式下对无扩展名的深层路径无法正确匹配到 `./lib/*.js` 条件

根本原因是：**导入路径缺少 `.js` 扩展名**，导致 Vite 无法通过 `exports` 映射解析到目标文件。

## 修复目标

将导入路径改为带 `.js` 扩展名的完整路径，使 Vite 能正确通过 `exports` 字段解析。
