import { Client, Appointment, Invoice, InventoryItem, Status } from '../types';

// --- INITIAL DUMMY DATA ---
const getRelativeDate = (daysOffset: number) => {
    const date = new Date();
    date.setDate(date.getDate() + daysOffset);
    return date.toISOString().split('T')[0];
};

const INITIAL_CLIENTS: Client[] = [
  { 
    id: '1', 
    name: 'Johnson Family', 
    contacts: [
      { id: 'c1', name: 'Alice Johnson', relation: 'Self', phone: '555-0101', email: 'alice@example.com', isPrimary: true },
      { id: 'c2', name: 'Mark Johnson', relation: 'Spouse', phone: '555-0102', email: 'mark@example.com', isPrimary: false }
    ],
    locations: [
      { id: 'l1', address: '123 Maple St, Springfield', type: 'Home', notes: 'Gate code: 1234', isPrimary: true }
    ],
    children: [
      { id: 'ch1', name: 'Timmy', age: '5', notes: 'Likes superheroes' }
    ],
    pets: [
      { id: 'p1', name: 'Max', type: 'Dog', notes: 'Friendly Golden Retriever' }
    ],
    houseNotes: 'Key is under the mat. Alarm code 9999.',
    generalNotes: 'Prefer text messages for scheduling.'
  },
  { 
    id: '2', 
    name: 'Bob Smith', 
    contacts: [
      { id: 'c3', name: 'Bob Smith', relation: 'Self', phone: '555-0202', email: 'bob@example.com', isPrimary: true }
    ],
    locations: [
      { id: 'l2', address: '456 Oak Ave, Springfield', type: 'Home', notes: '', isPrimary: true },
      { id: 'l3', address: '789 Pine Ln, Springfield', type: 'Office', notes: 'Clean on weekends only', isPrimary: false }
    ],
    children: [],
    pets: [],
    houseNotes: '',
    generalNotes: ''
  }
];

const INITIAL_APPOINTMENTS: Appointment[] = [
  { 
    id: '1', 
    clientId: '1', 
    clientName: 'Johnson Family', 
    date: getRelativeDate(0), 
    time: '09:00', 
    serviceType: 'Deep Clean', 
    status: Status.Pending, 
    address: '123 Maple St, Springfield',
    rate: 50,
    estimatedHours: 4,
    notes: 'Focus on the kitchen cabinets.'
  },
  { 
    id: '2', 
    clientId: '2', 
    clientName: 'Bob Smith', 
    date: getRelativeDate(1),
    time: '13:00', 
    serviceType: 'Standard Clean', 
    status: Status.Pending, 
    address: '456 Oak Ave, Springfield',
    rate: 45,
    estimatedHours: 2.5,
    notes: ''
  },
  { 
    id: '3', 
    clientId: '1', 
    clientName: 'Johnson Family', 
    date: getRelativeDate(-2),
    time: '09:00', 
    serviceType: 'Standard Clean', 
    status: Status.Completed, 
    address: '123 Maple St, Springfield',
    rate: 45,
    estimatedHours: 3,
    notes: 'Regular bi-weekly clean.'
  },
];

const INITIAL_INVOICES: Invoice[] = [
  { 
    id: '1', 
    clientId: '1',
    appointmentId: '3', 
    clientName: 'Johnson Family', 
    date: getRelativeDate(-2), 
    dueDate: getRelativeDate(28), 
    status: Status.Paid,
    amount: 135.00,
    notes: 'Thank you for your business!',
    items: [
        { id: 'i1', description: 'Standard Clean (3 hrs)', quantity: 3, unitPrice: 45.00 }
    ]
  }
];

const INITIAL_INVENTORY: InventoryItem[] = [
  { 
      id: '1', 
      itemName: 'All-Purpose Cleaner', 
      quantity: 5, 
      unit: 'bottles', 
      minThreshold: 2, 
      status: Status.InStock,
      supplier: 'CleanSupply Co.',
      cost: 5.99,
      notes: 'Use mostly for kitchen surfaces.'
  },
  { 
      id: '2', 
      itemName: 'Microfiber Cloths', 
      quantity: 20, 
      unit: 'pieces', 
      minThreshold: 10, 
      status: Status.InStock,
      supplier: 'Amazon',
      cost: 0.50,
      notes: 'Washable and reusable.'
  }
];

// --- INTERFACES ---

