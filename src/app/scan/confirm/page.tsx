'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Receipt, CATEGORIES, PAYMENT_METHODS, REGIONS } from '@/lib/types'
import { getSettings, getRegionFromDate } from '@/lib/settings'

export default function ConfirmPage() {
  const router = useRouter()
  const [form, setForm] = useState<Partial<Receipt>>({})
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState(getSettings())

  useEffect(() => {
    const raw = sessionStorage.getItem('scan-result')
    if (!raw) { router.push('/scan'); return }
    const data = JSON.parse(raw)
    const s = getSettings()
    setSettings(s)
    const today = new Date().toISOString().split('T')[0]
    const date = data.date || today
    const region = getRegionFromDate(date, s.tripSchedule)
    setForm({
      ...data,
      date,
      region,
      amountTWD: Math.round((data.amountJPY || 0) * s.exchangeRate),
      user: s.users?.[0] || '旅伴1'
    })
  }, [router])

  function update(key: keyof Receipt, val: any) {
    setForm(f => {
      const next = { ...f, [key]: val }
      if (key === 'amountJPY') next.amountTWD = Math.round(Number(val) * settings.exchangeRate)
      if (key === 'date') next.region = getRegionFromDate(val, settings.tripSchedule) as any
      return next
    })
  }

  async function save() {
    setSaving(true)
    try {
      const res = await fetch('/api/notion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      if (!res.ok) throw new Error('儲存失敗')
      sessionStorage.removeItem('scan-result')
      router.push('/')
    } catch (e: any) {
      alert(e.message)
      setSaving(false)
    }
  }

  if (!form.storeName && !form.items) return <div className="p-8 text-center text-gray-400">載入中...</div>

  return (
    <div className="pb-28 px-4 pt-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/scan" className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-sm">←</Link>
        <h1 className="text-xl font-bold">確認辨識結果</h1>
      </div>

      <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 mb-4 text-sm text-orange-700">
        🤖 AI 已辨識完成，請確認並修正錯誤後儲存
      </div>

      <div className="space-y-3">
        <div className="card">
          <p className="text-xs text-gray-400 mb-1">店名（繁中）</p>
          <input className="input-field" value={form.storeName || ''} onChange={e => update('storeName', e.target.value)} />
          {form.storeNameJa && <p className="text-xs text-gray-400 mt-1">日文：{form.storeNameJa}</p>}
        </div>

        <div className="card">
          <p className="text-xs text-gray-400 mb-1">商品（繁中）</p>
          <input className="input-field" value={form.items || ''} onChange={e => update('items', e.target.value)} />
          {form.itemsJa && <p className="text-xs text-gray-400 mt-1">日文：{form.itemsJa}</p>}
        </div>

        <div className="card">
          <p className="text-xs text-gray-400 mb-1">金額（日幣）</p>
          <div className="flex items-center gap-2">
            <span className="text-gray-400">¥</span>
            <input className="input-field" type="number" value={form.amountJPY || ''} onChange={e => update('amountJPY', Number(e.target.value))} />
          </div>
          <p className="text-xs text-gray-400 mt-1">≈ NT${(form.amountTWD || 0).toLocaleString()}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="card">
            <p className="text-xs text-gray-400 mb-1">日期</p>
            <input className="input-field text-sm" type="date" value={form.date || ''} onChange={e => update('date', e.target.value)} />
          </div>
          <div className="card">
            <p className="text-xs text-gray-400 mb-1">地區</p>
            <select className="select-field text-sm" value={form.region || ''} onChange={e => update('region', e.target.value)}>
              {REGIONS.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="card">
            <p className="text-xs text-gray-400 mb-1">類別</p>
            <select className="select-field text-sm" value={form.category || ''} onChange={e => update('category', e.target.value as any)}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="card">
            <p className="text-xs text-gray-400 mb-1">付款方式</p>
            <select className="select-field text-sm" value={form.paymentMethod || ''} onChange={e => update('paymentMethod', e.target.value as any)}>
              {PAYMENT_METHODS.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
        </div>

        <div className="card">
          <p className="text-xs text-gray-400 mb-1">誰付的</p>
          <select className="select-field" value={form.user || ''} onChange={e => update('user', e.target.value)}>
            {(settings.users || ['旅伴1', '旅伴2', '旅伴3']).map(u => <option key={u}>{u}</option>)}
          </select>
        </div>

        {form.note && (
          <div className="card">
            <p className="text-xs text-gray-400 mb-1">備註（稅制等）</p>
            <p className="text-sm text-gray-600">{form.note}</p>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-xl p-4 bg-white border-t border-gray-100">
        <button onClick={save} disabled={saving} className="btn-primary">
          {saving ? '儲存中...' : '✅ 儲存到 Notion'}
        </button>
      </div>
    </div>
  )
}
