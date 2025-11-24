import { Client, Appointment, Invoice, InventoryItem, Status, UserProfile } from '../types';

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
  },
  {
    id: 'verify-client-1',
    name: 'Verification Client',
    contacts: [
      { id: 'c1', name: 'Verify Contact', relation: 'Self', phone: '555-555-5555', email: 'verify@test.com', isPrimary: true },
    ],
    locations: [
      { id: 'l1', address: '123 Verification St, Test City', type: 'Home', notes: 'Gate code: 4321', isPrimary: true }
    ],
    children: [],
    pets: [],
    houseNotes: 'Test house notes.',
    generalNotes: 'Test general notes.'
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
  {
    id: 'verify-appt-1',
    clientId: 'verify-client-1',
    clientName: 'Verification Client',
    date: getRelativeDate(0), // Today's date
    time: '10:00',
    serviceType: 'Verification Clean',
    status: Status.Pending,
    address: '123 Verification St, Test City',
    rate: 100,
    estimatedHours: 2,
    notes: 'This is a test appointment for verification.',
    checklist: [
      { id: 'task1', task: 'Clean kitchen', frequency: 'Every Time', completed: false },
      { id: 'task2', task: 'Dust living room', frequency: 'Every Time', completed: false },
    ],
    jobLog: undefined
  }
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
    updateClient(client: Client): Promise<Client>;
    deleteClient(id: string): Promise<void>;
    
    getAppointments(): Promise<Appointment[]>;
    addAppointment(apt: Appointment): Promise<Appointment>;
    updateAppointment(apt: Appointment): Promise<Appointment>;
    updateAppointmentStatus(id: string, status: Status): Promise<void>;
    deleteAppointment(id: string): Promise<void>;
    deleteAppointments(ids: string[]): Promise<void>;
    
    getInvoices(): Promise<Invoice[]>;
    addInvoice(inv: Invoice): Promise<Invoice>;
    updateInvoice(inv: Invoice): Promise<Invoice>;
    deleteInvoice(id: string): Promise<void>;
    
    getInventory(): Promise<InventoryItem[]>;
    updateInventoryQuantity(id: string, quantity: number): Promise<void>;
    addInventoryItem(item: InventoryItem): Promise<InventoryItem>;
    updateInventoryItem(item: InventoryItem): Promise<InventoryItem>;
    deleteInventoryItem(id: string): Promise<void>;

    getSettings(): Promise<UserProfile | null>;
    saveSettings(settings: UserProfile): Promise<void>;
}

