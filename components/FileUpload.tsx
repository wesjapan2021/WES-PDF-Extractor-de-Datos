
import React, { useRef, useState, lazy, Suspense } from 'react';

// FIX: Wrap the lazy-loaded component to provide proper types. This resolves an issue where TypeScript
// cannot infer the props of the lazy-loaded component, causing an error when passing `className`.
const LazyUploadCloud = lazy(() => import('lucide-react').then(module => ({ default: module.UploadCloud })));
const UploadCloud = (props: React.SVGProps<SVGSVGElement>) => <LazyUploadCloud {...props} />;


interface FileUploadProps {
  onFileSelect: (file: File) => void;
  disabled: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "application/pdf") {
      onFileSelect(file);
    }
  };

  const handleAreaClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;
    
    const file = e.dataTransfer.files?.[0];
    if (file && file.type === "application/pdf") {
      onFileSelect(file);
    }
  };


  return (
    <div
      onClick={handleAreaClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      className={`flex justify-center w-full px-6 py-10 border-2 border-dashed rounded-lg transition-colors duration-200
        ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white cursor-pointer hover:border-blue-500'}
        ${isDragging ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}
      `}
    >
      <div className="text-center">
        <Suspense fallback={<div className="h-12 w-12" />}>
          <UploadCloud className={`mx-auto h-12 w-12 ${disabled ? 'text-gray-400' : 'text-gray-500'}`} />
        </Suspense>
        <p className="mt-2 text-sm text-gray-600">
          <span className="font-semibold text-blue-600">Click to upload</span> or drag and drop
        </p>
        <p className="text-xs text-gray-500">PDF files only</p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled}
        />
      </div>
    </div>
  );
};

export default FileUpload;