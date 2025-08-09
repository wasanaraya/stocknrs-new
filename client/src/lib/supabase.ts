import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zubrflyhzsmqngfbjkpg.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1YnJmbHloenNtcW5nZmJqa3BnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5MjA4NjAsImV4cCI6MjA2ODQ5Njg2MH0.SIDLeNDWphs1LxPLO5Mg37oCUB_8eAvfRIz5lCfle8g'

// ตรวจสอบว่า URL และ API key มีค่า
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase URL or API key')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type AccountCode = {
  id: number
  code: string
  name: string
}

export type Category = {
  id: string
  name: string
  description: string
  is_medicine?: boolean
  created_at?: string
}

export type Supplier = {
  id: string
  name: string
  email: string
  phone: string
  address: string
  created_at?: string
}

export type Product = {
  id: string
  name: string
  sku: string
  description?: string
  category_id: string
  supplier_id: string
  unit_price: number
  current_stock: number
  min_stock: number
  max_stock?: number
  unit?: string
  location?: string
  barcode?: string
  expiry_date?: string
  created_at?: string
  updated_at?: string
}

export type Movement = {
  id: string
  product_id: string
  type: 'in' | 'out'
  quantity: number
  reason: string
  reference?: string
  notes?: string
  created_at: string
  created_by?: string
}

export type BudgetRequest = {
  id: number
  request_no: string
  requester: string
  request_date: string
  account_code: string
  account_name?: string  // เพิ่ม field นี้
  amount: number
  purpose?: string       // เพิ่ม field นี้
  note?: string
  material_list: Array<{
    item: string
    quantity: string
  }>
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  created_at: string
}

export type Approval = {
  id: string
  request_id: string
  decision: string
  remark?: string
  approver_name: string
  created_at: string
}