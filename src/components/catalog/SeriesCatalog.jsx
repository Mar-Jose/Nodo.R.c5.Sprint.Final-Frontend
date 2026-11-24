import MediaCard from '../cards/MediaCard.jsx'
import SearchBar from '../search/SearchBar.jsx'

export default function SeriesCatalog({
  error,
  isSaved,
  loading,
  loadingWatchlist,
  onChangePage,
  onOpenDetails,
  onRetryWatchlist,
  onSearch,
  onSearchTextChange,
  onSearchYearChange,
  onToggleWatchlist,
  page,
  searchText,
  searchYear,
  shows,
  watchlistReady,
}) {
  return (
    <section className="catalog-section" id="catalog">
      <div className="section-heading">
        <div>
          <p className="eyebrow">CATÁLOGO</p>
          <h2>Descubre series</h2>
        </div>
        <SearchBar
          onSearch={onSearch}
          onSearchTextChange={onSearchTextChange}
          onSearchYearChange={onSearchYearChange}
          searchText={searchText}
          searchYear={searchYear}
        />
      </div>
      {error && <p className="error-message" role="alert">{error}</p>}
      {!watchlistReady && (
        <p className="watchlist-sync-message" role="status">
          {loadingWatchlist
            ? 'Sincronizando tu lista personal…'
            : <>No se pudo sincronizar tu lista.{' '}
              <button type="button" className="text-button" onClick={onRetryWatchlist}>
                Reintentar
              </button>
            </>}
        </p>
      )}
      {loading ? (
        <div className="loading-state"><span className="spinner" />Cargando catálogo…</div>
      ) : shows.length ? (
        <>
          <div className="media-grid">
            {shows.map((show) => (
              <MediaCard
                key={show.id}
                show={show}
                saved={isSaved(show)}
                onToggle={onToggleWatchlist}
                onDetails={onOpenDetails}
                saveDisabled={!watchlistReady}
              />
            ))}
          </div>
          {!searchText && (
            <div className="pagination">
              <button type="button" disabled={page === 0 || loading} onClick={() => onChangePage(page - 1)}>
                Anterior
              </button>
              <span>Página {page + 1}</span>
              <button type="button" disabled={loading} onClick={() => onChangePage(page + 1)}>
                Siguiente
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="empty-state">
          <span className="empty-icon">✳</span>
          <h3>{searchText ? 'No encontramos resultados' : 'No hay series para mostrar'}</h3>
          <p>{searchText ? 'Prueba con otro título o cambia el año.' : 'Vuelve a intentarlo en un momento.'}</p>
        </div>
      )}
    </section>
  )
}
