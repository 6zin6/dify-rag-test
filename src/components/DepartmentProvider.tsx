'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  DEFAULT_DEPARTMENT_ID,
  isDepartmentId,
  type DepartmentId,
} from '@/lib/departments';

const STORAGE_KEY = 'rag.department';

interface DepartmentContextValue {
  department: DepartmentId;
  setDepartment: (id: DepartmentId) => void;
}

const DepartmentContext = createContext<DepartmentContextValue | null>(null);

export function DepartmentProvider({ children }: { children: ReactNode }) {
  const [department, setDepartmentState] = useState<DepartmentId>(
    DEFAULT_DEPARTMENT_ID
  );

  // Hydrate from localStorage after mount to avoid SSR mismatch.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored && isDepartmentId(stored)) {
        setDepartmentState(stored);
      }
    } catch {
      // ignore storage access errors (private mode, etc.)
    }
  }, []);

  const setDepartment = (id: DepartmentId) => {
    setDepartmentState(id);
    try {
      window.localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // ignore
    }
  };

  return (
    <DepartmentContext.Provider value={{ department, setDepartment }}>
      {children}
    </DepartmentContext.Provider>
  );
}

export function useDepartment(): DepartmentContextValue {
  const ctx = useContext(DepartmentContext);
  if (!ctx) {
    throw new Error('useDepartment must be used within DepartmentProvider');
  }
  return ctx;
}
