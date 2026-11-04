export default function StatusBadge({ type }) {
  const video = type === "VIDEO";
  return <span className={`status-badge ${video ? "status-video" : "status-news"}`}>{type}</span>;
}
