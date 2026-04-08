# 日本收據記帳 — 設定說明

## 快速開始

### 1. 安裝套件
```bash
npm install
```

### 2. 設定 API 金鑰
複製 `.env.local.example` 並改名為 `.env.local`：
```bash
cp .env.local.example .env.local
```
然後開啟 `.env.local` 填入三個金鑰：
```
GEMINI_API_KEY=你的Gemini金鑰
NOTION_TOKEN=你的Notion_Token
NOTION_DATABASE_ID=你的資料庫ID
```

### 3. 建立 Notion 資料庫欄位
在 Notion 資料庫中建立以下欄位（**欄位名稱和類型要完全一致**）：

| 欄位名稱 | 類型 |
|---------|------|
| 項目 | Title |
| 商店名稱 | Rich Text |
| 商店日文 | Rich Text |
| 商品日文 | Rich Text |
| 日期 | Date |
| 金額 (JPY) | Number |
| 類別 | Select（選項：餐飲/交通/購物/門票/住宿/藥品/其他）|
| 支付方式 | Select（選項：現金/信用卡/Suica/PayPay/其他）|
| 地區 | Select（選項：東京/大阪/京都/名古屋/北海道/福岡/其他）|
| 用戶 | Rich Text |
| 稅制 | Rich Text |
| 備註 | Rich Text |

### 4. 本機測試
```bash
npm run dev
```
開啟 http://localhost:3000

### 5. 部署上線
推上 GitHub 後，連接 Vercel（免費）或 Zeabur（$5/月）部署。
記得在部署平台設定同樣的三個環境變數。
