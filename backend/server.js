import express from 'express'
import { createServer } from 'node:http'
import process from 'node:process'
import { WebSocket, WebSocketServer } from 'ws'
import pty from 'node-pty'

const port = Number(process.env.PORT) || 3001
const app = express()
const server = createServer(app)
const webSocketServer = new WebSocketServer({ noServer: true })

app.get('/health', (_request, response) => {
  response.json({ status: 'ok', service: 'ai-terminal-backend' })
})

function getShell() {
  if (process.env.SHELL) {
    return process.env.SHELL
  }

  if (process.platform === 'win32') {
    return process.env.COMSPEC || 'powershell.exe'
  }

  if (process.platform === 'darwin') {
    return '/bin/zsh'
  }

  return '/bin/sh'
}

function sendMessage(socket, message) {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message))
  }
}

function isValidTerminalSize(value) {
  return Number.isInteger(value) && value >= 20 && value <= 500
}

function createPtySession(socket) {
  let terminalProcess

  try {
    terminalProcess = pty.spawn(getShell(), [], {
      name: 'xterm-color',
      cols: 120,
      rows: 30,
      cwd: process.env.AI_TERMINAL_CWD || process.cwd(),
      env: process.env,
    })
  } catch (error) {
    sendMessage(socket, { type: 'error', message: 'Unable to start the terminal shell.' })
    socket.close(1011, 'PTY startup failed')
    return null
  }

  terminalProcess.onData((data) => sendMessage(socket, { type: 'output', data }))
  terminalProcess.onExit(({ exitCode, signal }) => {
    sendMessage(socket, { type: 'exit', exitCode, signal })
    if (socket.readyState === WebSocket.OPEN) {
      socket.close(1000, 'PTY exited')
    }
  })

  return terminalProcess
}

webSocketServer.on('connection', (socket) => {
  const terminalProcess = createPtySession(socket)
  if (!terminalProcess) {
    return
  }

  socket.on('message', (rawMessage, isBinary) => {
    if (isBinary) {
      sendMessage(socket, { type: 'error', message: 'Binary terminal messages are not supported.' })
      return
    }

    let message
    try {
      message = JSON.parse(rawMessage.toString())
    } catch {
      sendMessage(socket, { type: 'error', message: 'Invalid terminal message.' })
      return
    }

    if (message.type === 'input' && typeof message.data === 'string') {
      terminalProcess.write(message.data)
      return
    }

    if (message.type === 'resize' && isValidTerminalSize(message.cols) && isValidTerminalSize(message.rows)) {
      try {
        terminalProcess.resize(message.cols, message.rows)
      } catch {
        sendMessage(socket, { type: 'error', message: 'Unable to resize the terminal.' })
      }
      return
    }

    sendMessage(socket, { type: 'error', message: 'Unsupported terminal message.' })
  })

  socket.on('close', () => {
    try {
      terminalProcess.kill()
    } catch {
      // The PTY may already have exited between the socket close and cleanup.
    }
  })

  socket.on('error', () => {
    try {
      terminalProcess.kill()
    } catch {
      // Cleanup is best effort for an already-closed client.
    }
  })
})

server.on('upgrade', (request, socket, head) => {
  const requestUrl = new URL(request.url || '/', `http://${request.headers.host}`)
  if (requestUrl.pathname !== '/terminal') {
    socket.destroy()
    return
  }

  webSocketServer.handleUpgrade(request, socket, head, (client) => {
    webSocketServer.emit('connection', client, request)
  })
})

server.listen(port, () => {
  console.log(`AI Terminal backend listening on http://localhost:${port}`)
  console.log(`PTY shell: ${getShell()}`)
})