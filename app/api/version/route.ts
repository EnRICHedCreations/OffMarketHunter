import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    version: 'dac9ea3',
    timestamp: new Date().toISOString(),
    message: 'Latest deployment with Python API endpoint'
  });
}
