import { Client } from '@notionhq/client'
import { Receipt } from './types'

const notion = new Client({ auth: process.env.NOTION_TOKEN })
const DB = process.env.NOTION_DATABASE_ID!

// 動態查詢的類別快取
let categoryCache: { idToName: Record<string, string>; nameToId: Record<string, string>; ts: number } | null = null
const CATEGORY_TTL = 60 * 60 * 1000 // 1小時

async function getCategoryMaps() {
  if (categoryCache && Date.now() - categoryCache.ts < CATEGORY_TTL) return categoryCache

  try {
    // 從支出表的類別欄位找到關聯的預算表 database ID
    const dbInfo = await (notion as any).databases.retrieve({ database_id: DB })
    const categoryProp = dbInfo.properties?.['類別']
    const budgetDbId = categoryProp?.relation?.database_id

    if (!budgetDbId) {
      categoryCache = { idToName: {}, nameToId: {}, ts: Date.now() }
      return categoryCache
    }

    // 查詢預算表所有類別
    const res = await (notion as any).databases.query({ database_id: budgetDbId })
    const idToName: Record<string, string> = {}
    const nameToId: Record<string, string> = {}

    for (const page of res.results) {
      if (!('properties' in page)) continue
      const p = page.properties as Record<string, any>
      const name = p['類別']?.title?.[0]?.plain_text || ''
      const id = page.id.replace(/-/g, '')
      if (name) {
        idToName[id] = name
        nameToId[name] = id
        // 同時建立常用別名
        const alias: Record<string, string> = {
          '飲食類': '餐飲', '交通類': '交通', '住宿類': '住宿',
          '娛樂類': '門票', '購物類': '購物', '景點類': '景點', '藥品類': '藥品'
        }
        if (alias[name]) nameToId[alias[name]] = id
      }
    }

    categoryCache = { idToName, nameToId, ts: Date.now() }
    return categoryCache
  } catch {
    categoryCache = { idToName: {}, nameToId: {}, ts: Date.now() }
    return categoryCache
  }
}

let cache: { data: Receipt[]; ts: number } | null = null
const TTL = 3 * 60 * 1000

export async function getReceipts(): Promise<Receipt[]> {
  if (cache && Date.now() - cache.ts < TTL) return cache.data

  const { idToName } = await getCategoryMaps()
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
      const categoryRelation = p['類別']?.relation || []
      const categoryId = (categoryRelation[0]?.id || '').replace(/-/g, '')
      const categoryName = idToName[categoryId] || '其他'

      results.push({
        id: page.id,
        storeName: p['商店名稱']?.rich_text?.[0]?.plain_text || '',
        storeNameJa: p['商店日文']?.rich_text?.[0]?.plain_text || '',
        items: p['支出項目']?.title?.[0]?.plain_text || '',
        itemsJa: p['商品日文']?.rich_text?.[0]?.plain_text || '',
        amountJPY: p['支出金額']?.number || 0,
        amountTWD: p['台幣花費']?.number || 0,
        taxType: p['稅制']?.rich_text?.[0]?.plain_text || '',
        category: categoryName,
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

export function invalidateCache() {
  cache = null
}

export async function addReceipt(r: Receipt) {
  invalidateCache()
  const { nameToId } = await getCategoryMaps()
  const categoryPageId = nameToId[r.category]

  const props: Record<string, any> = {
    '支出項目': { title: [{ text: { content: (r as any).shortTitle || r.storeName || r.items || '' } }] },
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
  const { nameToId } = await getCategoryMaps()
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
    const pageId = nameToId[r.category]
    if (pageId) props['類別'] = { relation: [{ id: pageId }] }
  }

  return (notion as any).pages.update({ page_id: id, properties: props })
}

export async function deleteReceipt(id: string) {
  invalidateCache()
  return (notion as any).pages.update({ page_id: id, archived: true })
}
