/* The brand statement, the first thing under the category bar on the
 * homepage. One sentence for what MATTER is, one for who it is for, and a
 * garment label drawn beside it, since reading the label is the whole idea.
 * The words live here rather than in data/edits.json because they change
 * rarely and are part of the page, not the rotation. */

const Label = () => (
  <svg className="statement-label" viewBox="0 0 220 150" role="img" aria-label="A garment label reading Matter, shell one hundred percent wool, lining none">
    <rect x="1" y="1" width="218" height="148" rx="3" className="lbl-cloth" />
    <rect x="9" y="9" width="202" height="132" rx="2" className="lbl-stitch" />
    <text x="110" y="52" textAnchor="middle" className="lbl-mark">MATTER</text>
    <line x1="40" y1="68" x2="180" y2="68" className="lbl-rule" />
    <text x="110" y="93" textAnchor="middle" className="lbl-line">SHELL 100% WOOL</text>
    <text x="110" y="116" textAnchor="middle" className="lbl-line">LINING NONE</text>
  </svg>
);

export default function Statement() {
  return (
    <section className="statement" aria-label="About MATTER">
      <div className="statement-copy">
        <p className="eyebrow">What MATTER is</p>
        <h2>An uncompromising edit of natural fiber clothing, held to a high bar for fashion.</h2>
        <p>
          We search the brands worth knowing and keep only the pieces that clear both bars,
          gathered in one place. For people who care what they put on their bodies, what their
          clothes say about them, and the mark they leave on the planet.
        </p>
      </div>
      <Label />
    </section>
  );
}
