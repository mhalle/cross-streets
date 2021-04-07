import React, { useState } from "react";
import DeckGL, { GeoJsonLayer } from "deck.gl";
import { StaticMap } from "react-map-gl";
import 'mapbox-gl/dist/mapbox-gl.css';
import 'antd/dist/antd.css';
import Checkbox from 'antd/lib/checkbox';
import './App.css';

const MAPBOX_ACCESS_TOKEN =
  "pk.eyJ1IjoiaGFsYXphciIsImEiOiJja2N0dXI2Y3kxbTBoMnBxcTJnaTl3czVxIn0.MXzwZHuwNaOPKZgO17_YmA";

function App ({data}) {
  const initialViewState = {
    longitude: -71.2192,
    latitude: 42.330,
    zoom: 12
  };

  const [satellite, setSatellite] = useState(false);
  const [serial, setSerial] = useState(0);
  const [crossStreets, setCrossStreets] = useState(0);

  const incrSerial = () => {
    setSerial(serial + 1);
  }

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
          layers={getLayers(data, serial, incrSerial, setCrossStreets)}
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

function countPicked(data){
  const nodeSet = new Set();
  for(let e of Object.values(data.edges)){
    if(e.properties.picked) {
      const n = e.properties.nodes;
      nodeSet.add(n[0]);
      nodeSet.add(n[1]);
    }
  }
  let c = 0;
  for(let n of nodeSet){
    c += (data.nodes[n].properties.streetCount - 2);
  }
  return c;
}

function edgeClick(info, data, setCrossStreets) {
  const obj = info.object;
  if (!obj) {
    return;
  }
  const id = obj.properties.id;
  const streetName = data.revStreetIndex[id];
  const edges = data.streetIndex[streetName].map(x => data.edges[x]);

  const newState = !obj.properties.picked;
  for (let e of edges){
    e.properties.picked = newState;
  }
  setCrossStreets(countPicked(data));
  return true;
}

function getLayers(data, serial, incrSerial, setCrossStreets) {
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
      edgeClick(info, data, setCrossStreets); 
      incrSerial(); 
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