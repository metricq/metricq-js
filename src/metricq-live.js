var WebSocket = require('websocket').w3cwebsocket
var moment = require('moment')

class MetricQLive {
  static connect (uri) {
    return new Promise((resolve, reject) => {
      let mq = new MetricQLive(uri)

      mq.ws.onError = error =>
        reject(error)

      mq.ws.onopen = () => {
        mq.ws.onError = error =>
          mq.onError(error)

        mq.ws.onclose = (event) => {
          mq.ws = undefined
          mq.onClose(event)
        }

        mq.ws.onmessage = message => {
          mq._handleMessage(message.data)
        }

        resolve(mq)
      }
    })
  }

  subscribe (metrics) {
    if (!Array.isArray(metrics)) {
      metrics = [metrics]
    }

    this.ws.send(JSON.stringify({
      'function': 'subscribe',
      'metrics': metrics
    }))
  }

  onMetaData (metric, metadata) {}
  onData (metric, time, value) {}

  onError (error) {}
  onClose (event) {}

  constructor (uri) {
    this.ws = new WebSocket(uri)
  }

  _handleMessage (message) {
    var response = JSON.parse(message)
    if (response.hasOwnProperty('error')) {
      console.log('[MetricQLive] Received error message:' + response.error)
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
      console.log('[MetricQLive] Received unknown message')
    }
  }
}

module.exports = MetricQLive
