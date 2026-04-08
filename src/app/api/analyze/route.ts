import { NextRequest, NextResponse } from 'next/server'
import { analyzeReceipt } from '@/lib/gemini'

export async function POST(req: NextRequest) {
  try {
    const { base64, mimeType } = await req.json()
    if (!base64 || !mimeType) return NextResponse.json({ error: '缺少圖片資料' }, { status: 400 })
    const result = await analyzeReceipt(base64, mimeType)
    return NextResponse.json(result)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
