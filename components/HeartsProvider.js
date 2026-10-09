'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';

const HeartsContext = createContext({ hearts: [], toggle: () => {}, ready: false });
const KEY = 'matter.hearts';

/** Hearted items live in the viewer's own browser. That is right for launch
 *  and wrong once you want them on a second device, which is the moment to
 *  add accounts. Every read and write is wrapped, because storage throws in
 *  private windows and comes back empty when site data is cleared. */
export function HeartsProvider({ children }) {
  const [hearts, setHearts] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setHearts(JSON.parse(raw));
    } catch (e) {
      /* storage unavailable, carry on with an empty list */
    }
    setReady(true);
  }, []);

  const toggle = useCallback((id) => {
    setHearts((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch (e) {
        /* nothing persisted, but the session still works */
      }
      return next;
    });
  }, []);

  return (
    <HeartsContext.Provider value={{ hearts, toggle, ready }}>
      {children}
    </HeartsContext.Provider>
  );
}

export const useHearts = () => useContext(HeartsContext);
