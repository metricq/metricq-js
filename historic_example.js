var MetricQHistoric = require('./src/metricq-historic.js')
var moment = require('moment')

// var mq = new MetricQREST('https://grafana.metricq.zih.tu-dresden.de/metricq')
var mq = new MetricQHistoric('http://localhost:3001')

// mq.search('pow').then(matches =>
//   console.log(matches)
// ).catch(error =>
//   console.log('Something went wrong: ' + error)
// )

// mq.query(moment().startOf('day'), moment(), 1).target('elab.ariel.power').run().then(data =>
//   console.log(data['elab.ariel.power/min']['data'])
// ).catch(error =>
//   console.log('Something went wrong: ' + error)
// )

let q = mq.query(moment().startOf('day'), moment(), 100)

for (let metric of ['dummy.source']) {
  q.target(metric)
}

q.run().then(data =>
  console.log(data["dummy.source/avg"].data)
).catch(error =>
  console.log('Something went wrong: ' + error)
)
