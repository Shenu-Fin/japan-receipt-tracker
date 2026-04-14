'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Receipt } from '@/lib/types'

const CAT_COLOR: Record<string, React.CSSProperties> = {
  '餐飲':{background:'#FFF8E8',color:'#B07A00'}, '交通':{background:'#E8F7F5',color:'#0A7A70'},
  '住宿':{background:'#EDF7E8',color:'#3A7A20'}, '購物':{background:'#F9E8F5',color:'#8A208A'},
  '門票':{background:'#EAE8F7',color:'#3A20AA'}, '景點':{background:'#EAE8F7',color:'#3A20AA'},
  '藥品':{background:'#F7E8E8',color:'#AA2020'}, '其他':{background:'#ECECE8',color:'#6B6B6B'},
}
const CATS    = ['全部','餐飲','交通','購物','門票','住宿','藥品','景點','其他']
const REGIONS = ['所有地區','東京','大阪','京都','名古屋','北海道','福岡','其他']
const NA = '#D0F567', NI = 'rgba(255,255,255,0.45)'

export default function HistoryPage() {
  const [receipts,setReceipts] = useState<Receipt[]>([])
  const [loading,setLoading]   = useState(true)
  const [cat,setCat]           = useState('全部')
  const [region,setRegion]     = useState('所有地區')
  const [rate,setRate]         = useState(0.21)
  const [detail,setDetail]     = useState<Receipt|null>(null)
  const [deleting,setDeleting] = useState('')

  useEffect(()=>{load();fetch('/api/exchange-rate').then(r=>r.json()).then(d=>setRate(d.rate||0.21))},[])

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

  const filtered = receipts.filter(r=>(cat==='全部'||r.category===cat)&&(region==='所有地區'||r.region===region))

  const NavBar=({active}:{active:string})=>(
    <nav className="nav-bar">
      <Link href="/" className="flex flex-col items-center gap-0.5" style={{color:active==='home'?NA:NI}}><span className="text-xl">🏠</span><span className="text-xs">首頁</span></Link>
      <Link href="/history" className="flex flex-col items-center gap-0.5" style={{color:active==='history'?NA:NI}}><span className="text-xl">📋</span><span className="text-xs font-medium">記錄</span></Link>
      <Link href="/scan" className="flex flex-col items-center gap-0.5" style={{color:active==='scan'?NA:NI}}><span className="text-xl">📷</span><span className="text-xs">記帳</span></Link>
      <Link href="/stats" className="flex flex-col items-center gap-0.5" style={{color:active==='stats'?NA:NI}}><span className="text-xl">📊</span><span className="text-xs">統計</span></Link>
      <Link href="/settings" className="flex flex-col items-center gap-0.5" style={{color:active==='settings'?NA:NI}}><span className="text-xl">⚙️</span><span className="text-xs">設定</span></Link>
    </nav>
  )

  if(detail) return(
    <div className="pb-24 px-4 pt-6">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={()=>setDetail(null)} className="w-9 h-9 bg-white rounded-full flex items-center justify-center" style={{border:'0.5px solid #E8E8E4',color:'#1A1A1B'}}>←</button>
        <h1 className="text-xl font-bold" style={{color:'#1A1A1B'}}>支出細項</h1>
      </div>
      <div style={{borderRadius:'16px',overflow:'hidden',border:'0.5px solid #E8E8E4',marginBottom:'12px'}}>
        <div style={{background:'#1A1A1B',padding:'16px'}}>
          <p className="text-xs mb-1" style={{color:'rgba(255,255,255,0.55)'}}>{detail.category}</p>
          <p className="text-lg font-bold text-white">{detail.items||detail.storeName}</p>
          <p className="text-3xl font-bold text-white mt-1" style={{letterSpacing:'-0.5px'}}>¥{detail.amountJPY.toLocaleString()}</p>
          <p className="text-xs mt-1" style={{color:'#B2F0EB'}}>≈ NT${Math.round(detail.amountJPY*rate).toLocaleString()}</p>
        </div>
        <div style={{background:'white'}}>
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
          ] as ([string,string]|null)[]).filter((row):row is [string,string]=>!!row&&!!row[1]).map(([k,v])=>(
            <div key={k} className="flex justify-between px-4 py-2.5" style={{borderBottom:'0.5px solid #F0F0EC',fontSize:'13px'}}>
              <span style={{color:'#ABABAB'}}>{k}</span>
              <span className="font-medium" style={{color:'#1A1A1B'}}>{v}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-2 p-3" style={{background:'#F5F5F2',borderTop:'0.5px solid #E8E8E4'}}>
          <Link href={`/add?edit=${detail.id}`} className="flex-1 py-2.5 rounded-xl text-center text-sm font-medium" style={{background:'white',border:'0.5px solid #E8E8E4',color:'#1A1A1B'}}>✏️ 編輯</Link>
          <button onClick={()=>del(detail.id!)} disabled={deleting===detail.id} className="flex-1 py-2.5 rounded-xl text-sm font-medium" style={{background:'white',border:'0.5px solid #FECACA',color:'#991B1B'}}>
            {deleting===detail.id?'刪除中...':'🗑 刪除'}
          </button>
        </div>
      </div>
      <NavBar active="history"/>
    </div>
  )

  return(
    <div className="pb-24 px-4 pt-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold" style={{color:'#1A1A1B'}}>歷史記錄</h1>
        <span className="text-sm" style={{color:'#ABABAB'}}>{filtered.length} 筆</span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2 mb-2">
        {CATS.map(c=>(
          <button key={c} onClick={()=>setCat(c)} className="px-3 py-1.5 rounded-full text-sm whitespace-nowrap flex-shrink-0 font-medium"
            style={cat===c?{background:'#1A1A1B',color:'white'}:{background:'white',color:'#555',border:'0.5px solid #E8E8E4'}}>
            {c}
          </button>
        ))}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-3 mb-3">
        {REGIONS.map(r=>(
          <button key={r} onClick={()=>setRegion(r)} className="px-3 py-1.5 rounded-full text-sm whitespace-nowrap flex-shrink-0 font-medium"
            style={region===r?{background:'#ECECE8',color:'#1A1A1B',border:'0.5px solid #ABABAB'}:{background:'white',color:'#555',border:'0.5px solid #E8E8E4'}}>
            {r}
          </button>
        ))}
      </div>
      {loading?(
        <div className="card text-center py-8" style={{color:'#ABABAB'}}>載入中...</div>
      ):filtered.length===0?(
        <div className="card text-center py-8" style={{color:'#ABABAB'}}>沒有符合的記錄</div>
      ):(
        <div className="space-y-2.5">
          {filtered.map((r,i)=>(
            <div key={r.id||i} className="card">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm" style={{color:'#1A1A1B'}}>{r.items||r.storeName}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-xs" style={{color:'#ABABAB'}}>{r.date}</span>
                    <span className="tag" style={CAT_COLOR[r.category]||CAT_COLOR['其他']}>{r.category}</span>
                    {r.user&&<span className="text-xs" style={{color:'#ABABAB'}}>· {r.user}</span>}
                  </div>
                </div>
                <div className="text-right ml-3">
                  <p className="font-bold text-sm" style={{color:'#1A1A1B'}}>¥{r.amountJPY.toLocaleString()}</p>
                  <p className="text-xs mt-0.5" style={{color:'#0A7A70'}}>NT${Math.round(r.amountJPY*rate).toLocaleString()}</p>
                </div>
              </div>
              <div className="flex gap-2 pt-2" style={{borderTop:'0.5px solid #F0F0EC'}}>
                <Link href={`/add?edit=${r.id}`} className="flex-1 py-1.5 rounded-xl text-center text-xs font-medium" style={{background:'#F5F5F2',color:'#555'}}>編輯</Link>
                <button onClick={()=>setDetail(r)} className="flex-1 py-1.5 rounded-xl text-xs font-medium" style={{background:'#E8F7F5',color:'#0A7A70'}}>查看細項</button>
                <button onClick={()=>del(r.id!)} disabled={deleting===r.id} className="flex-1 py-1.5 rounded-xl text-xs font-medium" style={{background:'#FEF0F0',color:'#991B1B'}}>
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
