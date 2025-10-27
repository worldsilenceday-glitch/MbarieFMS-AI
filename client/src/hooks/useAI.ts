import { useState } from "react";

export const useAI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backendStatus, setBackendStatus] = useState<'unknown' | 'healthy' | 'unhealthy'>('unknown');

  const checkHealth = async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/ai/health', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        setBackendStatus('healthy');
        return true;
      } else {
        setBackendStatus('unhealthy');
        return false;
      }
    } catch (error) {
      setBackendStatus('unhealthy');
      return false;
    }
  };

  const request = async (endpoint: string, data?: any, options?: { retry?: boolean }) => {
    const retry = options?.retry ?? true;
    
    try {
      setLoading(true);
      setError(null);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const res = await fetch(`/api/ai/${endpoint}`, {
        method: data ? "POST" : "GET",
        headers: { "Content-Type": "application/json" },
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!res.ok) {
        let errorMessage = `Request failed: ${res.status}`;
        
        switch (res.status) {
          case 404:
            errorMessage = "AI endpoint not found - please check backend configuration";
            break;
          case 500:
            errorMessage = "AI service is currently offline - please try again later";
            break;
          case 503:
            errorMessage = "AI service is temporarily unavailable";
            break;
          default:
            errorMessage = `Server error: ${res.status}`;
        }
        
        throw new Error(errorMessage);
      }
      
      setBackendStatus('healthy');
      return await res.json();
    } catch (err: any) {
      const errorMessage = err.name === 'AbortError' 
        ? "Request timeout - AI service is not responding"
        : err.message || "Unknown error occurred";
      
      setError(errorMessage);
      setBackendStatus('unhealthy');
      
      // Auto-retry once for non-timeout errors
      if (retry && err.name !== 'AbortError') {
        console.log('Retrying request...');
        return await request(endpoint, data, { retry: false });
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async (file: File) => {
    try {
      setLoading(true);
      setError(null);
      
      const formData = new FormData();
      formData.append('file', file);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout for file upload
      
      const res = await fetch('/api/ai/document/analyze', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!res.ok) {
        throw new Error(`File upload failed: ${res.status}`);
      }
      
      setBackendStatus('healthy');
      return await res.json();
    } catch (err: any) {
      const errorMessage = err.name === 'AbortError' 
        ? "File upload timeout - please try again with a smaller file"
        : err.message || "File upload failed";
      
      setError(errorMessage);
      setBackendStatus('unhealthy');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { request, uploadFile, loading, error, backendStatus, checkHealth };
};
