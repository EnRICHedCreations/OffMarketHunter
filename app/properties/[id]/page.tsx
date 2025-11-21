import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { sql } from '@vercel/postgres';
import Image from 'next/image';
import Link from 'next/link';
import PropertyTimeline from '@/components/PropertyTimeline';
import MotivationScoreBreakdown from '@/components/MotivationScoreBreakdown';
import PropertyNotes from '@/components/PropertyNotes';
import PropertyInterestButton from '@/components/PropertyInterestButton';

interface Property {
  id: number;
  property_id: string;
  full_street_line: string;
  city: string;
  state: string;
  zip_code: string;
  county?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  beds?: number | null;
  baths?: number | null;
  sqft?: number | null;
  lot_sqft?: number | null;
  year_built?: number | null;
  property_type?: string | null;
  current_status: string;
  current_list_price?: number | null;
  original_list_price?: number | null;
  list_date?: string | null;
  agent_name?: string | null;
  agent_email?: string | null;
  agent_phone?: string | null;
  broker_name?: string | null;
  mls_id?: string | null;
  primary_photo?: string | null;
  photos?: any;
  description_text?: string | null;
  motivation_score?: number | null;
  motivation_score_dom?: number | null;
  motivation_score_reductions?: number | null;
  motivation_score_off_market?: number | null;
  motivation_score_status?: number | null;
  motivation_score_market?: number | null;
  raw_data?: any;
  watchlist_name?: string;
}

