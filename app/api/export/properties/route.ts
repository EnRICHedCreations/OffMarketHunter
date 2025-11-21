import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { sql } from '@vercel/postgres';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/export/properties?watchlist_id=X&interested=true
 * Export properties to CSV
 */
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const watchlistId = searchParams.get('watchlist_id');
    const interestedOnly = searchParams.get('interested') === 'true';
    const userId = parseInt(session.user.id);

    let query;

    if (interestedOnly) {
      // Export interested properties
      query = sql`
        SELECT
          p.*,
          w.name as watchlist_name
        FROM property_interest pi
        INNER JOIN properties p ON pi.property_id = p.id
        INNER JOIN watchlists w ON p.watchlist_id = w.id
        WHERE pi.user_id = ${userId}
        ORDER BY pi.marked_at DESC
      `;
    } else if (watchlistId) {
      // Export properties from specific watchlist
      const wid = parseInt(watchlistId);

      // Verify user owns this watchlist
      const ownerCheck = await sql`
        SELECT id FROM watchlists WHERE id = ${wid} AND user_id = ${userId}
      `;

      if (ownerCheck.rows.length === 0) {
        return NextResponse.json({ error: 'Watchlist not found' }, { status: 404 });
      }

      query = sql`
        SELECT
          p.*,
          w.name as watchlist_name
        FROM properties p
        INNER JOIN watchlists w ON p.watchlist_id = w.id
        WHERE p.watchlist_id = ${wid}
        ORDER BY p.created_at DESC
      `;
    } else {
      // Export all user's properties
      query = sql`
        SELECT
          p.*,
          w.name as watchlist_name
        FROM properties p
        INNER JOIN watchlists w ON p.watchlist_id = w.id
        WHERE w.user_id = ${userId}
        ORDER BY p.created_at DESC
      `;
    }

    const result = await query;

    if (result.rows.length === 0) {
      return new NextResponse('No properties to export', {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="properties.csv"',
        },
      });
    }

    // Build CSV
    const headers = [
      'Address',
      'City',
      'State',
      'ZIP',
      'County',
      'Beds',
      'Baths',
      'SqFt',
      'Lot SqFt',
      'Year Built',
      'Property Type',
      'Status',
      'List Price',
      'Original Price',
      'Price Reductions',
      'Total Reduction Amount',
      'Total Reduction %',
      'Days on Market',
      'Motivation Score',
      'Agent Name',
      'Agent Phone',
      'Agent Email',
      'MLS ID',
      'Watchlist',
    ];

    const csvRows = [headers.join(',')];

    for (const property of result.rows) {
      const row = [
        escapeCSV(property.full_street_line),
        escapeCSV(property.city),
        escapeCSV(property.state),
        escapeCSV(property.zip_code),
        escapeCSV(property.county),
        property.beds || '',
        property.baths || '',
        property.sqft || '',
        property.lot_sqft || '',
        property.year_built || '',
        escapeCSV(property.property_type),
        escapeCSV(property.current_status),
        property.current_list_price || '',
        property.original_list_price || '',
        property.price_reduction_count || 0,
        property.total_price_reduction_amount || '',
        property.total_price_reduction_percent || '',
        property.total_days_on_market || '',
        property.motivation_score || '',
        escapeCSV(property.agent_name),
        escapeCSV(property.agent_phone),
        escapeCSV(property.agent_email),
        escapeCSV(property.mls_id),
        escapeCSV(property.watchlist_name),
      ];

      csvRows.push(row.join(','));
    }

    const csv = csvRows.join('\n');
    const filename = interestedOnly
      ? 'interested-properties.csv'
      : watchlistId
      ? `watchlist-${watchlistId}-properties.csv`
      : 'all-properties.csv';

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting properties:', error);
    return NextResponse.json(
      { error: 'Failed to export properties', details: String(error) },
      { status: 500 }
    );
  }
}

function escapeCSV(value: any): string {
  if (value === null || value === undefined) return '';

  const stringValue = String(value);

  // If the value contains comma, quote, or newline, wrap it in quotes and escape internal quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}
