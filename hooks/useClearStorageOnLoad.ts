import { useEffect } from 'react';

export const useClearStorageOnLoad = () => {
  useEffect(() => {
    sessionStorage.clear();
    // If you still need to clear localStorage:
    // localStorage.clear();
  }, []);
};
