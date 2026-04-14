'use client'
import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ScanPage() {
  const router  = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  async function handleFile(file: File) {
    setLoading(true); setError('')
    const reader = new FileReader()
    reader.onload = async (e) => {
      const b64 = (e.target?.result as string).split(',')[1]
      try {
        const res  = await fetch('/api/analyze', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({base64:b64,mimeType:file.type})})
        const data = await res.json()
        if (data.error) { setError(data.error); setLoading(false); return }
        sessionStorage.setItem('scan-result', JSON.stringify(data))
        router.push('/scan/confirm')
      } catch { setError('辨識失敗，請重試'); setLoading(false) }
    }
    reader.readAsDataURL(file)
  }

  const NI = 'rgba(255,255,255,0.4)'

  return (
    <div className="pb-24 px-4 pt-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="w-9 h-9 rounded-full flex items-center justify-center text-base" style={{background:'#1E2048',border:'0.5px solid #2E3060',color:'#E8E8F4'}}>←</Link>
        <h1 className="text-xl font-bold text-white">記帳</h1>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <button onClick={()=>fileRef.current?.click()} disabled={loading}
          className="card flex flex-col items-center py-6 active:scale-95 transition-transform cursor-pointer">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-3" style={{background:'#2A2060'}}>📷</div>
          <span className="font-semibold text-sm text-white">掃描收據</span>
          <span className="text-xs mt-0.5" style={{color:'#6B6E9A'}}>AI 自動辨識</span>
        </button>
        <Link href="/add" className="card flex flex-col items-center py-6 active:scale-95 transition-transform">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-3" style={{background:'#1A2A3A'}}>✏️</div>
          <span className="font-semibold text-sm text-white">手動輸入</span>
          <span className="text-xs mt-0.5" style={{color:'#6B6E9A'}}>沒有收據時</span>
        </Link>
      </div>

      {loading && (
        <div className="card text-center py-6 mb-4">
          <p className="text-lg mb-1">🤖</p>
          <p className="font-medium" style={{color:'#A78BFA'}}>AI 辨識中...</p>
          <p className="text-xs mt-1" style={{color:'#6B6E9A'}}>請稍候</p>
        </div>
      )}
      {error && (
        <div className="card mb-4 px-4 py-3" style={{background:'#3A1F1F',borderColor:'#5A2F2F'}}>
          <p className="text-sm font-medium" style={{color:'#F87171'}}>⚠ {error}</p>
        </div>
      )}

      <div className="card">
        <p className="text-sm font-semibold mb-3 text-white">📌 拍攝小技巧</p>
        <div className="space-y-2">
          {['確保收據攤平，光線充足','拍完整，包含店名和合計金額','避免反光和模糊'].map((t,i)=>(
            <div key={i} className="flex items-start gap-2">
              <span className="text-xs mt-0.5" style={{color:'#A78BFA'}}>·</span>
              <span className="text-sm" style={{color:'#B0B3D4'}}>{t}</span>
            </div>
          ))}
        </div>
      </div>

      <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden"
        onChange={e=>e.target.files?.[0]&&handleFile(e.target.files[0])} />

      <nav className="nav-bar">
        <Link href="/" className="flex flex-col items-center gap-0.5" style={{color:NI}}><span className="text-xl">🏠</span><span className="text-xs">首頁</span></Link>
        <Link href="/history" className="flex flex-col items-center gap-0.5" style={{color:NI}}><span className="text-xl">📋</span><span className="text-xs">記錄</span></Link>
        <Link href="/scan" className="flex flex-col items-center gap-0.5" style={{color:'#A78BFA'}}><span className="text-xl">📷</span><span className="text-xs font-medium">記帳</span></Link>
        <Link href="/stats" className="flex flex-col items-center gap-0.5" style={{color:NI}}><span className="text-xl">📊</span><span className="text-xs">統計</span></Link>
        <Link href="/settings" className="flex flex-col items-center gap-0.5" style={{color:NI}}><span className="text-xl">⚙️</span><span className="text-xs">設定</span></Link>
      </nav>
    </div>
  )
}
