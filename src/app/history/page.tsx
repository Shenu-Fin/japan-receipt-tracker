'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Receipt, CATEGORIES, REGIONS } from '@/lib/types'

export default function HistoryPage() {
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [loading, setLoading] = useState(true)
  const [filterCat, setFilterCat] = useState('')
  const [filterRegion, setFilterRegion] = useState('')
  const [editing, setEditing] = useState<Receipt | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/notion').then(r => r.json()).then(data => {
      setReceipts(Array.isArray(data) ? data : [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const filtered = receipts.filter(r =>
    (!filterCat || r.category === filterCat) &&
    (!filterRegion || r.region === filterRegion)
  )

  async function handleDelete(id: string) {
    if (!confirm('確定要刪除這筆記錄？')) return
    await fetch('/api/notion/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'delete' })
    })
    setReceipts(r => r.filter(x => x.id !== id))
  }

  async function handleSave() {
    if (!editing?.id) return
    setSaving(true)
    await fetch('/api/notion/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editing.id, data: editing })
    })
    setReceipts(r => r.map(x => x.id === editing.id ? editing : x))
    setEditing(null)
    setSaving(false)
  }

  const catColors: Record<string, string> = {
    '餐飲': 'bg-orange-100 text-orange-700',
    '交通': 'bg-blue-100 text-blue-700',
    '購物': 'bg-pink-100 text-pink-700',
    '門票': 'bg-purple-100 text-purple-700',
    '住宿': 'bg-green-100 text-green-700',
    '藥品': 'bg-red-100 text-red-700',
    '其他': 'bg-gray-100 text-gray-600'
  }

  return (
    <div className="pb-24 px-4 pt-6">
      <div className="flex items-center gap-3 mb-4">
        <Link href="/" className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-sm">←</Link>
        <h1 className="text-xl font-bold">歷史記錄</h1>
        <span className="ml-auto text-sm text-gray-400">{filtered.length} 筆</span>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        <button onClick={() => setFilterCat('')} className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${!filterCat ? 'bg-orange-500 text-white' : 'bg-white text-gray-600'}`}>全部</button>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setFilterCat(c === filterCat ? '' : c)} className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${filterCat === c ? 'bg-orange-500 text-white' : 'bg-white text-gray-600'}`}>{c}</button>
        ))}
      </div>
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        <button onClick={() => setFilterRegion('')} className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${!filterRegion ? 'bg-gray-700 text-white' : 'bg-white text-gray-600'}`}>所有地區</button>
        {REGIONS.map(r => (
          <button key={r} onClick={() => setFilterRegion(r === filterRegion ? '' : r)} className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${filterRegion === r ? 'bg-gray-700 text-white' : 'bg-white text-gray-600'}`}>{r}</button>
        ))}
      </div>

      {loading ? (
        <div className="card text-center py-8 text-gray-400">載入中...</div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-8 text-gray-400">沒有符合的記錄</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((r, i) => (
            <div key={r.id || i} className="card">
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-medium truncate">{r.storeName || r.items}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${catColors[r.category] || 'bg-gray-100 text-gray-600'}`}>{r.category}</span>
                  </div>
                  <p className="text-xs text-gray-400">{r.date} · {r.region} · {r.user}</p>
                  {r.items && r.storeName && <p className="text-xs text-gray-400 mt-0.5 truncate">{r.items}</p>}
                </div>
                <div className="text-right ml-3 shrink-0">
                  <p className="font-bold text-orange-500">¥{r.amountJPY.toLocaleString()}</p>
                  <p className="text-xs text-gray-400">{r.paymentMethod}</p>
                </div>
              </div>
              <div className="flex gap-2 mt-2">
                <button onClick={() => setEditing({ ...r })} className="text-xs text-blue-500 bg-blue-50 px-3 py-1 rounded-lg">編輯</button>
                <button onClick={() => r.id && handleDelete(r.id)} className="text-xs text-red-500 bg-red-50 px-3 py-1 rounded-lg">刪除</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full max-w-xl mx-auto rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto">
            <h2 className="font-bold text-lg mb-4">編輯記錄</h2>
            <div className="space-y-3">
              <div><p className="text-xs text-gray-400 mb-1">店名</p>
                <input className="input-field" value={editing.storeName} onChange={e => setEditing(x => x ? {...x, storeName: e.target.value} : x)} /></div>
              <div><p className="text-xs text-gray-400 mb-1">商品</p>
                <input className="input-field" value={editing.items} onChange={e => setEditing(x => x ? {...x, items: e.target.value} : x)} /></div>
              <div><p className="text-xs text-gray-400 mb-1">金額（日幣）</p>
                <input className="input-field" type="number" value={editing.amountJPY} onChange={e => setEditing(x => x ? {...x, amountJPY: Number(e.target.value)} : x)} /></div>
              <div><p className="text-xs text-gray-400 mb-1">日期</p>
                <input className="input-field" type="date" value={editing.date} onChange={e => setEditing(x => x ? {...x, date: e.target.value} : x)} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs text-gray-400 mb-1">類別</p>
                  <select className="select-field text-sm" value={editing.category} onChange={e => setEditing(x => x ? {...x, category: e.target.value as any} : x)}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select></div>
                <div><p className="text-xs text-gray-400 mb-1">地區</p>
                  <select className="select-field text-sm" value={editing.region} onChange={e => setEditing(x => x ? {...x, region: e.target.value as any} : x)}>
                    {REGIONS.map(r => <option key={r}>{r}</option>)}
                  </select></div>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setEditing(null)} className="btn-secondary">取消</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary">{saving ? '儲存中...' : '儲存'}</button>
            </div>
          </div>
        </div>
      )}

      <nav className="nav-bar">
        <Link href="/" className="flex flex-col items-center text-gray-400"><span className="text-xl">🏠</span><span className="text-xs mt-0.5">首頁</span></Link>
        <Link href="/scan" className="flex flex-col items-center text-gray-400"><span className="text-xl">📷</span><span className="text-xs mt-0.5">掃描</span></Link>
        <Link href="/history" className="flex flex-col items-center text-orange-500"><span className="text-xl">📋</span><span className="text-xs mt-0.5">記錄</span></Link>
        <Link href="/stats" className="flex flex-col items-center text-gray-400"><span className="text-xl">📊</span><span className="text-xs mt-0.5">統計</span></Link>
      </nav>
    </div>
  )
}
