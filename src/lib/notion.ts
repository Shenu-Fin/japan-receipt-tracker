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
      sorts: [{ property: '消費日期', direction: 'descending' }]
    })

    for (const page of res.results) {
      if (!('properties' in page)) continue
      const p = page.properties as Record<string, any>
      results.push({
        id: page.id,
        storeName: p['商店名稱']?.rich_text?.[0]?.plain_text || '',
        storeNameJa: p['商店日文']?.rich_text?.[0]?.plain_text || '',
        items: p['支出項目']?.title?.[0]?.plain_text || '',
        itemsJa: p['商品日文']?.rich_text?.[0]?.plain_text || '',
        amountJPY: p['支出金額(JPY)']?.number || 0,
        amountTWD: p['台幣花費']?.formula?.number || p['台幣花費']?.number || 0,
        taxType: p['稅制']?.rich_text?.[0]?.plain_text || '',
        category: p['類別']?.select?.name || '其他',
        paymentMethod: p['支付方式']?.rich_text?.[0]?.plain_text || '現金',
        date: p['消費日期']?.date?.start || '',
        region: p['地區']?.rich_text?.[0]?.plain_text || '',
        user: p['付款人']?.rich_text?.[0]?.plain_text || '',
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
      '支出項目':      { title: [{ text: { content: r.items || r.storeName } }] },
      '商店名稱':      { rich_text: [{ text: { content: r.storeName } }] },
      '商店日文':      { rich_text: [{ text: { content: r.storeNameJa } }] },
      '商品中文':      { rich_text: [{ text: { content: r.items } }] },
      '商品日文':      { rich_text: [{ text: { content: r.itemsJa } }] },
      '消費日期':      { date: { start: r.date } },
      '支出金額(JPY)': { number: r.amountJPY },
      '類別':          { select: { name: r.category === '餐飲' ? '飲食類' :
                                         r.category === '交通' ? '交通類' :
                                         r.category === '住宿' ? '住宿類' :
                                         r.category === '門票' ? '娛樂類' :
                                         r.category === '購物' ? '購物類' :
                                         r.category === '藥品' ? '藥品類' : '其他類' } },
      '支付方式':      { rich_text: [{ text: { content: r.paymentMethod } }] },
      '付款人':        { rich_text: [{ text: { content: r.user } }] },
      '地區':          { rich_text: [{ text: { content: r.region } }] },
      '稅制':          { rich_text: [{ text: { content: r.taxType } }] },
    }
  })
}

export async function updateReceipt(id: string, r: Partial<Receipt>) {
  invalidateCache()
  const props: Record<string, any> = {}
  if (r.items || r.storeName) props['支出項目'] = { title: [{ text: { content: r.items || r.storeName } }] }
  if (r.storeName)     props['商店名稱']      = { rich_text: [{ text: { content: r.storeName } }] }
  if (r.storeNameJa)   props['商店日文']      = { rich_text: [{ text: { content: r.storeNameJa } }] }
  if (r.items)         props['商品中文']      = { rich_text: [{ text: { content: r.items } }] }
  if (r.itemsJa)       props['商品日文']      = { rich_text: [{ text: { content: r.itemsJa } }] }
  if (r.date)          props['消費日期']      = { date: { start: r.date } }
  if (r.amountJPY)     props['支出金額(JPY)'] = { number: r.amountJPY }
  if (r.category)      props['類別']          = { select: { name: r.category === '餐飲' ? '飲食類' :
                                                                    r.category === '交通' ? '交通類' :
                                                                    r.category === '住宿' ? '住宿類' :
                                                                    r.category === '門票' ? '娛樂類' :
                                                                    r.category === '購物' ? '購物類' :
                                                                    r.category === '藥品' ? '藥品類' : '其他類' } }
  if (r.paymentMethod) props['支付方式']      = { rich_text: [{ text: { content: r.paymentMethod } }] }
  if (r.user)          props['付款人']        = { rich_text: [{ text: { content: r.user } }] }
  if (r.region)        props['地區']          = { rich_text: [{ text: { content: r.region } }] }
  if (r.note !== undefined) props['稅制']     = { rich_text: [{ text: { content: r.note } }] }
  return notion.pages.update({ page_id: id, properties: props })
}

export async function deleteReceipt(id: string) {
  invalidateCache()
  return notion.pages.update({ page_id: id, archived: true })
}
