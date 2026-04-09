'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Receipt } from '@/lib/types'

export default function StatsPage() {
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [loading, setLoading] = useState(true)
  const [filterUser, setFilterUser] = useState('')
  const [exchangeRate, setExchangeRate] = useState(0.21)

  useEffect(() => {
    fetch('/api/notion').then(r => r.json()).then(data => {
      setReceipts(Array.isArray(data) ? data : [])
      setLoading(false)
    }).catch(() => setLoading(false))
    fetch('/api/exchange-rate').then(r => r.json()).then(d => setExchangeRate(d.rate || 0.21))
  }, [])

  const data = filterUser ? receipts.filter(r => r.user === filterUser) : receipts
  const totalJPY = data.reduce((s, r) => s + r.amountJPY, 0)
  const totalTWD = Math.round(totalJPY * exchangeRate)

  const byCat: Record<string, number> = {}
  data.forEach(r => { byCat[r.category] = (byCat[r.category] || 0) + r.amountJPY })
  const catList = Object.entries(byCat).sort((a, b) => b[1] - a[1])

  const byRegion: Record<string, number> = {}
  data.forEach(r => { byRegion[r.region] = (byRegion[r.region] || 0) + r.amountJPY })
  const regionList = Object.entries(byRegion).sort((a, b) => b[1] - a[1])

  const byPay: Record<string, number> = {}
  data.forEach(r => { byPay[r.paymentMethod] = (byPay[r.paymentMethod] || 0) + r.amountJPY })
  const payList = Object.entries(byPay).sort((a, b) => b[1] - a[1])

  const byUser: Record<string, number> = {}
  receipts.forEach(r => { byUser[r.user] = (byUser[r.user] || 0) + r.amountJPY })

  const byDay: Record<string, number> = {}
  data.forEach(r => { byDay[r.date] = (byDay[r.date] || 0) + r.amountJPY })
  const dayList = Object.entries(byDay).sort((a, b) => a[0].localeCompare(b[0])).slice(-10)
  const maxDay = Math.max(...dayList.map(d => d[1]), 1)

  const catColors: Record<string, string> = {
    '餐飲': '#F97316', '交通': '#3B82F6', '購物': '#EC4899',
    '門票': '#8B5CF6', '住宿': '#10B981', '藥品': '#EF4444', '其他': '#9CA3AF'
  }

  if (loading) return <div className="p-8 text-center text-gray-400 pt-16">載入中...</div>

  return (
    <div className="pb-24 px-4 pt-6">
      <div className="flex items-center gap-3 mb-4">
        <Link href="/" className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-sm">←</Link>
        <h1 className="text-xl font-bold">統計分析</h1>
      </div>

      {/* User filter */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        <button onClick={() => setFilterUser('')} className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${!filterUser ? 'bg-orange-500 text-white' : 'bg-white text-gray-600'}`}>全員</button>
        {Object.keys(byUser).map(u => (
          <button key={u} onClick={() => setFilterUser(u === filterUser ? '' : u)} className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${filterUser === u ? 'bg-orange-500 text-white' : 'bg-white text-gray-600'}`}>{u}</button>
        ))}
      </div>

      {/* 總花費 — 日幣 + 台幣 都顯示 */}
      <div className="card mb-4">
        <p className="text-sm text-gray-500 mb-1">旅程總花費</p>
        <p className="text-3xl font-bold text-orange-500">¥{totalJPY.toLocaleString()}</p>
        <div className="flex items-center gap-2 mt-2 bg-orange-50 rounded-xl px-4 py-2">
          <span className="text-sm text-orange-600">換算台幣</span>
          <span className="text-2xl font-bold text-orange-600 ml-auto">NT${totalTWD.toLocaleString()}</span>
        </div>
        <p className="text-xs text-gray-400 mt-1">即時匯率 ¥1 ≈ NT${exchangeRate.toFixed(4)}</p>
      </div>

      {/* 統計數字 */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="card text-center">
          <p className="text-xs text-gray-400">筆數</p>
          <p className="text-2xl font-bold">{data.length}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-gray-400">平均每筆</p>
          <p className="text-xl font-bold">¥{data.length ? Math.round(totalJPY / data.length).toLocaleString() : 0}</p>
          <p className="text-xs text-gray-400">NT${data.length ? Math.round(totalTWD / data.length).toLocaleString() : 0}</p>
        </div>
      </div>

      {/* Daily trend */}
      {dayList.length > 0 && (
        <div className="card mb-4">
          <p className="font-medium mb-3">每日花費趨勢</p>
          <div className="flex items-end gap-1 h-20">
            {dayList.map(([date, amt]) => (
              <div key={date} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full bg-orange-400 rounded-t" style={{ height: `${Math.round((amt / maxDay) * 64)}px` }} />
                <span className="text-gray-400" style={{ fontSize: 9 }}>{date.slice(5)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category breakdown */}
      {catList.length > 0 && (
        <div className="card mb-4">
          <p className="font-medium mb-3">類別佔比</p>
          <div className="space-y-2">
            {catList.map(([cat, amt]) => (
              <div key={cat}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{cat}</span>
                  <span className="font-medium">
                    ¥{amt.toLocaleString()} · NT${Math.round(amt * exchangeRate).toLocaleString()} ({Math.round((amt / totalJPY) * 100)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="h-2 rounded-full" style={{ width: `${(amt / totalJPY) * 100}%`, background: catColors[cat] || '#9CA3AF' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Region */}
      {regionList.length > 0 && (
        <div className="card mb-4">
          <p className="font-medium mb-3">地區分布</p>
          <div className="space-y-2">
            {regionList.map(([region, amt]) => (
              <div key={region} className="flex justify-between items-center">
                <span className="text-sm">{region}</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-gray-100 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full bg-blue-400" style={{ width: `${(amt / totalJPY) * 100}%` }} />
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">¥{amt.toLocaleString()}</p>
                    <p className="text-xs text-gray-400">NT${Math.round(amt * exchangeRate).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment */}
      {payList.length > 0 && (
        <div className="card mb-4">
          <p className="font-medium mb-3">付款方式</p>
          <div className="flex gap-2 flex-wrap">
            {payList.map(([pay, amt]) => (
              <div key={pay} className="bg-gray-50 rounded-xl px-3 py-2 text-center">
                <p className="text-xs text-gray-400">{pay}</p>
                <p className="font-medium text-sm">¥{amt.toLocaleString()}</p>
                <p className="text-xs text-gray-400">NT${Math.round(amt * exchangeRate).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Per user */}
      {Object.keys(byUser).length > 1 && (
        <div className="card mb-4">
          <p className="font-medium mb-3">各人花費</p>
          {Object.entries(byUser).sort((a, b) => b[1] - a[1]).map(([user, amt]) => (
            <div key={user} className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
              <span className="text-sm">{user}</span>
              <div className="text-right">
                <p className="font-medium">¥{amt.toLocaleString()}</p>
                <p className="text-xs text-gray-400">NT${Math.round(amt * exchangeRate).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <nav className="nav-bar">
        <Link href="/" className="flex flex-col items-center text-gray-400"><span className="text-xl">🏠</span><span className="text-xs mt-0.5">首頁</span></Link>
        <Link href="/scan" className="flex flex-col items-center text-gray-400"><span className="text-xl">📷</span><span className="text-xs mt-0.5">掃描</span></Link>
        <Link href="/history" className="flex flex-col items-center text-gray-400"><span className="text-xl">📋</span><span className="text-xs mt-0.5">記錄</span></Link>
        <Link href="/stats" className="flex flex-col items-center text-orange-500"><span className="text-xl">📊</span><span className="text-xs mt-0.5">統計</span></Link>
      </nav>
    </div>
  )
}
