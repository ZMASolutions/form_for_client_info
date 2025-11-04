// app/form/page.tsx
import { Suspense } from 'react';
import { AttractiveForm } from '@/components/attractive-form';
import FormPageContent from '././form-page-content';

export default function FormPage() {
  return (
    <Suspense fallback={<FormLoading />}>
      <FormPageContent />
    </Suspense>
  );
}

function FormLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 flex items-center justify-center">
      <div className="max-w-2xl mx-auto w-full px-4">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-center text-white mb-8">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold mb-2">Lade Formular...</h1>
          <p className="text-blue-100">Bitte warten Sie einen Moment.</p>
        </div>
      </div>
    </div>
  );
}