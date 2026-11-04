import { Search } from "lucide-react";

export default function SearchBar({ value, onChange, onReset, placeholder = "Search...", onSubmit }) {
  return (
    <form className="table-filters module-search" onSubmit={(event) => { event.preventDefault(); onSubmit?.(); }}>
      <div className="search-field">
        <Search size={17} />
        <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} aria-label={placeholder} />
      </div>
      <button className="button-secondary" type="button" onClick={onReset}>RESET</button>
      <button className="button-primary button-search" type="submit"><Search size={16} /> Search</button>
    </form>
  );
}
