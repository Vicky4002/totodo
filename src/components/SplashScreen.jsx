import React, { useEffect, useState } from 'react';
import { CheckSquare, Loader2 } from 'lucide-react';

export const SplashScreen = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('Initializing...');

  useEffect(() => {
    const steps = [
      { text: 'Loading offline data...', duration: 800 },
      { text: 'Checking network...', duration: 600 },
      { text: 'Syncing tasks...', duration: 700 },
      { text: 'Ready!', duration: 400 }
    ];

    let currentStep = 0;
    let currentProgress = 0;

    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setLoadingText(steps[currentStep].text);
        
        const stepProgress = (currentStep + 1) * (100 / steps.length);
        const progressIncrement = (stepProgress - currentProgress) / 10;
        
        const progressInterval = setInterval(() => {
          currentProgress += progressIncrement;
          setProgress(currentProgress);
          
          if (currentProgress >= stepProgress) {
            clearInterval(progressInterval);
            currentStep++;
            
            if (currentStep >= steps.length) {
              setTimeout(onComplete, 300);
            }
          }
        }, steps[currentStep].duration / 10);
        
      } else {
        clearInterval(interval);
      }
    }, steps[currentStep]?.duration || 1000);

    return () => {
      clearInterval(interval);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/70 flex items-center justify-center z-50">
      <div className="text-center space-y-8 px-6">
        {/* Logo */}
        <div className="relative">
          <div className="bg-white/20 rounded-3xl p-6 backdrop-blur-sm border border-white/30 shadow-2xl">
            <img 
              src="/lovable-uploads/80f966c5-4aaf-420d-898b-4d30d3e0903b.png" 
              alt="ToTodo Logo" 
              className="h-16 w-16 mx-auto brightness-0 invert"
            />
          </div>
          <div className="absolute -inset-4 bg-white/10 rounded-full animate-ping"></div>
        </div>

        {/* App Name */}
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
            ToTodo
          </h1>
          <p className="text-white/80 text-lg font-medium">
            Your Offline-First Productivity Companion
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-sm mx-auto space-y-4">
          <div className="bg-white/20 rounded-full h-2 overflow-hidden backdrop-blur-sm">
            <div 
              className="h-full bg-white rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          <div className="flex items-center justify-center gap-2 text-white/90">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm font-medium">{loadingText}</span>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 text-center text-white/80 text-xs">
          <div className="space-y-1">
            <CheckSquare className="h-5 w-5 mx-auto" />
            <p>Offline Ready</p>
          </div>
          <div className="space-y-1">
            <CheckSquare className="h-5 w-5 mx-auto" />
            <p>Auto Sync</p>
          </div>
          <div className="space-y-1">
            <CheckSquare className="h-5 w-5 mx-auto" />
            <p>AI Assistant</p>
          </div>
        </div>
      </div>
    </div>
  );
};