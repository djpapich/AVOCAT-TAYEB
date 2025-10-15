import React, { useState, useCallback } from 'react';
import { FormData, DocumentType, GeneratedDocument } from './types';
import DocumentPreview from './components/DocumentPreview';
import { generateDocument, extractDataFromDocument } from './services/geminiService';
import Header from './components/Header';
import Footer from './components/Footer';
import DocumentSelector from './components/DocumentSelector';
import Stepper from './components/Stepper';
import DocumentUploader from './components/DocumentUploader';
import DataVerificationForm from './components/DataVerificationForm';

type AppStep = 'DOCUMENT_SELECT' | 'FILE_UPLOAD' | 'DATA_VERIFICATION' | 'PREVIEW';

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>('DOCUMENT_SELECT');
  const [selectedDocTypes, setSelectedDocTypes] = useState<DocumentType[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<FormData | null>(null);
  const [generatedDocuments, setGeneratedDocuments] = useState<GeneratedDocument[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleDocumentSelect = (docTypes: DocumentType[]) => {
    setSelectedDocTypes(docTypes);
    setStep('FILE_UPLOAD');
  };

  const handleFileSubmit = async (file: File) => {
    setUploadedFile(file);
    setIsLoading(true);
    setError(null);
    setLoadingMessage("...جاري تحليل المستند واستخلاص البيانات");
    try {
        const extractedData = await extractDataFromDocument(file);
        setFormData(extractedData);
        setStep('DATA_VERIFICATION');
    } catch (err) {
        console.error("Error extracting data:", err);
        setError('حدث خطأ أثناء تحليل المستند. يرجى المحاولة مرة أخرى بملف آخر أو التأكد من وضوح المستند.');
        setStep('FILE_UPLOAD'); // Go back to upload step on error
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleDataVerified = useCallback(async (verifiedData: FormData) => {
    setFormData(verifiedData);
    setIsLoading(true);
    setError(null);
    setGeneratedDocuments([]);
    setLoadingMessage("...جاري إنشاء المستند(ات) النهائية");

    try {
      const generationPromises = selectedDocTypes.map(docType => 
        generateDocument(verifiedData, docType).then(htmlContent => ({ docType, htmlContent }))
      );
      
      const results = await Promise.all(generationPromises);
      
      setGeneratedDocuments(results);
      setStep('PREVIEW');
    } catch (err) {
      console.error("Error generating document(s):", err);
      setError('حدث خطأ أثناء إنشاء المستند(ات). يرجى المحاولة مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedDocTypes]);

  const handleBack = () => {
    setError(null);
    if (step === 'PREVIEW') {
        setGeneratedDocuments([]);
        setStep('DATA_VERIFICATION');
    } else if (step === 'DATA_VERIFICATION') {
        setFormData(null);
        setStep('FILE_UPLOAD');
    } else if (step === 'FILE_UPLOAD') {
        setSelectedDocTypes([]);
        setStep('DOCUMENT_SELECT');
    }
  };
  
  const handleReset = () => {
    setStep('DOCUMENT_SELECT');
    setSelectedDocTypes([]);
    setUploadedFile(null);
    setFormData(null);
    setGeneratedDocuments([]);
    setIsLoading(false);
    setError(null);
  };

  const STEPS = ["اختيار المستند", "رفع الملف", "مراجعة البيانات", "معاينة وتصدير"];
  const currentStepIndex = step === 'DOCUMENT_SELECT' ? 0 : step === 'FILE_UPLOAD' ? 1 : step === 'DATA_VERIFICATION' ? 2 : 3;

  const renderStep = () => {
    if (isLoading) {
       return (
         <div className="flex flex-col items-center justify-center min-h-[300px] bg-white p-8 rounded-lg shadow-xl max-w-5xl mx-auto text-center">
           <div className="w-16 h-16 border-4 border-teal-500 border-dashed rounded-full animate-spin"></div>
           <p className="mt-4 text-gray-600 font-semibold">{loadingMessage}</p>
           {error && <p className="text-red-500 mt-6">{error}</p>}
         </div>
       );
    }

    switch (step) {
      case 'DOCUMENT_SELECT':
        return <DocumentSelector onSelect={handleDocumentSelect} />;
      case 'FILE_UPLOAD':
        return <DocumentUploader onSubmit={handleFileSubmit} onBack={handleBack} />;
      case 'DATA_VERIFICATION':
        return <DataVerificationForm onSubmit={handleDataVerified} initialData={formData} onBack={handleBack} />;
      case 'PREVIEW':
        return <DocumentPreview generatedDocuments={generatedDocuments} onBack={handleBack} onReset={handleReset} />;
      default:
        return <DocumentSelector onSelect={handleDocumentSelect} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-8">
        <Stepper steps={STEPS} currentStep={currentStepIndex} />
        <div className="mt-8">
            {renderStep()}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default App;
