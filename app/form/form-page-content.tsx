// app/form/form-page-content.tsx
'use client';

import { useSearchParams } from 'next/navigation';
import { AttractiveForm } from '@/components/attractive-form';

export default function FormPageContent() {
  const searchParams = useSearchParams();
  const clientEmail = searchParams.get('email') || '';
  const token = searchParams.get('token') || '';
  const missingFields = ['firstName', 'lastName', 'phone', 'address']; // Default missing fields

  return (
    <AttractiveForm 
      clientEmail={clientEmail}
      token={token}
      missingFields={missingFields}
    />
  );
}