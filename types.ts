export enum Status {
  Active = 'Active',
  Inactive = 'Inactive',
  Pending = 'Pending',
  Completed = 'Completed',
  Paid = 'Paid',
  Unpaid = 'Unpaid',
  Overdue = 'Overdue',
  LowStock = 'Low Stock',
  InStock = 'In Stock'
}

export interface Contact {
  id: string;
  name: string;
  relation: string;
  phone: string;
  email: string;
  isPrimary: boolean;
}

export interface Location {
  id: string;
  address: string;
  type: string;
  notes: string;
  isPrimary: boolean;
}

export interface Child {
  id: string;
  name: string;
  age: string;
  notes: string;
}

export interface Pet {
  id: string;
  name: string;
  type: string;
  notes: string;
}

export interface Client {
  id: string;
  name: string; // File/Family Name
  contacts: Contact[];
  locations: Location[];
  children: Child[];
  pets: Pet[];
  houseNotes: string;
  generalNotes: string;
}

export interface Appointment {
  id: string;
  clientId: string;
  clientName: string; // Denormalized for display ease
  date: string;
  time: string;
  serviceType: string;
  status: Status;
  address: string;
  rate: number;
  estimatedHours: number;
  notes: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface Invoice {
  id: string;
  clientId: string;
  appointmentId?: string;
  clientName: string;
  date: string; // Issue Date
  dueDate: string;
  status: Status;
  items: InvoiceItem[];
  notes: string;
  amount: number; // Total
}

export interface InventoryItem {
  id: string;
  itemName: string;
  quantity: number;
  unit: string;
  minThreshold: number;
  status: Status;
  supplier: string;
  cost: number;
  notes: string;
}

export type ViewState = 'DASHBOARD' | 'CLIENTS' | 'APPOINTMENTS' | 'INVOICES' | 'INVENTORY';