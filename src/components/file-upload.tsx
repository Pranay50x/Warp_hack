"use client";

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  isLoading: boolean;
}

export function FileUpload({ onFileUpload, isLoading }: FileUploadProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileUpload(acceptedFiles[0]);
    }
  }, [onFileUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: false,
    disabled: isLoading
  });

  return (
    <Card className="p-6 border-dashed border-2 border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors">
      <div {...getRootProps()} className="cursor-pointer text-center">
        <input {...getInputProps()} />
        
        {isLoading ? (
          <div className="flex flex-col items-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Processing PDF...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-3">
            {isDragActive ? (
              <>
                <Upload className="h-8 w-8 text-primary" />
                <p className="text-sm text-muted-foreground">Drop your PDF here</p>
              </>
            ) : (
              <>
                <FileText className="h-8 w-8 text-muted-foreground" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Upload PDF Document</p>
                  <p className="text-xs text-muted-foreground">
                    Drag & drop or click to upload your textbook/study material
                  </p>
                </div>
                <Button variant="outline" size="sm" className="mt-2">
                  Choose File
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}