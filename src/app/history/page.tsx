'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Receipt } from '@/lib/types'

const CAT_COLOR:Record<string,React.CSSProperties>={
  '餐飲':{background:'#FEF3C7',color:'#92400E'},'交通':{background:'#DBEAFE',color:'#1E40AF'},
  '住宿':{background:'#D1FAE5',color:'#065F46'},'購物':{background:'#FCE7F3',color:'#9D174D'},
  '門票':{background:'#EDE9FE',color:'#5B21B6'},'景點':{background:'#EDE9FE',color:'#5B21B6'},
  '藥品':{background:'#FEE2E2',color:'#991B1B'},'其他':{background:'#F3EDE6',color:'#78523A'},
}
const CATS=['全部','餐飲','交通','購物','門票','住宿','藥品','景點','其他']
const REGIONS=['所有地區','東京','大阪','京都','名古屋','北海道','福岡','其他']
const AC='#F2B705', MU='#B8AFA6'

const NAV_ITEMS=[
  {href:'/',icon:'🏠',label:'首頁'},{href:'/history',icon:'📋',label:'記錄'},
  {href:'/scan',icon:'📷',label:'記帳'},{href:'/stats',icon:'📊',label:'統計'},
  {href:'/settings',icon:'⚙️',label:'設定'},
]

