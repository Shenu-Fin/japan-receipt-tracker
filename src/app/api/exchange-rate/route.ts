import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const res = await fetch('https://api.exchangerate-api.com/v4/latest/JPY')
    const data = await res.json()
    const twd = data.rates?.TWD
    if (!twd) throw new Error('無法取得匯率')
    return NextResponse.json({ rate: Math.round(twd * 10000) / 10000 })
  } catch {
    return NextResponse.json({ rate: 0.21 })
  }
}
