import { Client } from '@notionhq/client'
import { Receipt } from './types'

const notion = new Client({ auth: process.env.NOTION_TOKEN })
const DB = process.env.NOTION_DATABASE_ID!

// 類別對應到預算表的 Page ID（Relation）
const CATEGORY_PAGE_IDS: Record<string, string> = {
  '餐飲':  '33dde197da928069b8a8d7dfe5b0dc8a', // 飲食類
  '飲食類':'33dde197da928069b8a8d7dfe5b0dc8a',
  '交通':  '33dde197da92809aa4c8e83a6389f52f', // 交通類
  '交通類':'33dde197da92809aa4c8e83a6389f52f',
  '住宿':  '33dde197da9280cf9701c5a38d2f53e8', // 住宿類
  '住宿類':'33dde197da9280cf9701c5a38d2f53e8',
  '門票':  '33dde197da9280558559e664af0e42e0', // 娛樂類
  '娛樂類':'33dde197da9280558559e664af0e42e0',
  '購物':  '33fde197da9280a6a046c5dde0270d2a', // 購物類
  '購物類':'33fde197da9280a6a046c5dde0270d2a',
  '藥品':  '33dde197da928069b8a8d7dfe5b0dc8a', // 藥品歸飲食類
  '景點':  '33fde197da928026adb9ccc35ff3fd40', // 景點類
  '景點類':'33fde197da928026adb9ccc35ff3fd40',
  '其他':  '33dde197da9280558559e664af0e42e0', // 其他歸娛樂類
}

let cache: { data: Receipt[]; ts: number } | null = null
const TTL = 3 * 60 * 1000

export async function getReceipts(): Promise<Receipt[]> {
  if (cache && Date.now() - cache.ts < TTL) return cache.data

  const results: Receipt[] = []
  let cursor: string | undefined

  do {
    const res = await (notion as any).databases.query({
      database_id: DB,
      start_cursor: cursor,
      sorts: [{ property: '消費日期', direction: 'descending' }]
    })

    for (const page of res.results) {
      if (!('properties' in page)) continue
      const p = page.properties as Record<string, any>

      // 類別從 relation 取得名稱
      const categoryRelation = p['類別']?.relation || []
      const categoryId = categoryRelation[0]?.id || ''

      results.push({
        id: page.id,
        storeName: p['商店名稱']?.rich_text?.[0]?.plain_text || '',
        storeNameJa: p['商店日文']?.rich_text?.[0]?.plain_text || '',
        items: p['支出項目']?.title?.[0]?.plain_text || '',
        itemsJa: p['商品日文']?.rich_text?.[0]?.plain_text || '',
        amountJPY: p['支出金額']?.number || 0,
        amountTWD: p['台幣花費']?.number || 0,
        taxType: p['稅制']?.rich_text?.[0]?.plain_text || '',
        category: getCategoryName(categoryId),
        paymentMethod: p['支付方式']?.rich_text?.[0]?.plain_text || '現金',
        date: p['消費日期']?.date?.start || '',
        region: p['地區']?.rich_text?.[0]?.plain_text || '',
        user: p['付款人']?.rich_text?.[0]?.plain_text || '',
        note: p['稅制']?.rich_text?.[0]?.plain_text || ''
      })
    }

    cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined
  } while (cursor)

  cache = { data: results, ts: Date.now() }
  return results
}

function getCategoryName(pageId: string): any {
  const map: Record<string, string> = {
    '33dde197da928069b8a8d7dfe5b0dc8a': '餐飲',
    '33dde197da92809aa4c8e83a6389f52f': '交通',
    '33dde197da9280cf9701c5a38d2f53e8': '住宿',
    '33dde197da9280558559e664af0e42e0': '門票',
    '33fde197da9280a6a046c5dde0270d2a': '購物',
    '33fde197da928026adb9ccc35ff3fd40': '景點',
  }
  return map[pageId.replace(/-/g, '')] || '其他'
}

export function invalidateCache() { cache = null }

export async function addReceipt(r: Receipt) {
  invalidateCache()

  const categoryPageId = CATEGORY_PAGE_IDS[r.category]

  const props: Record<string, any> = {
    '支出項目': { title: [{ text: { content: r.items || r.storeName } }] },
    '支出金額': { number: r.amountJPY },
    '消費日期': { date: { start: r.date } },
    '付款人':   { rich_text: [{ text: { content: r.user } }] },
    '商品中文': { rich_text: [{ text: { content: r.items } }] },
    '商品日文': { rich_text: [{ text: { content: r.itemsJa } }] },
    '商店名稱': { rich_text: [{ text: { content: r.storeName } }] },
    '商店日文': { rich_text: [{ text: { content: r.storeNameJa } }] },
    '地區':     { rich_text: [{ text: { content: r.region } }] },
    '支付方式': { rich_text: [{ text: { content: r.paymentMethod } }] },
    '稅制':     { rich_text: [{ text: { content: r.taxType } }] },
    '台幣花費': { number: r.amountTWD },
  }

  if (categoryPageId) {
    props['類別'] = { relation: [{ id: categoryPageId }] }
  }

  return (notion as any).pages.create({
    parent: { database_id: DB },
    properties: props
  })
}

export async function updateReceipt(id: string, r: Partial<Receipt>) {
  invalidateCache()
  const props: Record<string, any> = {}
  if (r.items || r.storeName) props['支出項目'] = { title: [{ text: { content: r.items || r.storeName } }] }
  if (r.amountJPY)     props['支出金額'] = { number: r.amountJPY }
  if (r.amountTWD)     props['台幣花費'] = { number: r.amountTWD }
  if (r.date)          props['消費日期'] = { date: { start: r.date } }
  if (r.user)          props['付款人']   = { rich_text: [{ text: { content: r.user } }] }
  if (r.items)         props['商品中文'] = { rich_text: [{ text: { content: r.items } }] }
  if (r.itemsJa)       props['商品日文'] = { rich_text: [{ text: { content: r.itemsJa } }] }
  if (r.storeName)     props['商店名稱'] = { rich_text: [{ text: { content: r.storeName } }] }
  if (r.storeNameJa)   props['商店日文'] = { rich_text: [{ text: { content: r.storeNameJa } }] }
  if (r.region)        props['地區']     = { rich_text: [{ text: { content: r.region } }] }
  if (r.paymentMethod) props['支付方式'] = { rich_text: [{ text: { content: r.paymentMethod } }] }
  if (r.taxType)       props['稅制']     = { rich_text: [{ text: { content: r.taxType } }] }
  if (r.category) {
    const categoryPageId = CATEGORY_PAGE_IDS[r.category]
    if (categoryPageId) props['類別'] = { relation: [{ id: categoryPageId }] }
  }
  return (notion as any).pages.update({ page_id: id, properties: props })
}

export async function deleteReceipt(id: string) {
  invalidateCache()
  return (notion as any).pages.update({ page_id: id, archived: true })
}
