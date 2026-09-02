export type UserRole = 'retail' | 'wholesale' | 'admin';

export interface Profile {
  id: string;
  full_name: string;
  mobile: string;
  email: string;
  role: UserRole;
  business_name?: string;
  trade_license?: string;
  wholesale_status?: 'pending' | 'under_review' | 'approved' | 'rejected' | 'suspended';
  created_at: string;
  updated_at: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  sort_order: number;
}

export interface Service {
  id: string;
  name: string;
  category_id: string;
  description: string;
  thumbnail: string;
  icon: string;
  retail_price: number;
  wholesale_price: number;
  processing_time: string;
  required_fields: any; // JSON
  instructions: string;
  terms: string;
  is_active: boolean;
  sort_order: number;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  service_id: string;
  price: number;
  payment_status: 'pending' | 'paid' | 'rejected' | 'refunded';
  order_status: 'pending' | 'processing' | 'need_info' | 'completed' | 'rejected' | 'cancelled';
  required_info: any; // JSON
  admin_note?: string;
  customer_note?: string;
  created_at: string;
  updated_at: string;
}

export interface WholesaleApplication {
  id: string;
  user_id: string;
  business_name: string;
  business_type: string;
  address: string;
  expected_monthly_orders: string;
  reason: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'suspended';
  created_at: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  created_at: string;
  updated_at: string;
}

export interface WalletTransaction {
  id: string;
  wallet_id: string;
  type: 'deposit' | 'order_payment' | 'refund' | 'admin_adjustment' | 'bonus' | 'withdrawal';
  amount: number;
  status: 'pending' | 'completed' | 'rejected';
  reference_id?: string;
  notes?: string;
  created_at: string;
}
