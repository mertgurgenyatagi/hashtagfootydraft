import { HashRouter, Route, Routes } from 'react-router-dom'
import { Home } from './routes/Home'
import { Lobby } from './routes/Lobby'

/**
 * HashRouter, not BrowserRouter: the app ships to GitHub Pages, which serves
 * static files with no rewrite rules, so deep links need to live in the hash.
 * Anything unrecognised falls back to the home page.
 */
export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/lobby/:code" element={<Lobby />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </HashRouter>
  )
}
