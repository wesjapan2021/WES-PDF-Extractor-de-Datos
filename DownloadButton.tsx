
import React, { lazy, Suspense } from 'react';
import { ExtractedRecord } from './types';
import { downloadCsv } from './utils/csvUtils';

// FIX: Wrap the lazy-loaded component to provide proper types. This resolves an issue where TypeScript
// cannot infer the props of the lazy-loaded component, causing an error when passing `className`.
const LazyDownload = lazy(() => import('lucide-react').then(module => ({ default: module.Download })));
const Download = (props: React.SVGProps<SVGSVGElement>) => <LazyDownload {...props} />;

interface DownloadButtonProps {
  data: ExtractedRecord[] | null;
  filename: string;
}

const DownloadButton: React.FC<DownloadButtonProps> = ({ data, filename }) => {
  const handleDownload = () => {
    if (data) {
      downloadCsv(data, filename.replace(/\.[^/.]+$/, "") + '_data.csv');
    }
  };

  const isDisabled = !data || data.length === 0;

  return (
    <button
      onClick={handleDownload}
      disabled={isDisabled}
      className="mt-6 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
    >
        <Suspense fallback={<div className="h-5 w-5 mr-2" />}>
          <Download className="mr-2 h-5 w-5" />
        </Suspense>
      Download CSV
    </button>
  );
};

export default DownloadButton;