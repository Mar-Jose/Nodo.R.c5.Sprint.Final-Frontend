import SeriesCatalog from '../components/catalog/SeriesCatalog.jsx'

export default function CatalogView({ profileName, ...catalogProps }) {
  return (
    <>
      <section className="welcome-banner">
        <div className="banner-copy">
          <p className="eyebrow">HECHO PARA {profileName?.toUpperCase()}</p>
          <h1>Tu próxima historia<br />empieza aquí.</h1>
          <p>Explora series, encuentra algo nuevo y guárdalo para después.</p>
          <a className="banner-link" href="#catalog">Explorar catálogo <span aria-hidden="true">↓</span></a>
        </div>
        <div className="banner-art" aria-hidden="true">
          <span className="art-orbit orbit-one" />
          <span className="art-orbit orbit-two" />
          <span className="art-star">✳</span>
          <span className="art-caption">PLAY<br /><b>YOUR</b><br />STORY</span>
        </div>
      </section>
      <SeriesCatalog {...catalogProps} />
    </>
  )
}
