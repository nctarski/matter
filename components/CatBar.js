'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { slugify } from '@/lib/item';

/* The category bar. Every entry is a link to its own shop page, so the
 * homepage stays light and each category has a URL worth ranking. Hovering a
 * category that has sub-categories opens a small menu under it; a
 * sub-category opens the category page already narrowed, through the part of
 * the address after the #. On touch screens there is no hover, so the
 * category page also shows its sub-categories as a row above the pieces.
 *
 * pages: [{ label, slug, category }] from lib/shop.js
 * menus: sub-category menus from lib/shop.js
 * current: the label of the page you are on, or null on the homepage */
export default function CatBar({ pages, menus, current = null }) {
  const barRef = useRef(null);
  const closeTimer = useRef(null);
  const [menu, setMenu] = useState(null);

  const entries = [{ label: 'All', href: '/shop' }, ...pages.map((p) => ({ ...p, href: `/shop/${p.slug}` }))];

  const openMenu = (entry, el) => {
    clearTimeout(closeTimer.current);
    if (!entry.category || !menus[entry.category]?.subs.length) return setMenu(null);
    const bar = barRef.current.getBoundingClientRect();
    const btn = el.getBoundingClientRect();
    // Sit under the word, but never hang off the right edge of the page.
    setMenu({ entry, left: Math.max(0, Math.min(btn.left - bar.left - 16, bar.width - 240)) });
  };
  // A short delay, so moving the pointer from the word down into the menu
  // does not close it on the way.
  const closeSoon = () => {
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setMenu(null), 180);
  };

  return (
    <div className="catbar" ref={barRef} onMouseLeave={closeSoon} onKeyDown={(e) => e.key === 'Escape' && setMenu(null)}>
      <div className="wrap">
        <nav className="cats" aria-label="Shop by category">
          {entries.map((entry) => (
            <Link
              key={entry.label}
              href={entry.href}
              aria-current={current === entry.label ? 'page' : undefined}
              onMouseEnter={(e) => openMenu(entry, e.currentTarget)}
              onFocus={(e) => openMenu(entry, e.currentTarget)}
            >
              {entry.label}
            </Link>
          ))}
        </nav>
      </div>
      {menu && (
        <div
          className="submenu"
          style={{ left: menu.left }}
          onMouseEnter={() => clearTimeout(closeTimer.current)}
          onMouseLeave={closeSoon}
        >
          <Link href={menu.entry.href} onClick={() => setMenu(null)}>
            All {menu.entry.label.toLowerCase()}
          </Link>
          {menus[menu.entry.category].subs.map((sub) => (
            <Link key={sub.label} href={`${menu.entry.href}#${slugify(sub.label)}`} onClick={() => setMenu(null)}>
              {sub.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
