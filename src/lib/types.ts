export interface Receipt {
  id?: string
  storeName: string
  storeNameJa: string
  items: string
  itemsJa: string
  amountJPY: number
  amountTWD: number
  taxType: string
  category: Category
  paymentMethod: PaymentMethod
  date: string
  region: Region
  user: string
  note: string
}

export type Category = '餐飲' | '交通' | '購物' | '門票' | '住宿' | '藥品' | '其他'
export type PaymentMethod = '現金' | '信用卡' | 'Suica' | 'PayPay' | '其他'
export type Region = '東京' | '大阪' | '京都' | '名古屋' | '北海道' | '福岡' | '其他'

export interface AppSettings {
  budget: number
  budgetNote: string
  exchangeRate: number
  tripDays: number
  tripSchedule: string
  users: string[]
}

export const CATEGORIES: Category[] = ['餐飲', '交通', '購物', '門票', '住宿', '藥品', '其他']
export const PAYMENT_METHODS: PaymentMethod[] = ['現金', '信用卡', 'Suica', 'PayPay', '其他']
export const REGIONS: Region[] = ['東京', '大阪', '京都', '名古屋', '北海道', '福岡', '其他']

export const DEFAULT_SETTINGS: AppSettings = {
  budget: 300000,
  budgetNote: '',
  exchangeRate: 0.21,
  tripDays: 14,
  tripSchedule: '',
  users: ['旅伴1', '旅伴2', '旅伴3']
}
