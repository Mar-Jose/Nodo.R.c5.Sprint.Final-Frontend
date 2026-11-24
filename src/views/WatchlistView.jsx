import MediaCard from '../components/cards/MediaCard.jsx'

export default function WatchlistView({
  error,
  loading,
  onBrowseCatalog,
  onDetails,
  onRetry,
  onToggle,
  watchlist,
  watchlistReady,
}) {
  return (
    <section className="watchlist-section">
      <p className="eyebrow">TU COLECCIÓN PERSONAL</p>
      <h1>Mi lista</h1>
      <p className="muted">Las series que guardaste para ver más tarde.</p>
      {error && <p className="error-message" role="alert">{error}</p>}
      {loading ? (
        <div className="loading-state"><span className="spinner" />Cargando tu lista…</div>
      ) : watchlist.length ? (
        <div className="media-grid">
          {watchlist.map((item) => (
            <MediaCard
              key={item._id || item.id}
              show={{
                id: item.externalId,
                name: item.title,
                image: { medium: item.posterUrl },
                summary: item.overview,
                premiered: item.releaseDate,
                genres: item.genres || [],
              }}
              saved
              onToggle={onToggle}
              onDetails={onDetails}
            />
          ))}
        </div>
      ) : !watchlistReady ? (
        <div className="empty-state">
          <h3>No se pudo sincronizar tu lista</h3>
          <p>Comprueba tu conexión e inténtalo de nuevo.</p>
          <button type="button" className="primary-button" onClick={onRetry}>
            Reintentar
          </button>
        </div>
      ) : (
        <div className="empty-state">
          <span className="empty-icon">＋</span>
          <h3>Tu lista está esperando</h3>
          <p>Guarda series desde el catálogo y aparecerán aquí.</p>
          <button type="button" className="primary-button" onClick={onBrowseCatalog}>
            Explorar catálogo
          </button>
        </div>
      )}
    </section>
  )
}
