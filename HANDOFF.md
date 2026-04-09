# Japan Receipt Tracker — 交接文件

## 專案現況
網站已部署到 Vercel，但 Gemini AI 掃描功能還沒修好。

---

## 網站網址
https://japan-receipt-tracker-seven.vercel.app

## GitHub Repo
https://github.com/Shenu-Fin/japan-receipt-tracker

## 本機路徑
C:\Users\doris\OneDrive\Desktop\japan-receipt-tracker

---

## 目前唯一剩下的問題

### 問題：模型名稱錯誤
`src/lib/gemini.ts` 裡的模型名稱用了 `gemini-1.5-flash`，但這個帳號不支援這個模型。

### 解決方法：
1. 開啟 PowerShell，執行：
```
cd OneDrive\Desktop\japan-receipt-tracker
notepad src\lib\gemini.ts
```

2. 找到這行：
```
const MODELS = ['gemini-1.5-flash']
```

3. 改成：
```
const MODELS = ['gemini-2.0-flash', 'gemini-2.0-flash-001', 'gemini-2.5-flash']
```

4. 存檔後執行：
```
git add .
git commit -m "fix model names"
npx vercel --prod
```

---

## 這個帳號支援的模型（已確認）
- gemini-2.0-flash ✅
- gemini-2.0-flash-001 ✅
- gemini-2.5-flash ✅
- gemini-1.5-flash ❌ 不支援
- gemini-1.5-pro ❌ 不支援

---

## Vercel 環境變數（已設定）
- GEMINI_API_KEY — v2 Japan Receipt Tracker 專案的 Free tier Key
- NOTION_TOKEN — ntn_596...
- NOTION_DATABASE_ID — 33cde197...

---

## Notion 資料庫
- 名稱：Japan Receipt Tracker
- 欄位：項目、商店名稱、商店日文、商品日文、日期、金額(JPY)、類別、支付方式、地區、用戶、稅制、備註
- Integration 已連接 ✅

---

## 專案結構
```
src/
├── app/
│   ├── page.tsx          # Dashboard 首頁
│   ├── scan/page.tsx     # 拍照掃描
│   ├── scan/confirm/     # 確認 AI 結果
│   ├── add/page.tsx      # 手動輸入
│   ├── history/page.tsx  # 歷史記錄
│   ├── stats/page.tsx    # 統計分析
│   ├── settings/page.tsx # 設定
│   └── api/
│       ├── analyze/      # Gemini AI 辨識
│       ├── notion/       # Notion CRUD
│       └── notion/update/# 更新刪除
└── lib/
    ├── gemini.ts         # ← 需要修改這個檔案
    ├── notion.ts
    ├── settings.ts
    └── types.ts
```

---

## 已完成的事項
- ✅ 專案程式碼完整建立
- ✅ 部署到 Vercel（免費）
- ✅ Notion 資料庫建立並連接
- ✅ 環境變數設定
- ✅ PWA 支援（可加到手機桌面）
- ✅ Next.js 版本升級（解決 Vercel 安全性檢查）
- ✅ middleware.ts 已刪除（解決 404 問題）
- ✅ Google Cloud 帳單帳號綁定
- ✅ Gemini API 已啟用
- ✅ 新的 Free tier API Key 已建立並更新到 Vercel

## 待完成
- ❌ 修改 gemini.ts 模型名稱（見上方解決方法）
- ❌ 測試掃描功能是否正常
- ❌ 加入 Google 登入（只允許 4 個家人帳號）

---

## 常用指令
```bash
# 本機開發
cd OneDrive\Desktop\japan-receipt-tracker
npm run dev

# 部署到 Vercel
npx vercel --prod

# 推上 GitHub
git add .
git commit -m "訊息"
git push
```
