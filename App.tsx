import React, { useState, lazy, Suspense, useEffect } from 'react';
import { extractTextFromPdf } from './utils/pdfUtils';
import { extractDataWithGemini } from './services/geminiService';
import { ExtractedRecord } from './types';
import FileUpload from './components/FileUpload';
import DataTable from './components/DataTable';
import DownloadButton from './DownloadButton';
import Loader from './components/Loader';
import PdfPreview from './PdfPreview';

// FIX: Wrap the lazy-loaded components to provide proper types. This resolves an issue where TypeScript
// cannot infer the props of the lazy-loaded component, causing an error when passing `className`.
const LazyFileText = lazy(() => import('lucide-react').then(module => ({ default: module.FileText })));
const FileText = (props: React.SVGProps<SVGSVGElement>) => <LazyFileText {...props} />;
const LazySparkles = lazy(() => import('lucide-react').then(module => ({ default: module.Sparkles })));
const Sparkles = (props: React.SVGProps<SVGSVGElement>) => <LazySparkles {...props} />;
const LazyXCircle = lazy(() => import('lucide-react').then(module => ({ default: module.XCircle })));
const XCircle = (props: React.SVGProps<SVGSVGElement>) => <LazyXCircle {...props} />;
const LazyTrash2 = lazy(() => import('lucide-react').then(module => ({ default: module.Trash2 })));
const Trash2 = (props: React.SVGProps<SVGSVGElement>) => <LazyTrash2 {...props} />;
const LazyEye = lazy(() => import('lucide-react').then(module => ({ default: module.Eye })));
const Eye = (props: React.SVGProps<SVGSVGElement>) => <LazyEye {...props} />;
const LazyEyeOff = lazy(() => import('lucide-react').then(module => ({ default: module.EyeOff })));
const EyeOff = (props: React.SVGProps<SVGSVGElement>) => <LazyEyeOff {...props} />;


