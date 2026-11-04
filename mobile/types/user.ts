export interface User {
  id: number;
  email: string;
  name: string;
  phone_number: string;
  role: 'CITIZEN' | 'COLLECTOR' | 'ADMIN';
  verification_status: 'PENDING' | 'APPROVED' | 'REJECTED';
  collector_profile?: CollectorProfile;
}

export interface CollectorProfile {
  id: number;
  user: number;
  user_email: string;
  user_name: string;
  user_phone: string;
  wallet_balance: string;
  vehicle_number: string;
  vehicle_type: string;
  vehicle_capacity_kg: number | null;
  vehicle_capacity_pickups: number;
  license_number: string;
  hub: number;
  hub_name: string;
  hub_city: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Hub {
  id: number;
  name: string;
  city: number;
  city_name: string;
  latitude: number;
  longitude: number;
  address: string;
  is_active: boolean;
  collectors_count: number;
  created_at: string;
  updated_at: string;
}

export interface City {
  id: number;
  name: string;
  state: string;
  is_active: boolean;
  active_hub: number | null;
  active_hub_name: string | null;
  has_active_collectors: boolean;
  created_at: string;
  updated_at: string;
}

export interface CollectorWithHub {
  hub: Hub;
  collectors: CollectorProfile[];
  total_collectors: number;
}

export interface RegisterCollectorData {
  email: string;
  name: string;
  phone_number: string;
  password: string;
  vehicle_number?: string;
  vehicle_type?: string;
  vehicle_capacity_kg?: number;
  vehicle_capacity_pickups?: number;
  license_number?: string;
  hub_id: number;
}

export interface UpdateVehicleData {
  vehicle_number?: string;
  vehicle_type?: string;
  vehicle_capacity_kg?: number | null;
  vehicle_capacity_pickups?: number;
  license_number?: string;
  hub?: number | null;
}
