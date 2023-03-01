import { connect } from './metricq-live.js'

connect('wss://websocket.metricq.zih.tu-dresden.de')
  .then((ws) => {
    ws.onData = (metric, time, value) => {
      console.log(`${metric}: ${time}@${value}`)
    }

    ws.onMetaData = (metric, metadata) => {
      console.log(`Metadata of ${metric}: ${JSON.stringify(metadata)}`)
    }

    ws.subscribe('dummy.source')
  })
  .catch((error) => console.log('Something went wrong: ' + error))
