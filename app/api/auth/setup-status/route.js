import { NextResponse } from 'next/server';
import { getUserCount } from '@/lib/auth';

export async function GET() {
    const isSetup = getUserCount() === 0;
    return NextResponse.json({ available: isSetup, setupOpen: isSetup });
}