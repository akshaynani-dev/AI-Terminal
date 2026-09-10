import './TerminalTabs.css'

function TerminalTabs({ onNewTerminal }) {
  return (
    <div className="terminal-tabs">
      <div className="terminal-tab active">
        <span className="terminal-tab-icon" aria-hidden="true">›_</span>
        <span>Terminal 1</span>
        <span className="terminal-tab-close" aria-hidden="true">×</span>
      </div>
      <button className="new-tab-button" type="button" aria-label="Open a new terminal session" onClick={onNewTerminal}>+</button>
    </div>
  )
}

export default TerminalTabs