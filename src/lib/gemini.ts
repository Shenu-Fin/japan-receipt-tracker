import { GoogleGenerativeAI } from '@google/generative-ai'

const MODELS = ['gemini-2.0-flash', 'gemini-2.0-flash-001', 'gemini-2.5-flash']

const PROMPT = `你是一個專業的日本收據辨識助手。請分析這張收據圖片，回傳以下 JSON 格式（只回傳 JSON，不要其他文字）：

{
  "shortTitle": "簡短支出項目（繁體中文，5字以內，例如：便利商店、拉麵午餐、地鐵票、藥妝店）",
  "storeName": "店名（繁體中文翻譯）",
  "storeNameJa": "店名（日文原文）",
  "items": "主要商品（繁體中文，用逗號分隔，最多5項）",
  "itemsJa": "主要商品（日文原文，用逗號分隔）",
  "amountJPY": 金額數字（日幣，整數，不含符號）,
  "taxType": "税制（内税/外税/免税/不明）",
  "category": "類別（餐飲/交通/購物/門票/住宿/藥品/景點/其他）",
  "paymentMethod": "付款方式（現金/信用卡/Suica/PayPay/其他）",
  "date": "日期（YYYY-MM-DD格式，若看不到則用今天日期）",
  "region": "地區（根據收據上的地址、店名判斷：東京/大阪/京都/名古屋/北海道/福岡/其他）",
  "note": "備注（稅制說明、折扣資訊等，沒有則空字串）"
}

注意：
- shortTitle 要簡短有意義，代表這筆消費的核心（例：全家便利商店→便利商店，地鐵車票→地鐵票，一蘭拉麵→一蘭拉麵）
- 金額請辨識合計金額（合計/小計/お会計 等）
- 如果有消費稅，請辨識是内税（含稅）還是外税（未含稅）
- 店名盡量翻譯成繁體中文，保留日文原文
- 類別根據店家性質判斷（便利商店/超市=餐飲，電車/巴士=交通，藥妝店=藥品，百貨/服飾=購物，神社/博物館=景點）
- 地區根據收據上的地址判斷，例如「大阪府」=大阪，「東京都」=東京`

export async function analyzeReceipt(base64Image: string, mimeType: string) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

  for (const modelName of MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName })
      const result = await model.generateContent([
        PROMPT,
        { inlineData: { data: base64Image, mimeType } }
      ])
      const text = result.response.text().replace(/```json\n?|```/g, '').trim()
      const data = JSON.parse(text)
      // 把 shortTitle 放到 items 位置給前端使用
      if (data.shortTitle) {
        data.displayTitle = data.shortTitle
      }
      return data
    } catch (e) {
      console.error(`Model ${modelName} failed:`, e)
      continue
    }
  }
  throw new Error('所有 Gemini 模型都失敗了')
}
