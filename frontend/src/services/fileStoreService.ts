/**
 * File Store Service
 * Handles saving and retrieving file records from the backend database.
 */

const API_BASE = '/api';

function getHeaders() {
  const token = localStorage.getItem('access_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

export async function saveFileRecord(fileRecord: any) {
  const token = localStorage.getItem('access_token');
  if (!token) return; // Only save for logged in users

  try {
    const response = await fetch(`${API_BASE}/files`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(fileRecord)
    });
    
    if (!response.ok) {
      // Background save, fail silently but log
      console.warn('Failed to save file record to backend');
      return;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error saving file record:', error);
  }
}

export async function getFileRecords() {
  const token = localStorage.getItem('access_token');
  if (!token) return [];

  try {
    const response = await fetch(`${API_BASE}/files`, {
      headers: getHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch file records');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching file records:', error);
    return [];
  }
}

export async function deleteFileRecord(id: string) {
  try {
    const response = await fetch(`${API_BASE}/files/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete file record');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error deleting file record:', error);
    throw error;
  }
}
