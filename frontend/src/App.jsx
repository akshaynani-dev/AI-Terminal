import { useCallback, useState } from 'react'
import Header from './components/Header/Header'
import Terminal from './components/Terminal/Terminal'
import TerminalTabs from './components/TerminalTabs/TerminalTabs'
import BottomBar from './components/BottomBar/BottomBar'
import './App.css'

function App() {
  const [connectionStatus, setConnectionStatus] = useState('Connecting...')
  const [terminalKey, setTerminalKey] = useState(0)
  const [terminalActions, setTerminalActions] = useState(null)

  const reconnect = useCallback(() => {
    setTerminalActions(null)
    setTerminalKey((currentKey) => currentKey + 1)
  }, [])

  const registerTerminal = useCallback((actions) => {
    setTerminalActions(() => actions)
  }, [])

  const clearTerminal = useCallback(() => {
    terminalActions?.clear()
  }, [terminalActions])

  return (
    <div className="app-shell">
      <Header status={connectionStatus} onReconnect={reconnect} />
      <main className="workspace">
        <div className="workspace-heading">
          <div>
            <span className="eyebrow">Workspace</span>
            <h1>Interactive terminal</h1>
          </div>
          <span className="workspace-path">~/ai-terminal</span>
        </div>
        <section className="terminal-card" aria-label="Terminal workspace">
          <TerminalTabs onNewTerminal={reconnect} />
          <Terminal
            key={terminalKey}
            onStatusChange={setConnectionStatus}
            onRegister={registerTerminal}
          />
        </section>
      </main>
      <BottomBar
        status={connectionStatus}
        onNewTerminal={reconnect}
        onClear={clearTerminal}
        onReconnect={reconnect}
      />
    </div>
  )
}

export default App