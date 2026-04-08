'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Receipt } from '@/lib/types'
import { getSettings } from '@/lib/settings'

export default function StatsPage() {
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [loading, setLoading] = useState(true)
  const [filterUser, setFilterUser] = useState('')
  const settings = getSettings()

  useEffect(() => {
    fetch('/api/notion').then(r => r.json()).then(data => {
      setReceipts(Array.isArray(data) ? data : [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const data = filterUser ? receipts.filter(r => r.user === filterUser) : receipts
  const total = data.reduce((s, r) => s + r.amountJPY, 0)
  const totalTWD = Math.round(total * settings.exchangeRate)
  const budget = settings.budget || 300000
  const budgetPct = Math.min(Math.round((total / budget) * 100), 100)

  // By category
  const byCat: Record<string, number> = {}
  data.forEach(r => { byCat[r.category] = (byCat[r.category] || 0) + r.amountJPY })
  const catList = Object.entries(byCat).sort((a, b) => b[1] - a[1])

  // By region
  const byRegion: Record<string, number> = {}
  data.forEach(r => { byRegion[r.region] = (byRegion[r.region] || 0) + r.amountJPY })
  const regionList = Object.entries(byRegion).sort((a, b) => b[1] - a[1])

  // By payment
  const byPay: Record<string, number> = {}
  data.forEach(r => { byPay[r.paymentMethod] = (byPay[r.paymentMethod] || 0) + r.amountJPY })
  const payList = Object.entries(byPay).sort((a, b) => b[1] - a[1])

  // By user
  const byUser: Record<string, number> = {}
  receipts.forEach(r => { byUser[r.user] = (byUser[r.user] || 0) + r.amountJPY })

  // Daily trend (last 10 days)
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

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="card col-span-2">
          <p className="text-sm text-gray-500 mb-1">總花費</p>
          <p className="text-3xl font-bold text-orange-500">¥{total.toLocaleString()}</p>
          <p className="text-sm text-gray-400">≈ NT${totalTWD.toLocaleString()}</p>
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>預算進度</span><span>{budgetPct}% / ¥{budget.toLocaleString()}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div className="h-2 rounded-full transition-all" style={{ width: `${budgetPct}%`, background: budgetPct > 90 ? '#EF4444' : budgetPct > 70 ? '#F97316' : '#10B981' }} />
            </div>
          </div>
        </div>
        <div className="card text-center">
          <p className="text-xs text-gray-400">筆數</p>
          <p className="text-2xl font-bold">{data.length}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-gray-400">平均每筆</p>
          <p className="text-2xl font-bold">¥{data.length ? Math.round(total / data.length).toLocaleString() : 0}</p>
        </div>
      </div>

      {/* Daily trend */}
      {dayList.length > 0 && (
        <div className="card mb-4">
          <p className="font-medium mb-3">每日花費趨勢</p>
          <div className="flex items-end gap-1 h-20">
            {dayList.map(([date, amt]) => (
              <div key={date} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full bg-orange-400 rounded-t" style={{ height: `${Math.round((amt / maxDay) * 64)}px` }} title={`¥${amt.toLocaleString()}`} />
                <span className="text-xs text-gray-400" style={{ fontSize: 9 }}>{date.slice(5)}</span>
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
                  <span className="font-medium">¥{amt.toLocaleString()} ({Math.round((amt / total) * 100)}%)</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="h-2 rounded-full" style={{ width: `${(amt / total) * 100}%`, background: catColors[cat] || '#9CA3AF' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Region breakdown */}
      {regionList.length > 0 && (
        <div className="card mb-4">
          <p className="font-medium mb-3">地區分布</p>
          <div className="space-y-2">
            {regionList.map(([region, amt]) => (
              <div key={region} className="flex justify-between items-center">
                <span className="text-sm">{region}</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-gray-100 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full bg-blue-400" style={{ width: `${(amt / total) * 100}%` }} />
                  </div>
                  <span className="text-sm font-medium w-20 text-right">¥{amt.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment method */}
      {payList.length > 0 && (
        <div className="card mb-4">
          <p className="font-medium mb-3">付款方式</p>
          <div className="flex gap-2 flex-wrap">
            {payList.map(([pay, amt]) => (
              <div key={pay} className="bg-gray-50 rounded-xl px-3 py-2 text-center">
                <p className="text-xs text-gray-400">{pay}</p>
                <p className="font-medium text-sm">¥{amt.toLocaleString()}</p>
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
              <span className="font-medium">¥{amt.toLocaleString()}</span>
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
