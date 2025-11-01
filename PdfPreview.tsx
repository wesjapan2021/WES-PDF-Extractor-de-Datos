
import React, { useEffect, useRef, useState, lazy, Suspense } from 'react';

// This assumes pdfjsLib is available on the window object
// @ts-ignore
const pdfjsLib = window.pdfjsLib;

// FIX: Wrap the lazy-loaded components to provide proper types. This resolves an issue where TypeScript
// cannot infer the props of the lazy-loaded component, causing an error when passing `className`.
const LazyLoaderCircle = lazy(() => import('lucide-react').then(module => ({ default: module.LoaderCircle })));
const LoaderCircle = (props: React.SVGProps<SVGSVGElement>) => <LazyLoaderCircle {...props} />;
const LazyAlertTriangle = lazy(() => import('lucide-react').then(module => ({ default: module.AlertTriangle })));
const AlertTriangle = (props: React.SVGProps<SVGSVGElement>) => <LazyAlertTriangle {...props} />;


interface PdfPreviewProps {
  file: File;
}

const PdfPreview: React.FC<PdfPreviewProps> = ({ file }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pageNum, setPageNum] = useState(1);
  const [pageRendering, setPageRendering] = useState(false);
  const [pageNumPending, setPageNumPending] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!file) return;

    const fileReader = new FileReader();
    setIsLoading(true);
    setError(null);

    fileReader.onload = async (event) => {
      if (!event.target?.result) {
        setError("Failed to read file");
        setIsLoading(false);
        return;
      }
      if (!pdfjsLib) {
        setError("PDF.js library is not loaded.");
        setIsLoading(false);
        return;
      }
      try {
        const typedArray = new Uint8Array(event.target.result as ArrayBuffer);
        const pdf = await pdfjsLib.getDocument(typedArray).promise;
        setPdfDoc(pdf);
        setPageNum(1); // Reset to first page on new file
      } catch (err: any) {
        console.error("Error loading PDF:", err);
        setError("Could not load the PDF file for preview.");
      } finally {
        setIsLoading(false);
      }
    };
    fileReader.onerror = () => {
        setError("Error reading file");
        setIsLoading(false);
    }
    fileReader.readAsArrayBuffer(file);
    
    // Cleanup
    return () => {
        setPdfDoc(null);
    }
  }, [file]);
  
  const renderPage = async (num: number) => {
    if (!pdfDoc) return;
    setPageRendering(true);
    
    try {
        const page = await pdfDoc.getPage(num);
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        // Use the container width to determine the scale
        const container = canvas.parentElement;
        if (!container) return;
        const desiredWidth = container.clientWidth;
        const viewport = page.getViewport({ scale: 1 });
        const scale = desiredWidth / viewport.width;
        const scaledViewport = page.getViewport({ scale: scale });
        
        const context = canvas.getContext('2d');
        if (!context) return;
        
        canvas.height = scaledViewport.height;
        canvas.width = scaledViewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: scaledViewport,
        };
        
        await page.render(renderContext).promise;
        
    } catch (err) {
        console.error('Error rendering page:', err);
        setError('Could not render PDF page.');
    } finally {
        setPageRendering(false);
        if (pageNumPending !== null) {
          renderPage(pageNumPending);
          setPageNumPending(null);
        }
    }
  };

  useEffect(() => {
    if (pdfDoc) {
      renderPage(pageNum);
    }
  }, [pdfDoc, pageNum]);

  const queueRenderPage = (num: number) => {
    if (pageRendering) {
      setPageNumPending(num);
    } else {
      setPageNum(num);
    }
  };
  
  const onPrevPage = () => {
    if (pageNum <= 1) return;
    queueRenderPage(pageNum - 1);
  };
  
  const onNextPage = () => {
    if (!pdfDoc || pageNum >= pdfDoc.numPages) return;
    queueRenderPage(pageNum + 1);
  };

  if (isLoading) {
    return (
        <div className="flex flex-col items-center justify-center space-y-2 p-4 min-h-[200px]">
            <Suspense fallback={<div className="h-8 w-8" />}>
                <LoaderCircle className="animate-spin h-8 w-8 text-blue-600" />
            </Suspense>
            <p className="text-gray-600">Loading preview...</p>
        </div>
    );
  }
  
  if (error) {
    return (
        <div className="flex flex-col items-center justify-center space-y-2 text-red-600 p-4 min-h-[200px] bg-red-50 rounded-md">
            <Suspense fallback={<div className="h-8 w-8" />}>
                <AlertTriangle className="h-8 w-8" />
            </Suspense>
            <p className="font-semibold">Preview Error</p>
            <p className="text-sm">{error}</p>
        </div>
    );
  }
  
  if (!pdfDoc) {
      return null; // Should be handled by loading/error states
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-center space-x-4 bg-gray-200 p-2 rounded-md sticky top-0 z-10">
        <button onClick={onPrevPage} disabled={pageNum <= 1 || pageRendering} className="px-3 py-1 bg-white border border-gray-300 rounded shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
          Previous
        </button>
        <span className="font-medium text-gray-700">
          Page {pageNum} of {pdfDoc.numPages}
        </span>
        <button onClick={onNextPage} disabled={pageNum >= pdfDoc.numPages || pageRendering} className="px-3 py-1 bg-white border border-gray-300 rounded shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
          Next
        </button>
      </div>
      <div className="flex justify-center border rounded-lg overflow-auto max-h-[60vh] bg-gray-300 shadow-inner">
        <canvas ref={canvasRef} className="max-w-full h-auto"></canvas>
      </div>
    </div>
  );
};

export default PdfPreview;