var MetricQ = require('./src/metricq-rest.js')
var moment = require('moment')

var mq = new MetricQ('https://grafana.metricq.zih.tu-dresden.de/metricq')

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

let q = mq.query(moment().startOf('day'), moment(), 1)

for (let metric of ['elab.ariel.s0.package.power', 'elab.ariel.s1.power']) {
  q.target(metric)
}

q.run().then(data =>
  console.log(data)
).catch(error =>
  console.log('Something went wrong: ' + error)
)
