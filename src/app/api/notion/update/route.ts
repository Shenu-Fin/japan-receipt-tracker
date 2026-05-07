import { NextRequest, NextResponse } from 'next/server'
import { updateReceipt, deleteReceipt } from '@/lib/notion'

export async function POST(req: NextRequest) {
  try {
    const { id, data, action } = await req.json()
    if (action === 'delete') {
      await deleteReceipt(id)
    } else {
      await updateReceipt(id, data)
    }
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json()
    await deleteReceipt(id)
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
