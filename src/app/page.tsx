'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Receipt } from '@/lib/types'

const TRIP_START = new Date('2026-06-02')
const TRIP_END   = new Date('2026-06-06')
const TRIP_DAYS  = 5

const CAT_COLOR: Record<string, React.CSSProperties> = {
  '餐飲': {background:'#FFF3E0',color:'#E65100'},
  '交通': {background:'#E0F2F1',color:'#00695C'},
  '住宿': {background:'#E8F5E9',color:'#2E7D32'},
  '購物': {background:'#FCE4EC',color:'#880E4F'},
  '門票': {background:'#EDE7F6',color:'#4527A0'},
  '景點': {background:'#EDE7F6',color:'#4527A0'},
  '藥品': {background:'#FFEBEE',color:'#B71C1C'},
  '其他': {background:'#ECEFF1',color:'#455A64'},
}

const NA = 'white'
const NI = 'rgba(255,255,255,0.6)'

export default function Dashboard() {
  const [receipts, setReceipts]   = useState<Receipt[]>([])
  const [loading, setLoading]     = useState(true)
  const [exchangeRate, setExchangeRate] = useState(0.21)

  useEffect(() => {
    fetch('/api/notion').then(r => r.json()).then(d => {
      setReceipts(Array.isArray(d) ? d : [])
      setLoading(false)
    }).catch(() => setLoading(false))
    fetch('/api/exchange-rate').then(r => r.json()).then(d => setExchangeRate(d.rate || 0.21))
  }, [])

  const today      = new Date().toISOString().split('T')[0]
  const todayTotal = receipts.filter(r => r.date === today).reduce((s, r) => s + r.amountJPY, 0)
  const totalJPY   = receipts.reduce((s, r) => s + r.amountJPY, 0)
  const totalTWD   = Math.round(totalJPY * exchangeRate)

  const now = new Date(); now.setHours(0,0,0,0)
  let tripPct = 0, tripLabel = ''
  if (now < TRIP_START) {
    const d = Math.ceil((TRIP_START.getTime() - now.getTime()) / 86400000)
    tripLabel = `出發倒數 ${d} 天`
  } else if (now > TRIP_END) {
    tripLabel = '旅程已結束'; tripPct = 100
  } else {
    const d = Math.floor((now.getTime() - TRIP_START.getTime()) / 86400000) + 1
    tripPct  = Math.round((d / TRIP_DAYS) * 100)
    tripLabel = `第 ${d} 天 / 共 ${TRIP_DAYS} 天`
  }

  const recent = receipts.slice(0, 5)

  return (
    <div className="pb-24 px-4 pt-6">
      <div className="mb-5">
        <h1 className="text-2xl font-bold" style={{color:'#37474F'}}>日本旅行記帳</h1>
        <p className="text-sm mt-0.5" style={{color:'#80B5B0'}} suppressHydrationWarning>
          {new Date().toLocaleDateString('zh-TW', {month:'long', day:'numeric', weekday:'short'})}
        </p>
      </div>

      {/* Hero 大卡片 */}
      <div className="hero-card mb-4">
        {/* 上半：今日花費 */}
        <p className="text-xs mb-1" style={{color:'rgba(255,255,255,0.7)'}}>今日花費</p>
        <p className="text-4xl font-bold text-white" style={{letterSpacing:'-1px'}}>
          ¥{todayTotal.toLocaleString()}
        </p>
        <p className="text-sm mt-0.5" style={{color:'rgba(255,255,255,0.7)'}}>
          ≈ NT${Math.round(todayTotal * exchangeRate).toLocaleString()}
        </p>

        {/* 分隔線 */}
        <div style={{borderTop:'1px solid rgba(255,255,255,0.25)',margin:'14px 0 12px'}} />

        {/* 下半：旅程累計 + 進度 並排 */}
        <div className="flex justify-between items-end">
          <div>
            <p className="text-xs mb-0.5" style={{color:'rgba(255,255,255,0.7)'}}>旅程累計</p>
            <p className="text-xl font-bold text-white">¥{totalJPY.toLocaleString()}</p>
            <p className="text-xs mt-0.5" style={{color:'rgba(255,255,255,0.7)'}}>
              NT${totalTWD.toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs mb-1" style={{color:'rgba(255,255,255,0.7)'}}>
              旅程進度 {tripPct}%
            </p>
            <div className="w-24 rounded-full h-1.5" style={{background:'rgba(255,255,255,0.25)'}}>
              <div className="h-1.5 rounded-full" style={{width:`${tripPct}%`, background:'white'}} />
            </div>
            <p className="text-xs mt-1" style={{color:'rgba(255,255,255,0.6)'}}>{tripLabel}</p>
          </div>
        </div>
      </div>

      {/* 最近記錄 */}
      <div className="flex justify-between items-center mb-2.5">
        <p className="section-title" style={{margin:0}}>最近記錄</p>
        <Link href="/history" className="text-xs font-medium" style={{color:'#26A69A'}}>查看全部 →</Link>
      </div>

      {loading ? (
        <div className="card text-center py-8" style={{color:'#80B5B0'}}>載入中...</div>
      ) : recent.length === 0 ? (
        <div className="card text-center py-8" style={{color:'#80B5B0'}}>
          <p className="text-2xl mb-2">🧾</p>
          <p>還沒有記錄，掃描第一張收據吧！</p>
        </div>
      ) : (
        <div className="space-y-2">
          {recent.map((r, i) => (
            <div key={r.id||i} className="card flex justify-between items-center">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate" style={{color:'#37474F'}}>
                  {r.items || r.storeName}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-xs" style={{color:'#80B5B0'}}>{r.date}</span>
                  <span className="tag" style={CAT_COLOR[r.category] || CAT_COLOR['其他']}>
                    {r.category}
                  </span>
                </div>
              </div>
              <div className="text-right ml-3">
                <p className="font-bold text-sm" style={{color:'#37474F'}}>
                  ¥{r.amountJPY.toLocaleString()}
                </p>
                <p className="text-xs mt-0.5" style={{color:'#00A86B'}}>
                  NT${Math.round(r.amountJPY * exchangeRate).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <nav className="nav-bar">
        <Link href="/" className="flex flex-col items-center gap-0.5" style={{color:NA}}>
          <span className="text-xl">🏠</span><span className="text-xs font-medium">首頁</span>
        </Link>
        <Link href="/history" className="flex flex-col items-center gap-0.5" style={{color:NI}}>
          <span className="text-xl">📋</span><span className="text-xs">記錄</span>
        </Link>
        <Link href="/scan" className="flex flex-col items-center gap-0.5" style={{color:NI}}>
          <span className="text-xl">📷</span><span className="text-xs">記帳</span>
        </Link>
        <Link href="/stats" className="flex flex-col items-center gap-0.5" style={{color:NI}}>
          <span className="text-xl">📊</span><span className="text-xs">統計</span>
        </Link>
        <Link href="/settings" className="flex flex-col items-center gap-0.5" style={{color:NI}}>
          <span className="text-xl">⚙️</span><span className="text-xs">設定</span>
        </Link>
      </nav>
    </div>
  )
}
