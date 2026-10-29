/* The written summary at the top of a brand page, or folded up at the foot of
 * a category page. Plain facts from the catalog, refreshed at every build, so
 * the page says something a search engine or an AI tool can quote rather than
 * only listing pieces.
 *
 * collapsed: render inside a closed <details>, so the shopper lands on the
 * pieces and the numbers are one click away. The text is still in the HTML
 * for anything that reads the page instead of looking at it. */
export default function Facts({ summary, updated, trend = null, collapsed = false }) {
  const body = (
    <>
      <p>{summary}</p>
      {trend && (
        <div className="trend">
          <p>{trend.sentence}</p>
          <table>
            <caption>Share of pieces read each month that were 95% natural fiber or more</caption>
            <thead>
              <tr><th scope="col">Month read</th><th scope="col">Pieces read</th><th scope="col">95% natural or more</th></tr>
            </thead>
            <tbody>
              {trend.rows.map((r) => (
                <tr key={r.label}><th scope="row">{r.label}</th><td>{r.read}</td><td>{r.pct}%</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="updated">Updated {updated}</p>
    </>
  );
  if (collapsed) {
    return (
      <details className="facts folded" aria-label="At a glance">
        <summary>About these pieces</summary>
        <div className="facts-body">{body}</div>
      </details>
    );
  }
  return (
    <section className="facts" aria-label="At a glance">
      {body}
    </section>
  );
}
