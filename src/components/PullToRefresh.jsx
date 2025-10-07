import React, { useState, useRef, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export const PullToRefresh = ({
  onRefresh,
  children,
  className
}) => {
  const [pulling, setPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const containerRef = useRef(null);

  const threshold = 80;

  const handleTouchStart = useCallback((e) => {
    if (window.scrollY === 0) {
      touchStartY.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (window.scrollY === 0 && touchStartY.current > 0) {
      const currentY = e.touches[0].clientY;
      const distance = currentY - touchStartY.current;
      
      if (distance > 0) {
        setPullDistance(Math.min(distance * 0.5, threshold + 20));
        setPulling(distance > 10);
      }
    }
  }, [threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance > threshold && !refreshing) {
      setRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
      }
    }
    
    setPulling(false);
    setPullDistance(0);
    touchStartY.current = 0;
  }, [pullDistance, threshold, refreshing, onRefresh]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('touchstart', handleTouchStart, { passive: true });
      container.addEventListener('touchmove', handleTouchMove, { passive: true });
      container.addEventListener('touchend', handleTouchEnd, { passive: true });

      return () => {
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchmove', handleTouchMove);
        container.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const shouldTriggerRefresh = pullDistance > threshold;

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Pull to refresh indicator */}
      <div
        className={cn(
          'absolute top-0 left-0 right-0 flex items-center justify-center transition-all duration-200 z-10',
          'bg-background/80 backdrop-blur-sm border-b border-border/50',
          pulling ? 'opacity-100' : 'opacity-0'
        )}
        style={{ 
          height: `${Math.min(pullDistance, threshold + 20)}px`,
          transform: `translateY(-${Math.max(0, threshold + 20 - pullDistance)}px)`
        }}
      >
        <div className="flex items-center gap-2 text-muted-foreground">
          <RefreshCw 
            className={cn(
              'h-4 w-4 transition-all duration-200',
              refreshing && 'animate-spin',
              shouldTriggerRefresh && !refreshing && 'text-primary scale-110'
            )}
          />
          <span className="text-sm font-medium">
            {refreshing 
              ? 'Refreshing...' 
              : shouldTriggerRefresh 
                ? 'Release to refresh' 
                : 'Pull to refresh'
            }
          </span>
        </div>
      </div>

      {/* Main content */}
      <div
        className="transition-transform duration-200"
        style={{ 
          transform: `translateY(${pulling ? pullDistance * 0.3 : 0}px)`,
          paddingTop: pulling ? `${pullDistance * 0.2}px` : 0
        }}
      >
        {children}
      </div>
    </div>
  );
};