export default function TableContainer({ title, description, count, children, className = "" }) {
  return (
    <section className={`panel module-table-panel ${className}`}>
      {(title || description || count) && (
        <div className="panel-heading">
          <div>{title && <h2>{title}</h2>}{description && <p>{description}</p>}</div>
          {count !== undefined && <span className="count-chip">{count}</span>}
        </div>
      )}
      {children}
    </section>
  );
}
