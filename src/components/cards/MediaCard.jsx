import plainText from '../../utils/plainText.js'

export default function MediaCard({ show, saved, onToggle, onDetails, saveDisabled = false }) {
  const image = show.image?.medium || show.posterUrl
  const description = plainText(show.summary || show.overview || 'Sin descripción disponible.')

  return (
    <article className="media-card">
      <button className="poster-button" type="button" onClick={() => onDetails(show.id)}>
        {image
          ? <img className="poster" src={image} alt={`Póster de ${show.name || show.title}`} loading="lazy" />
          : <span className="poster-placeholder">N<span>+</span></span>}
        <span className="poster-overlay">Ver detalles <span aria-hidden="true">↗</span></span>
      </button>
      <div className="media-info">
        <div className="media-title-row">
          <h3>{show.name || show.title}</h3>
          {show.rating?.average && <span className="rating">★ {show.rating.average}</span>}
        </div>
        <p className="media-meta">
          {show.premiered?.slice(0, 4) || 'Año no disponible'}
          {show.genres?.length ? ` · ${show.genres.slice(0, 2).join(' · ')}` : ''}
        </p>
        <p className="media-description">{description || 'Sin descripción disponible.'}</p>
        <button
          className={`save-button ${saved ? 'saved' : ''}`}
          type="button"
          onClick={() => onToggle(show)}
          disabled={saveDisabled}
        >
          <span aria-hidden="true">{saved ? '✓' : '+'}</span>
          {saveDisabled ? 'Sincronizando…' : saved ? 'En mi lista' : 'Agregar a mi lista'}
        </button>
      </div>
    </article>
  )
}
