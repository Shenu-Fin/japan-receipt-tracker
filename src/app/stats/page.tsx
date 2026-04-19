'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Receipt } from '@/lib/types'

const COLORS=['#F2B705','#3C5A99','#D97706','#059669','#9333EA','#DC2626','#0891B2','#65A30D']
const AC='#F2B705', MU='#B8AFA6'

function PieChart({data}:{data:{label:string;value:number;color:string}[]}) {
  const total=data.reduce((s,d)=>s+d.value,0)
  if(!total) return <div style={{width:90,height:90,borderRadius:'50%',background:'#F3EDE6'}}/>
  let offset=25
  const slices=data.map(d=>{const pct=(d.value/total)*100;const s={...d,pct,offset};offset-=pct;return s})
  return (
    <svg width="90" height="90" viewBox="0 0 36 36">
      {slices.map((s,i)=>(<circle key={i} cx="18" cy="18" r="15.9" fill="none" stroke={s.color} strokeWidth="3.2" strokeDasharray={`${s.pct} ${100-s.pct}`} strokeDashoffset={s.offset}/>))}
      <circle cx="18" cy="18" r="10.5" fill="white"/>
    </svg>
  )
}

function Section({title,data,labelKey}:{title:string;data:{label:string;value:number}[];labelKey:string}) {
  const total=data.reduce((s,d)=>s+d.value,0)
  const colored=data.map((d,i)=>({...d,color:COLORS[i%COLORS.length],pct:total?Math.round((d.value/total)*100):0}))
  return (
    <div className="card mb-3">
      <p className="section-title" style={{margin:'0 0 12px'}}>{title}</p>
      <div className="flex items-center gap-4 mb-4">
        <PieChart data={colored}/>
        <div className="flex-1 space-y-1.5">
          {colored.map((d,i)=>(
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{background:d.color}}/>
                <span className="text-xs" style={{color:'#1A1A1A'}}>{d.label}</span>
              </div>
              <span className="text-xs font-bold" style={{color:d.color}}>{d.pct}%</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{borderTop:'1px solid #EDE7DD',paddingTop:10}}>
        <div className="grid grid-cols-4 gap-1 mb-2" style={{fontSize:11,color:MU}}>
          <span>#</span><span>{labelKey}</span><span className="text-right">金額</span><span className="text-right">比例</span>
        </div>
        {colored.map((d,i)=>(
          <div key={i} className="grid grid-cols-4 gap-1 py-2" style={{borderBottom:i<colored.length-1?'1px solid #F3EDE6':'none',fontSize:13}}>
            <span style={{color:MU,fontSize:11}}>{i+1}</span>
            <span className="font-medium" style={{color:'#1A1A1A'}}>{d.label}</span>
            <span className="text-right font-bold" style={{color:'#1A1A1A'}}>¥{d.value.toLocaleString()}</span>
            <span className="text-right font-semibold" style={{color:'#1A1A1A'}}>{d.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function StatsPage() {
  const [receipts,setReceipts]=useState<Receipt[]>([])
  const [loading,setLoading]=useState(true)
  const [exchangeRate,setExchangeRate]=useState(0.21)

  useEffect(()=>{
    fetch('/api/notion').then(r=>r.json()).then(d=>{setReceipts(Array.isArray(d)?d:[]);setLoading(false)}).catch(()=>setLoading(false))
    fetch('/api/exchange-rate').then(r=>r.json()).then(d=>setExchangeRate(d.rate||0.21))
  },[])

  const totalJPY=receipts.reduce((s,r)=>s+r.amountJPY,0)
  const totalTWD=Math.round(totalJPY*exchangeRate)
  const byCat:Record<string,number>={};  receipts.forEach(r=>{byCat[r.category]=(byCat[r.category]||0)+r.amountJPY})
  const byPay:Record<string,number>={};  receipts.forEach(r=>{byPay[r.paymentMethod]=(byPay[r.paymentMethod]||0)+r.amountJPY})
  const byUser:Record<string,number>={}; receipts.forEach(r=>{byUser[r.user]=(byUser[r.user]||0)+r.amountJPY})

  if(loading) return <div className="p-8 text-center pt-16" style={{color:MU}}>載入中...</div>

  const navItems=[
    {href:'/',icon:'🏠',label:'首頁',active:false},
    {href:'/history',icon:'📋',label:'記錄',active:false},
    {href:'/scan',icon:'📷',label:'記帳',active:false},
    {href:'/stats',icon:'📊',label:'統計',active:true},
    {href:'/settings',icon:'⚙️',label:'設定',active:false},
  ]

  return (
    <div className="pb-24 px-4 pt-6">
      <h1 className="font-display text-2xl mb-5" style={{color:'#1A1A1A'}}>統計分析</h1>

      {/* Hero */}
      <div className="hero-card mb-4">
        <p className="text-xs mb-1" style={{color:'rgba(255,255,255,0.5)',letterSpacing:'0.08em',textTransform:'uppercase',fontFamily:'Inter,sans-serif'}}>旅程總花費</p>
        <p className="font-display text-5xl text-white" style={{letterSpacing:'-1px'}}>¥{totalJPY.toLocaleString()}</p>
        <div style={{borderTop:'1px solid rgba(255,255,255,0.12)',margin:'14px 0 12px'}}/>
        <div className="flex justify-between items-center">
          <span className="text-xs" style={{color:'rgba(255,255,255,0.5)',fontFamily:'Inter,sans-serif'}}>換算台幣</span>
          <span className="font-bold text-lg" style={{color:AC,fontFamily:'Inter,sans-serif'}}>NT${totalTWD.toLocaleString()}</span>
        </div>
        <p className="text-xs mt-1" style={{color:'rgba(255,255,255,0.3)',fontFamily:'Inter,sans-serif'}}>即時匯率 ¥1 ≈ NT${exchangeRate.toFixed(4)}</p>
      </div>

      {Object.keys(byCat).length>0&&<Section title="支出類別比" data={Object.entries(byCat).sort((a,b)=>b[1]-a[1]).map(([label,value])=>({label,value}))} labelKey="類別"/>}
      {Object.keys(byPay).length>0&&<Section title="支出帳戶比" data={Object.entries(byPay).sort((a,b)=>b[1]-a[1]).map(([label,value])=>({label,value}))} labelKey="帳戶"/>}
      {Object.keys(byUser).length>0&&<Section title="支出成員比" data={Object.entries(byUser).sort((a,b)=>b[1]-a[1]).map(([label,value])=>({label,value}))} labelKey="成員"/>}
      {receipts.length===0&&<div className="card text-center py-8" style={{color:MU}}>還沒有記錄</div>}

      <nav className="nav-bar">
        {navItems.map(({href,icon,label,active})=>(
          <Link key={href} href={href} className="flex flex-col items-center gap-0.5" style={{color:active?AC:MU}}>
            <span className="text-xl">{icon}</span>
            <span className="text-xs" style={{fontWeight:active?600:400}}>{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
