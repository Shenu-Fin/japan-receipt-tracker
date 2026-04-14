'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Receipt } from '@/lib/types'

const COLORS = ['#20B2AA','#00A86B','#FF6B6B','#FFB347','#9B59B6','#1ABC9C','#E67E22','#3498DB']
const NA = '#00A86B'
const NI = '#8BBAB8'

function PieChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  if (total === 0) return <div className="w-24 h-24 rounded-full" style={{background:'#D4E6E4'}} />
  let offset = 25
  const slices = data.map(d => {
    const pct = (d.value / total) * 100
    const slice = { ...d, pct, offset }
    offset -= pct
    return slice
  })
  return (
    <svg width="90" height="90" viewBox="0 0 36 36">
      {slices.map((s, i) => (
        <circle key={i} cx="18" cy="18" r="15.9" fill="none"
          stroke={s.color} strokeWidth="3.2"
          strokeDasharray={`${s.pct} ${100 - s.pct}`}
          strokeDashoffset={s.offset} />
      ))}
      <circle cx="18" cy="18" r="10.5" fill="white" />
    </svg>
  )
}

function Section({ title, data, labelKey }: { title: string; data: { label: string; value: number }[]; labelKey: string }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  const colored = data.map((d, i) => ({ ...d, color: COLORS[i % COLORS.length], pct: total ? Math.round((d.value / total) * 100) : 0 }))
  return (
    <div className="card mb-3">
      <p className="text-xs font-semibold mb-3" style={{color:'#8BBAB8',letterSpacing:'0.06em',textTransform:'uppercase'}}>{title}</p>
      <div className="flex items-center gap-4 mb-4">
        <PieChart data={colored} />
        <div className="flex-1 space-y-1.5">
          {colored.map((d, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{background: d.color}} />
                <span className="text-xs" style={{color:'#455A64'}}>{d.label}</span>
              </div>
              <span className="text-xs font-semibold" style={{color: d.color}}>{d.pct}%</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{borderTop:'0.5px solid #D4E6E4',paddingTop:'10px'}}>
        <div className="grid grid-cols-4 gap-1 mb-2" style={{fontSize:'11px',color:'#8BBAB8'}}>
          <span>#</span><span>{labelKey}</span><span className="text-right">金額</span><span className="text-right">比例</span>
        </div>
        {colored.map((d, i) => (
          <div key={i} className="grid grid-cols-4 gap-1 py-2" style={{borderBottom: i < colored.length-1 ? '0.5px solid #E0F2F1' : 'none', fontSize:'13px'}}>
            <span style={{color:'#8BBAB8',fontSize:'11px'}}>{i+1}</span>
            <span className="font-medium" style={{color:'#455A64'}}>{d.label}</span>
            <span className="text-right font-semibold" style={{color: d.color}}>¥{d.value.toLocaleString()}</span>
            <span className="text-right font-semibold" style={{color: i===0 ? d.color : '#8BBAB8'}}>{d.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function StatsPage() {
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [loading, setLoading] = useState(true)
  const [exchangeRate, setExchangeRate] = useState(0.21)

  useEffect(() => {
    fetch('/api/notion').then(r => r.json()).then(d => { setReceipts(Array.isArray(d) ? d : []); setLoading(false) }).catch(() => setLoading(false))
    fetch('/api/exchange-rate').then(r => r.json()).then(d => setExchangeRate(d.rate || 0.21))
  }, [])

  const totalJPY = receipts.reduce((s, r) => s + r.amountJPY, 0)
  const totalTWD = Math.round(totalJPY * exchangeRate)

  const byCat: Record<string, number> = {}
  receipts.forEach(r => { byCat[r.category] = (byCat[r.category] || 0) + r.amountJPY })
  const catData = Object.entries(byCat).sort((a,b) => b[1]-a[1]).map(([label,value]) => ({label,value}))

  const byPay: Record<string, number> = {}
  receipts.forEach(r => { byPay[r.paymentMethod] = (byPay[r.paymentMethod] || 0) + r.amountJPY })
  const payData = Object.entries(byPay).sort((a,b) => b[1]-a[1]).map(([label,value]) => ({label,value}))

  const byUser: Record<string, number> = {}
  receipts.forEach(r => { byUser[r.user] = (byUser[r.user] || 0) + r.amountJPY })
  const userData = Object.entries(byUser).sort((a,b) => b[1]-a[1]).map(([label,value]) => ({label,value}))

  if (loading) return <div className="p-8 text-center pt-16" style={{color:'#8BBAB8'}}>載入中...</div>

  return (
    <div className="pb-24 px-4 pt-6">
      <h1 className="text-xl font-bold mb-4" style={{color:'#455A64'}}>統計分析</h1>

      <div style={'background':'#20B2AA',borderRadius:'20px',padding:'18px',marginBottom:'16px'}}>
        <p className="text-xs mb-1" style={{color:'rgba(255,255,255,0.75)'}}>旅程總花費</p>
        <p className="text-4xl font-bold text-white" style={{letterSpacing:'-1px'}}>¥{totalJPY.toLocaleString()}</p>
        <div className="flex justify-between items-center mt-3 rounded-xl px-3 py-2" style={{background:'rgba(255,255,255,0.18)'}}>
          <span className="text-xs" style={{color:'rgba(255,255,255,0.8)'}}>換算台幣</span>
          <span className="font-semibold text-white">NT${totalTWD.toLocaleString()}</span>
        </div>
        <p className="text-xs mt-2" style={{color:'rgba(255,255,255,0.6)'}}>即時匯率 ¥1 ≈ NT${exchangeRate.toFixed(4)}</p>
      </div>

      {catData.length > 0 && <Section title="支出類別比" data={catData} labelKey="類別" />}
      {payData.length > 0 && <Section title="支出帳戶比" data={payData} labelKey="帳戶" />}
      {userData.length > 0 && <Section title="支出成員比" data={userData} labelKey="成員" />}
      {receipts.length === 0 && <div className="card text-center py-8" style={{color:'#8BBAB8'}}>還沒有記錄</div>}

      <nav className="nav-bar">
        <Link href="/" className="flex flex-col items-center gap-0.5" style={{color:NI}}><span className="text-xl">🏠</span><span className="text-xs">首頁</span></Link>
        <Link href="/history" className="flex flex-col items-center gap-0.5" style={{color:NI}}><span className="text-xl">📋</span><span className="text-xs">記錄</span></Link>
        <Link href="/scan" className="flex flex-col items-center gap-0.5" style={{color:NI}}><span className="text-xl">📷</span><span className="text-xs">記帳</span></Link>
        <Link href="/stats" className="flex flex-col items-center gap-0.5" style={{color:NA}}><span className="text-xl">📊</span><span className="text-xs font-medium">統計</span></Link>
        <Link href="/settings" className="flex flex-col items-center gap-0.5" style={{color:NI}}><span className="text-xl">⚙️</span><span className="text-xs">設定</span></Link>
      </nav>
    </div>
  )
}
