'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Receipt } from '@/lib/types'
import { getSettings } from '@/lib/settings'

const TRIP_START = new Date('2026-06-02')
const TRIP_END = new Date('2026-06-06')
const TRIP_DAYS = 5

export default function Dashboard() {
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [loading, setLoading] = useState(true)
  const [exchangeRate, setExchangeRate] = useState(0.21)
  const settings = typeof window !== 'undefined' ? getSettings() : null

  useEffect(() => {
    fetch('/api/notion').then(r => r.json()).then(data => {
      setReceipts(Array.isArray(data) ? data : [])
      setLoading(false)
    }).catch(() => setLoading(false))
    fetch('/api/exchange-rate').then(r => r.json()).then(d => setExchangeRate(d.rate || 0.21))
  }, [])

  const today = new Date().toISOString().split('T')[0]
  const todayTotal = receipts.filter(r => r.date === today).reduce((s, r) => s + r.amountJPY, 0)
  const totalJPY = receipts.reduce((s, r) => s + r.amountJPY, 0)
  const totalTWD = Math.round(totalJPY * exchangeRate)

  // 旅程日期進度
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  let tripDay = 0
  let tripPct = 0
  let tripLabel = ''
  if (now < TRIP_START) {
    const daysLeft = Math.ceil((TRIP_START.getTime() - now.getTime()) / 86400000)
    tripLabel = `出發倒數 ${daysLeft} 天`
    tripPct = 0
  } else if (now > TRIP_END) {
    tripLabel = '旅程已結束'
    tripPct = 100
    tripDay = TRIP_DAYS
  } else {
    tripDay = Math.floor((now.getTime() - TRIP_START.getTime()) / 86400000) + 1
    tripPct = Math.round((tripDay / TRIP_DAYS) * 100)
    tripLabel = `第 ${tripDay} 天 / 共 ${TRIP_DAYS} 天`
  }

  const recentReceipts = receipts.slice(0, 5)

  return (
    <div className="pb-24 px-4 pt-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">日本旅行記帳</h1>
          <p className="text-gray-500 text-sm mt-0.5" suppressHydrationWarning>{new Date().toLocaleDateString('zh-TW', { month: 'long', day: 'numeric', weekday: 'short' })}</p>
        </div>
        <Link href="/settings" className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-xl">⚙️</Link>
      </div>

      {/* 今日花費 */}
      <div className="card mb-3">
        <p className="text-sm text-gray-500 mb-1">今日花費</p>
        <p className="text-3xl font-bold text-orange-500">¥{todayTotal.toLocaleString()}</p>
        <p className="text-sm text-gray-400 mt-0.5">≈ NT${Math.round(todayTotal * exchangeRate).toLocaleString()}</p>
      </div>

      {/* 統計卡片 */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="card">
          <p className="text-xs text-gray-500 mb-1">旅程累計</p>
          <p className="text-xl font-bold">¥{totalJPY.toLocaleString()}</p>
          <p className="text-xs text-gray-400">≈ NT${totalTWD.toLocaleString()}</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500 mb-1">旅程進度</p>
          <p className="text-xl font-bold">{tripPct}%</p>
          <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
            <div className="bg-orange-400 h-1.5 rounded-full transition-all" style={{ width: `${tripPct}%` }} />
          </div>
          <p className="text-xs text-gray-400 mt-1">{tripLabel}</p>
        </div>
      </div>

      {/* 快捷入口 */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Link href="/scan" className="card flex flex-col items-center py-5 active:scale-95 transition-transform">
          <span className="text-3xl mb-2">📷</span>
          <span className="font-medium">掃描收據</span>
          <span className="text-xs text-gray-400 mt-0.5">AI 自動辨識</span>
        </Link>
        <Link href="/add" className="card flex flex-col items-center py-5 active:scale-95 transition-transform">
          <span className="text-3xl mb-2">✏️</span>
          <span className="font-medium">手動輸入</span>
          <span className="text-xs text-gray-400 mt-0.5">沒有收據時</span>
        </Link>
      </div>

      {/* 最近記錄 */}
      <div className="flex justify-between items-center mb-3">
        <h2 className="font-semibold">最近記錄</h2>
        <Link href="/history" className="text-orange-500 text-sm">查看全部</Link>
      </div>

      {loading ? (
        <div className="card text-center text-gray-400 py-8">載入中...</div>
      ) : recentReceipts.length === 0 ? (
        <div className="card text-center text-gray-400 py-8">
          <p className="text-2xl mb-2">🧾</p>
          <p>還沒有記錄，掃描第一張收據吧！</p>
        </div>
      ) : (
        <div className="space-y-2">
          {recentReceipts.map((r, i) => (
            <div key={r.id || i} className="card flex justify-between items-center">
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{r.storeName || r.items}</p>
                <p className="text-xs text-gray-400">{r.date} · {r.category} · {r.user}</p>
              </div>
              <div className="text-right ml-3">
                <p className="font-bold text-orange-500">¥{r.amountJPY.toLocaleString()}</p>
                <p className="text-xs text-gray-400">{r.region}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <nav className="nav-bar">
        <Link href="/" className="flex flex-col items-center text-orange-500">
          <span className="text-xl">🏠</span><span className="text-xs mt-0.5">首頁</span>
        </Link>
        <Link href="/scan" className="flex flex-col items-center text-gray-400">
          <span className="text-xl">📷</span><span className="text-xs mt-0.5">掃描</span>
        </Link>
        <Link href="/history" className="flex flex-col items-center text-gray-400">
          <span className="text-xl">📋</span><span className="text-xs mt-0.5">記錄</span>
        </Link>
        <Link href="/stats" className="flex flex-col items-center text-gray-400">
          <span className="text-xl">📊</span><span className="text-xs mt-0.5">統計</span>
        </Link>
      </nav>
    </div>
  )
}
