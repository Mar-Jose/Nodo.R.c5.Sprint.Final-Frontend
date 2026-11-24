# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Protected routes

The application uses React Router with these routes:

- `/login`: login and registration.
- `/profiles` and `/profiles/create`: require an account session.
- `/catalog` and `/watchlist`: require an account session and an active profile.
- `/profiles/manage`: also requires an adult profile.

Route declarations and guards live in `src/routes/AppRoutes.jsx`; path constants and screen lookup live in `src/routes/routeConfig.js`. `src/App.jsx` supplies the screens and application actions.

Catalog state and requests are managed by `src/hooks/useCatalog.js`, and profile-scoped Watchlist state and requests by `src/hooks/useWatchlist.js`. Both reuse `src/api.js`; persistence and business rules remain in the backend.

Presentation is separated into `src/components/catalog/SeriesCatalog.jsx`, `src/components/search/SearchBar.jsx`, `src/components/cards/MediaCard.jsx`, and `src/components/watchlist/WatchlistView.jsx`. The catalog and Watchlist reuse the same card.

Frontend redirects improve navigation, but the backend API remains responsible for validating JWTs and authorizing operations. In production, configure the web server to serve `index.html` for application routes so direct links work.
