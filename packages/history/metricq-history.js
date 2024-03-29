import { post } from 'axios'
import moment from 'moment'

class Query {
  constructor(mq, from, to, points, postFunction) {
    this.mq = mq
    this.from = from
    this.to = to
    this.points = points
    this.targets = []
    this.postFunction = postFunction
  }

  target(metric, functions = ['min', 'max', 'avg'], sma_window = null) {
    this.targets.push({
      metric: metric,
      functions: functions,
      sma_window: sma_window,
    })

    return this
  }

  _parse_result(result) {
    let data = {}
    for (var target of result.data) {
      const dataPoints = target.datapoints.map((dataPoint) => {
        return { time: moment(dataPoint[1]), value: dataPoint[0] }
      })
      data[target.target] = {
        time_measurements: target['time_measurements'],
        data: dataPoints,
      }
    }

    return data
  }

  run() {
    return new Promise((resolve, reject) => {
      const parameters = {
        range: {
          from: this.from.toISOString(),
          to: this.to.toISOString(),
        },
        maxDataPoints: this.points,
        targets: this.targets,
      }

      this.postFunction(`${this.mq.url}/query`, parameters, this.mq.config)
        .then((result) => resolve(this._parse_result(result)))
        .catch((error) => reject(error))
    })
  }
}

class AnalyzeQuery {
  constructor(mq, from, to, postFunction) {
    this.mq = mq
    this.from = from
    this.to = to
    this.targets = []
    this.postFunction = postFunction
  }

  target(metric) {
    this.targets.push({
      metric,
    })

    return this
  }

  _parse_result(result) {
    let data = {}
    for (var target of result.data) {
      data[target.target] = {
        time_measurements: target['time_measurements'],
        minimum: target.minimum,
        maximum: target.maximum,
        sum: target.sum,
        count: target.count,
        integral_ns: target.integral_ns,
        active_time_ns: target['active_time_ns'],
        mean: target.mean,
        mean_integral: target['mean_integral'],
        mean_sum: target['mean_sum'],
      }
    }

    return data
  }

  run() {
    return new Promise((resolve, reject) => {
      const parameters = {
        range: {
          from: this.from.toISOString(),
          to: this.to.toISOString(),
        },
        targets: this.targets,
      }

      this.postFunction(`${this.mq.url}/analyze`, parameters, this.mq.config)
        .then((result) => resolve(this._parse_result(result)))
        .catch((error) => reject(error))
    })
  }
}

class Timeline {
  constructor(mq, from, to, points, postFunction) {
    this.mq = mq
    this.from = from
    this.to = to
    this.points = points
    this.metrics = []
    this.postFunction = postFunction
  }

  metric(metric) {
    this.metrics.push(metric)

    return this
  }

  _parse_result({ data }) {
    for (const metric_data of Object.values(data)) {
      if (metric_data.mode === 'empty' || metric_data.error !== undefined)
        continue
      for (const value of metric_data[metric_data.mode]) {
        value.timestamp = moment(value.timestamp / 1e6)
      }
    }

    return data
  }

  run() {
    return new Promise((resolve, reject) => {
      const parameters = {
        range: {
          from: this.from.toISOString(),
          to: this.to.toISOString(),
        },
        maxDataPoints: this.points,
        metrics: this.metrics,
      }
      this.postFunction(`${this.mq.url}/timeline`, parameters, this.mq.config)
        .then((result) => resolve(this._parse_result(result)))
        .catch((error) => reject(error))
    })
  }
}

class MetricQHistoric {
  constructor(url, username = undefined, password = undefined) {
    this.url = url
    this.postFunction = post
    if (username !== undefined && password !== undefined) {
      this.config = { auth: { username: username, password: password } }
    } else {
      this.config = undefined
    }
  }

  search(target, metadata = false, limit = undefined) {
    return new Promise((resolve, reject) => {
      this.postFunction(
        `${this.url}/search`,
        {
          target,
          metadata,
          limit,
        },
        this.config
      )
        .then(({ data }) => {
          resolve(data)
        })
        .catch((error) => reject(error))
    })
  }

  metadata(target) {
    return new Promise((resolve, reject) => {
      this.postFunction(
        `${this.url}/metadata`,
        {
          target,
        },
        this.config
      )
        .then(({ data }) => resolve(data.target))
        .catch((error) => reject(error))
    })
  }

  query(from, to, numPoints) {
    return new Query(
      this,
      moment(from),
      moment(to),
      numPoints,
      this.postFunction
    )
  }

  analyze(from, to) {
    return new AnalyzeQuery(this, moment(from), moment(to), this.postFunction)
  }

  timeline(from, to, numPoints) {
    return new Timeline(
      this,
      moment(from),
      moment(to),
      numPoints,
      this.postFunction
    )
  }
}

export default MetricQHistoric
