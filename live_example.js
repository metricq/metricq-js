var MetricQLive = require("./live/metricq-live.js");

MetricQLive.connect("wss://websocket.metricq.zih.tu-dresden.de")
  .then((ws) => {
    ws.onData = (metric, time, value) => {
      console.log(`${metric}: ${time}@${value}`);
    };

    ws.onMetaData = (metric, metadata) => {
      console.log(`${metric}: ${metadata}`);
    };

    ws.subscribe("elab.ariel.power");
  })
  .catch((error) => console.log("Something went wrong: " + error));
