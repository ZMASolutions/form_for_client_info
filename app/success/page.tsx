// app/success/page.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-cyan-50 flex items-center justify-center py-8 px-4">
      <div className="max-w-md w-full">
        <Card className="shadow-2xl border-0">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-800">
              Vielen Dank!
            </CardTitle>
            <CardDescription className="text-gray-600 text-lg">
              Ihre Informationen wurden erfolgreich übermittelt.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              Wir haben Ihre Daten erhalten und werden uns in Kürze bei Ihnen melden.
            </p>
            <Button 
              onClick={() => window.location.href = '/'}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              Zurück zur Startseite
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}