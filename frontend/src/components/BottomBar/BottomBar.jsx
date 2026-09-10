import { ConnectionStatus } from '../Header/Header'
import './BottomBar.css'

function BottomBar({ status, onNewTerminal, onClear, onReconnect }) {
  return (
    <footer className="bottom-bar">
      <div className="bottom-actions">
        <button type="button" onClick={onNewTerminal}><span aria-hidden="true">+</span> New Terminal</button>
        <button type="button" onClick={onClear}><span aria-hidden="true">⌫</span> Clear</button>
      </div>
      <div className="bottom-session">
        <span className="session-info">Terminal 1 <span aria-hidden="true">·</span> PTY session</span>
        <ConnectionStatus status={status} />
        {status === 'Disconnected' && <button className="reconnect-button" type="button" onClick={onReconnect}>Reconnect</button>}
      </div>
    </footer>
  )
}

export default BottomBar