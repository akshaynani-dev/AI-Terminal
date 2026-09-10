import { useEffect, useRef } from 'react'
import { Terminal as XTerm } from '@xterm/xterm'
import '@xterm/xterm/css/xterm.css'
import './Terminal.css'

const terminalSocketPath = import.meta.env.VITE_TERMINAL_WS_URL || '/terminal'

function getWebSocketUrl() {
  if (terminalSocketPath.startsWith('ws://') || terminalSocketPath.startsWith('wss://')) {
    return terminalSocketPath
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${window.location.host}${terminalSocketPath}`
}

function Terminal({ onStatusChange, onRegister }) {
  const terminalElement = useRef(null)
  const terminalInstance = useRef(null)
  const socketInstance = useRef(null)
  const callbacks = useRef({ onStatusChange, onRegister })

  useEffect(() => {
    callbacks.current = { onStatusChange, onRegister }
  }, [onStatusChange, onRegister])

  useEffect(() => {
    const terminal = new XTerm({
      cursorBlink: true,
      cursorStyle: 'bar',
      fontFamily: "'IBM Plex Mono', 'SFMono-Regular', Consolas, monospace",
      fontSize: 14,
      lineHeight: 1.45,
      scrollback: 5000,
      theme: {
        background: '#111821',
        foreground: '#d8e0eb',
        cursor: '#e8bb61',
        cursorAccent: '#111821',
        selectionBackground: '#344354',
        black: '#111821',
        brightBlack: '#718094',
        green: '#91c997',
        brightGreen: '#b0e7ac',
        yellow: '#e8bb61',
        brightYellow: '#ffda83',
        blue: '#8ab9e8',
        brightBlue: '#b4d8ff',
      },
    })
    terminal.open(terminalElement.current)
    terminal.write('\x1b[1;33mAI Terminal\x1b[0m\r\n')
    terminal.write('\x1b[90mInteractive developer terminal\x1b[0m\r\n')
    terminal.write('\x1b[90mType a command to get started.\x1b[0m\r\n\r\n')
    terminalInstance.current = terminal

    const send = (message) => {
      const socket = socketInstance.current
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(message))
      }
    }

    const resize = () => {
      const width = terminalElement.current?.clientWidth || 800
      const height = terminalElement.current?.clientHeight || 400
      const cols = Math.max(40, Math.floor(width / 8.4))
      const rows = Math.max(10, Math.floor(height / 20))
      terminal.resize(cols, rows)
      send({ type: 'resize', cols, rows })
    }

    const connect = () => {
      callbacks.current.onStatusChange('Connecting...')
      const socket = new WebSocket(getWebSocketUrl())
      socketInstance.current = socket

      socket.onopen = () => {
        callbacks.current.onStatusChange('Connected')
        resize()
      }

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          if (message.type === 'output') {
            terminal.write(message.data)
          } else if (message.type === 'error') {
            terminal.write(`\r\n\x1b[31m${message.message}\x1b[0m\r\n`)
          } else if (message.type === 'exit') {
            callbacks.current.onStatusChange('Disconnected')
          }
        } catch {
          terminal.write(event.data)
        }
      }

      socket.onerror = () => {
        callbacks.current.onStatusChange('Disconnected')
      }

      socket.onclose = () => {
        callbacks.current.onStatusChange('Disconnected')
      }
    }

    const dataListener = terminal.onData((data) => send({ type: 'input', data }))
    const resizeListener = terminal.onResize(({ cols, rows }) => send({ type: 'resize', cols, rows }))
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(terminalElement.current)
    connect()

    const actions = {
      clear: () => send({ type: 'input', data: '\u000c' }),
    }
    callbacks.current.onRegister(actions)

    return () => {
      resizeObserver.disconnect()
      dataListener.dispose()
      resizeListener.dispose()
      socketInstance.current?.close()
      terminal.dispose()
      terminalInstance.current = null
      socketInstance.current = null
    }
  }, [])

  return <div ref={terminalElement} className="terminal-container" role="application" aria-label="Interactive AI Terminal" />
}

export default Terminal