import { auth } from '@/auth';
import { sql } from '@vercel/postgres';
import Link from 'next/link';
import WatchlistCard from '@/components/WatchlistCard';
import { redirect } from 'next/navigation';

interface Watchlist {
  id: number;
  name: string;
  location: string;
  price_min: number | null;
  price_max: number | null;
  beds_min: number | null;
  beds_max: number | null;
  baths_min: number | null;
  baths_max: number | null;
  sqft_min: number | null;
  sqft_max: number | null;
  property_types: string[] | null;
  track_off_market: boolean;
  track_price_reductions: boolean;
  track_expired: boolean;
  is_active: boolean;
  created_at: Date;
  property_count?: number;
}

async function getWatchlists(userId: string): Promise<Watchlist[]> {
  try {
    const result = await sql`
      SELECT
        w.*,
        COUNT(p.id) as property_count
      FROM watchlists w
      LEFT JOIN properties p ON p.watchlist_id = w.id
      WHERE w.user_id = ${userId}
      GROUP BY w.id
      ORDER BY w.created_at DESC
    `;

    return result.rows as Watchlist[];
  } catch (error) {
    console.error('Error fetching watchlists:', error);
    return [];
  }
}

export default async function WatchlistsPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  const watchlists = await getWatchlists(session.user.id);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Watchlists</h1>
          <p className="mt-2 text-gray-600">
            Create and manage watchlists to track off-market properties
          </p>
        </div>
        <Link
          href="/watchlists/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 transition"
        >
          <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          New Watchlist
        </Link>
      </div>

      {watchlists.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <svg
            className="mx-auto h-24 w-24 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
          <h3 className="mt-6 text-2xl font-semibold text-gray-900">
            No watchlists yet
          </h3>
          <p className="mt-2 text-gray-600 max-w-md mx-auto">
            Create your first watchlist to start tracking off-market properties in your target area.
          </p>
          <div className="mt-8">
            <Link
              href="/watchlists/new"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 transition"
            >
              <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create Your First Watchlist
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {watchlists.map((watchlist) => (
            <WatchlistCard key={watchlist.id} watchlist={watchlist} />
          ))}
        </div>
      )}
    </div>
  );
}
