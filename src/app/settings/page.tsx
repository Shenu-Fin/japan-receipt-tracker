'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AppSettings, DEFAULT_SETTINGS } from '@/lib/types'
import { getSettings, saveSettings } from '@/lib/settings'

export default function SettingsPage() {
  const [form, setForm] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [saved, setSaved] = useState(false)

  useEffect(() => { setForm(getSettings()) }, [])

  function update(key: keyof AppSettings, val: any) {
    setForm(f => ({ ...f, [key]: val }))
  }

  function updateUser(i: number, val: string) {
    setForm(f => {
      const users = [...(f.users || [])]
      users[i] = val
      return { ...f, users }
    })
  }

  function save() {
    saveSettings(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="pb-28 px-4 pt-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-sm">←</Link>
        <h1 className="text-xl font-bold">設定</h1>
      </div>

      <div className="space-y-4">
        {/* Budget */}
        <div className="card">
          <p className="font-medium mb-3">💰 預算設定</p>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-400 mb-1">總預算（日幣）</p>
              <input className="input-field" type="number" value={form.budget} onChange={e => update('budget', Number(e.target.value))} />
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">預算備註</p>
              <input className="input-field" placeholder="例：現金 + Suica 儲值" value={form.budgetNote} onChange={e => update('budgetNote', e.target.value)} />
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">匯率（¥1 = NT$?）</p>
              <input className="input-field" type="number" step="0.01" value={form.exchangeRate} onChange={e => update('exchangeRate', Number(e.target.value))} />
              <p className="text-xs text-gray-400 mt-1">¥1,000 ≈ NT${Math.round(1000 * form.exchangeRate)}</p>
            </div>
          </div>
        </div>

        {/* Trip */}
        <div className="card">
          <p className="font-medium mb-3">🗓 行程設定</p>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-400 mb-1">旅行天數</p>
              <input className="input-field" type="number" value={form.tripDays} onChange={e => update('tripDays', Number(e.target.value))} />
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">行程表（自動判斷地區）</p>
              <textarea
                className="input-field"
                rows={6}
                placeholder={'東京 3/15-3/18\n大阪 3/19-3/22\n京都 3/23-3/25'}
                value={form.tripSchedule}
                onChange={e => update('tripSchedule', e.target.value)}
              />
              <p className="text-xs text-gray-400 mt-1">格式：地區名稱 月/日-月/日（一行一個）</p>
            </div>
          </div>
        </div>

        {/* Users */}
        <div className="card">
          <p className="font-medium mb-3">👥 旅伴名稱</p>
          <div className="space-y-2">
            {(form.users || ['旅伴1', '旅伴2', '旅伴3']).map((u, i) => (
              <div key={i}>
                <p className="text-xs text-gray-400 mb-1">旅伴 {i + 1}</p>
                <input className="input-field" value={u} onChange={e => updateUser(i, e.target.value)} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-xl p-4 bg-white border-t border-gray-100">
        <button onClick={save} className="btn-primary">
          {saved ? '✅ 已儲存！' : '儲存設定'}
        </button>
      </div>
    </div>
  )
}
