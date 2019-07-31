var axios = require('axios')
var moment = require('moment')

class Query {
  constructor (mq, from, to, points) {
    this.mq = mq
    this.from = from
    this.to = to
    this.points = points
    this.targets = []
  }

  target (metric, aggregations = ['min', 'max', 'avg']) {
    this.targets.push({ 'target_metric': metric, 'aggregates': aggregations })

    return this
  }

  send () {
    console.log(this.targets)
    return new Promise((resolve, reject) => {
      axios.post(this.mq.url + '/query', {
        'range': {
          'from': this.from,
          'to': this.to
        },
        'intervalMs': this.to.diff(this.from) / this.points,
        'targets': this.targets
      }).then(result => {
        let data = {}
        for (var target of result['data']) {
          var datapoints = []
          for (var datapoint of target['datapoints']) {
            datapoints.push({ 'time': moment(datapoint[1]), 'value': datapoint[0] })
          }
          data[target['target']] = {
            'time_measurements': target['time_measurements'],
            'data': datapoints
          }
        }
        resolve(data)
      }).catch(error =>
        reject(error)
      )
    })
  }
}

class MetricQ {
  constructor (url) {
    this.url = url
  }

  search (target) {
    return new Promise((resolve, reject) => {
      axios.post(this.url + '/search', {
        target: target
      }).then(result => {
        resolve(result['data'])
      }
      ).catch(error =>
        reject(error)
      )
    })
  }

  query (from, to, points) {
    return new Query(this, moment(from), moment(to), points)
  }
}

module.exports = MetricQ
