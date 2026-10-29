'use client';

import { useEffect, useRef, useState } from 'react';
import ProductCard from './ProductCard';

/* A homepage section's pieces, three at a time. The arrow on the right moves
 * on to the next three; one on the left comes back once there is something
 * behind you. The track scrolls natively, so a phone swipes it and a mouse
 * wheel works, and the arrows only call scrollBy on it.
 *
 * pieces: [{ item, note, image, label }] in display order, grouped in threes
 * by lib/editrules.js so each view shares a retailer's studio background. */
export default function EditRail({ pieces, label }) {
  const track = useRef(null);
  const [at, setAt] = useState({ start: true, end: pieces.length <= 3 });

  const read = () => {
    const el = track.current;
    if (!el) return;
    setAt({
      start: el.scrollLeft <= 2,
      end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 2,
    });
  };
  useEffect(() => {
    read();
    const el = track.current;
    if (!el) return undefined;
    el.addEventListener('scroll', read, { passive: true });
    window.addEventListener('resize', read);
    return () => {
      el.removeEventListener('scroll', read);
      window.removeEventListener('resize', read);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pieces.length]);

  const go = (dir) => {
    const el = track.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth, behavior: 'smooth' });
  };

  return (
    <div className="rail-wrap">
      <div className="rail-track" ref={track} role="group" aria-label={label}>
        {pieces.map((p) => (
          <ProductCard key={p.item.id} item={p.item} note={p.note} image={p.image} label={p.label} />
        ))}
      </div>
      {pieces.length > 3 && (
        <>
          <button
            type="button"
            className="rail-btn prev"
            aria-label={`Previous three, ${label}`}
            onClick={() => go(-1)}
            hidden={at.start}
          >
            &larr;
          </button>
          <button
            type="button"
            className="rail-btn next"
            aria-label={`Next three, ${label}`}
            onClick={() => go(1)}
            hidden={at.end}
          >
            &rarr;
          </button>
        </>
      )}
    </div>
  );
}
