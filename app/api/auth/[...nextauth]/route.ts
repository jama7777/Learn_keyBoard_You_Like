import { NextResponse } from 'next/server';
import { handlers } from '@/auth';

// Next.js 16: route handlers default to the Node.js runtime. Do NOT set
// `export const runtime = 'edge'` — the docs now recommend Node, and v16's
// replacement for middleware (`proxy.ts`) is Node-only.
export const { GET, POST } = handlers;