async function getProperty(propertyId: number, userId: number): Promise<Property | null> {
  try {
    const result = await sql`
      SELECT
        p.*,
        w.name as watchlist_name,
        w.user_id
      FROM properties p
      INNER JOIN watchlists w ON p.watchlist_id = w.id
      WHERE p.id = ${propertyId}
    `;

    if (result.rows.length === 0) {
      return null;
    }

    const property = result.rows[0] as any;

    // Verify user owns this property
    if (property.user_id !== userId) {
      return null;
    }

    return property;
  } catch (error) {
    console.error('Error fetching property:', error);
    return null;
  }
}

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const userId = parseInt(session.user.id);
  const { id } = await params;
  const propertyId = parseInt(id);

  const property = await getProperty(propertyId, userId);

  if (!property) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900">Property Not Found</h1>
          <p className="mt-2 text-gray-600">
            The property you're looking for doesn't exist or you don't have access to it.
          </p>
          <Link
            href="/properties"
            className="mt-4 inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Back to Properties
          </Link>
        </div>
      </div>
    );
  }

  const formatPrice = (price: number | null | undefined) => {
    if (!price) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const photos = property.photos ? (Array.isArray(property.photos) ? property.photos : []) : [];
  const allPhotos = property.primary_photo ? [property.primary_photo, ...photos] : photos;

  const daysOnMarket = property.raw_data?.days_on_market;
  const lastSoldPrice = property.raw_data?.last_sold_price;
  const lastSoldDate = property.raw_data?.last_sold_date;

  // Create Google Maps link
  const mapLink = property.latitude && property.longitude
    ? `https://www.google.com/maps/search/?api=1&query=${property.latitude},${property.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${property.full_street_line}, ${property.city}, ${property.state} ${property.zip_code}`
      )}`;

  // Create Realtor.com link - use scraped URL if available, otherwise construct search URL
  const realtorLink = property.raw_data?.property_url ||
    `https://www.realtor.com/realestateandhomes-search/${encodeURIComponent(
      `${property.full_street_line}, ${property.city}, ${property.state} ${property.zip_code}`
    )}`;

  return (
    <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <Link
          href="/properties"
          className="inline-flex items-center text-indigo-600 hover:text-indigo-800 mb-4"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Properties
        </Link>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {property.full_street_line}
              </h1>
              <p className="text-lg text-gray-600">
                {property.city}, {property.state} {property.zip_code}
              </p>
              {property.county && (
                <p className="text-sm text-gray-500 mt-1">{property.county} County</p>
              )}
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-indigo-600 mb-1">
                {formatPrice(property.current_list_price)}
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                {property.current_status}
              </span>
            </div>
          </div>

          {/* Property Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
            {property.beds != null && (
              <div>
                <div className="text-sm text-gray-500">Bedrooms</div>
                <div className="text-xl font-semibold text-gray-900">{property.beds}</div>
              </div>
            )}
            {property.baths != null && (
              <div>
                <div className="text-sm text-gray-500">Bathrooms</div>
                <div className="text-xl font-semibold text-gray-900">{property.baths}</div>
              </div>
            )}
            {property.sqft != null && (
              <div>
                <div className="text-sm text-gray-500">Square Feet</div>
                <div className="text-xl font-semibold text-gray-900">
                  {property.sqft.toLocaleString()}
                </div>
              </div>
            )}
            {property.lot_sqft != null && (
              <div>
                <div className="text-sm text-gray-500">Lot Size</div>
                <div className="text-xl font-semibold text-gray-900">
                  {property.lot_sqft.toLocaleString()} sqft
                </div>
              </div>
            )}
            {property.year_built != null && (
              <div>
                <div className="text-sm text-gray-500">Year Built</div>
                <div className="text-xl font-semibold text-gray-900">{property.year_built}</div>
              </div>
            )}
            {property.property_type && (
              <div>
                <div className="text-sm text-gray-500">Property Type</div>
                <div className="text-xl font-semibold text-gray-900">{property.property_type}</div>
              </div>
            )}
            {daysOnMarket !== null && daysOnMarket !== undefined && (
              <div>
                <div className="text-sm text-gray-500">Days on Market</div>
                <div className="text-xl font-semibold text-gray-900">{daysOnMarket}</div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Photos */}
          <div className="lg:col-span-2 space-y-6">
            {/* Photo Gallery */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Photos</h2>
              {allPhotos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {allPhotos.slice(0, 6).map((photo: string, index: number) => (
                    <div key={index} className="relative h-64 bg-gray-100 rounded-lg overflow-hidden">
                      <Image
                        src={photo}
                        alt={`Property photo ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
                  <div className="text-center text-gray-500">
                    <svg className="mx-auto w-16 h-16 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p>No photos available</p>
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            {property.description_text && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Description</h2>
                <p className="text-gray-700 whitespace-pre-line">{property.description_text}</p>
              </div>
            )}

            {/* Additional Details */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Additional Details</h2>
              <div className="space-y-3">
                {property.mls_id && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">MLS ID</span>
                    <span className="font-medium text-gray-900">{property.mls_id}</span>
                  </div>
                )}
                {lastSoldPrice && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Last Sold Price</span>
                    <span className="font-medium text-gray-900">{formatPrice(lastSoldPrice)}</span>
                  </div>
                )}
                {lastSoldDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Last Sold Date</span>
                    <span className="font-medium text-gray-900">
                      {new Date(lastSoldDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">From Watchlist</span>
                  <span className="font-medium text-gray-900">{property.watchlist_name}</span>
                </div>
              </div>
            </div>

            {/* Property History */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Property History</h2>
              <PropertyTimeline propertyId={property.id} />
            </div>
{/* Property Notes */}            <PropertyNotes propertyId={property.id} />
          </div>

          {/* Right Column - Contact & Actions */}
          <div className="space-y-6">
            {/* Agent Contact */}
            {(property.agent_name || property.broker_name) && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h2>
                <div className="space-y-3">
                  {property.agent_name && (
                    <div>
                      <div className="text-sm text-gray-500">Agent</div>
                      <div className="font-medium text-gray-900">{property.agent_name}</div>
                    </div>
                  )}
                  {property.agent_phone && (
                    <div>
                      <div className="text-sm text-gray-500">Phone</div>
                      <a
                        href={`tel:${property.agent_phone}`}
                        className="font-medium text-indigo-600 hover:text-indigo-800"
                      >
                        {property.agent_phone}
                      </a>
                    </div>
                  )}
                  {property.agent_email && (
                    <div>
                      <div className="text-sm text-gray-500">Email</div>
                      <a
                        href={`mailto:${property.agent_email}`}
                        className="font-medium text-indigo-600 hover:text-indigo-800 break-all"
                      >
                        {property.agent_email}
                      </a>
                    </div>
                  )}
                  {property.broker_name && (
                    <div>
                      <div className="text-sm text-gray-500">Broker</div>
                      <div className="font-medium text-gray-900">{property.broker_name}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Motivation Score */}
            {property.motivation_score != null && property.motivation_score_dom != null && property.motivation_score_reductions != null && property.motivation_score_off_market != null && property.motivation_score_status != null && property.motivation_score_market != null ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Motivation Analysis</h2>
                <MotivationScoreBreakdown
                  totalScore={typeof property.motivation_score === 'string' ? parseFloat(property.motivation_score) || 0 : property.motivation_score || 0}
                  domComponent={typeof property.motivation_score_dom === 'string' ? parseFloat(property.motivation_score_dom) || 0 : property.motivation_score_dom || 0}
                  reductionComponent={typeof property.motivation_score_reductions === 'string' ? parseFloat(property.motivation_score_reductions) || 0 : property.motivation_score_reductions || 0}
                  offMarketComponent={typeof property.motivation_score_off_market === 'string' ? parseFloat(property.motivation_score_off_market) || 0 : property.motivation_score_off_market || 0}
                  statusComponent={typeof property.motivation_score_status === 'string' ? parseFloat(property.motivation_score_status) || 0 : property.motivation_score_status || 0}
                  marketComponent={typeof property.motivation_score_market === 'string' ? parseFloat(property.motivation_score_market) || 0 : property.motivation_score_market || 0}
                />
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Motivation Score</h2>
                <div className="text-center py-4 text-gray-500">
                  <p>Score not calculated yet</p>
                  <p className="text-xs mt-2">Scores will be calculated automatically when properties are scanned</p>
                </div>
              </div>
            )}

{/* Interest Button */}            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">              <PropertyInterestButton propertyId={property.id} />            </div>
            {/* Map Link */}
            <a
              href={mapLink}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:border-indigo-300 transition"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">View on Map</h3>
                  <p className="text-sm text-gray-500 mt-1">Open in Google Maps</p>
                </div>
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </a>

            {/* Realtor.com Link */}
            <a
              href={realtorLink}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:border-indigo-300 transition"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">View Listing</h3>
                  <p className="text-sm text-gray-500 mt-1">Open on Realtor.com</p>
                </div>
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
            </a>
          </div>
        </div>
    </div>
  );
}
