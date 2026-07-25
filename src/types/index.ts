export type ServiceType = 'rinpa' | 'counselor';

export interface Menu {
  id: string;
  service_type?: ServiceType;
  name: string;
  price: number;
  duration_minutes: number;
  customer_duration_minutes: number;
  provider_duration_minutes: number;
  description?: string;
  is_active: boolean;
  sort_order: number;
}

export interface User {
  id: string;
  line_user_id: string;
  name: string;
  phone: string;
  email: string;
  is_first_visit: boolean;
  created_at: string;
}

// カウンセラー予約で使用する場所マスタ（リンパ側では表示のみ）
export interface Location {
  id: string;
  name: string;
  address: string;
  is_active: boolean;
  sort_order: number;
}

export interface Reservation {
  id: string;
  user_id: string;
  menu_id: string;
  location_id?: string | null;
  location_note?: string | null;
  date: string;
  time: string;
  status: 'confirmed' | 'cancelled';
  referrer_name?: string;
  created_at: string;
  user?: User;
  menu?: Menu;
  location?: Location | null;
}

export interface ReservationState {
  selectedMenu: Menu | null;
  selectedDate: string | null;
  selectedTime: string | null;
  referrerName: string;
}

export type Step = 'menu' | 'calendar' | 'time' | 'form' | 'confirm' | 'complete';

export interface AvailableSlot {
  id: string;
  date: string;
  time: string;
}
