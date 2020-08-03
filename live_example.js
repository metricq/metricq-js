var MetricQWebsocket = require('./src/metricq-ws.js')

MetricQWebsocket.connect('wss://websocket.metricq.zih.tu-dresden.de').then(ws => {
  ws.onData = (metric, time, value) => {
    console.log(`${metric}: ${time}@${value}`)
  }

  ws.subscribe('elab.ariel.power')
}).catch(error =>
  console.log('Something went wrong: ' + error)
)
