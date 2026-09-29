import {defineConfig, loadEnv} from 'vite';
import path from 'path';
import createVitePlugins from './vite/plugins';

// https://vitejs.dev/config/
export default defineConfig(({mode, command}) => {
    const env = loadEnv(mode, process.cwd());
    return {
        // 部署根路径。默认 '/'；部署到子路径（如 https://example.com/admin/）时，
        // 在对应 .env 文件中把 VITE_APP_PUBLIC_PATH 设为 /admin/ 即可。
        // 注意：Monaco 的 worker 目前仍按 window.location.origin 拼绝对路径，
        // 走子路径部署时需要一并改为基于 base 的路径。
        base: env.VITE_APP_PUBLIC_PATH || '/',
        plugins: createVitePlugins(env, command === 'build'),
        resolve: {
            // https://cn.vitejs.dev/config/#resolve-alias
            alias: {
                // 设置路径别名
                '~': path.resolve(__dirname, './'),
                // 设置路径别名
                '@': path.resolve(__dirname, './src'),
                // element-plus exports 字段不暴露 locale 子路径，需要别名绕过
                'element-plus/lib/locale/lang/zh-cn': path.resolve(
                    __dirname,
                    'node_modules/element-plus/lib/locale/lang/zh-cn.js'
                ),
            },
            // https://cn.vitejs.dev/config/#resolve-extensions
            extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue'],
        },
        // vite 相关配置
        server: {
            port: 8080,
            host: '127.0.0.1',
            open: true, // 在服务器启动时自动在浏览器中打开应用程序
            proxy: {
                // https://cn.vitejs.dev/config/#server-proxy
                '/lacus-api': {
                    // 后端地址
                    target: 'http://127.0.0.1:8090',
                    changeOrigin: true,
                    // 将/lacus-api路径去掉
                    rewrite: (p) => p.replace(/^\/lacus-api/, '')
                }
            },
        },
        //  fix:error:stdin>:7356:1: warning: "@charset" must be the first rule in the file
        css: {
            postcss: {
                plugins: [
                    {
                        postcssPlugin: 'internal:charset-removal',
                        AtRule: {
                            charset: (atRule) => {
                                if (atRule.name === 'charset') {
                                    atRule.remove();
                                }
                            },
                        },
                    },
                ],
            },
        },
        test: {
            environment: 'jsdom',
            globals: true,
        },
    };
});
