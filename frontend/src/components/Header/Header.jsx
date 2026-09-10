import { useState } from 'react'
import './Header.css'

function Header({ status, onReconnect }) {
  const [showSettings, setShowSettings] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  return (
    <header className="app-header">
      <div className="header-brand">
        <span className="brand-mark" aria-hidden="true">⚡</span>
        <span className="brand-name">AI Terminal</span>
      </div>
      <div className="session-label">
        <span className="session-label-caption">Session</span>
        <span>Terminal 1</span>
      </div>
      <div className="header-actions">
        <ConnectionStatus status={status} />
        <div className="header-menu-wrap">
          <button className="icon-button" type="button" aria-label="Terminal settings" aria-expanded={showSettings} onClick={() => { setShowSettings(!showSettings); setShowMenu(false) }}>
            <span aria-hidden="true">⚙</span>
          </button>
          {showSettings && (
            <div className="popover settings-popover">
              <strong>Terminal settings</strong>
              <span>Transport: WebSocket</span>
              <span>Shell: runtime detected</span>
            </div>
          )}
        </div>
        <div className="header-menu-wrap">
          <button className="icon-button" type="button" aria-label="More terminal options" aria-expanded={showMenu} onClick={() => { setShowMenu(!showMenu); setShowSettings(false) }}>
            <span aria-hidden="true">⋯</span>
          </button>
          {showMenu && (
            <div className="popover options-popover">
              <button type="button" onClick={() => { onReconnect(); setShowMenu(false) }}>Reconnect terminal</button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export function ConnectionStatus({ status }) {
  const statusClass = status.toLowerCase().replaceAll('...', '')
  return (
    <div className={`connection-status ${statusClass}`}>
      <span className="status-dot" aria-hidden="true" />
      <span>{status}</span>
    </div>
  )
}

export default Header