interface IDataService {
    getClients(): Promise<Client[]>;
    addClient(client: Client): Promise<Client>;
    deleteClient(id: string): Promise<void>;
    
    getAppointments(): Promise<Appointment[]>;
    addAppointment(apt: Appointment): Promise<Appointment>;
    updateAppointment(apt: Appointment): Promise<Appointment>;
    updateAppointmentStatus(id: string, status: Status): Promise<void>;
    deleteAppointment(id: string): Promise<void>;
    
    getInvoices(): Promise<Invoice[]>;
    addInvoice(inv: Invoice): Promise<Invoice>;
    updateInvoice(inv: Invoice): Promise<Invoice>;
    deleteInvoice(id: string): Promise<void>;
    
    getInventory(): Promise<InventoryItem[]>;
    updateInventoryQuantity(id: string, quantity: number): Promise<void>;
    addInventoryItem(item: InventoryItem): Promise<InventoryItem>;
    updateInventoryItem(item: InventoryItem): Promise<InventoryItem>;
    deleteInventoryItem(id: string): Promise<void>;
}

// --- MOCK SERVICE (Fallback) ---
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class MockService implements IDataService {
    private clients = [...INITIAL_CLIENTS];
    private appointments = [...INITIAL_APPOINTMENTS];
    private invoices = [...INITIAL_INVOICES];
    private inventory = [...INITIAL_INVENTORY];

    async getClients() { await delay(300); return [...this.clients]; }
    async addClient(c: Client) { 
        await delay(300); 
        const nc = { ...c, id: c.id || Math.random().toString(36).substr(2, 9) }; 
        this.clients.push(nc); return nc; 
    }
    async deleteClient(id: string) { await delay(300); this.clients = this.clients.filter(c => c.id !== id); }

    async getAppointments() { await delay(300); return [...this.appointments]; }
    async addAppointment(a: Appointment) { 
        await delay(300); 
        const na = { ...a, id: a.id || Math.random().toString(36).substr(2, 9) }; 
        this.appointments.push(na); return na; 
    }
    async updateAppointment(a: Appointment) { 
        await delay(300); 
        this.appointments = this.appointments.map(x => x.id === a.id ? a : x); return a; 
    }
    async updateAppointmentStatus(id: string, status: Status) { 
        await delay(300); 
        const a = this.appointments.find(x => x.id === id); if(a) a.status = status; 
    }
    async deleteAppointment(id: string) { await delay(300); this.appointments = this.appointments.filter(x => x.id !== id); }

    async getInvoices() { await delay(300); return [...this.invoices]; }
    async addInvoice(i: Invoice) { 
        await delay(300); 
        const ni = { ...i, id: i.id || Math.random().toString(36).substr(2, 9) }; 
        this.invoices.push(ni); return ni; 
    }
    async updateInvoice(i: Invoice) { 
        await delay(300); 
        this.invoices = this.invoices.map(x => x.id === i.id ? i : x); return i; 
    }
    async deleteInvoice(id: string) { await delay(300); this.invoices = this.invoices.filter(x => x.id !== id); }

    async getInventory() { await delay(300); return [...this.inventory]; }
    async updateInventoryQuantity(id: string, q: number) {
        await delay(100);
        const i = this.inventory.find(x => x.id === id);
        if(i) { i.quantity = q; i.status = q <= i.minThreshold ? Status.LowStock : Status.InStock; }
    }
    async addInventoryItem(i: InventoryItem) { 
        await delay(300); 
        const ni = { ...i, id: i.id || Math.random().toString(36).substr(2, 9) }; 
        ni.status = ni.quantity <= ni.minThreshold ? Status.LowStock : Status.InStock;
        this.inventory.push(ni); return ni; 
    }
    async updateInventoryItem(i: InventoryItem) { 
        await delay(300); 
        const idx = this.inventory.findIndex(x => x.id === i.id); 
        if(idx !== -1) { 
            i.status = i.quantity <= i.minThreshold ? Status.LowStock : Status.InStock;
            this.inventory[idx] = i; 
        } 
        return i; 
    }
    async deleteInventoryItem(id: string) { await delay(300); this.inventory = this.inventory.filter(x => x.id !== id); }
}

// --- GOOGLE SHEETS SERVICE ---

const SPREADSHEET_NAME = "CleanSwift Manager Data";
const SHEETS = {
    CLIENTS: "Clients",
    APPOINTMENTS: "Appointments",
    INVOICES: "Invoices",
    INVENTORY: "Inventory"
};

