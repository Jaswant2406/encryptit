import React from 'react';

export interface FileRecord {
  id: string;
  name: string;
  size: number;
  type: string;
  date: string;
  encryptionType: string;
  entropyBefore: number;
  entropyAfter: number;
}

export type View = 'encrypt' | 'decrypt' | 'analytics' | 'files' | 'steganography' | 'settings';
