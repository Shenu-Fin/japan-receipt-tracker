'use client'
import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ScanPage() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleFile(file: File) {
    setLoading(true)
    setError('')
    try {
      const base64 = await new Promise<string>((res, rej) => {
        const reader = new FileReader()
        reader.onload = () => res((reader.result as string).split(',')[1])
        reader.onerror = rej
        reader.readAsDataURL(file)
      })
      const resp = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64, mimeType: file.type })
      })
      const data = await resp.json()
      if (data.error) throw new Error(data.error)
      sessionStorage.setItem('scan-result', JSON.stringify(data))
      router.push('/scan/confirm')
    } catch (e: any) {
      setError(e.message || '辨識失敗，請重試')
      setLoading(false)
    }
  }

  return (
    <div className="pb-24 px-4 pt-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-sm">←</Link>
        <h1 className="text-xl font-bold">掃描收據</h1>
      </div>

      {loading ? (
        <div className="card text-center py-16">
          <div className="text-5xl mb-4 animate-pulse">🤖</div>
          <p className="font-medium text-lg">AI 辨識中...</p>
          <p className="text-gray-400 text-sm mt-2">正在翻譯日文收據</p>
        </div>
      ) : (
        <>
          <div
            className="card flex flex-col items-center py-12 mb-4 cursor-pointer border-2 border-dashed border-orange-200 active:scale-95 transition-transform"
            onClick={() => inputRef.current?.click()}
          >
            <span className="text-5xl mb-4">📷</span>
            <p className="font-medium text-lg">拍照或選擇圖片</p>
            <p className="text-gray-400 text-sm mt-1">支援 JPG、PNG 格式</p>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
          />

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 text-red-600 text-sm">
              ⚠️ {error}
            </div>
          )}

          <div className="card mb-4">
            <p className="text-sm font-medium mb-2">📌 拍攝小技巧</p>
            <ul className="text-sm text-gray-500 space-y-1">
              <li>• 確保收據攤平，光線充足</li>
              <li>• 拍完整，包含店名和合計金額</li>
              <li>• 避免反光和模糊</li>
            </ul>
          </div>

          <Link href="/add" className="btn-secondary text-center block">
            沒有收據？手動輸入
          </Link>
        </>
      )}

      <nav className="nav-bar">
        <Link href="/" className="flex flex-col items-center text-gray-400">
          <span className="text-xl">🏠</span><span className="text-xs mt-0.5">首頁</span>
        </Link>
        <Link href="/scan" className="flex flex-col items-center text-orange-500">
          <span className="text-xl">📷</span><span className="text-xs mt-0.5">掃描</span>
        </Link>
        <Link href="/history" className="flex flex-col items-center text-gray-400">
          <span className="text-xl">📋</span><span className="text-xs mt-0.5">記錄</span>
        </Link>
        <Link href="/stats" className="flex flex-col items-center text-gray-400">
          <span className="text-xl">📊</span><span className="text-xs mt-0.5">統計</span>
        </Link>
      </nav>
    </div>
  )
}