class GoogleSheetsService implements IDataService {
    private token: string;
    private spreadsheetId: string = '';

    constructor(token: string) {
        this.token = token;
    }

    private async fetch(url: string, options: RequestInit = {}) {
        const res = await fetch(url, {
            ...options,
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error?.message || 'Google API Error');
        }
        return res.json();
    }

    async init() {
        // 1. Search for existing spreadsheet by exact name
        const q = `name='${SPREADSHEET_NAME}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`;
        const searchRes = await this.fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}`);
        
        if (searchRes.files && searchRes.files.length > 0) {
            this.spreadsheetId = searchRes.files[0].id;
        } else {
            await this.createAndSeedSpreadsheet();
        }
    }

    private async createAndSeedSpreadsheet() {
        // Create blank sheet
        const createRes = await this.fetch('https://sheets.googleapis.com/v4/spreadsheets', {
            method: 'POST',
            body: JSON.stringify({
                properties: { title: SPREADSHEET_NAME },
                sheets: [
                    { properties: { title: SHEETS.CLIENTS, gridProperties: { frozenRowCount: 1 } } },
                    { properties: { title: SHEETS.APPOINTMENTS, gridProperties: { frozenRowCount: 1 } } },
                    { properties: { title: SHEETS.INVOICES, gridProperties: { frozenRowCount: 1 } } },
                    { properties: { title: SHEETS.INVENTORY, gridProperties: { frozenRowCount: 1 } } }
                ]
            })
        });
        this.spreadsheetId = createRes.spreadsheetId;

        // Format Headers (Bold) and Add Headers
        // We do this in a batch update to look nice
        const requests = [
           // Bold top row for all sheets
           ...Object.values(SHEETS).map(sheetTitle => {
               const sheetId = createRes.sheets.find((s:any) => s.properties.title === sheetTitle).properties.sheetId;
               return {
                   repeatCell: {
                       range: { sheetId: sheetId, startRowIndex: 0, endRowIndex: 1 },
                       cell: { userEnteredFormat: { textFormat: { bold: true } } },
                       fields: "userEnteredFormat.textFormat.bold"
                   }
               };
           })
        ];

        await this.fetch(`https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}:batchUpdate`, {
            method: 'POST',
            body: JSON.stringify({ requests })
        });

        // Seed Initial Data including headers
        // Note: We append data. First row will be treated as headers conceptually, but our serializer handles raw values.
        // For a proper "header" row we can prepend a header array, but to keep serialization simple we'll just dump data.
        // The first item in the array acts as the structure definer.
        
        // Actually, let's add explicit headers for clarity in the sheet
        const clientHeader = ["ID", "Name", "House Notes", "General Notes", "Contacts (JSON)", "Locations (JSON)", "Children (JSON)", "Pets (JSON)"];
        const apptHeader = ["ID", "ClientID", "Client Name", "Date", "Time", "Service", "Status", "Address", "Rate", "Hours", "Notes"];
        const invHeader = ["ID", "ClientID", "ApptID", "Client Name", "Issue Date", "Due Date", "Status", "Amount", "Notes", "Items (JSON)"];
        const invenHeader = ["ID", "Item Name", "Quantity", "Unit", "Min Threshold", "Status", "Supplier", "Cost", "Notes"];

        await this.writeSheet(SHEETS.CLIENTS, [clientHeader, ...INITIAL_CLIENTS.map(this.serializeClient)]);
        await this.writeSheet(SHEETS.APPOINTMENTS, [apptHeader, ...INITIAL_APPOINTMENTS.map(this.serializeAppointment)]);
        await this.writeSheet(SHEETS.INVOICES, [invHeader, ...INITIAL_INVOICES.map(this.serializeInvoice)]);
        await this.writeSheet(SHEETS.INVENTORY, [invenHeader, ...INITIAL_INVENTORY.map(this.serializeInventory)]);
    }

    // --- Serialization Helpers ---
    
    private serializeClient = (c: Client) => [
        c.id, c.name, c.houseNotes, c.generalNotes, 
        JSON.stringify(c.contacts), JSON.stringify(c.locations), JSON.stringify(c.children), JSON.stringify(c.pets)
    ];
    private deserializeClient = (row: any[]): Client => ({
        id: row[0], name: row[1], houseNotes: row[2], generalNotes: row[3],
        contacts: JSON.parse(row[4] || '[]'), locations: JSON.parse(row[5] || '[]'),
        children: JSON.parse(row[6] || '[]'), pets: JSON.parse(row[7] || '[]')
    });

    private serializeAppointment = (a: Appointment) => [
        a.id, a.clientId, a.clientName, a.date, a.time, a.serviceType, a.status, a.address, a.rate, a.estimatedHours, a.notes
    ];
    private deserializeAppointment = (row: any[]): Appointment => ({
        id: row[0], clientId: row[1], clientName: row[2], date: row[3], time: row[4],
        serviceType: row[5], status: row[6] as Status, address: row[7],
        rate: Number(row[8]), estimatedHours: Number(row[9]), notes: row[10]
    });

    private serializeInvoice = (i: Invoice) => [
        i.id, i.clientId, i.appointmentId || '', i.clientName, i.date, i.dueDate, i.status, i.amount, i.notes, JSON.stringify(i.items)
    ];
    private deserializeInvoice = (row: any[]): Invoice => ({
        id: row[0], clientId: row[1], appointmentId: row[2], clientName: row[3], date: row[4], dueDate: row[5],
        status: row[6] as Status, amount: Number(row[7]), notes: row[8], items: JSON.parse(row[9] || '[]')
    });

    private serializeInventory = (i: InventoryItem) => [
        i.id, i.itemName, i.quantity, i.unit, i.minThreshold, i.status, i.supplier, i.cost, i.notes
    ];
    private deserializeInventory = (row: any[]): InventoryItem => ({
        id: row[0], itemName: row[1], quantity: Number(row[2]), unit: row[3], minThreshold: Number(row[4]),
        status: row[5] as Status, supplier: row[6], cost: Number(row[7]), notes: row[8]
    });

    // --- Core CRUD ---

    private async readSheet<T>(sheetName: string, deserializer: (row: any[]) => T): Promise<T[]> {
        const res = await this.fetch(`https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${sheetName}!A2:Z`); // Start A2 to skip header
        const rows = res.values || [];
        return rows.map(deserializer).filter((item: any) => item.id);
    }

    private async writeSheet(sheetName: string, rows: any[][]) {
        await this.fetch(`https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${sheetName}!A1?valueInputOption=USER_ENTERED`, {
            method: 'PUT',
            body: JSON.stringify({ values: rows })
        });
    }

    private async appendRow(sheetName: string, row: any[]) {
        await this.fetch(`https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${sheetName}!A1:append?valueInputOption=USER_ENTERED`, {
            method: 'POST',
            body: JSON.stringify({ values: [row] })
        });
    }

    private async updateSheetData<T>(
        sheetName: string, 
        deserializer: (r: any[]) => T, 
        serializer: (i: T) => any[], 
        modifier: (items: T[]) => T[]
    ) {
        // Read existing data (skipping header)
        const items = await this.readSheet(sheetName, deserializer);
        // Modify
        const newItems = modifier(items);
        // Re-serialize
        const rows = newItems.map(serializer);
        // Get Header Row to preserve it
        const headerRes = await this.fetch(`https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${sheetName}!A1:Z1`);
        const header = headerRes.values ? headerRes.values[0] : [];
        
        // Write back Header + Data
        await this.writeSheet(sheetName, [header, ...rows]);
        return newItems;
    }

    // --- Implementation ---

    async getClients() { return this.readSheet(SHEETS.CLIENTS, this.deserializeClient); }
    async addClient(c: Client) {
        const nc = { ...c, id: c.id || Math.random().toString(36).substr(2, 9) };
        await this.appendRow(SHEETS.CLIENTS, this.serializeClient(nc));
        return nc;
    }
    async deleteClient(id: string) {
        await this.updateSheetData(SHEETS.CLIENTS, this.deserializeClient, this.serializeClient, items => items.filter(i => i.id !== id));
    }

    async getAppointments() { return this.readSheet(SHEETS.APPOINTMENTS, this.deserializeAppointment); }
    async addAppointment(a: Appointment) {
        const na = { ...a, id: a.id || Math.random().toString(36).substr(2, 9) };
        await this.appendRow(SHEETS.APPOINTMENTS, this.serializeAppointment(na));
        return na;
    }
    async updateAppointment(a: Appointment) {
        await this.updateSheetData(SHEETS.APPOINTMENTS, this.deserializeAppointment, this.serializeAppointment, items => items.map(i => i.id === a.id ? a : i));
        return a;
    }
    async updateAppointmentStatus(id: string, status: Status) {
        await this.updateSheetData(SHEETS.APPOINTMENTS, this.deserializeAppointment, this.serializeAppointment, items => items.map(i => i.id === id ? { ...i, status } : i));
    }
    async deleteAppointment(id: string) {
        await this.updateSheetData(SHEETS.APPOINTMENTS, this.deserializeAppointment, this.serializeAppointment, items => items.filter(i => i.id !== id));
    }

    async getInvoices() { return this.readSheet(SHEETS.INVOICES, this.deserializeInvoice); }
    async addInvoice(i: Invoice) {
        const ni = { ...i, id: i.id || Math.random().toString(36).substr(2, 9) };
        await this.appendRow(SHEETS.INVOICES, this.serializeInvoice(ni));
        return ni;
    }
    async updateInvoice(i: Invoice) {
        await this.updateSheetData(SHEETS.INVOICES, this.deserializeInvoice, this.serializeInvoice, items => items.map(x => x.id === i.id ? i : x));
        return i;
    }
    async deleteInvoice(id: string) {
        await this.updateSheetData(SHEETS.INVOICES, this.deserializeInvoice, this.serializeInvoice, items => items.filter(x => x.id !== id));
    }

    async getInventory() { return this.readSheet(SHEETS.INVENTORY, this.deserializeInventory); }
    async updateInventoryQuantity(id: string, q: number) {
        await this.updateSheetData(SHEETS.INVENTORY, this.deserializeInventory, this.serializeInventory, items => items.map(i => {
            if (i.id === id) {
                return { ...i, quantity: q, status: q <= i.minThreshold ? Status.LowStock : Status.InStock };
            }
            return i;
        }));
    }
    async addInventoryItem(i: InventoryItem) {
        const ni = { ...i, id: i.id || Math.random().toString(36).substr(2, 9) };
        ni.status = ni.quantity <= ni.minThreshold ? Status.LowStock : Status.InStock;
        await this.appendRow(SHEETS.INVENTORY, this.serializeInventory(ni));
        return ni;
    }
    async updateInventoryItem(i: InventoryItem) {
        const updated = { ...i, status: i.quantity <= i.minThreshold ? Status.LowStock : Status.InStock };
        await this.updateSheetData(SHEETS.INVENTORY, this.deserializeInventory, this.serializeInventory, items => items.map(x => x.id === i.id ? updated : x));
        return updated;
    }
    async deleteInventoryItem(id: string) {
        await this.updateSheetData(SHEETS.INVENTORY, this.deserializeInventory, this.serializeInventory, items => items.filter(x => x.id !== id));
    }
}

// --- PROXY SERVICE (THE EXPORT) ---

class DBProxy implements IDataService {
    private service: IDataService;

    constructor() {
        this.service = new MockService(); // Default to Mock
    }

    async initGoogleMode(token: string) {
        const googleService = new GoogleSheetsService(token);
        await googleService.init();
        this.service = googleService;
    }
    
    setMockMode() {
        this.service = new MockService();
    }

    // Proxies
    getClients() { return this.service.getClients(); }
    addClient(c: Client) { return this.service.addClient(c); }
    deleteClient(id: string) { return this.service.deleteClient(id); }
    
    getAppointments() { return this.service.getAppointments(); }
    addAppointment(a: Appointment) { return this.service.addAppointment(a); }
    updateAppointment(a: Appointment) { return this.service.updateAppointment(a); }
    updateAppointmentStatus(id: string, s: Status) { return this.service.updateAppointmentStatus(id, s); }
    deleteAppointment(id: string) { return this.service.deleteAppointment(id); }

    getInvoices() { return this.service.getInvoices(); }
    addInvoice(i: Invoice) { return this.service.addInvoice(i); }
    updateInvoice(i: Invoice) { return this.service.updateInvoice(i); }
    deleteInvoice(id: string) { return this.service.deleteInvoice(id); }

    getInventory() { return this.service.getInventory(); }
    updateInventoryQuantity(id: string, q: number) { return this.service.updateInventoryQuantity(id, q); }
    addInventoryItem(i: InventoryItem) { return this.service.addInventoryItem(i); }
    updateInventoryItem(i: InventoryItem) { return this.service.updateInventoryItem(i); }
    deleteInventoryItem(id: string) { return this.service.deleteInventoryItem(id); }
}

export const db = new DBProxy();