export default function HistoryPage() {
  const [receipts,setReceipts]=useState<Receipt[]>([])
  const [loading,setLoading]=useState(true)
  const [cat,setCat]=useState('全部')
  const [region,setRegion]=useState('所有地區')
  const [exchangeRate,setExchangeRate]=useState(0.21)
  const [detail,setDetail]=useState<Receipt|null>(null)
  const [deleting,setDeleting]=useState('')

  useEffect(()=>{load();fetch('/api/exchange-rate').then(r=>r.json()).then(d=>setExchangeRate(d.rate||0.21))},[])

  function load(){
    setLoading(true)
    fetch('/api/notion').then(r=>r.json()).then(d=>{setReceipts(Array.isArray(d)?d:[]);setLoading(false)}).catch(()=>setLoading(false))
  }

  async function del(id:string){
    if(!confirm('確定刪除？'))return
    setDeleting(id)
    await fetch('/api/notion/update',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id})})
    setDeleting('');setDetail(null);load()
  }

  const filtered=receipts.filter(r=>(cat==='全部'||r.category===cat)&&(region==='所有地區'||r.region===region))

  const NavBar=({active}:{active:string})=>(
    <nav className="nav-bar">
      {NAV_ITEMS.map(({href,icon,label})=>(
        <Link key={href} href={href} className="flex flex-col items-center gap-0.5" style={{color:href==='/'+active||href===active?AC:MU}}>
          <span className="text-xl">{icon}</span>
          <span className="text-xs" style={{fontWeight:href==='/'+active||href===active?600:400}}>{label}</span>
        </Link>
      ))}
    </nav>
  )

  if(detail) return (
    <div className="pb-24 px-4 pt-6">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={()=>setDetail(null)} className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-sm" style={{border:'1px solid #EDE7DD',color:'#1A1A1A'}}>←</button>
        <h1 className="font-display text-2xl" style={{color:'#1A1A1A'}}>支出細項</h1>
      </div>
      <div style={{borderRadius:20,overflow:'hidden',border:'1px solid #EDE7DD',marginBottom:12,boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
        <div className="hero-card" style={{borderRadius:0}}>
          <p className="text-xs mb-1" style={{color:'rgba(255,255,255,0.5)',letterSpacing:'0.06em',textTransform:'uppercase',fontFamily:'Inter,sans-serif'}}>{detail.category}</p>
          <p className="font-display text-2xl text-white">{detail.items||detail.storeName}</p>
          <p className="font-display text-4xl text-white mt-1" style={{letterSpacing:'-0.5px'}}>¥{detail.amountJPY.toLocaleString()}</p>
          <p className="text-sm mt-1" style={{color:AC,fontFamily:'Inter,sans-serif'}}>≈ NT${Math.round(detail.amountJPY*exchangeRate).toLocaleString()}</p>
        </div>
        <div style={{background:'white'}}>
          {([
            ['消費日期',detail.date],['商店名稱',detail.storeName],
            detail.storeNameJa?['商店日文',detail.storeNameJa]:null,
            ['商品明細',detail.items],
            detail.itemsJa?['商品日文',detail.itemsJa]:null,
            ['付款人',detail.user],['支付方式',detail.paymentMethod],
            ['地區',detail.region],detail.taxType?['稅制',detail.taxType]:null,
          ] as ([string,string]|null)[]).filter((row):row is [string,string]=>!!row&&!!row[1]).map(([k,v])=>(
            <div key={k} className="flex justify-between px-5 py-3" style={{borderBottom:'1px solid #F3EDE6',fontSize:13}}>
              <span style={{color:MU}}>{k}</span>
              <span className="font-medium" style={{color:'#1A1A1A'}}>{v}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-2 p-3" style={{background:'#FAF7F3',borderTop:'1px solid #EDE7DD'}}>
          <Link href={`/add?edit=${detail.id}`} className="flex-1 py-2.5 rounded-xl text-center text-sm font-semibold" style={{background:'white',border:'1px solid #EDE7DD',color:'#1A1A1A'}}>✏️ 編輯</Link>
          <button onClick={()=>del(detail.id!)} disabled={deleting===detail.id} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{background:'#FEE2E2',border:'1px solid #FECACA',color:'#991B1B'}}>
            {deleting===detail.id?'刪除中...':'🗑 刪除'}
          </button>
        </div>
      </div>
      <NavBar active="/history"/>
    </div>
  )

  return (
    <div className="pb-24 px-4 pt-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-display text-2xl" style={{color:'#1A1A1A'}}>歷史記錄</h1>
        <span className="text-sm font-medium" style={{color:MU}}>{filtered.length} 筆</span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2 mb-2">
        {CATS.map(c=>(
          <button key={c} onClick={()=>setCat(c)} className="px-3 py-1.5 rounded-full text-sm whitespace-nowrap flex-shrink-0 font-medium"
            style={cat===c?{background:'#1A1A1A',color:'white'}:{background:'white',color:'#5C4F44',border:'1px solid #EDE7DD'}}>
            {c}
          </button>
        ))}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-3 mb-3">
        {REGIONS.map(r=>(
          <button key={r} onClick={()=>setRegion(r)} className="px-3 py-1.5 rounded-full text-sm whitespace-nowrap flex-shrink-0 font-medium"
            style={region===r?{background:'#F2B705',color:'white'}:{background:'white',color:'#5C4F44',border:'1px solid #EDE7DD'}}>
            {r}
          </button>
        ))}
      </div>
      {loading?(
        <div className="card text-center py-8" style={{color:MU}}>載入中...</div>
      ):filtered.length===0?(
        <div className="card text-center py-8" style={{color:MU}}>沒有符合的記錄</div>
      ):(
        <div className="space-y-2.5">
          {filtered.map((r,i)=>(
            <div key={r.id||i} className="card">
              <div className="flex justify-between items-start mb-2.5">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm" style={{color:'#1A1A1A'}}>{r.items||r.storeName}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-xs" style={{color:MU}}>{r.date}</span>
                    <span className="tag" style={CAT_COLOR[r.category]||CAT_COLOR['其他']}>{r.category}</span>
                    {r.user&&<span className="text-xs" style={{color:MU}}>· {r.user}</span>}
                  </div>
                </div>
                <div className="text-right ml-3">
                  <p className="font-bold text-sm" style={{color:'#1A1A1A'}}>¥{r.amountJPY.toLocaleString()}</p>
                  <p className="text-xs mt-0.5 gold">NT${Math.round(r.amountJPY*exchangeRate).toLocaleString()}</p>
                </div>
              </div>
              <div className="flex gap-2 pt-2.5" style={{borderTop:'1px solid #F3EDE6'}}>
                <Link href={`/add?edit=${r.id}`} className="flex-1 py-1.5 rounded-xl text-center text-xs font-semibold" style={{background:'#FAF7F3',color:'#5C4F44'}}>編輯</Link>
                <button onClick={()=>setDetail(r)} className="flex-1 py-1.5 rounded-xl text-xs font-semibold" style={{background:'#FEF3C7',color:'#92400E'}}>查看細項</button>
                <button onClick={()=>del(r.id!)} disabled={deleting===r.id} className="flex-1 py-1.5 rounded-xl text-xs font-semibold" style={{background:'#FEE2E2',color:'#991B1B'}}>
                  {deleting===r.id?'...':'刪除'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <NavBar active="/history"/>
    </div>
  )
}
