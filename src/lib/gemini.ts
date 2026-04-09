import { GoogleGenerativeAI } from '@google/generative-ai'

const MODELS = ['gemini-1.5-flash']

const PROMPT = `你是一個專業的日本收據辨識助手。請分析這張收據圖片，回傳以下 JSON 格式（只回傳 JSON，不要其他文字）：

{
  "storeName": "店名（繁體中文翻譯）",
  "storeNameJa": "店名（日文原文）",
  "items": "主要商品（繁體中文，用逗號分隔，最多5項）",
  "itemsJa": "主要商品（日文原文，用逗號分隔）",
  "amountJPY": 金額數字（日幣，整數，不含符號）,
  "taxType": "税制（内税/外税/免税/不明）",
  "category": "類別（餐飲/交通/購物/門票/住宿/藥品/其他）",
  "paymentMethod": "付款方式（現金/信用卡/Suica/PayPay/其他）",
  "date": "日期（YYYY-MM-DD格式，若看不到則用今天日期）",
  "note": "備注（稅制說明、折扣資訊等，沒有則空字串）"
}

注意：
- 金額請辨識合計金額（合計/小計/お会計 等）
- 如果有消費稅，請辨識是内税（含稅）還是外税（未含稅）
- 店名盡量翻譯成繁體中文，保留日文原文
- 類別根據店家性質判斷`

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
      return data
    } catch (e) {
      console.error(`Model ${modelName} failed:`, e)
      continue
    }
  }
  throw new Error('所有 Gemini 模型都失敗了')
}
