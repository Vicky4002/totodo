import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Palette } from 'lucide-react';
import { useTheme } from './ThemeProvider';
export const ThemeToggle = () => {
  const {
    theme,
    setTheme,
    themes
  } = useTheme();
  return <div className="flex items-center gap-2">
      
      <Select value={theme} onValueChange={setTheme}>
        <SelectTrigger className="w-32 h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {themes.map(themeOption => <SelectItem key={themeOption.value} value={themeOption.value}>
              <div className="flex items-center gap-2">
                <span>{themeOption.icon}</span>
                {themeOption.label}
              </div>
            </SelectItem>)}
        </SelectContent>
      </Select>
    </div>;
};