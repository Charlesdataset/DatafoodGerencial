import React, { createContext, useCallback, useContext, type ReactNode } from "react";

type EventCallback = (data?: any) => void;

interface NavigationContextType {
  emit: (event: string, data?: any) => void;
  subscribe: (event: string, callback: EventCallback) => () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider = ({ children }: { children: ReactNode }) => {
  const listeners = React.useRef<Map<string, EventCallback[]>>(new Map());

  const subscribe = useCallback((event: string, callback: EventCallback) => {
    if (!listeners.current.has(event)) {
      listeners.current.set(event, []);
    }
    listeners.current.get(event)!.push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = listeners.current.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) callbacks.splice(index, 1);
      }
    };
  }, []);

  const emit = useCallback((event: string, data?: any) => {
    const callbacks = listeners.current.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => callback(data));
    }
  }, []);

  return <NavigationContext.Provider value={{ emit, subscribe }}>{children}</NavigationContext.Provider>;
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("useNavigation must be used within NavigationProvider");
  }
  return context;
};
