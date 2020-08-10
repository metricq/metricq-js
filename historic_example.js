var MetricQHistoric = require('./src/metricq-historic.js')
var moment = require('moment')

var mq = new MetricQHistoric('https://grafana.metricq.zih.tu-dresden.de/metricq')
//var mq = new MetricQHistoric('http://localhost:3001')

mq.search('pow').then(matches =>
  console.log(matches)
).catch(error =>
  console.log('Something went wrong: ' + error)
)

let q = mq.query(moment().startOf('day'), moment(), 100)

for (let metric of ['elab.ariel.power']) {
  q.target(metric)
}

q.run().then(data =>
  console.log(data["elab.ariel.power/avg"].data)
).catch(error =>
  console.log('Something went wrong: ' + error)
)
