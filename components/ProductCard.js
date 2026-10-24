'use client';

import {
  COLOURS, DARK_COLOURS, LINING_UNDISCLOSED,
  cellulosicPct, formatComposition, formatPrice,
} from '@/lib/fibers';
import { availableSizes, isSoldOut, licensedImage } from '@/lib/item';
import { SITE } from '@/lib/site';
import { useHearts } from './HeartsProvider';

const HeartIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <path d="M12 20.5s-7.5-4.7-7.5-9.8A4.2 4.2 0 0 1 12 7.6a4.2 4.2 0 0 1 7.5 3.1c0 5.1-7.5 9.8-7.5 9.8Z" />
  </svg>
);

export default function ProductCard({ item, note, image: override, label }) {
  const { hearts, toggle } = useHearts();
  const on = hearts.includes(item.id);
  const dark = DARK_COLOURS.includes(item.colour);
  const cellulosic = cellulosicPct(item.shell);
  const soldOut = isSoldOut(item);
  const sizes = availableSizes(item);

  // Until you are approved and have real links, the card does not pretend to
  // be clickable. Fill item.url in the catalog and it becomes an outbound link.
  // Never item.image directly. licensedImage returns nothing unless this
  // retailer's program is approved, so an image can sit in the catalog ready
  // to go and still not render until we have the right to show it.
  // An edit can pick a different photo of the same piece (on the model, or the
  // garment alone) so a section reads as one set. It goes through the same
  // licence check as the catalog photo.
  const image = licensedImage(item) && override ? override : licensedImage(item);

  const Shot = (
    <div
      className={`shot${image ? ' has-img' : ''}`}
      style={image ? undefined : { backgroundColor: COLOURS[item.colour] || 'var(--hairline)' }}
    >
      {image
        ? <img src={image} alt={`${item.brand} ${item.name}`} loading="lazy" />
        : <span className="placeholder">{item.colour}</span>}
    </div>
  );

  return (
    <article className="card">
      {label && <p className="tier">{label}</p>}
      <div className={`shotwrap${dark ? ' dark' : ''}`}>
        {item.url
          ? <a className="shotlink" href={item.url} target="_blank" rel="nofollow sponsored noopener">{Shot}</a>
          : Shot}
        {/* Sold out takes the corner the New tag uses. A piece that has just
            sold out is not news a shopper can act on. */}
        {soldOut
          ? <span className="tagnew tagsold">Sold out</span>
          : item.isNew && <span className="tagnew">New</span>}
        <button
          type="button"
          className="heart"
          aria-pressed={on}
          aria-label={`${on ? 'Remove from' : 'Add to'} my hearts, ${item.brand} ${item.name}`}
          onClick={() => toggle(item.id)}
        >
          <HeartIcon />
        </button>
      </div>

      <div className="meta">
        <span className="brand">{item.brand}</span>
        {item.url ? (
          <a href={item.url} target="_blank" rel="nofollow sponsored noopener">
            <h3 className="name">{item.name}</h3>
          </a>
        ) : (
          <h3 className="name">{item.name}</h3>
        )}
        <span className="price">{formatPrice(item.price)}</span>
        {/* Only what the retailer says it has, in its own size order. No stock
            data, no line, rather than a guess. */}
        {sizes && sizes.length > 0 && <span className="sizes">In stock: {sizes.join(', ')}</span>}
        {note && <p className="ednote">{note}</p>}
        <span className="comp">
          {formatComposition(item.shell)}
          {cellulosic > 0 && ` · ${cellulosic}% regenerated cellulosic`}
        </span>
        {/* Most second compositions are a lining. Some are a contrast panel or
            a trim, and calling those a lining would be its own small lie, so
            an item can override the word. */}
        <span className="lining">
          {item.lining === LINING_UNDISCLOSED
            ? `${item.liningLabel || 'Lining'} not disclosed`
            : item.lining
              ? `${item.liningLabel || 'Lining'} ${formatComposition(item.lining)}`
              : 'Unlined'}
        </span>
        {/* Elastic, lace and thread are not a lining and should not be filtered
            like one, but they are the part of a garment people are most often
            surprised by. A trim note says what is known, in either direction:
            Pansy publishing natural rubber elastic, or Hanro not publishing the
            waistband at all. */}
        {item.trim && <span className="trim">{item.trim}</span>}
        <span className="at">at {item.retailer}</span>
        {/* Shoppers find data problems faster than any sampling process does.
            Prefilled so a report arrives with the piece already identified. */}
        <a
          className="report"
          href={`mailto:${SITE.email}?subject=${encodeURIComponent(
            `Composition correction: ${item.brand} ${item.name}`
          )}&body=${encodeURIComponent(
            `Piece: ${item.brand} ${item.name}\nID: ${item.id}\nWe list: ${formatComposition(item.shell)}` +
              `${item.lining === LINING_UNDISCLOSED
                ? ' / lining not disclosed'
                : item.lining
                  ? ` / ${(item.liningLabel || 'lining').toLowerCase()} ${formatComposition(item.lining)}`
                  : ' / unlined'}\n\nWhat we got wrong:\n`
          )}`}
        >
          Report an error
        </a>
      </div>
    </article>
  );
}
