import { promises as fs } from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'data');
const dataFilePath = path.join(dataDir, 'db.json');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export async function readDb(retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const data = await fs.readFile(dataFilePath, 'utf8');
            if (!data.trim()) return []; // Handle empty file content
            return JSON.parse(data);
        } catch (error) {
            if (error.code === 'ENOENT') return [];
            // If syntax error (corrupted file), return empty or throw? 
            // Better to throw so we don't overwrite with empty.
            if (error instanceof SyntaxError) throw error;
            
            // If it's the last retry, throw
            if (i === retries - 1) throw error;
            
            // Wait before retry
            await sleep(100);
        }
    }
}

export async function writeDb(data) {
    // Ensure directory exists
    try {
        await fs.access(dataDir);
    } catch {
        await fs.mkdir(dataDir, { recursive: true });
    }

    const tempPath = path.join(dataDir, `db.${Date.now()}-${Math.random().toString(36).slice(2)}.tmp`);
    
    try {
        // Write to temp file first
        await fs.writeFile(tempPath, JSON.stringify(data, null, 2));
        
        // Retry rename operation
        let renamed = false;
        for (let i = 0; i < 5; i++) {
            try {
                await fs.rename(tempPath, dataFilePath);
                renamed = true;
                break;
            } catch (error) {
                if (i === 4) throw error;
                await sleep(100);
            }
        }
    } catch (error) {
        // Cleanup temp file if it exists
        try { await fs.unlink(tempPath); } catch {}
        throw error;
    }
}
