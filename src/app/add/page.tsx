'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Receipt, CATEGORIES, PAYMENT_METHODS, REGIONS } from '@/lib/types'
import { getSettings } from '@/lib/settings'

const blank = (): Partial<Receipt> => {
  const s = getSettings()
  return {
    storeName: '', storeNameJa: '', items: '', itemsJa: '',
    amountJPY: 0, amountTWD: 0, taxType: '内税',
    category: '餐飲', paymentMethod: '現金', region: '東京',
    date: new Date().toISOString().split('T')[0],
    user: s.users?.[0] || '旅伴1', note: ''
  }
}

export default function AddPage() {
  const router = useRouter()
  const [form, setForm] = useState<Partial<Receipt>>(blank())
  const [saving, setSaving] = useState(false)
  const settings = getSettings()

  function update(key: keyof Receipt, val: any) {
    setForm(f => {
      const next = { ...f, [key]: val }
      if (key === 'amountJPY') next.amountTWD = Math.round(Number(val) * settings.exchangeRate)
      return next
    })
  }

  async function save() {
    if (!form.storeName && !form.items) return alert('請填入店名或商品名稱')
    if (!form.amountJPY) return alert('請填入金額')
    setSaving(true)
    try {
      const res = await fetch('/api/notion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      if (!res.ok) throw new Error('儲存失敗')
      router.push('/')
    } catch (e: any) {
      alert(e.message)
      setSaving(false)
    }
  }

  return (
    <div className="pb-28 px-4 pt-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-sm">←</Link>
        <h1 className="text-xl font-bold">手動新增</h1>
      </div>

      <div className="space-y-3">
        <div className="card">
          <p className="text-xs text-gray-400 mb-1">店名</p>
          <input className="input-field" placeholder="例：全家便利商店" value={form.storeName || ''} onChange={e => update('storeName', e.target.value)} />
        </div>

        <div className="card">
          <p className="text-xs text-gray-400 mb-1">商品</p>
          <input className="input-field" placeholder="例：飯糰, 綠茶" value={form.items || ''} onChange={e => update('items', e.target.value)} />
        </div>

        <div className="card">
          <p className="text-xs text-gray-400 mb-1">金額（日幣）</p>
          <div className="flex items-center gap-2">
            <span className="text-gray-400">¥</span>
            <input className="input-field" type="number" placeholder="0" value={form.amountJPY || ''} onChange={e => update('amountJPY', Number(e.target.value))} />
          </div>
          {(form.amountJPY ?? 0) > 0 && (
            <p className="text-xs text-gray-400 mt-1">≈ NT${(form.amountTWD || 0).toLocaleString()}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="card">
            <p className="text-xs text-gray-400 mb-1">日期</p>
            <input className="input-field text-sm" type="date" value={form.date || ''} onChange={e => update('date', e.target.value)} />
          </div>
          <div className="card">
            <p className="text-xs text-gray-400 mb-1">地區</p>
            <select className="select-field text-sm" value={form.region || ''} onChange={e => update('region', e.target.value as any)}>
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

        <div className="card">
          <p className="text-xs text-gray-400 mb-1">備註（選填）</p>
          <input className="input-field" placeholder="稅制、折扣等" value={form.note || ''} onChange={e => update('note', e.target.value)} />
        </div>
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-xl p-4 bg-white border-t border-gray-100">
        <button onClick={save} disabled={saving} className="btn-primary">
          {saving ? '儲存中...' : '✅ 儲存到 Notion'}
        </button>
      </div>
    </div>
  )
}
