'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Receipt } from '@/lib/types'

const CAT_COLOR: Record<string, React.CSSProperties> = {
  '餐飲':{background:'#2A1F4A',color:'#C084FC'}, '交通':{background:'#1A2F4A',color:'#60A5FA'},
  '住宿':{background:'#1A3A2F',color:'#34D399'}, '購物':{background:'#3A1F2A',color:'#F472B6'},
  '門票':{background:'#2A2040',color:'#A78BFA'}, '景點':{background:'#2A2040',color:'#A78BFA'},
  '藥品':{background:'#3A1F1F',color:'#F87171'}, '其他':{background:'#252640',color:'#94A3B8'},
}
const CATS    = ['全部','餐飲','交通','購物','門票','住宿','藥品','景點','其他']
const REGIONS = ['所有地區','東京','大阪','京都','名古屋','北海道','福岡','其他']
const NI = 'rgba(255,255,255,0.4)', NA = '#A78BFA'

export default function HistoryPage() {
  const [receipts,setReceipts]   = useState<Receipt[]>([])
  const [loading,setLoading]     = useState(true)
  const [cat,setCat]             = useState('全部')
  const [region,setRegion]       = useState('所有地區')
  const [exchangeRate,setExchangeRate] = useState(0.21)
  const [detail,setDetail]       = useState<Receipt|null>(null)
  const [deleting,setDeleting]   = useState('')

  useEffect(()=>{ load(); fetch('/api/exchange-rate').then(r=>r.json()).then(d=>setExchangeRate(d.rate||0.21)) },[])

  function load() {
    setLoading(true)
    fetch('/api/notion').then(r=>r.json()).then(d=>{setReceipts(Array.isArray(d)?d:[]);setLoading(false)}).catch(()=>setLoading(false))
  }

  async function del(id:string) {
    if (!confirm('確定刪除？')) return
    setDeleting(id)
    await fetch('/api/notion/update',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id})})
    setDeleting(''); setDetail(null); load()
  }

  const filtered = receipts.filter(r=>(cat==='全部'||r.category===cat)&&(region==='所有地區'||r.region===region))

  const NavBar = ({active}:{active:string}) => (
    <nav className="nav-bar">
      <Link href="/" className="flex flex-col items-center gap-0.5" style={{color:active==='home'?NA:NI}}><span className="text-xl">🏠</span><span className="text-xs">首頁</span></Link>
      <Link href="/history" className="flex flex-col items-center gap-0.5" style={{color:active==='history'?NA:NI}}><span className="text-xl">📋</span><span className="text-xs font-medium">記錄</span></Link>
      <Link href="/scan" className="flex flex-col items-center gap-0.5" style={{color:active==='scan'?NA:NI}}><span className="text-xl">📷</span><span className="text-xs">記帳</span></Link>
      <Link href="/stats" className="flex flex-col items-center gap-0.5" style={{color:active==='stats'?NA:NI}}><span className="text-xl">📊</span><span className="text-xs">統計</span></Link>
      <Link href="/settings" className="flex flex-col items-center gap-0.5" style={{color:active==='settings'?NA:NI}}><span className="text-xl">⚙️</span><span className="text-xs">設定</span></Link>
    </nav>
  )

  if (detail) return (
    <div className="pb-24 px-4 pt-6">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={()=>setDetail(null)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{background:'#1E2048',border:'0.5px solid #2E3060',color:'#E8E8F4'}}>←</button>
        <h1 className="text-xl font-bold text-white">支出細項</h1>
      </div>
      <div style={{borderRadius:'16px',overflow:'hidden',border:'0.5px solid #2E3060',marginBottom:'12px'}}>
        <div style={{background:'linear-gradient(135deg,#3D2E8E,#5B4ACA)',padding:'16px'}}>
          <p className="text-xs mb-1" style={{color:'rgba(255,255,255,0.6)'}}>{detail.category}</p>
          <p className="text-lg font-bold text-white">{detail.items||detail.storeName}</p>
          <p className="text-3xl font-bold text-white mt-1" style={{letterSpacing:'-0.5px'}}>¥{detail.amountJPY.toLocaleString()}</p>
          <p className="text-xs mt-1" style={{color:'#F5C842'}}>≈ NT${Math.round(detail.amountJPY*exchangeRate).toLocaleString()}</p>
        </div>
        <div style={{background:'#1E2048'}}>
          {([
            ['消費日期',detail.date],
            ['商店名稱',detail.storeName],
            detail.storeNameJa?['商店日文',detail.storeNameJa]:null,
            ['商品明細',detail.items],
            detail.itemsJa?['商品日文',detail.itemsJa]:null,
            ['付款人',detail.user],
            ['支付方式',detail.paymentMethod],
            ['地區',detail.region],
            detail.taxType?['稅制',detail.taxType]:null,
          ] as ([string,string]|null)[]).filter((row): row is [string,string] => !!row&&!!row[1]).map(([k,v])=>(
            <div key={k} className="flex justify-between px-4 py-2.5" style={{borderBottom:'0.5px solid #252650',fontSize:'13px'}}>
              <span style={{color:'#6B6E9A'}}>{k}</span>
              <span className="font-medium text-white">{v}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-2 p-3" style={{background:'#181938',borderTop:'0.5px solid #2E3060'}}>
          <Link href={`/add?edit=${detail.id}`} className="flex-1 py-2.5 rounded-xl text-center text-sm font-medium" style={{background:'#1E2048',border:'0.5px solid #2E3060',color:'#E8E8F4'}}>✏️ 編輯</Link>
          <button onClick={()=>del(detail.id!)} disabled={deleting===detail.id} className="flex-1 py-2.5 rounded-xl text-sm font-medium" style={{background:'#3A1F1F',border:'0.5px solid #5A2F2F',color:'#F87171'}}>
            {deleting===detail.id?'刪除中...':'🗑 刪除'}
          </button>
        </div>
      </div>
      <NavBar active="history"/>
    </div>
  )

  return (
    <div className="pb-24 px-4 pt-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-white">歷史記錄</h1>
        <span className="text-sm" style={{color:'#6B6E9A'}}>{filtered.length} 筆</span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2 mb-2">
        {CATS.map(c=>(
          <button key={c} onClick={()=>setCat(c)} className="px-3 py-1.5 rounded-full text-sm whitespace-nowrap flex-shrink-0 font-medium"
            style={cat===c?{background:'#7C4DFF',color:'white'}:{background:'#1E2048',color:'#B0B3D4',border:'0.5px solid #2E3060'}}>
            {c}
          </button>
        ))}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-3 mb-3">
        {REGIONS.map(r=>(
          <button key={r} onClick={()=>setRegion(r)} className="px-3 py-1.5 rounded-full text-sm whitespace-nowrap flex-shrink-0 font-medium"
            style={region===r?{background:'#252650',color:'white',border:'0.5px solid #A78BFA'}:{background:'#1E2048',color:'#B0B3D4',border:'0.5px solid #2E3060'}}>
            {r}
          </button>
        ))}
      </div>
      {loading?(
        <div className="card text-center py-8" style={{color:'#6B6E9A'}}>載入中...</div>
      ):filtered.length===0?(
        <div className="card text-center py-8" style={{color:'#6B6E9A'}}>沒有符合的記錄</div>
      ):(
        <div className="space-y-2.5">
          {filtered.map((r,i)=>(
            <div key={r.id||i} className="card">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-white">{r.items||r.storeName}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-xs" style={{color:'#6B6E9A'}}>{r.date}</span>
                    <span className="tag" style={CAT_COLOR[r.category]||CAT_COLOR['其他']}>{r.category}</span>
                    {r.user&&<span className="text-xs" style={{color:'#6B6E9A'}}>· {r.user}</span>}
                  </div>
                </div>
                <div className="text-right ml-3">
                  <p className="font-bold text-sm text-white">¥{r.amountJPY.toLocaleString()}</p>
                  <p className="text-xs mt-0.5" style={{color:'#F5C842'}}>NT${Math.round(r.amountJPY*exchangeRate).toLocaleString()}</p>
                </div>
              </div>
              <div className="flex gap-2 pt-2" style={{borderTop:'0.5px solid #252650'}}>
                <Link href={`/add?edit=${r.id}`} className="flex-1 py-1.5 rounded-xl text-center text-xs font-medium" style={{background:'#252650',color:'#B0B3D4'}}>編輯</Link>
                <button onClick={()=>setDetail(r)} className="flex-1 py-1.5 rounded-xl text-xs font-medium" style={{background:'#2A2060',color:'#A78BFA'}}>查看細項</button>
                <button onClick={()=>del(r.id!)} disabled={deleting===r.id} className="flex-1 py-1.5 rounded-xl text-xs font-medium" style={{background:'#3A1F1F',color:'#F87171'}}>
                  {deleting===r.id?'...':'刪除'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <NavBar active="history"/>
    </div>
  )
}
