
import React, { lazy, Suspense } from 'react';
import { ExtractedRecord } from '../types';

// FIX: Wrap the lazy-loaded component to provide proper types. This resolves an issue where TypeScript
// cannot infer the props of the lazy-loaded component, causing an error when passing `className`.
const LazyTable = lazy(() => import('lucide-react').then(module => ({ default: module.Table })));
const Table = (props: React.SVGProps<SVGSVGElement>) => <LazyTable {...props} />;

interface DataTableProps {
  data: ExtractedRecord[];
}

const DataTable: React.FC<DataTableProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
        <div className="mt-8 text-center text-gray-500 p-8 border rounded-lg bg-gray-50">
            <Suspense fallback={<div className="h-12 w-12" />}>
                <Table className="mx-auto h-12 w-12 text-gray-400"/>
            </Suspense>
            <p className="mt-4 font-semibold">No data extracted.</p>
            <p className="mt-1 text-sm">The model could not find any data matching your prompt.</p>
        </div>
    );
  }

  const headers = Object.keys(data[0]);

  return (
    <div className="w-full mt-6 overflow-x-auto bg-white rounded-lg shadow-md border border-gray-200">
        <table className="min-w-full text-sm divide-y divide-gray-200">
            <thead className="bg-gray-50">
            <tr>
                {headers.map((header) => (
                <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {header}
                </th>
                ))}
            </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-gray-50 transition-colors">
                {headers.map((header, colIndex) => (
                    <td key={`${rowIndex}-${colIndex}`} className="px-6 py-4 whitespace-nowrap text-gray-700">
                    {String(row[header])}
                    </td>
                ))}
                </tr>
            ))}
            </tbody>
        </table>
    </div>
  );
};

export default DataTable;