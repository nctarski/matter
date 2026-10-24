/* The written summary at the top of a brand or category page. Plain facts
 * from the catalog, refreshed at every build, so the page says something a
 * search engine or an AI tool can quote rather than only listing pieces. */
export default function Facts({ summary, updated, trend = null }) {
  return (
    <section className="facts" aria-label="At a glance">
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
    </section>
  );
}
