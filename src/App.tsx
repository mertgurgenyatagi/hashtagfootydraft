import { HashRouter, Route, Routes } from 'react-router-dom'
import { Home } from './routes/Home'
import { MultiLobby } from './routes/MultiLobby'
import { SoloLobby } from './routes/SoloLobby'

/**
 * `HashRouter` specifically: GitHub Pages serves static files with no rewrite
 * rules, so a deep link has to live in the hash or it 404s on refresh.
 *
 * Both lobbies keep their identity in the path rather than in state, so
 * /#/solo/free-pick and /#/lobby/KX7QD are real, shareable addresses — the
 * second one is the invite link.
 */
export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/solo" element={<SoloLobby />} />
        <Route path="/solo/:formatId" element={<SoloLobby />} />
        <Route path="/lobby/:code" element={<MultiLobby />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </HashRouter>
  )
}
