var MetricQHistory = require("./metricq-history.js");
var moment = require("moment");

var mq = new MetricQHistory(
  "https://grafana.metricq.zih.tu-dresden.de/metricq"
);
//var mq = new MetricQHistory('http://localhost:3001')

mq.search("pow")
  .then((matches) => console.log(matches))
  .catch((error) => console.log("Something went wrong: " + error));

mq.metadata("elab.ariel.power")
  .then((result) => console.log(result))
  .catch((error) => console.log("Something went wrong: " + error));

let q = mq.query(moment().startOf("day"), moment(), 100);

for (let metric of ["elab.ariel.power"]) {
  q.target(metric);
}

q.run()
  .then((data) => console.log(data["elab.ariel.power/avg"].data))
  .catch((error) => console.log("Something went wrong: " + error));

let a = mq.analyze(moment().startOf("day"), moment());

for (let metric of ["elab.ariel.power"]) {
  a.target(metric);
}

a.run()
  .then((data) => console.log(data["elab.ariel.power"]))
  .catch((error) => console.log("Something went wrong: " + error));

let h = mq.timeline(moment().startOf("day"), moment(), 4);

for (let metric of ["elab.ariel.power"]) {
  h.metric(metric);
}

h.run()
  .then((data) => console.log(data["elab.ariel.power"]))
  .catch((error) => console.log("Something went wrong: " + error));
