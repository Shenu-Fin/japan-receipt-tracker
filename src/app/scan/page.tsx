'use client'
import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const AC = '#F2B705', MU = '#B8AFA6'

export default function ScanPage() {
  const router=useRouter(), fileRef=useRef<HTMLInputElement>(null)
  const [loading,setLoading]=useState(false), [error,setError]=useState('')

  async function handleFile(file:File) {
    setLoading(true); setError('')
    const reader=new FileReader()
    reader.onload=async(e)=>{
      const b64=(e.target?.result as string).split(',')[1]
      try {
        const res=await fetch('/api/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({base64:b64,mimeType:file.type})})
        const data=await res.json()
        if(data.error){setError(data.error);setLoading(false);return}
        sessionStorage.setItem('scan-result',JSON.stringify(data))
        router.push('/scan/confirm')
      } catch{setError('辨識失敗，請重試');setLoading(false)}
    }
    reader.readAsDataURL(file)
  }

  const navItems=[
    {href:'/',icon:'🏠',label:'首頁',active:false},
    {href:'/history',icon:'📋',label:'記錄',active:false},
    {href:'/scan',icon:'📷',label:'記帳',active:true},
    {href:'/stats',icon:'📊',label:'統計',active:false},
    {href:'/settings',icon:'⚙️',label:'設定',active:false},
  ]

  return (
    <div className="pb-24 px-4 pt-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-sm font-medium" style={{border:'1px solid #EDE7DD',color:'#1A1A1A',boxShadow:'0 1px 3px rgba(0,0,0,0.06)'}}>←</Link>
        <h1 className="font-display text-2xl" style={{color:'#1A1A1A'}}>記帳</h1>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <button onClick={()=>fileRef.current?.click()} disabled={loading}
          className="card flex flex-col items-center py-7 active:scale-95 transition-transform cursor-pointer">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-3" style={{background:'#FEF3C7'}}>📷</div>
          <span className="font-semibold text-sm" style={{color:'#1A1A1A'}}>掃描收據</span>
          <span className="text-xs mt-1" style={{color:MU}}>AI 自動辨識</span>
        </button>
        <Link href="/add" className="card flex flex-col items-center py-7 active:scale-95 transition-transform">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-3" style={{background:'#DBEAFE'}}>✏️</div>
          <span className="font-semibold text-sm" style={{color:'#1A1A1A'}}>手動輸入</span>
          <span className="text-xs mt-1" style={{color:MU}}>沒有收據時</span>
        </Link>
      </div>

      {loading && (
        <div className="card text-center py-6 mb-4">
          <p className="text-2xl mb-2">🤖</p>
          <p className="font-semibold text-sm" style={{color:'#1A1A1A'}}>AI 辨識中...</p>
          <p className="text-xs mt-1" style={{color:MU}}>請稍候</p>
        </div>
      )}
      {error && (
        <div className="card mb-4 px-4 py-3" style={{background:'#FEE2E2',borderColor:'#FECACA'}}>
          <p className="text-sm font-medium" style={{color:'#991B1B'}}>⚠ {error}</p>
        </div>
      )}

      <div className="card">
        <p className="font-semibold text-sm mb-3" style={{color:'#1A1A1A'}}>📌 拍攝小技巧</p>
        {['確保收據攤平，光線充足','拍完整，包含店名和合計金額','避免反光和模糊'].map((t,i)=>(
          <div key={i} className="flex items-start gap-2 mb-2">
            <span className="text-xs mt-0.5 font-bold gold">·</span>
            <span className="text-sm" style={{color:'#5C4F44'}}>{t}</span>
          </div>
        ))}
      </div>

      <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden"
        onChange={e=>e.target.files?.[0]&&handleFile(e.target.files[0])} />

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