const App: React.FC = () => {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [extractionPrompt, setExtractionPrompt] = useState<string>('CODIGÓ VENTA, CODIGO, CANTIDAD, DESCRIPCIÓN, PRECIO, SUBTOTAL, TOTAL A PAGAR');
  const [extractedData, setExtractedData] = useState<ExtractedRecord[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [promptHistory, setPromptHistory] = useState<string[]>([]);

  useEffect(() => {
    try {
      const savedPrompts = localStorage.getItem('pdf-extractor-prompts');
      if (savedPrompts) {
        setPromptHistory(JSON.parse(savedPrompts));
      }
    } catch (err) {
      console.error("Failed to load prompt history from localStorage", err);
    }
  }, []);

  const handleFileSelect = (file: File) => {
    setPdfFile(file);
    setError(null);
    setExtractedData(null);
    setShowPreview(false);
  };

  const handleReset = () => {
    setPdfFile(null);
    setExtractionPrompt('CODIGÓ VENTA, CODIGO, CANTIDAD, DESCRIPCIÓN, PRECIO, SUBTOTAL, TOTAL A PAGAR');
    setExtractedData(null);
    setError(null);
    setIsLoading(false);
    setShowPreview(false);
  };

  const handleClearHistory = () => {
    setPromptHistory([]);
    localStorage.removeItem('pdf-extractor-prompts');
  };

  const handleExtract = async () => {
    if (!pdfFile || !extractionPrompt.trim()) {
      setError("Please select a PDF file and provide an extraction prompt.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setExtractedData(null);

    try {
      const pdfText = await extractTextFromPdf(pdfFile);
      const data = await extractDataWithGemini(pdfText, extractionPrompt);
      setExtractedData(data);
      
      const trimmedPrompt = extractionPrompt.trim();
      if (trimmedPrompt && !promptHistory.includes(trimmedPrompt)) {
        const newHistory = [trimmedPrompt, ...promptHistory].slice(0, 15); // Keep last 15
        setPromptHistory(newHistory);
        localStorage.setItem('pdf-extractor-prompts', JSON.stringify(newHistory));
      }

    } catch (err: any) {
      setError(err.message || "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-start justify-center p-4 sm:p-6 lg:p-8">
      <main className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-6 sm:p-8 space-y-8">
        <header className="text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">PDF Data Extractor</h1>
          <p className="mt-2 text-md text-gray-600">
            Upload a PDF, tell Gemini what to extract, and get your data in a clean table.
          </p>
        </header>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">
            <div className="flex">
                <div className="py-1">
                    <Suspense fallback={<div className="h-6 w-6" />}>
                        <XCircle className="h-6 w-6 text-red-500 mr-3" />
                    </Suspense>
                </div>
              <div>
                <p className="font-bold">Error</p>
                <p>{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {!pdfFile ? (
            <FileUpload onFileSelect={handleFileSelect} disabled={isLoading} />
          ) : (
            <div className="space-y-4">
              <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 overflow-hidden">
                      <Suspense fallback={<div className="h-8 w-8" />}>
                          <FileText className="h-8 w-8 text-blue-600 flex-shrink-0" />
                      </Suspense>
                      <div className="truncate">
                          <p className="font-medium text-gray-800 truncate" title={pdfFile.name}>{pdfFile.name}</p>
                          <p className="text-sm text-gray-500">{(pdfFile.size / 1024).toFixed(2)} KB</p>
                      </div>
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <button
                      onClick={() => setShowPreview(!showPreview)}
                      disabled={isLoading}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label={showPreview ? "Hide preview" : "Show preview"}
                    >
                      <Suspense fallback={<div className="h-5 w-5" />}>
                        {showPreview ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </Suspense>
                    </button>
                    <button 
                      onClick={handleReset} 
                      disabled={isLoading}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label="Remove file"
                    >
                      <Suspense fallback={<div className="h-5 w-5" />}>
                          <Trash2 className="h-5 w-5" />
                      </Suspense>
                    </button>
                  </div>
                </div>
              </div>

              {showPreview && (
                <div className="border rounded-lg p-2 sm:p-4 bg-gray-50">
                    <Suspense fallback={<div className="text-center p-4">Loading preview...</div>}>
                        <PdfPreview file={pdfFile} />
                    </Suspense>
                </div>
              )}

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label htmlFor="prompt" className="block text-sm font-medium text-gray-700">
                    What data do you want to extract?
                  </label>
                  {promptHistory.length > 0 && (
                    <button
                      onClick={handleClearHistory}
                      disabled={isLoading}
                      className="text-xs text-gray-500 hover:text-red-600 transition-colors disabled:opacity-50"
                    >
                      Clear History
                    </button>
                  )}
                </div>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Suspense fallback={<div className="h-5 w-5" />}>
                            <Sparkles className="h-5 w-5 text-gray-400" />
                        </Suspense>
                    </div>
                    <input
                        type="text"
                        id="prompt"
                        list="prompt-history"
                        value={extractionPrompt}
                        onChange={(e) => setExtractionPrompt(e.target.value)}
                        placeholder="e.g., invoice number, total amount, and due date"
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        disabled={isLoading}
                    />
                    <datalist id="prompt-history">
                      {promptHistory.map((p, i) => (
                        <option key={i} value={p} />
                      ))}
                    </datalist>
                </div>
              </div>
              <button
                onClick={handleExtract}
                disabled={isLoading || !extractionPrompt.trim()}
                className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Extracting...' : 'Extract Data'}
              </button>
            </div>
          )}
        </div>

        {isLoading && <Loader />}
        
        {!isLoading && extractedData && (
          <section className="text-center">
            <h2 className="text-2xl font-semibold text-gray-800">Extracted Data</h2>
            <DataTable data={extractedData} />
            <DownloadButton data={extractedData} filename={pdfFile?.name || 'data.csv'} />
          </section>
        )}
      </main>
    </div>
  );
};

export default App;