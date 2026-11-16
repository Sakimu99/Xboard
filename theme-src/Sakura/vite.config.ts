import { readFileSync, renameSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const themeConfig = JSON.parse(readFileSync(new URL('./theme.config.json', import.meta.url), 'utf8'))
const THEME_NAME: string = themeConfig.name

// 建置時把 index.html 轉成 Xboard 需要的 dashboard.blade.php，並輸出 config.json
const BLADE_HEAD = `<title>{{ $title }}</title>
    <meta name="description" content="{{ $description }}" />
    @php
      $tc = $theme_config ?? [];
      $xbSettings = [
        'title' => $title,
        'description' => $description,
        'logo' => $logo,
        'version' => $version,
        'default_language' => $tc['default_language'] ?? 'zh-CN',
        'background_url' => $tc['background_url'] ?? '',
        'banner_url' => $tc['banner_url'] ?? '',
        'sticker_url' => $tc['sticker_url'] ?? '',
        'effects' => $tc['effects'] ?? 'full',
        'hero_title' => $tc['hero_title'] ?? '',
      ];
    @endphp
    <script data-cfasync="false">window.settings = @json($xbSettings);</script>`
const BLADE_FOOTER = `{!! $theme_config['custom_html'] ?? '' !!}`

function xboardTheme(env: Record<string, string>): Plugin {
  let isBuild = false

  const devSettings = {
    title: env.VITE_TITLE || 'Meow',
    description: 'Meow !',
    logo: '',
    version: 'dev',
    default_language: 'zh-CN',
    background_url: env.VITE_BACKGROUND_URL ?? 'https://t.alcy.cc/bd',
    banner_url: 'https://t.alcy.cc/moe',
    sticker_url: 'https://t.alcy.cc/xhl',
    effects: 'full',
    hero_title: '',
  }

  function transformHtml(html: string) {
    // Cloudflare Rocket Loader 會改寫 script，導致 window.settings 與模組載入順序錯亂
    html = html.replace(/<script type="module"/g, '<script data-cfasync="false" type="module"')
    if (isBuild) {
      return html.replace('<!--XBOARD_HEAD-->', BLADE_HEAD).replace('<!--XBOARD_FOOTER-->', BLADE_FOOTER)
    }
    return html
      .replace('<!--XBOARD_HEAD-->', `<title>${devSettings.title}</title><script>window.settings = ${JSON.stringify(devSettings)};</script>`)
      .replace('<!--XBOARD_FOOTER-->', '')
  }

  return {
    name: 'xboard-theme',
    configResolved(c) {
      isBuild = c.command === 'build'
    },
    // post：在 Vite 注入資源標籤之後執行，才能替入口 script 加上 data-cfasync
    transformIndexHtml: { order: 'post', handler: transformHtml },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'config.json', source: JSON.stringify(themeConfig, null, 2) })
    },
    writeBundle(options) {
      if (options.dir) renameSync(join(options.dir, 'index.html'), join(options.dir, 'dashboard.blade.php'))
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  const basePath = (env.VITE_BASE_PATH || '').replace(/^\/+|\/+$/g, '')
  return {
    base: `${basePath ? `/${basePath}` : ''}/theme/${THEME_NAME}/`,
    plugins: [react(), tailwindcss(), xboardTheme(env)],
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
    server: {
      proxy: { '/api': { target: env.VITE_API_TARGET || 'http://127.0.0.1:7001', changeOrigin: true } },
    },
    build: {
      outDir: `build/${THEME_NAME}`,
      emptyOutDir: true,
      chunkSizeWarningLimit: 800,
    },
  }
})
