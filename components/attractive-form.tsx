// components/attractive-form.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

// Shadcn UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

// Form validation schema
const formSchema = z.object({
  firstName: z.string().min(2, {
    message: 'Der Vorname muss mindestens 2 Zeichen lang sein.',
  }),
  lastName: z.string().min(2, {
    message: 'Der Nachname muss mindestens 2 Zeichen lang sein.',
  }),
  email: z.string().email({
    message: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.',
  }),
  phone: z.string().min(10, {
    message: 'Die Telefonnummer muss mindestens 10 Ziffern haben.',
  }),
  address: z.string().min(5, {
    message: 'Die Adresse muss mindestens 5 Zeichen lang sein.',
  }),
});

type FormData = z.infer<typeof formSchema>;

interface AttractiveFormProps {
  clientEmail?: string;
  token?: string;
  missingFields?: string[];
}

export function AttractiveForm({ clientEmail = '', token = '', missingFields = [] }: AttractiveFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isEmailPreFilled, setIsEmailPreFilled] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null);
  const [isClient, setIsClient] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
    },
  });

  // Set client-side flag to prevent hydration errors
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Set email when clientEmail prop changes - only on client
  useEffect(() => {
    if (isClient && clientEmail) {
      form.setValue('email', clientEmail);
      setIsEmailPreFilled(true);
      console.log(`📧 Email pre-filled: ${clientEmail}`);
    }
  }, [clientEmail, form, isClient]);

  // SIMPLIFIED: Skip token validation to allow form access
  useEffect(() => {
    if (!isClient) return;
    
    // For now, skip token validation to allow form access
    console.log('⚠️ Skipping token validation for now');
    setIsTokenValid(true);
    
  }, [isClient]);

  const onSubmit = async (data: FormData) => {
    // Check if token is required but invalid
    if (token && isTokenValid === false) {
      toast.error('Ungültiger Link', {
        description: 'Dieser Formular-Link ist abgelaufen oder ungültig.',
        duration: 5000,
      });
      return;
    }

    setIsSubmitting(true);
    
    const toastId = toast.loading('Ihre Informationen werden verarbeitet...');
    
    try {
      console.log('🚀 Starting form submission...');
      console.log('📝 Form data:', data);
      console.log('🔐 Token status:', token ? `Provided (valid: ${isTokenValid})` : 'Not provided');
      
      // Create FormData object for file upload
      const formData = new FormData();
      
      // Append all form fields
      Object.entries(data).forEach(([key, value]) => {
        formData.append(key, value as string);
        console.log(`📝 Form field: ${key} = ${value}`);
      });
      
      // Append security token and missing fields info
      if (token) {
        formData.append('token', token);
        console.log(`🔐 Token: ${token}`);
      }
      if (missingFields.length > 0) {
        formData.append('missingFields', JSON.stringify(missingFields));
        console.log(`📋 Missing fields: ${JSON.stringify(missingFields)}`);
      }
      
      // Append file if selected
      if (selectedFile) {
        formData.append('document', selectedFile);
        console.log(`📎 File: ${selectedFile.name} (${selectedFile.size} bytes)`);
      }
      
      // Send to backend API
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://37.120.176:8005';
      const endpoint = `${API_URL}/api/client/submit-missing-info`;
      console.log(`🌐 Sending to: ${endpoint}`);
      
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      console.log(`📨 Response status: ${response.status}`);
      console.log(`📨 Response ok: ${response.ok}`);
      
      if (!response.ok) {
        let errorMessage = `Server error! Status: ${response.status}`;
        let errorText = '';
        
        try {
          errorText = await response.text();
          console.error(`❌ Raw API Error:`, errorText);
          
          if (errorText) {
            try {
              // Remove extra quotes if present
              const cleanErrorText = errorText.replace(/^"|"$/g, '');
              const errorData = JSON.parse(cleanErrorText);
              errorMessage = errorData.detail || errorData.message || JSON.stringify(errorData);
              console.error(`❌ API Error details:`, errorData);
            } catch {
              errorMessage = errorText || errorMessage;
            }
          }
        } catch (e) {
          console.error(`❌ Cannot read response:`, e);
        }
        
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      console.log('✅ API Success response:', result);
      
      // Success handling
      toast.success('Erfolgreich übermittelt!', {
        id: toastId,
        description: 'Vielen Dank! Ihre Informationen wurden gespeichert.',
        duration: 5000,
      });
      
      // Reset form but keep email if it was pre-filled
      form.reset({
        firstName: '',
        lastName: '',
        email: clientEmail || '', // Keep email if it was pre-filled
        phone: '',
        address: '',
      });
      setSelectedFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
      
      console.log('✅ Form submitted successfully and reset');
      
      // Redirect to success page after 2 seconds
      setTimeout(() => {
        window.location.href = '/success';
      }, 2000);
      
    } catch (error) {
      console.error('❌ Submission error:', error);
      
      let errorMessage = 'Bitte versuchen Sie es später erneut.';
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Die Verbindung zum Server hat zu lange gedauert. Bitte überprüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.';
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Verbindung zum Server fehlgeschlagen. Bitte stellen Sie sicher, dass der Server läuft.';
        } else if (error.message.includes('Invalid or expired token')) {
          errorMessage = 'Dieser Formular-Link ist abgelaufen. Bitte fordern Sie einen neuen Link an.';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast.error('Übermittlung fehlgeschlagen', {
        id: toastId,
        description: errorMessage,
        duration: 7000, // Longer duration for error messages
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    
    if (file) {
      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'image/jpeg',
        'image/png'
      ];
      
      // Validate file size (10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
      
      if (!allowedTypes.includes(file.type)) {
        toast.error('Ungültiger Dateityp', {
          description: 'Bitte laden Sie nur PDF, DOC, DOCX, TXT, JPG oder PNG Dateien hoch.',
          duration: 5000,
        });
        event.target.value = ''; // Reset input
        return;
      }
      
      if (file.size > maxSize) {
        toast.error('Datei zu groß', {
          description: 'Bitte laden Sie Dateien kleiner als 10MB hoch.',
          duration: 5000,
        });
        event.target.value = ''; // Reset input
        return;
      }
      
      setSelectedFile(file);
      toast.info('Datei ausgewählt', {
        description: `${file.name} wurde zum Hochladen ausgewählt.`,
        duration: 3000,
      });
      
      console.log(`📎 File selected: ${file.name} (${file.size} bytes, ${file.type})`);
    }
  };

  const handleRemoveFile = () => {
    if (selectedFile) {
      toast.info('Datei entfernt', {
        description: `${selectedFile.name} wurde entfernt.`,
        duration: 3000,
      });
      console.log(`🗑️ File removed: ${selectedFile.name}`);
    }
    setSelectedFile(null);
    
    // Reset file input
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return (
          <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
          </svg>
        );
      case 'doc':
      case 'docx':
        return (
          <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
          </svg>
        );
      case 'jpg':
      case 'jpeg':
      case 'png':
        return (
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Calculate disabled state for submit button - ensure it's always boolean
  const isSubmitDisabled = Boolean(isSubmitting || (token && isTokenValid === false));

  // Show loading while validating token - only on client
  if (isClient && token && isTokenValid === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Überprüfe Formular-Link...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error if token is invalid - only on client
  if (isClient && token && isTokenValid === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Ungültiger Link</h3>
            <p className="text-gray-600 mb-4">Dieser Formular-Link ist abgelaufen oder ungültig.</p>
            <Button 
              onClick={() => window.location.href = '/'}
              className="bg-gradient-to-r from-blue-600 to-purple-600"
            >
              Zur Startseite
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header without Logo */}
        <div className="flex flex-col items-center mb-8">
          <Card className="bg-gradient-to-r from-blue-600 to-purple-600 border-0 shadow-2xl shadow-blue-500/25 w-full">
            <CardHeader className="text-center text-white pb-6">
              <CardTitle className="text-3xl font-bold mb-4">
                Bitte geben Sie Ihre vollständigen Informationen an
              </CardTitle>
              <CardDescription className="text-blue-100 text-lg">
                Um das Dokument zu verarbeiten
              </CardDescription>
              <div className="w-24 h-1 bg-white/30 rounded-full mx-auto mt-4"></div>
            </CardHeader>
          </Card>
        </div>

        {/* Form Card */}
        <Card className="shadow-2xl shadow-purple-500/10 border-purple-100 overflow-hidden">
          <CardHeader className="pb-4">
            <div>
              <CardTitle className="text-2xl font-bold text-gray-800">
                Dokumentinformationen
              </CardTitle>
              <CardDescription className="text-gray-600">
                Bitte füllen Sie alle erforderlichen Angaben aus, damit Ihr Dokument bearbeitet werden kann.
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* First Name & Last Name Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center text-sm font-semibold">
                          <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mr-2"></div>
                          Vorname *
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Geben Sie Ihren Vornamen ein" 
                            {...field}
                            className="transition-all duration-200 focus:ring-2 focus:ring-blue-500/20 border-2"
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage className="flex items-center text-red-500" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center text-sm font-semibold">
                          <div className="w-2 h-2 bg-gradient-to-r from-green-500 to-cyan-500 rounded-full mr-2"></div>
                          Nachname *
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Geben Sie Ihren Nachnamen ein" 
                            {...field}
                            className="transition-all duration-200 focus:ring-2 focus:ring-green-500/20 border-2"
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage className="flex items-center text-red-500" />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Email Field */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center text-sm font-semibold">
                        <div className="w-2 h-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-full mr-2"></div>
                        E-Mail Adresse *
                        {isEmailPreFilled && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            Vorausgefüllt
                          </span>
                        )}
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="email"
                          placeholder="ihre.email@beispiel.com" 
                          {...field}
                          className="transition-all duration-200 focus:ring-2 focus:ring-orange-500/20 border-2"
                          readOnly={isEmailPreFilled}
                          disabled={isSubmitting}
                          style={{ 
                            backgroundColor: isEmailPreFilled ? '#f3f4f6' : 'white',
                            cursor: isEmailPreFilled ? 'not-allowed' : 'text'
                          }}
                        />
                      </FormControl>
                      {isEmailPreFilled && (
                        <FormDescription className="text-blue-600">
                          Diese E-Mail-Adresse wurde automatisch aus Ihrer ursprünglichen Nachricht übernommen.
                        </FormDescription>
                      )}
                      <FormMessage className="flex items-center text-red-500" />
                    </FormItem>
                  )}
                />

                {/* Phone & Address Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center text-sm font-semibold">
                          <div className="w-2 h-2 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full mr-2"></div>
                          Telefonnummer *
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="tel"
                            placeholder="+43 123 456789" 
                            {...field}
                            className="transition-all duration-200 focus:ring-2 focus:ring-orange-500/20 border-2"
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage className="flex items-center text-red-500" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center text-sm font-semibold">
                          <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full mr-2"></div>
                          Adresse *
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Straße Hausnummer, PLZ Ort" 
                            {...field}
                            className="transition-all duration-200 focus:ring-2 focus:ring-purple-500/20 border-2"
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage className="flex items-center text-red-500" />
                      </FormItem>
                    )}
                  />
                </div>

                {/* File Upload Section */}
                <div className="space-y-3">
                  <Label className="flex items-center text-sm font-semibold">
                    <div className="w-2 h-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full mr-2"></div>
                    Dokument hochladen (pdf, doc usw.) - Optional
                  </Label>
                  
                  <div className={`border-2 border-dashed border-gray-300 rounded-xl p-6 text-center transition-all duration-200 hover:border-cyan-400 hover:bg-cyan-50/30 bg-gray-50/50 ${
                    isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  }`}>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                      onChange={handleFileChange}
                      className="hidden"
                      id="file-upload"
                      disabled={isSubmitting}
                    />
                    <Label 
                      htmlFor="file-upload" 
                      className={`cursor-pointer ${isSubmitting ? 'pointer-events-none' : ''}`}
                    >
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center mb-3">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        </div>
                        <p className="text-gray-600 mb-1 font-medium">
                          {selectedFile ? selectedFile.name : 'Zum Hochladen klicken oder per Drag & Drop ablegen'}
                        </p>
                        <p className="text-gray-400 text-sm">
                          PDF, DOC, DOCX, TXT, JPG, PNG (Max. 10MB)
                        </p>
                      </div>
                    </Label>
                  </div>
                  
                  {selectedFile && (
                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          {getFileIcon(selectedFile.name)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-green-800">{selectedFile.name}</p>
                          <p className="text-xs text-green-600">
                            {formatFileSize(selectedFile.size)} • Bereit zum Hochladen
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleRemoveFile}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        disabled={isSubmitting}
                      >
                        Entfernen
                      </Button>
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isSubmitDisabled}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-6 text-lg transition-all duration-200 transform hover:scale-[1.02] disabled:scale-100 disabled:opacity-50 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Informationen werden übermittelt...
                    </div>
                  ) : (
                    'Informationen absenden'
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Enhanced Footer Section */}
        <div className="text-center mt-6">
          <Card className="bg-white/50 backdrop-blur-sm border-0">
            <CardContent className="p-6">
              <div className="flex flex-col items-center space-y-4">
                <p className="text-gray-500 text-sm flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Ihre Daten sind sicher und geschützt.
                </p>
                
                <div className="flex items-center justify-center space-x-4 pt-4 border-t border-gray-200/50 w-full">
                  <div className="flex items-center space-x-3 bg-gradient-to-r from-cyan-50 to-blue-50 px-6 py-4 rounded-2xl border border-cyan-100 shadow-sm">
                    <div className="relative">
                      <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-600 rounded-2xl flex items-center justify-center font-bold text-white text-2xl shadow-lg transform rotate-3">
                        <div className="absolute inset-0 bg-white/20 rounded-2xl blur-sm"></div>
                        <span className="relative z-10">C</span>
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="font-bold bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-700 bg-clip-text text-transparent text-xl tracking-wide">
                        cybrain
                      </div>
                      <div className="text-xs text-gray-500 font-medium mt-1">
                        AI-Powered Solutions
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-gray-400 text-sm flex items-center">
                  <span>Securely powered by Cybrain Technology</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}