// --- MOCK SERVICE (Fallback) ---
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class MockService implements IDataService {
    private clients = [...INITIAL_CLIENTS];
    private appointments = [...INITIAL_APPOINTMENTS];
    private invoices = [...INITIAL_INVOICES];
    private inventory = [...INITIAL_INVENTORY];
    private settings: UserProfile | null = null;

    async getClients() { await delay(300); return [...this.clients]; }
    async addClient(c: Client) { 
        await delay(300); 
        const nc = { ...c, id: c.id || Math.random().toString(36).substr(2, 9) }; 
        this.clients.push(nc); return nc; 
    }
    async updateClient(c: Client) {
        await delay(300);
        this.clients = this.clients.map(x => x.id === c.id ? c : x);
        return c;
    }
    async deleteClient(id: string) { await delay(300); this.clients = this.clients.filter(c => c.id !== id); }

    async getAppointments() { await delay(300); return [...this.appointments]; }
    async addAppointment(a: Appointment) { 
        await delay(300); 
        
        const newAppointments: Appointment[] = [];

        // 1. Create the Base Appointment
        const baseId = a.id || Math.random().toString(36).substr(2, 9);
        const seriesId = a.recurrence ? (a.seriesId || Math.random().toString(36).substr(2, 9)) : undefined;
        
        const baseAppt = { ...a, id: baseId, seriesId };
        newAppointments.push(baseAppt);

        // 2. Handle Recurrence Generation
        if (a.recurrence) {
            const freqMap = { 'Weekly': 7, 'Biweekly': 14, 'Monthly': 28 }; // Simplified Monthly
            const daysToAdd = freqMap[a.recurrence] || 7;
            const limitDate = new Date();
            limitDate.setMonth(limitDate.getMonth() + 6); // 6 Months out

            let currentDate = new Date(a.date);
            
            // Loop
            while (true) {
                // Increment
                if (a.recurrence === 'Monthly') {
                    currentDate.setMonth(currentDate.getMonth() + 1);
                } else {
                    currentDate.setDate(currentDate.getDate() + daysToAdd);
                }

                if (currentDate > limitDate) break;

                newAppointments.push({
                    ...a,
                    id: Math.random().toString(36).substr(2, 9),
                    date: currentDate.toISOString().split('T')[0],
                    seriesId: seriesId
                });
            }
        }

        // 3. Save All
        this.appointments.push(...newAppointments); 

        // 4. Auto-create Invoice ONLY for the base appointment (Immediate need)
        // NOTE: Future invoices are usually generated when the job is done or upcoming, 
        // but for now we'll just invoice the first one to avoid clutter.
        const na = newAppointments[0];
        const invoice: Invoice = {
            id: Math.random().toString(36).substr(2, 9),
            clientId: na.clientId,
            appointmentId: na.id,
            clientName: na.clientName,
            date: new Date().toISOString().split('T')[0],
            dueDate: na.date,
            status: Status.Unpaid,
            amount: na.rate * na.estimatedHours,
            notes: `Generated from Appointment (Job Status: ${na.status})`,
            items: [{
                id: Math.random().toString(36).substr(2, 9),
                description: `${na.serviceType} (${na.estimatedHours} hrs)`,
                quantity: na.estimatedHours,
                unitPrice: na.rate
            }]
        };
        this.invoices.push(invoice);

        return na; 
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
    async deleteAppointments(ids: string[]) { await delay(300); this.appointments = this.appointments.filter(x => !ids.includes(x.id)); }

    async getInvoices() { await delay(300); return [...this.invoices]; }
    async addInvoice(i: Invoice) { 
        await delay(300); 
        const ni = { ...i, id: i.id || Math.random().toString(36).substr(2, 9) }; 
        this.invoices.push(ni); return ni; 
    }
    async updateInvoice(i: Invoice) {
        await delay(300);
        const idx = this.invoices.findIndex(x => x.id === i.id);
        if (idx > -1) {
            // Ensure new properties are merged correctly
            this.invoices[idx] = { ...this.invoices[idx], ...i };
        }
        return i;
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

    async getSettings() {
        await delay(300);
        // Try to load from localStorage if in mock mode but user wants persistence simulation
        if (!this.settings) {
             const stored = localStorage.getItem('cleanswift_user_profile');
             if (stored) return JSON.parse(stored);
        }
        return this.settings;
    }

    async saveSettings(s: UserProfile) {
        await delay(300);
        this.settings = s;
        localStorage.setItem('cleanswift_user_profile', JSON.stringify(s));
    }
}

// --- GOOGLE SHEETS SERVICE ---

const SPREADSHEET_NAME = "CleanSwift Manager Data";
const SHEETS = {
    CLIENTS: "Clients",
    APPOINTMENTS: "Appointments",
    INVOICES: "Invoices",
    INVENTORY: "Inventory",
    SETTINGS: "Settings"
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
            cache: 'no-store',
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json',
                'Pragma': 'no-cache',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
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
            
            // Check if "Settings" sheet exists (for legacy users)
            const metaRes = await this.fetch(`https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}`);
            const sheetTitles = (metaRes.sheets || []).map((s: any) => s.properties.title);
            
            if (!sheetTitles.includes(SHEETS.SETTINGS)) {
                // Add Settings Sheet
                await this.fetch(`https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}:batchUpdate`, {
                    method: 'POST',
                    body: JSON.stringify({
                        requests: [
                            { addSheet: { properties: { title: SHEETS.SETTINGS, gridProperties: { frozenRowCount: 1 } } } }
                        ]
                    })
                });
                
                // Seed Header
                const settingsHeader = ["CompanyName", "CompanyAddress", "ShowLogo", "Avatar (Base64)", "JobTypes (JSON)"];
                await this.writeSheet(SHEETS.SETTINGS, [settingsHeader]);
            }

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
                    { properties: { title: SHEETS.INVENTORY, gridProperties: { frozenRowCount: 1 } } },
                    { properties: { title: SHEETS.SETTINGS, gridProperties: { frozenRowCount: 1 } } }
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
        const apptHeader = ["ID", "ClientID", "Client Name", "Date", "Time", "Service", "Status", "Address", "Rate", "Hours", "Notes", "Frequency", "SeriesID"];
        const invHeader = ["ID", "ClientID", "ApptID", "Client Name", "Issue Date", "Due Date", "Status", "Amount", "Notes", "Items (JSON)"];
        const invenHeader = ["ID", "Item Name", "Quantity", "Unit", "Min Threshold", "Status", "Supplier", "Cost", "Notes"];
        const settingsHeader = ["CompanyName", "CompanyAddress", "ShowLogo", "Avatar (Base64)", "JobTypes (JSON)"];

        await this.writeSheet(SHEETS.CLIENTS, [clientHeader, ...INITIAL_CLIENTS.map(this.serializeClient)]);
        await this.writeSheet(SHEETS.APPOINTMENTS, [apptHeader, ...INITIAL_APPOINTMENTS.map(this.serializeAppointment)]);
        await this.writeSheet(SHEETS.INVOICES, [invHeader, ...INITIAL_INVOICES.map(this.serializeInvoice)]);
        await this.writeSheet(SHEETS.INVENTORY, [invenHeader, ...INITIAL_INVENTORY.map(this.serializeInventory)]);
        await this.writeSheet(SHEETS.SETTINGS, [settingsHeader]);
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
        a.id, a.clientId, a.clientName, a.date, a.time, a.serviceType, a.status, a.address, a.rate, a.estimatedHours, a.notes, a.recurrence || '', a.seriesId || ''
    ];
    private deserializeAppointment = (row: any[]): Appointment => ({
        id: row[0], clientId: row[1], clientName: row[2], date: row[3], time: row[4],
        serviceType: row[5], status: row[6] as Status, address: row[7],
        rate: Number(row[8]), estimatedHours: Number(row[9]), notes: row[10],
        recurrence: row[11] || undefined, seriesId: row[12] || undefined
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

    private serializeSettings = (s: UserProfile) => {
        const jobTypesStr = JSON.stringify(s.jobTypes);
        const avatar = s.avatar || "";
        const chunkSize = 40000; // Safe limit below 50k
        const avatarChunks = [];
        for (let i = 0; i < avatar.length; i += chunkSize) {
            avatarChunks.push(avatar.slice(i, i + chunkSize));
        }
        
        return [
            s.companyName, 
            s.companyAddress, 
            s.showLogoOnInvoice ? "TRUE" : "FALSE", 
            jobTypesStr, 
            ...avatarChunks
        ];
    };
    
    private deserializeSettings = (row: any[]): UserProfile => {
        let jobTypes = [];
        let avatar = "";
        
        // Heuristic to support both old and new schema during transition
        // New Schema: [Name, Addr, Logo, JobTypes, AvatarChunk1, AvatarChunk2...]
        // Old Schema: [Name, Addr, Logo, Avatar, JobTypes]
        
        const col3 = row[3] || "";
        if (col3.trim().startsWith('[')) {
            // It's likely JSON, so it's the New Schema
            try { jobTypes = JSON.parse(col3); } catch(e) {}
            avatar = row.slice(4).join('');
        } else {
            // Fallback / Old Schema
            avatar = col3;
            if (row[4]) {
                try { jobTypes = JSON.parse(row[4]); } catch(e) {}
            }
        }

        return {
            companyName: row[0],
            companyAddress: row[1],
            showLogoOnInvoice: row[2] === "TRUE",
            avatar: avatar,
            jobTypes: jobTypes
        };
    };

    // --- Core CRUD ---

    private async readSheet<T>(sheetName: string, deserializer: (row: any[]) => T): Promise<T[]> {
        const res = await this.fetch(`https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${sheetName}!A2:ZZ`); // Extended range to ZZ to catch all chunks
        const rows = res.values || [];
        // Filter out empty rows if any, though deserialize usually handles it. 
        // Note: For settings, we might get 1 row without ID.
        if (sheetName === SHEETS.SETTINGS) return rows.map(deserializer);
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

    private async appendRows(sheetName: string, rows: any[][]) {
        await this.fetch(`https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${sheetName}!A1:append?valueInputOption=USER_ENTERED`, {
            method: 'POST',
            body: JSON.stringify({ values: rows })
        });
    }

    private async clearSheet(sheetName: string) {
        await this.fetch(`https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${sheetName}!A:ZZ:clear`, {
            method: 'POST'
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
        
        // Clear the sheet to remove leftovers (safest way to handle deletions)
        await this.clearSheet(sheetName);

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
    async updateClient(c: Client) {
        await this.updateSheetData(SHEETS.CLIENTS, this.deserializeClient, this.serializeClient, items => items.map(i => i.id === c.id ? c : i));
        return c;
    }
    async deleteClient(id: string) {
        await this.updateSheetData(SHEETS.CLIENTS, this.deserializeClient, this.serializeClient, items => items.filter(i => i.id !== id));
    }

    async getAppointments() { return this.readSheet(SHEETS.APPOINTMENTS, this.deserializeAppointment); }
    async addAppointment(a: Appointment) {
        
        const newAppointments: Appointment[] = [];

        // 1. Base Appointment
        const baseId = a.id || Math.random().toString(36).substr(2, 9);
        const seriesId = a.recurrence ? (a.seriesId || Math.random().toString(36).substr(2, 9)) : undefined;
        
        const baseAppt = { ...a, id: baseId, seriesId };
        newAppointments.push(baseAppt);

        // 2. Recurrence Generation
        if (a.recurrence) {
            const freqMap = { 'Weekly': 7, 'Biweekly': 14, 'Monthly': 28 };
            const daysToAdd = freqMap[a.recurrence] || 7;
            const limitDate = new Date();
            limitDate.setMonth(limitDate.getMonth() + 6); // 6 Months out

            let currentDate = new Date(a.date);
            
            while (true) {
                if (a.recurrence === 'Monthly') {
                    currentDate.setMonth(currentDate.getMonth() + 1);
                } else {
                    currentDate.setDate(currentDate.getDate() + daysToAdd);
                }

                if (currentDate > limitDate) break;

                newAppointments.push({
                    ...a,
                    id: Math.random().toString(36).substr(2, 9),
                    date: currentDate.toISOString().split('T')[0],
                    seriesId: seriesId
                });
            }
        }

        // 3. Batch Save
        await this.appendRows(SHEETS.APPOINTMENTS, newAppointments.map(this.serializeAppointment));

        // 4. Auto-create Invoice (Only for base)
        const na = newAppointments[0];
        const invoice: Invoice = {
            id: Math.random().toString(36).substr(2, 9),
            clientId: na.clientId,
            appointmentId: na.id,
            clientName: na.clientName,
            date: new Date().toISOString().split('T')[0],
            dueDate: na.date,
            status: Status.Unpaid,
            amount: na.rate * na.estimatedHours,
            notes: `Generated from Appointment (Job Status: ${na.status})`,
            items: [{
                id: Math.random().toString(36).substr(2, 9),
                description: `${na.serviceType} (${na.estimatedHours} hrs)`,
                quantity: na.estimatedHours,
                unitPrice: na.rate
            }]
        };
        await this.addInvoice(invoice);

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
    async deleteAppointments(ids: string[]) {
        await this.updateSheetData(SHEETS.APPOINTMENTS, this.deserializeAppointment, this.serializeAppointment, items => items.filter(i => !ids.includes(i.id)));
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

    async getSettings() {
        const rows = await this.readSheet(SHEETS.SETTINGS, this.deserializeSettings);
        return rows.length > 0 ? rows[0] : null;
    }

    async saveSettings(s: UserProfile) {
        // We overwrite the entire sheet (preserving header)
        // Header matching new schema:
        const header = ["CompanyName", "CompanyAddress", "ShowLogo", "JobTypes (JSON)", "Avatar (Base64...Chunks)"];
        
        await this.writeSheet(SHEETS.SETTINGS, [header, this.serializeSettings(s)]);
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
    updateClient(c: Client) { return this.service.updateClient(c); }
    deleteClient(id: string) { return this.service.deleteClient(id); }
    
    getAppointments() { return this.service.getAppointments(); }
    addAppointment(a: Appointment) { return this.service.addAppointment(a); }
    updateAppointment(a: Appointment) { return this.service.updateAppointment(a); }
    updateAppointmentStatus(id: string, s: Status) { return this.service.updateAppointmentStatus(id, s); }
    deleteAppointment(id: string) { return this.service.deleteAppointment(id); }
    deleteAppointments(ids: string[]) { return this.service.deleteAppointments(ids); }

    getInvoices() { return this.service.getInvoices(); }
    addInvoice(i: Invoice) { return this.service.addInvoice(i); }
    updateInvoice(i: Invoice) { return this.service.updateInvoice(i); }
    deleteInvoice(id: string) { return this.service.deleteInvoice(id); }

    getInventory() { return this.service.getInventory(); }
    updateInventoryQuantity(id: string, q: number) { return this.service.updateInventoryQuantity(id, q); }
    addInventoryItem(i: InventoryItem) { return this.service.addInventoryItem(i); }
    updateInventoryItem(i: InventoryItem) { return this.service.updateInventoryItem(i); }
    deleteInventoryItem(id: string) { return this.service.deleteInventoryItem(id); }
    
    getSettings() { return this.service.getSettings(); }
    saveSettings(s: UserProfile) { return this.service.saveSettings(s); }
}

export const db = new DBProxy();