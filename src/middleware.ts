import { NextRequest, NextResponse } from 'next/server'

const PASSWORD = '202606'
const COOKIE = 'auth-token'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // API routes don't need password
  if (pathname.startsWith('/api')) return NextResponse.next()
  // Login page itself doesn't need password
  if (pathname === '/login') return NextResponse.next()

  const token = req.cookies.get(COOKIE)?.value
  if (token === PASSWORD) return NextResponse.next()

  // Redirect to login
  const url = req.nextUrl.clone()
  url.pathname = '/login'
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.json).*)']
}
