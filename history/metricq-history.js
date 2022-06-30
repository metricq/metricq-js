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

      axios.post(`${this.mq.url}/query`, paramters, this.mq.config).then(result =>
        resolve(this._parse_result(result))
      ).catch(error => reject(error)
      )
    })
  }
}

class AnalyzeQuery {
  constructor (mq, from, to) {
    this.mq = mq
    this.from = from
    this.to = to
    this.targets = []
  }

  target (metric) {
    this.targets.push({
      'metric': metric,
    })

    return this
  }

  _parse_result (result) {
    let data = {}
    for (var target of result['data']) {
      data[target['target']] = {
        'time_measurements': target['time_measurements'],
        "minimum": target['minimum'],
        "maximum": target['maximum'],
        "sum": target['sum'],
        "count": target['count'],
        "integral_ns": target['integral_ns'],
        "active_time_ns": target['active_time_ns'],
        "mean": target['mean'],
        "mean_integral": target['mean_integral'],
        "mean_sum": target['mean_sum']
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
        'targets': this.targets
      }

      axios.post(`${this.mq.url}/analyze`, paramters, this.mq.config).then(result =>
        resolve(this._parse_result(result))
      ).catch(error => reject(error)
      )
    })
  }
}

class HtaQuery{
  constructor (mq, from, to, points) {
    this.mq = mq
    this.from = from
    this.to = to
    this.points = points
    this.metrics = []
  }

  metric (metric) {
    this.metrics.push({
      'metric': metric,
    })

    return this
  }

  _parse_result (result) {
    let data = {}

    for (var metric of result['data']) {
      const datapoints = metric[metric['mode']].map(datapoint => {
        return { 'time': moment(datapoint['time']), 'min': datapoint['min'], 'avg': datapoint['avg'], 'max': datapoint['max'], 'count': datapoint['count'] }
      })
      data[metric['metric']] = {
        'mode': metric['mode'],
        'time_measurements': metric['time_measurements'],
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
        'targets': this.metrics
      }
      axios.post(`${this.mq.url}/query_hta`, paramters, this.mq.config).then(result =>
        resolve(this._parse_result(result))
      ).catch(error => reject(error)
      )
    })
  }
}

class MetricQHistoric {
  constructor (url, username = undefined, password = undefined) {
    this.url = url
    if (username !== undefined && password !== undefined) {
      this.config = { auth: { username: username, password: password }}
    } else {
      this.config = undefined
    }
  }

  search (target, metadata = false, limit = undefined) {
    return new Promise((resolve, reject) => {
      axios.post(`${this.url}/search`, {
        target: target,
        metadata: metadata,
        limit: limit
      }, this.config).then(result => {
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
      }, this.config).then(result =>
        resolve(result['data'][target])
      ).catch(error =>
        reject(error)
      )
    })
  }

  query (from, to, num_points) {
    return new Query(this, moment(from), moment(to), num_points)
  }

  analyze (from, to) {
    return new AnalyzeQuery(this, moment(from), moment(to))
  }

  htaquery (from, to, num_points) {
    return new HtaQuery(this, moment(from), moment(to), num_points)
  }
}

module.exports = MetricQHistoric
