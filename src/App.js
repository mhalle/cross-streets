import React, { useEffect, useState } from "react";
import DeckGL, { GeoJsonLayer } from "deck.gl";
import 'antd/dist/antd.css';
import Checkbox from 'antd/lib/checkbox';
import './App.css';
import mapboxgl from 'mapbox-gl';
import { StaticMap } from "react-map-gl";
import 'mapbox-gl/dist/mapbox-gl.css';
import { useQueryParam, StringParam } from 'use-query-params';


// @ts-ignore
// eslint-disable-next-line import/no-webpack-loader-syntax
mapboxgl.workerClass = require("worker-loader!mapbox-gl/dist/mapbox-gl-csp-worker").default;

const MAPBOX_ACCESS_TOKEN =
  "pk.eyJ1IjoiaGFsYXphciIsImEiOiJja2N0dXI2Y3kxbTBoMnBxcTJnaTl3czVxIn0.MXzwZHuwNaOPKZgO17_YmA";


function getRouteSet(rp) {
  if(!rp) {
    return new Set();
  }
  return new Set(rp.split(','));
}

function App({ data }) {
  const initialViewState = {
    longitude: -71.2192,
    latitude: 42.330,
    zoom: 12
  };
  const incrSerial = () => {
    setSerial(serial + 1);
  }


  const [satellite, setSatellite] = useState(false);
  const [serial, setSerial] = useState(0);
  const [crossStreets, setCrossStreets] = useState(0);
  const [routeParam, setRouteParam] = useQueryParam('r', StringParam);


  
  const toggleStreet = (streetName) => {
    const routeSet = getRouteSet(routeParam);
    if (routeSet.has(streetName)) {
      routeSet.delete(streetName);
    }
    else {
      routeSet.add(streetName);
    }
    setRouteParam(Array.from(routeSet).join(','));
  }



  useEffect(() => {
    const routeSet = getRouteSet(routeParam);
    for (let s of Object.keys(data.streetIndex)) {
      const state = routeSet.has(s);
      for (let e of data.streetIndex[s]) {
        data.edges[e].properties.picked = state;
      }
      incrSerial();
    }
    setCrossStreets(countPicked(data));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeParam, data]);

  return (
    <div className="App">
      <div className="controls">
        <h1>{crossStreets} Cross Streets</h1>
        <div>
          <div style={{ paddingTop: "15px" }}>
            <Checkbox checked={satellite}
              onChange={e => setSatellite(e.target.checked)}>Satellite</Checkbox>
          </div>
        </div>
      </div>
      <div style={{ width: 0, height: 0 }} >
        <DeckGL
          initialViewState={initialViewState}
          controller={true}
          pickingRadius={5}
          layers={getLayers(data, serial, toggleStreet)}
        >
          <StaticMap
            mapStyle={satellite ?
              "mapbox://styles/mapbox/satellite-streets-v11" :
              "mapbox://styles/mapbox/outdoors-v11"}
            mapboxApiAccessToken={MAPBOX_ACCESS_TOKEN}
          />
        </DeckGL>
      </div>
    </div>
  );
}

function countPicked(data) {
  const nodeSet = new Set();
  for (let e of Object.values(data.edges)) {
    if (e.properties.picked) {
      const n = e.properties.nodes;
      nodeSet.add(n[0]);
      nodeSet.add(n[1]);
    }
  }
  let c = 0;
  for (let n of nodeSet) {
    c += (data.nodes[n].properties.streetCount - 2);
  }
  return c;
}



function edgeClick(info, data, toggleStreet) {
  const obj = info.object;
  if (!obj) {
    return;
  }
  const id = obj.properties.id;
  const streetName = data.revStreetIndex[id];
  toggleStreet(streetName);
  return true;
}

function getLayers(data, serial, toggleStreet) {
  const edgeLayer = new GeoJsonLayer({
    radiusUnits: 'meters',
    id: 'edgeLayer',
    pickable: true,
    stroked: true,
    filled: true,
    extruded: true,
    lineWidthScale: 1,
    lineWidthMinPixels: 3,
    getFillColor: [160, 160, 180, 100],
    getLineColor: (d) => {
      return d.properties.picked ? [100, 64, 200, 140] : [255, 128, 40, 100]
    },
    onClick: (info) => {
      edgeClick(info, data, toggleStreet);
    },
    getRadius: 2,
    getLineWidth: d => d.properties.picked ? 15 : 3,
    data: Object.values(data.edges),
    updateTriggers: {
      getLineColor: [serial],
      getLineWidth: [serial]

    }
  });

  const nodeLayer = new GeoJsonLayer({
    id: 'nodeLayer',
    pickable: true,
    stroked: true,
    filled: true,
    extruded: true,
    lineWidthScale: 1,
    lineWidthMinPixels: 0,
    getLineColor: [0, 0, 0, 255],
    radiusUnits: 'meters',
    getRadius: 10,
    getLineWidth: 0,
    getFillColor: (d) => {
      return d.properties.picked ? [0, 0, 0, 255] : [0, 0, 180, 100]
    },
    data: Object.values(data.nodes),
  });

  return [edgeLayer, nodeLayer];
}

export default App;