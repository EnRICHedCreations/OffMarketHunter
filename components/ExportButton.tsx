'use client';

import { useState } from 'react';

interface ExportButtonProps {
  watchlistId?: number;
  interested?: boolean;
  label?: string;
}

export default function ExportButton({ watchlistId, interested, label = 'Export to CSV' }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);

    try {
      let url = '/api/export/properties';
      const params = new URLSearchParams();

      if (watchlistId) {
        params.append('watchlist_id', watchlistId.toString());
      }
      if (interested) {
        params.append('interested', 'true');
      }

      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Failed to export');
      }

      // Get the CSV content
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);

      // Create a temporary link and click it to download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = interested
        ? 'interested-properties.csv'
        : watchlistId
        ? `watchlist-${watchlistId}-properties.csv`
        : 'all-properties.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error exporting:', error);
      alert('Failed to export properties');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      {isExporting ? 'Exporting...' : label}
    </button>
  );
}
