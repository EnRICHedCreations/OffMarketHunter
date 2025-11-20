'use client';

import { useEffect, useState } from 'react';

interface HistoryEvent {
  id: number;
  event_type: string;
  event_date: string;
  old_status?: string | null;
  new_status?: string | null;
  old_price?: number | null;
  new_price?: number | null;
  price_change_amount?: number | null;
  price_change_percent?: number | null;
  notes?: string | null;
}

interface PropertyTimelineProps {
  propertyId: number;
}

export default function PropertyTimeline({ propertyId }: PropertyTimelineProps) {
  const [history, setHistory] = useState<HistoryEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const response = await fetch(`/api/properties/history?id=${propertyId}`);
        const data = await response.json();

        if (data.success) {
          setHistory(data.history);
        } else {
          setError(data.error || 'Failed to load history');
        }
      } catch (err) {
        console.error('Error fetching history:', err);
        setError('Failed to load property history');
      } finally {
        setIsLoading(false);
      }
    }

    fetchHistory();
  }, [propertyId]);

  const formatPrice = (price: number | null | undefined) => {
    if (!price) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getEventIcon = (eventType: string) => {
    if (eventType === 'price_reduction') {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
        </svg>
      );
    }
    if (eventType === 'status_change') {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  };

  const getEventColor = (eventType: string) => {
    if (eventType === 'price_reduction') return 'text-green-600 bg-green-100';
    if (eventType === 'status_change') return 'text-blue-600 bg-blue-100';
    return 'text-gray-600 bg-gray-100';
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <p className="mt-2 text-gray-600">Loading history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        <p>{error}</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <svg className="mx-auto w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p>No history available yet</p>
        <p className="text-sm mt-1">Changes will be tracked automatically</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {history.map((event, index) => (
        <div key={event.id} className="relative">
          {/* Timeline line */}
          {index < history.length - 1 && (
            <div className="absolute left-5 top-12 bottom-0 w-0.5 bg-gray-200"></div>
          )}

          <div className="flex gap-4">
            {/* Icon */}
            <div className={`flex-shrink-0 w-10 h-10 rounded-full ${getEventColor(event.event_type)} flex items-center justify-center`}>
              {getEventIcon(event.event_type)}
            </div>

            {/* Content */}
            <div className="flex-1 bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-semibold text-gray-900">
                    {event.event_type === 'price_reduction' && 'Price Reduction'}
                    {event.event_type === 'status_change' && 'Status Change'}
                    {event.event_type === 'listing' && 'Listed'}
                  </h4>
                  <p className="text-sm text-gray-500">{formatDate(event.event_date)}</p>
                </div>
              </div>

              {event.event_type === 'price_reduction' && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-600">Price:</span>
                    <span className="line-through text-gray-400">{formatPrice(event.old_price)}</span>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="font-semibold text-green-600">{formatPrice(event.new_price)}</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium text-green-600">
                      -{formatPrice(event.price_change_amount)}
                      ({event.price_change_percent?.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              )}

              {event.event_type === 'status_change' && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-600">Status:</span>
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                    {event.old_status?.replace(/_/g, ' ')}
                  </span>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                    {event.new_status?.replace(/_/g, ' ')}
                  </span>
                </div>
              )}

              {event.notes && (
                <p className="mt-2 text-sm text-gray-600">{event.notes}</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
