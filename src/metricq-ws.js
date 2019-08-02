var WebSocketClient = require('websocket').client
var moment = require('moment')

class MetricQWebsocket {
  constructor () {
    this.ws = new WebSocketClient()
  }

  static connect (uri) {
    return new Promise((resolve, reject) => {
      let mq = new MetricQWebsocket()

      mq.ws.on('connectFailed', error =>
        reject(error)
      )

      mq.ws.on('connect', connection => {
        mq.connection = connection
        connection.on('error', error => {
          mq.connection = undefined
          mq.onError(error)
        })

        connection.on('close', () => {
          mq.connection = undefined
          mq.onClose()
        })

        connection.on('message', message => {
          if (message.type === 'utf8') {
            mq.handleMessage(message.utf8Data)
          }
        })

        resolve(mq)
      })

      mq.ws.connect(uri)
    })
  }

  subscribe (metrics) {
    if (!Array.isArray(metrics)) {
      metrics = [metrics]
    }

    this.connection.sendUTF(JSON.stringify({
      'function': 'subscribe',
      'metrics': metrics
    }))
  }

  onMetaData (metric, metadata) {}
  onData (metric, time, value) {}

  handleMessage (message) {
    var response = JSON.parse(message)
    if (response.hasOwnProperty('error')) {
      console.log('[MetricqWebSocket] Received error message:' + response.error)
      this.onError(response.error)
    } else if (response.hasOwnProperty('data')) {
      for (let datapoint of response.data) {
        this.onData(datapoint.id, moment(datapoint.ts / 1e6), datapoint.value)
      }
    } else if (response.hasOwnProperty('metadata')) {
      Object.keys(response.metadata).forEach(metric => {
        this.onMetaData(metric, response.metadata[metric])
      })
    } else {
      console.log('[MetricqWebSocket] Received unknown message')
    }
  }
}

module.exports = MetricQWebsocket
