import { Client } from '@notionhq/client'
import { Receipt } from './types'

const notion = new Client({ auth: process.env.NOTION_TOKEN })
const DB = process.env.NOTION_DATABASE_ID!

let cache: { data: Receipt[]; ts: number } | null = null
const TTL = 3 * 60 * 1000

export async function getReceipts(): Promise<Receipt[]> {
  if (cache && Date.now() - cache.ts < TTL) return cache.data

  const results: Receipt[] = []
  let cursor: string | undefined

  do {
    const res = await notion.databases.query({
      database_id: DB,
      start_cursor: cursor,
      sorts: [{ property: '日期', direction: 'descending' }]
    })

    for (const page of res.results) {
      if (!('properties' in page)) continue
      const p = page.properties as Record<string, any>
      results.push({
        id: page.id,
        storeName: p['商店名稱']?.rich_text?.[0]?.plain_text || p['商店名稱']?.title?.[0]?.plain_text || '',
        storeNameJa: p['商店日文']?.rich_text?.[0]?.plain_text || '',
        items: p['項目']?.title?.[0]?.plain_text || p['項目']?.rich_text?.[0]?.plain_text || '',
        itemsJa: p['商品日文']?.rich_text?.[0]?.plain_text || '',
        amountJPY: p['金額 (JPY)']?.number || 0,
        amountTWD: p['金額 (TWD)']?.formula?.number || p['金額 (TWD)']?.number || 0,
        taxType: p['稅制']?.rich_text?.[0]?.plain_text || '',
        category: p['類別']?.select?.name || '其他',
        paymentMethod: p['支付方式']?.select?.name || '現金',
        date: p['日期']?.date?.start || '',
        region: p['地區']?.select?.name || '其他',
        user: p['用戶']?.rich_text?.[0]?.plain_text || '',
        note: p['備註']?.rich_text?.[0]?.plain_text || ''
      })
    }

    cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined
  } while (cursor)

  cache = { data: results, ts: Date.now() }
  return results
}

export function invalidateCache() { cache = null }

export async function addReceipt(r: Receipt) {
  invalidateCache()
  return notion.pages.create({
    parent: { database_id: DB },
    properties: {
      '項目':       { title: [{ text: { content: r.items } }] },
      '商店名稱':   { rich_text: [{ text: { content: r.storeName } }] },
      '商店日文':   { rich_text: [{ text: { content: r.storeNameJa } }] },
      '商品日文':   { rich_text: [{ text: { content: r.itemsJa } }] },
      '日期':       { date: { start: r.date } },
      '金額 (JPY)': { number: r.amountJPY },
      '類別':       { select: { name: r.category } },
      '支付方式':   { select: { name: r.paymentMethod } },
      '地區':       { select: { name: r.region } },
      '用戶':       { rich_text: [{ text: { content: r.user } }] },
      '稅制':       { rich_text: [{ text: { content: r.taxType } }] },
      '備註':       { rich_text: [{ text: { content: r.note } }] }
    }
  })
}

export async function updateReceipt(id: string, r: Partial<Receipt>) {
  invalidateCache()
  const props: Record<string, any> = {}
  if (r.items)         props['項目']       = { title: [{ text: { content: r.items } }] }
  if (r.storeName)     props['商店名稱']   = { rich_text: [{ text: { content: r.storeName } }] }
  if (r.storeNameJa)   props['商店日文']   = { rich_text: [{ text: { content: r.storeNameJa } }] }
  if (r.itemsJa)       props['商品日文']   = { rich_text: [{ text: { content: r.itemsJa } }] }
  if (r.date)          props['日期']       = { date: { start: r.date } }
  if (r.amountJPY)     props['金額 (JPY)'] = { number: r.amountJPY }
  if (r.category)      props['類別']       = { select: { name: r.category } }
  if (r.paymentMethod) props['支付方式']   = { select: { name: r.paymentMethod } }
  if (r.region)        props['地區']       = { select: { name: r.region } }
  if (r.user)          props['用戶']       = { rich_text: [{ text: { content: r.user } }] }
  if (r.note !== undefined) props['備註']  = { rich_text: [{ text: { content: r.note } }] }
  return notion.pages.update({ page_id: id, properties: props })
}

export async function deleteReceipt(id: string) {
  invalidateCache()
  return notion.pages.update({ page_id: id, archived: true })
}
