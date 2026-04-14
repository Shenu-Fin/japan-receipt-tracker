'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Receipt } from '@/lib/types'

const TRIP_START = new Date('2026-06-02')
const TRIP_END   = new Date('2026-06-06')
const TRIP_DAYS  = 5

const CAT_COLOR: Record<string, React.CSSProperties> = {
  '餐飲': {background:'#FFF8E8',color:'#B07A00'},
  '交通': {background:'#E8F7F5',color:'#0A7A70'},
  '住宿': {background:'#EDF7E8',color:'#3A7A20'},
  '購物': {background:'#F9E8F5',color:'#8A208A'},
  '門票': {background:'#EAE8F7',color:'#3A20AA'},
  '景點': {background:'#EAE8F7',color:'#3A20AA'},
  '藥品': {background:'#F7E8E8',color:'#AA2020'},
  '其他': {background:'#ECECE8',color:'#6B6B6B'},
}

export default function Dashboard() {
  const [receipts, setReceipts]         = useState<Receipt[]>([])
  const [loading, setLoading]           = useState(true)
  const [exchangeRate, setExchangeRate] = useState(0.21)

  useEffect(() => {
    fetch('/api/notion').then(r=>r.json()).then(d=>{
      setReceipts(Array.isArray(d)?d:[]); setLoading(false)
    }).catch(()=>setLoading(false))
    fetch('/api/exchange-rate').then(r=>r.json()).then(d=>setExchangeRate(d.rate||0.21))
  }, [])

  const today      = new Date().toISOString().split('T')[0]
  const todayTotal = receipts.filter(r=>r.date===today).reduce((s,r)=>s+r.amountJPY,0)
  const totalJPY   = receipts.reduce((s,r)=>s+r.amountJPY,0)
  const totalTWD   = Math.round(totalJPY*exchangeRate)

  const now = new Date(); now.setHours(0,0,0,0)
  let tripPct=0, tripLabel=''
  if (now < TRIP_START) {
    const d = Math.ceil((TRIP_START.getTime()-now.getTime())/86400000)
    tripLabel = `出發倒數 ${d} 天`
  } else if (now > TRIP_END) {
    tripLabel = '旅程已結束'; tripPct = 100
  } else {
    const d = Math.floor((now.getTime()-TRIP_START.getTime())/86400000)+1
    tripPct = Math.round((d/TRIP_DAYS)*100)
    tripLabel = `第 ${d} 天 / 共 ${TRIP_DAYS} 天`
  }

  const recent = receipts.slice(0,5)

  return (
    <div className="pb-24 px-4 pt-6">
      <div className="mb-5">
        <h1 className="text-2xl font-bold" style={{color:'#1A1A1B'}}>日本旅行記帳</h1>
        <p className="text-sm mt-0.5" style={{color:'#ABABAB'}} suppressHydrationWarning>
          {new Date().toLocaleDateString('zh-TW',{month:'long',day:'numeric',weekday:'short'})}
        </p>
      </div>

      {/* Hero 大卡片 — 深炭黑底 */}
      <div className="hero-card mb-4">
        <p className="text-xs mb-1" style={{color:'rgba(255,255,255,0.55)'}}>今日花費</p>
        <p className="text-4xl font-bold text-white" style={{letterSpacing:'-1px'}}>
          ¥{todayTotal.toLocaleString()}
        </p>
        <p className="text-sm mt-0.5" style={{color:'rgba(255,255,255,0.55)'}}>
          ≈ NT${Math.round(todayTotal*exchangeRate).toLocaleString()}
        </p>

        <div style={{borderTop:'1px solid rgba(255,255,255,0.12)',margin:'14px 0 12px'}}/>

        <div className="flex justify-between items-end">
          <div>
            <p className="text-xs mb-0.5" style={{color:'rgba(255,255,255,0.55)'}}>旅程累計</p>
            <p className="text-xl font-bold text-white">¥{totalJPY.toLocaleString()}</p>
            <p className="text-xs mt-0.5" style={{color:'#B2F0EB'}}>
              NT${totalTWD.toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs mb-1.5" style={{color:'rgba(255,255,255,0.55)'}}>
              旅程進度 {tripPct}%
            </p>
            <div className="w-24 rounded-full h-1.5" style={{background:'rgba(255,255,255,0.15)'}}>
              <div className="h-1.5 rounded-full" style={{width:`${tripPct}%`,background:'#D0F567'}}/>
            </div>
            <p className="text-xs mt-1" style={{color:'rgba(255,255,255,0.35)'}}>{tripLabel}</p>
          </div>
        </div>
      </div>

      {/* 最近記錄 */}
      <div className="flex justify-between items-center mb-2.5">
        <p className="section-title" style={{margin:0}}>最近記錄</p>
        <Link href="/history" className="text-xs font-medium" style={{color:'#1A1A1B'}}>查看全部 →</Link>
      </div>

      {loading ? (
        <div className="card text-center py-8" style={{color:'#ABABAB'}}>載入中...</div>
      ) : recent.length===0 ? (
        <div className="card text-center py-8" style={{color:'#ABABAB'}}>
          <p className="text-2xl mb-2">🧾</p>
          <p>還沒有記錄，掃描第一張收據吧！</p>
        </div>
      ) : (
        <div className="space-y-2">
          {recent.map((r,i) => (
            <div key={r.id||i} className="card flex justify-between items-center">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate" style={{color:'#1A1A1B'}}>
                  {r.items||r.storeName}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-xs" style={{color:'#ABABAB'}}>{r.date}</span>
                  <span className="tag" style={CAT_COLOR[r.category]||CAT_COLOR['其他']}>
                    {r.category}
                  </span>
                </div>
              </div>
              <div className="text-right ml-3">
                <p className="font-bold text-sm" style={{color:'#1A1A1B'}}>¥{r.amountJPY.toLocaleString()}</p>
                <p className="text-xs mt-0.5" style={{color:'#0A7A70'}}>
                  NT${Math.round(r.amountJPY*exchangeRate).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <nav className="nav-bar">
        <Link href="/" className="flex flex-col items-center gap-0.5" style={{color:'#D0F567'}}>
          <span className="text-xl">🏠</span><span className="text-xs font-medium">首頁</span>
        </Link>
        <Link href="/history" className="flex flex-col items-center gap-0.5" style={{color:'rgba(255,255,255,0.45)'}}>
          <span className="text-xl">📋</span><span className="text-xs">記錄</span>
        </Link>
        <Link href="/scan" className="flex flex-col items-center gap-0.5" style={{color:'rgba(255,255,255,0.45)'}}>
          <span className="text-xl">📷</span><span className="text-xs">記帳</span>
        </Link>
        <Link href="/stats" className="flex flex-col items-center gap-0.5" style={{color:'rgba(255,255,255,0.45)'}}>
          <span className="text-xl">📊</span><span className="text-xs">統計</span>
        </Link>
        <Link href="/settings" className="flex flex-col items-center gap-0.5" style={{color:'rgba(255,255,255,0.45)'}}>
          <span className="text-xl">⚙️</span><span className="text-xs">設定</span>
        </Link>
      </nav>
    </div>
  )
}
