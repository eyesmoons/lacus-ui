import {defineConfig, loadEnv} from 'vite';
import path from 'path';
import createVitePlugins from './vite/plugins';

// https://vitejs.dev/config/
export default defineConfig(({mode, command}) => {
    const env = loadEnv(mode, process.cwd());
    const {VITE_APP_ENV} = env;
    return {
        // 部署生产环境和开发环境下的URL。
        // 默认情况下，vite 会假设你的应用是被部署在一个域名的根路径上
        // 例如，如果你的应用被部署在 https://www.lacus.com/admin/，则设置 baseUrl 为 /admin/。
        base: VITE_APP_ENV === 'production' ? '/' : '/',
        plugins: createVitePlugins(env, command === 'build'),
        resolve: {
            // https://cn.vitejs.dev/config/#resolve-alias
            alias: {
                // 设置路径别名
                '~': path.resolve(__dirname, './'),
                // 设置路径别名
                '@': path.resolve(__dirname, './src'),
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
    };
});
