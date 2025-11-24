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
  checklist?: ChecklistItem[];
}

export interface ChecklistItem {
  id: string;
  task: string;
  frequency: 'Every Time' | 'Every Other Time' | 'Monthly';
  completed: boolean;
}

export interface ChecklistTemplate {
  id: string;
  name: string;
  items: Omit<ChecklistItem, 'completed'>[];
}

export interface JobLog {
  startTime: string; // ISO date string
  endTime?: string; // ISO date string
  breaks: {
    startTime: string;
    endTime?: string;
  }[];
  totalHours: number;
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
  recurrence?: 'Weekly' | 'Biweekly' | 'Monthly';
  seriesId?: string;
  checklist?: ChecklistItem[];
  jobLog?: JobLog;
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
  paymentMethod?: string;
  paymentNotes?: string;
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

export interface JobType {
  id: string;
  name: string;
  defaultRate: number;
}

export interface UserProfile {
  companyName: string;
  companyAddress: string;
  avatar?: string; // Base64 or URL
  showLogoOnInvoice?: boolean;
  jobTypes: JobType[];
  checklistTemplates?: ChecklistTemplate[];
}

export type ViewState = 'DASHBOARD' | 'CLIENTS' | 'APPOINTMENTS' | 'INVOICES' | 'INVENTORY' | 'SETTINGS';