'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Receipt } from '@/lib/types'

const CAT_COLOR: Record<string, string> = {
  '餐飲':'background:#FDF3E3;color:#9A6020','交通':'background:#E8F0FB;color:#2E5BA8',
  '住宿':'background:#EAF3DE;color:#3B6D11','購物':'background:#FBEAF0;color:#9C2A5A',
  '門票':'background:#F0EDFB;color:#5B3DB8','景點':'background:#F0EDFB;color:#5B3DB8',
  '藥品':'background:#FCEBEB;color:#A32D2D','其他':'background:#F5F0EB;color:#6B4C35',
}

const CATS = ['全部','餐飲','交通','購物','門票','住宿','藥品','景點','其他']
const REGIONS = ['所有地區','東京','大阪','京都','名古屋','北海道','福岡','其他']

export default function HistoryPage() {
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [loading, setLoading] = useState(true)
  const [cat, setCat] = useState('全部')
  const [region, setRegion] = useState('所有地區')
  const [exchangeRate, setExchangeRate] = useState(0.21)
  const [detail, setDetail] = useState<Receipt | null>(null)
  const [deleting, setDeleting] = useState('')

  useEffect(() => {
    load()
    fetch('/api/exchange-rate').then(r => r.json()).then(d => setExchangeRate(d.rate || 0.21))
  }, [])

  function load() {
    setLoading(true)
    fetch('/api/notion').then(r => r.json()).then(d => {
      setReceipts(Array.isArray(d) ? d : [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  async function del(id: string) {
    if (!confirm('確定刪除？')) return
    setDeleting(id)
    await fetch('/api/notion/update', { method: 'DELETE', headers: {'Content-Type':'application/json'}, body: JSON.stringify({id}) })
    setDeleting('')
    setDetail(null)
    load()
  }

  const filtered = receipts.filter(r =>
    (cat === '全部' || r.category === cat) &&
    (region === '所有地區' || r.region === region)
  )

  // 細項頁
  if (detail) {
    return (
      <div className="pb-24 px-4 pt-6">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => setDetail(null)} className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-base" style={{border:'0.5px solid #EDE5D8',color:'#6B4C35'}}>←</button>
          <h1 className="text-xl font-bold" style={{color:'#2C1F14'}}>支出細項</h1>
        </div>

        {/* 頂部橘色卡頭 */}
        <div style={{borderRadius:'16px',overflow:'hidden',border:'0.5px solid #EDE5D8',marginBottom:'12px'}}>
          <div style={{background:'#D4622A',padding:'16px'}}>
            <p className="text-xs mb-1" style={{color:'rgba(255,255,255,0.7)'}}>{detail.category}</p>
            <p className="text-lg font-bold text-white">{detail.items || detail.storeName}</p>
            <p className="text-3xl font-bold text-white mt-1" style={{letterSpacing:'-0.5px'}}>¥{detail.amountJPY.toLocaleString()}</p>
            <p className="text-xs mt-1" style={{color:'rgba(255,255,255,0.7)'}}>≈ NT${Math.round(detail.amountJPY * exchangeRate).toLocaleString()}</p>
          </div>
          <div style={{background:'white'}}>
            {[
              ['消費日期', detail.date],
              ['商店名稱', detail.storeName],
              detail.storeNameJa && ['商店日文', detail.storeNameJa],
              ['商品明細', detail.items],
              detail.itemsJa && ['商品日文', detail.itemsJa],
              ['付款人', detail.user],
              ['支付方式', detail.paymentMethod],
              ['地區', detail.region],
              detail.taxType && ['稅制', detail.taxType],
            ].filter(Boolean).map(([k, v]: any) => v && (
              <div key={k} className="flex justify-between px-4 py-2.5" style={{borderBottom:'0.5px solid #F5F0EB',fontSize:'13px'}}>
                <span style={{color:'#B8A898'}}>{k}</span>
                <span className="font-medium" style={{color:'#2C1F14'}}>{v}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2 p-3" style={{background:'#FBF8F4',borderTop:'0.5px solid #EDE5D8'}}>
            <Link href={`/add?edit=${detail.id}`} className="flex-1 py-2.5 rounded-xl text-center text-sm font-medium" style={{background:'white',border:'0.5px solid #EDE5D8',color:'#6B4C35'}}>✏️ 編輯</Link>
            <button onClick={() => del(detail.id!)} disabled={deleting === detail.id} className="flex-1 py-2.5 rounded-xl text-sm font-medium" style={{background:'white',border:'0.5px solid #F5C6C1',color:'#C0392B'}}>
              {deleting === detail.id ? '刪除中...' : '🗑 刪除'}
            </button>
          </div>
        </div>

        <nav className="nav-bar">
          <Link href="/" className="flex flex-col items-center gap-0.5" style={{color:'#B8A898'}}><span className="text-xl">🏠</span><span className="text-xs">首頁</span></Link>
          <Link href="/history" className="flex flex-col items-center gap-0.5" style={{color:'#D4622A'}}><span className="text-xl">📋</span><span className="text-xs font-medium">記錄</span></Link>
          <Link href="/scan" className="flex flex-col items-center gap-0.5" style={{color:'#B8A898'}}><span className="text-xl">📷</span><span className="text-xs">記帳</span></Link>
          <Link href="/stats" className="flex flex-col items-center gap-0.5" style={{color:'#B8A898'}}><span className="text-xl">📊</span><span className="text-xs">統計</span></Link>
          <Link href="/settings" className="flex flex-col items-center gap-0.5" style={{color:'#B8A898'}}><span className="text-xl">⚙️</span><span className="text-xs">設定</span></Link>
        </nav>
      </div>
    )
  }

  return (
    <div className="pb-24 px-4 pt-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold" style={{color:'#2C1F14'}}>歷史記錄</h1>
        <span className="text-sm" style={{color:'#B8A898'}}>{filtered.length} 筆</span>
      </div>

      {/* 類別篩選 */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-2 no-scrollbar">
        {CATS.map(c => (
          <button key={c} onClick={() => setCat(c)}
            className="px-3 py-1.5 rounded-full text-sm whitespace-nowrap flex-shrink-0 font-medium"
            style={cat===c ? {background:'#D4622A',color:'white'} : {background:'white',color:'#6B4C35',border:'0.5px solid #EDE5D8'}}>
            {c}
          </button>
        ))}
      </div>

      {/* 地區篩選 */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-3 no-scrollbar">
        {REGIONS.map(r => (
          <button key={r} onClick={() => setRegion(r)}
            className="px-3 py-1.5 rounded-full text-sm whitespace-nowrap flex-shrink-0 font-medium"
            style={region===r ? {background:'#2C1F14',color:'white'} : {background:'white',color:'#6B4C35',border:'0.5px solid #EDE5D8'}}>
            {r}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card text-center py-8" style={{color:'#B8A898'}}>載入中...</div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-8" style={{color:'#B8A898'}}>沒有符合的記錄</div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((r, i) => (
            <div key={r.id||i} className="card">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm" style={{color:'#2C1F14'}}>{r.items || r.storeName}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-xs" style={{color:'#B8A898'}}>{r.date}</span>
                    <span className="tag" style={CAT_COLOR[r.category] || CAT_COLOR['其他']}>{r.category}</span>
                    {r.user && <span className="text-xs" style={{color:'#B8A898'}}>· {r.user}</span>}
                  </div>
                </div>
                <div className="text-right ml-3">
                  <p className="font-bold text-sm" style={{color:'#D4622A'}}>¥{r.amountJPY.toLocaleString()}</p>
                  <p className="text-xs mt-0.5" style={{color:'#B8A898'}}>NT${Math.round(r.amountJPY * exchangeRate).toLocaleString()}</p>
                </div>
              </div>
              <div className="flex gap-2 pt-2" style={{borderTop:'0.5px solid #F5F0EB'}}>
                <Link href={`/add?edit=${r.id}`} className="flex-1 py-1.5 rounded-xl text-center text-xs font-medium" style={{background:'#FBF8F4',color:'#6B4C35'}}>編輯</Link>
                <button onClick={() => setDetail(r)} className="flex-1 py-1.5 rounded-xl text-xs font-medium" style={{background:'#FDF3EC',color:'#D4622A'}}>查看細項</button>
                <button onClick={() => del(r.id!)} disabled={deleting===r.id} className="flex-1 py-1.5 rounded-xl text-xs font-medium" style={{background:'#FEF0EE',color:'#C0392B'}}>
                  {deleting===r.id ? '...' : '刪除'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <nav className="nav-bar">
        <Link href="/" className="flex flex-col items-center gap-0.5" style={{color:'#B8A898'}}><span className="text-xl">🏠</span><span className="text-xs">首頁</span></Link>
        <Link href="/history" className="flex flex-col items-center gap-0.5" style={{color:'#D4622A'}}><span className="text-xl">📋</span><span className="text-xs font-medium">記錄</span></Link>
        <Link href="/scan" className="flex flex-col items-center gap-0.5" style={{color:'#B8A898'}}><span className="text-xl">📷</span><span className="text-xs">記帳</span></Link>
        <Link href="/stats" className="flex flex-col items-center gap-0.5" style={{color:'#B8A898'}}><span className="text-xl">📊</span><span className="text-xs">統計</span></Link>
        <Link href="/settings" className="flex flex-col items-center gap-0.5" style={{color:'#B8A898'}}><span className="text-xl">⚙️</span><span className="text-xs">設定</span></Link>
      </nav>
    </div>
  )
}
