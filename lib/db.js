import Database from 'better-sqlite3';
import crypto from 'crypto';
import { existsSync, mkdirSync, readFileSync } from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'data');
const databasePath = process.env.SQLITE_DATABASE_PATH || path.join(dataDir, 'agency.sqlite');
const legacyFilePath = path.join(dataDir, 'db.json');

let database;

function getDatabase() {
    if (database) return database;

    mkdirSync(path.dirname(databasePath), { recursive: true });
    database = new Database(databasePath);
    database.pragma('journal_mode = WAL');
    database.pragma('foreign_keys = ON');
    database.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT NOT NULL UNIQUE COLLATE NOCASE,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
            permissions_json TEXT NOT NULL DEFAULT '[]',
            is_active INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS clients (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL DEFAULT '',
            phone TEXT NOT NULL DEFAULT '',
            company TEXT NOT NULL DEFAULT '',
            notes TEXT NOT NULL DEFAULT '',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
            project_name TEXT NOT NULL,
            project_url TEXT NOT NULL DEFAULT '',
            source_type TEXT NOT NULL DEFAULT 'online',
            online_platform TEXT NOT NULL DEFAULT '',
            offline_person TEXT NOT NULL DEFAULT '',
            date TEXT NOT NULL,
            start_date TEXT NOT NULL DEFAULT '',
            end_date TEXT NOT NULL DEFAULT '',
            amount_minor INTEGER NOT NULL DEFAULT 0,
            budget_minor INTEGER NOT NULL DEFAULT 0,
            currency TEXT NOT NULL DEFAULT 'USD',
            category TEXT NOT NULL DEFAULT '',
            status TEXT NOT NULL DEFAULT 'In Progress',
            notes TEXT NOT NULL DEFAULT '',
            credentials_json TEXT NOT NULL DEFAULT '[]',
            hosting_details_json TEXT NOT NULL DEFAULT '{}',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS payments (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
            client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
            amount_minor INTEGER NOT NULL,
            currency TEXT NOT NULL DEFAULT 'USD',
            paid_at TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'received',
            notes TEXT NOT NULL DEFAULT '',
            created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS expenses (
            id TEXT PRIMARY KEY,
            project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
            category TEXT NOT NULL,
            amount_minor INTEGER NOT NULL,
            currency TEXT NOT NULL DEFAULT 'USD',
            spent_at TEXT NOT NULL,
            notes TEXT NOT NULL DEFAULT '',
            created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS attachments (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
            original_name TEXT NOT NULL,
            stored_name TEXT NOT NULL UNIQUE,
            mime_type TEXT NOT NULL,
            size_bytes INTEGER NOT NULL,
            created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS project_categories (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL UNIQUE COLLATE NOCASE,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS project_category_seed_state (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            initialized_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS projects_client_id_idx ON projects(client_id);
        CREATE INDEX IF NOT EXISTS projects_status_idx ON projects(status);
        CREATE INDEX IF NOT EXISTS payments_project_id_idx ON payments(project_id);
        CREATE INDEX IF NOT EXISTS expenses_project_id_idx ON expenses(project_id);
    `);

    ensureColumn('projects', 'status_reason', "TEXT NOT NULL DEFAULT ''");
    ensureColumn('clients', 'address', "TEXT NOT NULL DEFAULT ''");
    ensureColumn('users', 'name', "TEXT NOT NULL DEFAULT ''");
    seedProjectCategories();
    importLegacyProjects();
    return database;
}

function ensureColumn(table, column, definition) {
    const columns = database.prepare(`PRAGMA table_info(${table})`).all();
    if (columns.some((entry) => entry.name === column)) return;
    database.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
}

const defaultProjectCategories = [
    'Simple Wordpress',
    'Blog website',
    'Website Customization',
    'Plain hTML/CSS site',
    'WooCommerce',
    'Corporate Site',
    'SaaS Dashboard',
    'Bug Fix',
    'Other',
];

function seedProjectCategories() {
    const now = new Date().toISOString();
    const seedState = database.prepare('SELECT id FROM project_category_seed_state WHERE id = 1').get();
    if (seedState) return;

    const insert = database.prepare(`
        INSERT OR IGNORE INTO project_categories (id, name, created_at, updated_at)
        VALUES (?, ?, ?, ?)
    `);
    const categoryCount = database.prepare('SELECT COUNT(*) AS count FROM project_categories').get().count;
    const existingNames = database.prepare('SELECT name FROM project_categories').all().map((row) => row.name.toLowerCase());
    const fromProjects = database.prepare(`
        SELECT DISTINCT category FROM projects WHERE category IS NOT NULL AND TRIM(category) != ''
    `).all().map((row) => row.category);

    const names = categoryCount === 0 ? [...defaultProjectCategories, ...fromProjects] : fromProjects;
    database.transaction(() => {
        for (const name of names) {
            const trimmed = String(name || '').trim();
            if (!trimmed) continue;
            if (existingNames.includes(trimmed.toLowerCase())) continue;
            insert.run(crypto.randomUUID(), trimmed, now, now);
            existingNames.push(trimmed.toLowerCase());
        }
        database.prepare('INSERT INTO project_category_seed_state (id, initialized_at) VALUES (1, ?)').run(now);
    })();
}

function importLegacyProjects() {
    const db = database;
    if (!existsSync(legacyFilePath) || db.prepare('SELECT 1 FROM projects LIMIT 1').get()) return;

    const projects = JSON.parse(readFileSync(legacyFilePath, 'utf8') || '[]');
    const now = new Date().toISOString();
    const insertClient = db.prepare(`
        INSERT INTO clients (id, name, email, company, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
    `);
    const insertProject = db.prepare(`
        INSERT INTO projects (
            id, client_id, project_name, project_url, source_type, online_platform,
            offline_person, date, amount_minor, currency, category, status, notes,
            credentials_json, hosting_details_json, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    db.transaction(() => {
        for (const project of projects) {
            const firstCredential = Array.isArray(project.credentials) ? project.credentials[0] : null;
            const clientName = firstCredential?.username || project.offlinePerson || '';
            const clientEmail = firstCredential?.email || '';
            const clientId = clientName || clientEmail ? crypto.randomUUID() : null;
            if (clientId) insertClient.run(clientId, clientName || clientEmail, clientEmail, '', now, now);

            insertProject.run(
                project.id || crypto.randomUUID(), clientId, project.projectName || 'Untitled project',
                project.projectUrl || '', project.sourceType || 'online', project.onlinePlatform || '',
                project.offlinePerson || '', project.date || now.slice(0, 10),
                Math.round(Number(project.amount || 0) * 100), 'USD', project.category || '',
                project.status || 'In Progress', project.notes || '',
                JSON.stringify(project.credentials || []), JSON.stringify(project.hostingDetails || {}),
                project.createdAt || now, now
            );
        }
    })();
}

function toProject(row) {
    if (!row) return null;
    return {
        id: row.id,
        projectName: row.project_name,
        projectUrl: row.project_url,
        sourceType: row.source_type,
        onlinePlatform: row.online_platform,
        offlinePerson: row.offline_person,
        date: row.date,
        startDate: row.start_date,
        endDate: row.end_date,
        amount: String(row.amount_minor / 100),
        budget: String(row.budget_minor / 100),
        currency: row.currency,
        category: row.category,
        status: row.status,
        statusReason: row.status_reason || '',
        notes: row.notes,
        credentials: JSON.parse(row.credentials_json || '[]'),
        hostingDetails: migrateHostingDetails(JSON.parse(row.hosting_details_json || '{}')),
        clientId: row.client_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

function migrateHostingDetails(hostingDetails) {
    if (!hostingDetails || typeof hostingDetails !== 'object' || Array.isArray(hostingDetails)) {
        return { server: emptyServerDetails(), hosting: emptyHostingAccount() };
    }
    if (hostingDetails.server || hostingDetails.hosting) {
        return {
            server: { ...emptyServerDetails(), ...(hostingDetails.server || {}) },
            hosting: { ...emptyHostingAccount(), ...(hostingDetails.hosting || {}) },
        };
    }
    return {
        server: {
            serverName: hostingDetails.serverName || '',
            ip: hostingDetails.ip || '',
            username: hostingDetails.username || '',
            password: hostingDetails.password || '',
            notes: hostingDetails.notes || '',
        },
        hosting: emptyHostingAccount(),
    };
}

function emptyServerDetails() {
    return { serverName: '', ip: '', username: '', password: '', notes: '' };
}

function emptyHostingAccount() {
    return { provider: '', plan: '', domain: '', username: '', password: '', notes: '' };
}

export function getDatabaseConnection() {
    return getDatabase();
}

export function withDbMutation(callback) {
    return callback();
}

export async function readDb() {
    return getDatabase().prepare('SELECT * FROM projects ORDER BY date DESC, created_at DESC').all().map(toProject);
}

export async function writeDb(projects) {
    const db = getDatabase();
    const now = new Date().toISOString();
    const insert = db.prepare(`
        INSERT INTO projects (
            id, client_id, project_name, project_url, source_type, online_platform,
            offline_person, date, start_date, end_date, amount_minor, budget_minor,
            currency, category, status, status_reason, notes, credentials_json, hosting_details_json,
            created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const update = db.prepare(`
        UPDATE projects SET client_id = ?, project_name = ?, project_url = ?, source_type = ?, online_platform = ?,
            offline_person = ?, date = ?, start_date = ?, end_date = ?, amount_minor = ?, budget_minor = ?, currency = ?, category = ?, status = ?,
            status_reason = ?, notes = ?, credentials_json = ?, hosting_details_json = ?, updated_at = ? WHERE id = ?
    `);

    db.transaction(() => {
        const existingIds = new Set(db.prepare('SELECT id FROM projects').all().map(({ id }) => id));
        const incomingIds = new Set(projects.map((project) => project.id));
        for (const id of existingIds) {
            if (!incomingIds.has(id)) db.prepare('DELETE FROM projects WHERE id = ?').run(id);
        }
        for (const project of projects) {
            let clientId = project.clientId || null;
            
            // Auto-create/link client if clientId is not provided
            if (!clientId) {
                const firstCred = Array.isArray(project.credentials) ? project.credentials[0] : null;
                const clientName = firstCred?.username || project.offlinePerson || '';
                const clientEmail = firstCred?.email || '';
                if (clientName || clientEmail) {
                    const existingClient = db.prepare("SELECT id FROM clients WHERE (email != '' AND email = ?) OR (name != '' AND name = ?) LIMIT 1").get(clientEmail, clientName);
                    if (existingClient) {
                        clientId = existingClient.id;
                    } else {
                        clientId = crypto.randomUUID();
                        db.prepare(`
                            INSERT INTO clients (id, name, email, company, notes, created_at, updated_at)
                            VALUES (?, ?, ?, ?, ?, ?, ?)
                        `).run(clientId, clientName || clientEmail, clientEmail, '', '', now, now);
                    }
                }
            }

            if (!existingIds.has(project.id)) {
                insert.run(
                    project.id, clientId, project.projectName || 'Untitled project',
                    project.projectUrl || '', project.sourceType || 'online', project.onlinePlatform || '',
                    project.offlinePerson || '', project.date || now.slice(0, 10), project.startDate || '', project.endDate || '',
                    Math.round(Number(project.amount || 0) * 100), Math.round(Number(project.budget || 0) * 100),
                    project.currency || 'USD', project.category || '', project.status || 'In Progress',
                    project.statusReason || '', project.notes || '', JSON.stringify(project.credentials || []),
                    JSON.stringify(project.hostingDetails || {}), project.createdAt || now, now
                );
            } else {
                update.run(
                    clientId, project.projectName || '', project.projectUrl || '', project.sourceType || 'online',
                    project.onlinePlatform || '', project.offlinePerson || '', project.date || now, project.startDate || '', project.endDate || '',
                    Math.round(Number(project.amount || 0) * 100), Math.round(Number(project.budget || 0) * 100), project.currency || 'USD',
                    project.category || '', project.status || 'In Progress', project.statusReason || '', project.notes || '',
                    JSON.stringify(project.credentials || []), JSON.stringify(project.hostingDetails || {}), now, project.id
                );
            }
        }
    })();
}

export { toProject };
