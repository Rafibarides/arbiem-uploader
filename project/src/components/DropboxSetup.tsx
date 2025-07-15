import React from 'react';
import { Check } from 'lucide-react';

export function DropboxSetup() {
  return (
    <div className="flex items-center justify-center text-green-600">
      <Check className="h-5 w-5 mr-2" />
      <span className="text-sm font-medium">Dropbox storage configured automatically</span>
    </div>
  );
}