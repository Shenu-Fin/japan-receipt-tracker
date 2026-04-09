'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AppSettings, DEFAULT_SETTINGS } from '@/lib/types'
import { getSettings, saveSettings } from '@/lib/settings'

export default function SettingsPage() {
  const [form, setForm] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [saved, setSaved] = useState(false)
  const [liveRate, setLiveRate] = useState<number | null>(null)

  useEffect(() => {
    setForm(getSettings())
    fetch('/api/exchange-rate').then(r => r.json()).then(d => setLiveRate(d.rate))
  }, [])

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
        <div className="card">
          <p className="font-medium mb-3">💰 預算設定</p>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-400 mb-1">總預算（日幣，填 0 表示不限）</p>
              <input className="input-field" type="number" value={form.budget} onChange={e => update('budget', Number(e.target.value))} />
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">預算備註</p>
              <input className="input-field" placeholder="例：現金 + Suica 儲值" value={form.budgetNote} onChange={e => update('budgetNote', e.target.value)} />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <p className="text-xs text-gray-400">匯率（¥1 = NT$?）</p>
                {liveRate && <span className="text-xs text-green-600">即時匯率：{liveRate.toFixed(4)}</span>}
              </div>
              <input className="input-field" type="number" step="0.0001" value={form.exchangeRate} onChange={e => update('exchangeRate', Number(e.target.value))} />
              <p className="text-xs text-gray-400 mt-1">掃描時自動使用即時匯率，此處為備用</p>
            </div>
          </div>
        </div>

        <div className="card">
          <p className="font-medium mb-3">🗓 行程設定</p>
          <div>
            <p className="text-xs text-gray-400 mb-1">旅行天數</p>
            <input className="input-field" type="number" value={form.tripDays} onChange={e => update('tripDays', Number(e.target.value))} />
          </div>
        </div>

        <div className="card">
          <p className="font-medium mb-3">👥 旅伴名稱（4人）</p>
          <div className="space-y-2">
            {[0, 1, 2, 3].map(i => (
              <div key={i}>
                <p className="text-xs text-gray-400 mb-1">旅伴 {i + 1}</p>
                <input className="input-field" value={(form.users || [])[i] || ''} onChange={e => updateUser(i, e.target.value)} />
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
