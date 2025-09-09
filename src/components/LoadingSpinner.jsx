import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const LoadingSpinner = () => {
  return (
    <div className="min-h-screen bg-gradient-bg flex items-center justify-center animate-fade-in">
      <div className="space-y-6 w-full max-w-md px-4">
        <div className="flex items-center justify-center mb-8">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/30 border-t-primary"></div>
        </div>
        <Skeleton className="h-12 w-full animate-pulse" />
        <Skeleton className="h-32 w-full animate-pulse" />
        <Skeleton className="h-8 w-3/4 animate-pulse" />
        <div className="space-y-3">
          <Skeleton className="h-6 w-full animate-pulse" />
          <Skeleton className="h-6 w-4/5 animate-pulse" />
          <Skeleton className="h-6 w-3/5 animate-pulse" />
        </div>
      </div>
    </div>
  );
};