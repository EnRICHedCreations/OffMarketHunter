import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({
    message: 'POST test-scrape works',
    timestamp: new Date().toISOString()
  });
}

export async function GET() {
  return NextResponse.json({
    message: 'GET test-scrape works',
    timestamp: new Date().toISOString()
  });
}
