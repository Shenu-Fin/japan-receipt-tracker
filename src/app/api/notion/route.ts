import { NextRequest, NextResponse } from 'next/server'
import { getReceipts, addReceipt } from '@/lib/notion'

export async function GET() {
  try {
    const receipts = await getReceipts()
    return NextResponse.json(receipts)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const receipt = await req.json()
    await addReceipt(receipt)
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
