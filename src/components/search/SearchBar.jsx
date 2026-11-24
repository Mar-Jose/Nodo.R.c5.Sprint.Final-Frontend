export default function SearchBar({
  onSearch,
  onSearchTextChange,
  onSearchYearChange,
  searchText,
  searchYear,
}) {
  return (
    <form className="search-form" onSubmit={onSearch}>
      <label className="search-field">
        <span className="sr-only">Buscar serie</span>
        <span aria-hidden="true">⌕</span>
        <input
          type="search"
          placeholder="Buscar una serie…"
          value={searchText}
          onChange={(event) => onSearchTextChange(event.target.value)}
        />
      </label>
      <input
        className="year-input"
        aria-label="Filtrar por año"
        type="number"
        min="1900"
        max="2100"
        placeholder="Año"
        value={searchYear}
        onChange={(event) => onSearchYearChange(event.target.value)}
      />
      <button className="primary-button search-button" type="submit">Buscar</button>
    </form>
  )
}
