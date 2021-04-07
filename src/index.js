import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import data from "./newton-routes-nodes2.json";
import {
  BrowserRouter as Router,
  Route
} from "react-router-dom";
import { QueryParamProvider } from 'use-query-params';
import reportWebVitals from './reportWebVitals';


ReactDOM.render(
  <React.StrictMode>
    <Router>
      <QueryParamProvider ReactRouterRoute={Route}>
        <App data={data} />
      </QueryParamProvider>
    </Router>
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
