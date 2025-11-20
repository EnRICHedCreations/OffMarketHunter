'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Alert {
  id: number;
  alert_type: string;
  alert_reason: string;
  motivation_score: number;
  sent_at: string;
  read_at: string | null;
  property_id: number;
  watchlist_name: string;
  // Property details
  full_street_line: string;
  city: string;
  state: string;
  zip_code: string;
  current_list_price: number | null;
  primary_photo: string | null;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'high_motivation'>('all');

  useEffect(() => {
    fetchAlerts();
  }, []);

  useEffect(() => {
    applyFilter();
  }, [alerts, filter]);

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/alerts');
      const data = await response.json();

      if (data.success) {
        setAlerts(data.alerts);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilter = () => {
    if (filter === 'unread') {
      setFilteredAlerts(alerts.filter(a => !a.read_at));
    } else if (filter === 'high_motivation') {
      setFilteredAlerts(alerts.filter(a => a.alert_type === 'high_motivation'));
    } else {
      setFilteredAlerts(alerts);
    }
  };

  const markAsRead = async (alertId: number) => {
    try {
      const response = await fetch(`/api/alerts/by-id?id=${alertId}`, {
        method: 'PUT',
      });

      if (response.ok) {
        setAlerts(alerts.map(a =>
          a.id === alertId ? { ...a, read_at: new Date().toISOString() } : a
        ));
      }
    } catch (error) {
      console.error('Error marking alert as read:', error);
    }
  };

  const deleteAlert = async (alertId: number) => {
    try {
      const response = await fetch(`/api/alerts/by-id?id=${alertId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setAlerts(alerts.filter(a => a.id !== alertId));
      }
    } catch (error) {
      console.error('Error deleting alert:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/alerts/read-all', {
        method: 'PUT',
      });

      if (response.ok) {
        setAlerts(alerts.map(a => ({ ...a, read_at: new Date().toISOString() })));
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const formatPrice = (price: number | null) => {
    if (!price) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getAlertIcon = (alertType: string) => {
    if (alertType === 'high_motivation') {
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
    }
    return (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    );
  };

  const unreadCount = alerts.filter(a => !a.read_at).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Alerts</h1>
        <p className="text-gray-600 mt-2">
          Get notified when high-motivation properties are found
        </p>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({alerts.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === 'unread'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Unread ({unreadCount})
            </button>
            <button
              onClick={() => setFilter('high_motivation')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === 'high_motivation'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              High Motivation
            </button>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition"
            >
              Mark all as read
            </button>
          )}
        </div>
      </div>

      {/* Alerts List */}
      {filteredAlerts.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <svg className="mx-auto w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No alerts yet</h3>
          <p className="text-gray-600">
            You'll be notified here when high-motivation properties are found
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`bg-white rounded-lg shadow-sm border-2 transition hover:shadow-md ${
                !alert.read_at ? 'border-indigo-200 bg-indigo-50/30' : 'border-gray-200'
              }`}
            >
              <div className="p-6">
                <div className="flex items-start gap-4">
                  {/* Alert Icon */}
                  <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                    alert.alert_type === 'high_motivation' ? 'bg-yellow-100 text-yellow-600' : 'bg-blue-100 text-blue-600'
                  }`}>
                    {getAlertIcon(alert.alert_type)}
                  </div>

                  {/* Property Image */}
                  <div className="flex-shrink-0 w-24 h-24 bg-gray-200 rounded-lg overflow-hidden">
                    {alert.primary_photo ? (
                      <Image
                        src={alert.primary_photo}
                        alt={alert.full_street_line}
                        width={96}
                        height={96}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full bg-gray-100">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Alert Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {alert.full_street_line}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {alert.city}, {alert.state} {alert.zip_code}
                        </p>
                      </div>
                      <span className="ml-4 inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-yellow-100 text-yellow-800">
                        Score: {alert.motivation_score}
                      </span>
                    </div>

                    <p className="text-gray-700 mb-3">{alert.alert_reason}</p>

                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                      <span className="font-medium text-gray-900">{formatPrice(alert.current_list_price)}</span>
                      {alert.beds && <span>{alert.beds} bd</span>}
                      {alert.baths && <span>{alert.baths} ba</span>}
                      {alert.sqft && <span>{alert.sqft.toLocaleString()} sqft</span>}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="inline-flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        {alert.watchlist_name}
                      </span>
                      <span className="inline-flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {formatDate(alert.sent_at)}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 flex items-center gap-3">
                      <Link
                        href={`/properties/${alert.property_id}`}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium"
                        onClick={() => !alert.read_at && markAsRead(alert.id)}
                      >
                        View Property
                      </Link>
                      {!alert.read_at && (
                        <button
                          onClick={() => markAsRead(alert.id)}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                        >
                          Mark as Read
                        </button>
                      )}
                      <button
                        onClick={() => deleteAlert(alert.id)}
                        className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
