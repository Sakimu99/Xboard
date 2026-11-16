# Sakura 主題

Xboard 用戶前台主題，React 19 + Vite + Tailwind CSS v4 + shadcn/ui，日系二次元風格，粉白配色、固定亮色（玻璃擬態、極光光暈、櫻花飄落、點擊星星、滑鼠光斑、立繪與看板娘貼圖），預設簡體中文，另含繁中／英文。

## 開發

```bash
npm install
node scripts/mock-server.mjs   # 可選：沒有後端時用模擬 API（登入密碼 password，優惠碼 VIP10）
npm run dev                    # http://localhost:5173/theme/Sakura/
```

預設代理 `/api` 到 `http://127.0.0.1:7001`，連真實後端時複製 `.env.example` 為 `.env.local` 並修改 `VITE_API_TARGET`。

## 建置與安裝

```bash
npm run pack   # 型別檢查 + 建置 + 打包，產出 build/Sakura-<版本>.zip
```

若網站部署在 `/xboard/` 等子路徑，請以 `VITE_BASE_PATH=/xboard npm run pack` 建置，資源、API 與邀請連結會使用相同前綴。根目錄部署直接執行 `npm run pack`。

後台「主題設定」上傳 zip 後啟用即可。升級時請先調高 `theme.config.json` 的 `version`，否則後台會拒絕覆蓋同名主題。

建置流程會把 `index.html` 轉成 `dashboard.blade.php`，並由 `theme.config.json` 產出 `config.json`；後台可設定的項目：

| 欄位 | 說明 |
| --- | --- |
| `effects` | 動態特效：全部開啟／僅光效／關閉（系統開啟「減少動態效果」時自動關閉） |
| `background_url` | 立繪背景：登入頁右側、控制台右下角。預設 `https://t.alcy.cc/bd`（白底橫圖，角色在右側） |
| `banner_url` | 儀表盤歡迎橫幅，預設 `https://t.alcy.cc/moe`（萌系橫圖） |
| `sticker_url` | 看板娘貼圖：登入卡片、側欄、空狀態。預設 `https://t.alcy.cc/xhl`（白底 Q 版小狐狸） |
| `hero_title` | 登入頁標語 |
| `default_language` | 預設語言（預設簡中） |
| `custom_html` | 頁尾自訂 HTML（客服腳本等） |

圖片欄位留空即關閉該圖片位。白底圖會以 `mix-blend-multiply` 融入粉白背景，所以建議選白底或淺底的圖源；隨機圖 API 每個圖片位會帶不同的 `slot` 參數，避免整頁同一張圖。

站點開了 Cloudflare Rocket Loader 也沒關係：建置時會在 `window.settings` 與入口腳本加上 `data-cfasync="false"`，讓 Rocket Loader 跳過。

## 目錄

```
src/
  api/          API 用戶端、型別、react-query hooks
  components/   ui/ 為 shadcn 元件；layout/ 為側欄與登入頁佈局
  i18n/         語系檔（zh-CN 為基準，型別檢查會提示缺漏鍵值）
  lib/          格式化、圖片位、特效、登入狀態等工具
  pages/        各頁面
```

## 頁面

登入、註冊（郵箱驗證碼、邀請碼、郵箱後綴白名單、reCAPTCHA v2/v3、Turnstile、服務條款）、忘記密碼、郵件連結登入、儀表盤、使用文檔（Markdown、搜尋）、購買訂閱與結帳（週期、優惠碼）、節點狀態、我的訂單與付款（掃碼輪詢、跳轉、取消）、我的邀請（邀請碼、佣金劃轉、提現、發放紀錄）、個人中心、我的工單（新建、對話、關閉）、流量明細（本月柱狀圖）。

## 尚未支援

Telegram 綁定、Stripe 信用卡支付（需 Stripe.js 取 token）、禮品卡、在線裝置管理。
