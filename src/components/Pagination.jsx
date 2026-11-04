export default function Pagination({ page, totalPages, onPageChange, totalItems, pageSize }) {
  const firstItem = totalItems ? (page - 1) * pageSize + 1 : 0;
  const lastItem = Math.min(page * pageSize, totalItems);
  return (
    <div className="table-foot">
      <span>Showing <strong>{firstItem}–{lastItem}</strong> of <strong>{totalItems}</strong></span>
      <div className="pagination">
        <button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Previous</button>
        <span>Page {page} of {totalPages}</span>
        <button type="button" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>Next</button>
      </div>
    </div>
  );
}
