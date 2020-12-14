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

  target (metric, functions = ['min', 'max', 'avg'], sma_window = null) {
    this.targets.push({
      'metric': metric,
      'functions': functions,
      'sma_window': sma_window
    })

    return this
  }

  _parse_result (result) {
    let data = {}
    for (var target of result['data']) {
      const datapoints = target['datapoints'].map(datapoint => {
        return { 'time': moment(datapoint[1]), 'value': datapoint[0] }
      })
      data[target['target']] = {
        'time_measurements': target['time_measurements'],
        'data': datapoints
      }
    }

    return data
  }

  run () {
    return new Promise((resolve, reject) => {
      const paramters = {
        'range': {
          'from': this.from.toISOString(),
          'to': this.to.toISOString()
        },
        'maxDataPoints': this.points,
        'targets': this.targets
      }

      axios.post(`${this.mq.url}/query`, paramters).then(result =>
        resolve(this._parse_result(result))
      ).catch(error => reject(error)
      )
    })
  }
}

class MetricQHistoric {
  constructor (url) {
    this.url = url
  }

  search (target) {
    return new Promise((resolve, reject) => {
      axios.post(`${this.url}/search`, {
        target: target
      }).then(result => {
        resolve(result['data'])
      }
      ).catch(error =>
        reject(error)
      )
    })
  }

  metadata (target) {
    return new Promise((resolve, reject) => {
      axios.post(`${this.url}/metadata`, {
        target: target
      }).then(result =>
        resolve(result['data'][target])
      ).catch(error =>
        reject(error)
      )
    })
  }

  query (from, to, num_points) {
    return new Query(this, moment(from), moment(to), num_points)
  }
}

module.exports = MetricQHistoric