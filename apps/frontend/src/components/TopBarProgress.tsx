import { LinearProgress, Box } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

export function TopBarProgress() {
  const location = useLocation();
  const prev = useRef(location.pathname);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (prev.current !== location.pathname) {
      prev.current = location.pathname;
      setActive(true);
      const t = setTimeout(() => setActive(false), 400);
      return () => clearTimeout(t);
    }
  }, [location.pathname]);

  if (!active) return null;
  return (
    <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: (t) => t.zIndex.modal + 2 }}>
      <LinearProgress color="secondary" sx={{ height: 3 }} />
    </Box>
  );
}

