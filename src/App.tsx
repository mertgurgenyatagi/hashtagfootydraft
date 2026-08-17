import { Home } from './routes/Home'

/**
 * One page, so no router. The lobby was removed with the rest of the old
 * frontend; when it comes back it brings a HashRouter with it — GitHub Pages
 * serves static files with no rewrite rules, so deep links have to live in the
 * hash. Nothing until then needs a URL.
 */
export function App() {
  return <Home />
}
