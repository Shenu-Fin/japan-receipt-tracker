'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Receipt } from '@/lib/types'

const TRIP_START = new Date('2026-06-02')
const TRIP_END   = new Date('2026-06-06')
const TRIP_DAYS  = 5

const CAT_COLOR: Record<string, React.CSSProperties> = {
  '餐飲': {background:'#FEF3C7',color:'#92400E'},
  '交通': {background:'#DBEAFE',color:'#1E40AF'},
  '住宿': {background:'#D1FAE5',color:'#065F46'},
  '購物': {background:'#FCE7F3',color:'#9D174D'},
  '門票': {background:'#EDE9FE',color:'#5B21B6'},
  '景點': {background:'#EDE9FE',color:'#5B21B6'},
  '藥品': {background:'#FEE2E2',color:'#991B1B'},
  '其他': {background:'#F3EDE6',color:'#78523A'},
}

const ACTIVE_COLOR = '#F2B705'
const MUTED_COLOR  = '#B8AFA6'

export default function Dashboard() {
  const [receipts,     setReceipts]     = useState<Receipt[]>([])
  const [loading,      setLoading]      = useState(true)
  const [exchangeRate, setExchangeRate] = useState(0.21)

  useEffect(() => {
    fetch('/api/notion').then(r=>r.json()).then(d=>{ setReceipts(Array.isArray(d)?d:[]); setLoading(false) }).catch(()=>setLoading(false))
    fetch('/api/exchange-rate').then(r=>r.json()).then(d=>setExchangeRate(d.rate||0.21))
  }, [])

  const today      = new Date().toISOString().split('T')[0]
  const todayTotal = receipts.filter(r=>r.date===today).reduce((s,r)=>s+r.amountJPY,0)
  const totalJPY   = receipts.reduce((s,r)=>s+r.amountJPY,0)
  const totalTWD   = Math.round(totalJPY*exchangeRate)

  const now = new Date(); now.setHours(0,0,0,0)
  let tripPct=0, tripLabel=''
  if (now<TRIP_START) {
    const d=Math.ceil((TRIP_START.getTime()-now.getTime())/86400000)
    tripLabel=`出發倒數 ${d} 天`
  } else if (now>TRIP_END) {
    tripLabel='旅程已結束'; tripPct=100
  } else {
    const d=Math.floor((now.getTime()-TRIP_START.getTime())/86400000)+1
    tripPct=Math.round((d/TRIP_DAYS)*100); tripLabel=`第 ${d} 天 / 共 ${TRIP_DAYS} 天`
  }

  return (
    <div className="pb-24 px-4 pt-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-3xl" style={{color:'#1A1A1A',letterSpacing:'-0.5px'}}>日本旅行記帳</h1>
        <p className="text-sm mt-1" style={{color:MUTED_COLOR}} suppressHydrationWarning>
          {new Date().toLocaleDateString('zh-TW',{month:'long',day:'numeric',weekday:'short'})}
        </p>
      </div>

      {/* Hero card — dark charcoal */}
      <div className="hero-card mb-3">
        <p className="text-xs mb-1" style={{color:'rgba(255,255,255,0.55)',letterSpacing:'0.08em',textTransform:'uppercase',fontFamily:'Inter,sans-serif'}}>今日花費</p>
        <p className="font-display text-5xl text-white" style={{letterSpacing:'-1px'}}>
          ¥{todayTotal.toLocaleString()}
        </p>
        <p className="text-sm mt-1" style={{color:'rgba(255,255,255,0.5)',fontFamily:'Inter,sans-serif'}}>
          ≈ NT${Math.round(todayTotal*exchangeRate).toLocaleString()}
        </p>
        <div style={{borderTop:'1px solid rgba(255,255,255,0.12)',margin:'16px 0 14px'}} />
        <div className="flex justify-between items-end">
          <div>
            <p className="text-xs mb-1" style={{color:'rgba(255,255,255,0.55)',letterSpacing:'0.06em',textTransform:'uppercase',fontFamily:'Inter,sans-serif'}}>旅程累計</p>
            <p className="text-xl font-bold text-white" style={{fontFamily:'Inter,sans-serif'}}>¥{totalJPY.toLocaleString()}</p>
            <p className="text-xs mt-0.5" style={{color:'#F2B705',fontFamily:'Inter,sans-serif'}}>NT${totalTWD.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-xs mb-1.5" style={{color:'rgba(255,255,255,0.55)',fontFamily:'Inter,sans-serif'}}>旅程進度 {tripPct}%</p>
            <div className="w-28 rounded-full h-1.5" style={{background:'rgba(255,255,255,0.15)'}}>
              <div className="h-1.5 rounded-full transition-all" style={{width:`${tripPct}%`,background:'#F2B705'}} />
            </div>
            <p className="text-xs mt-1.5" style={{color:'rgba(255,255,255,0.35)',fontFamily:'Inter,sans-serif'}}>{tripLabel}</p>
          </div>
        </div>
      </div>

      {/* 最近記錄 */}
      <div className="flex justify-between items-center mb-3">
        <p className="section-title" style={{margin:0}}>最近記錄</p>
        <Link href="/history" className="text-xs font-semibold" style={{color:ACTIVE_COLOR}}>查看全部 →</Link>
      </div>

      {loading ? (
        <div className="card text-center py-8" style={{color:MUTED_COLOR}}>載入中...</div>
      ) : receipts.length===0 ? (
        <div className="card text-center py-8" style={{color:MUTED_COLOR}}>
          <p className="text-3xl mb-2">🧾</p>
          <p className="text-sm">還沒有記錄，掃描第一張收據吧！</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {receipts.slice(0,5).map((r,i) => (
            <div key={r.id||i} className="card flex justify-between items-center">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate" style={{color:'#1A1A1A'}}>{r.items||r.storeName}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-xs" style={{color:MUTED_COLOR}}>{r.date}</span>
                  <span className="tag" style={CAT_COLOR[r.category]||CAT_COLOR['其他']}>{r.category}</span>
                </div>
              </div>
              <div className="text-right ml-3 flex-shrink-0">
                <p className="font-bold text-sm" style={{color:'#1A1A1A'}}>¥{r.amountJPY.toLocaleString()}</p>
                <p className="text-xs mt-0.5" style={{color:'#1A1A1A'}}>NT${Math.round(r.amountJPY*exchangeRate).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <nav className="nav-bar">
        {[
          {href:'/',    icon:'🏠', label:'首頁',  active:true},
          {href:'/history', icon:'📋', label:'記錄',  active:false},
          {href:'/scan',    icon:'📷', label:'記帳',  active:false},
          {href:'/stats',   icon:'📊', label:'統計',  active:false},
          {href:'/settings',icon:'⚙️', label:'設定',  active:false},
        ].map(({href,icon,label,active}) => (
          <Link key={href} href={href} className="flex flex-col items-center gap-0.5"
            style={{color: active ? ACTIVE_COLOR : MUTED_COLOR}}>
            <span className="text-xl">{icon}</span>
            <span className="text-xs" style={{fontWeight: active ? 600 : 400}}>{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
