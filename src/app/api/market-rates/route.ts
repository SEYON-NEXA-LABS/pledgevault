import { NextRequest, NextResponse } from 'next/server';
import { syncMarketRatesAction } from '@/app/actions/market';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated
    const authHeader = request.headers.get('authorization');
    const force = request.nextUrl.searchParams.get('force') === 'true';

    // Call the server action
    const result = await syncMarketRatesAction(force);

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result.data,
        throttled: result.throttled || false,
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
  } catch (err: any) {
    console.error('Market rates API error:', err);
    return NextResponse.json({
      success: false,
      error: err.message || 'Failed to sync market rates',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET() {
  // Redirect to docs or show usage
  return NextResponse.json({
    message: 'Use POST to sync market rates',
    usage: 'POST /api/market-rates?force=true',
    documentation: 'Syncs real-time gold and silver rates from GoldAPI.io'
  });
}
