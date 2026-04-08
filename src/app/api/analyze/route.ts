import { NextRequest, NextResponse } from 'next/server'
import { analyzeReceipt } from '@/lib/gemini'

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'GEMINI_API_KEY 未設定' }, { status: 500 })
    if (!apiKey.startsWith('AIza')) return NextResponse.json({ error: `GEMINI_API_KEY 格式錯誤，開頭是: ${apiKey.substring(0, 6)}` }, { status: 500 })

    const { base64, mimeType } = await req.json()
    if (!base64 || !mimeType) return NextResponse.json({ error: '缺少圖片資料' }, { status: 400 })
    const result = await analyzeReceipt(base64, mimeType)
    return NextResponse.json(result)
  } catch (e: any) {
    console.error('Analyze error:', e)
    return NextResponse.json({ error: e.message, detail: e.toString() }, { status: 500 })
  }
}
