import { HashRouter, Route, Routes } from 'react-router-dom'
import { Home } from './routes/Home'
import { SoloLobby } from './routes/SoloLobby'

/**
 * Two routes now, so the router is back. `HashRouter` specifically: GitHub
 * Pages serves static files with no rewrite rules, so a deep link has to live
 * in the hash or it 404s on refresh.
 *
 * The format the lobby opens on is a path segment rather than state, so
 * /#/solo/free-pick is a real, shareable address.
 */
export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/solo" element={<SoloLobby />} />
        <Route path="/solo/:formatId" element={<SoloLobby />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </HashRouter>
  )
}
