/**
 * Health Check API Route
 *
 * - Check database connectivity
 * - Return status: healthy/unhealthy
 * - Optional: Check Supabase Storage, Redis
 *
 * Endpoint: GET /api/health
 * Response: { status: 'healthy', timestamp: '...' }
 *
 * Use for:
 * - Monitoring/alerting
 * - Load balancer health checks
 * - Deployment verification
 *
 * See: docs/backend.md - Step 12: Health Check API
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Check database connectivity
    const { error } = await supabase.from('organizations').select('id').limit(1);

    if (error) {
      return NextResponse.json(
        {
          status: 'unhealthy',
          error: 'Database connection failed',
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      );
    }

    // Potential checks: Supabase Storage, Redis, External APIs

    return NextResponse.json({
      status: 'healthy',
      checks: {
        database: 'ok',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
