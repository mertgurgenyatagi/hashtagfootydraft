import { HashRouter, Route, Routes } from 'react-router-dom'
import { Home } from './routes/Home'

/**
 * HashRouter, not BrowserRouter: the app ships to GitHub Pages, which serves
 * static files with no rewrite rules, so deep links need to live in the hash.
 * Only "/" exists so far — everything else falls back to it.
 */
export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </HashRouter>
  )
}
