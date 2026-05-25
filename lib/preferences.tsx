'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './auth';

interface Preferences {
  language: string;
  fontSize: string;
  colorScheme: string;
}

interface PreferencesContextType {
  preferences: Preferences;
  updatePreferences: (prefs: Partial<Preferences>) => void;
}

const defaultPreferences: Preferences = {
  language: 'zh-CN',
  fontSize: 'medium',
  colorScheme: 'light',
};

const PreferencesContext = createContext<PreferencesContextType>({
  preferences: defaultPreferences,
  updatePreferences: () => {},
});

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences);

  useEffect(() => {
    if (user) {
      setPreferences({
        language: user.language || 'zh-CN',
        fontSize: user.fontSize || 'medium',
        colorScheme: user.colorScheme || 'light',
      });
    } else {
      const saved = localStorage.getItem('preferences');
      if (saved) {
        try {
          setPreferences(JSON.parse(saved));
        } catch {
          setPreferences(defaultPreferences);
        }
      } else {
        setPreferences(defaultPreferences);
      }
    }
  }, [user]);

  useEffect(() => {
    const root = document.documentElement;

    const fontSizeMap: Record<string, string> = {
      small: '14px',
      medium: '16px',
      large: '18px',
    };
    root.style.fontSize = fontSizeMap[preferences.fontSize] || '16px';

    if (preferences.colorScheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    root.setAttribute('lang', preferences.language);

    localStorage.setItem('preferences', JSON.stringify(preferences));
  }, [preferences]);

  const updatePreferences = (prefs: Partial<Preferences>) => {
    setPreferences(prev => ({ ...prev, ...prefs }));
  };

  return (
    <PreferencesContext.Provider value={{ preferences, updatePreferences }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  return useContext(PreferencesContext);
}
