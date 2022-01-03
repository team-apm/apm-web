import React, { useState, useEffect } from 'react';
import './App.css';
import SurveyComponent from './SurveyComponent';
import { PackagesList } from './parseXML';

function App() {
  const [packageItem, setPackageItem] = useState();

  useEffect(() => {
    async function fetchXML() {
      const text = await (await fetch("https://cdn.jsdelivr.net/gh/hal-shu-sato/apm-data@main/v2/data/packages.xml")).text();
      const packages = new PackagesList(text);
      setPackageItem(packages['ePi/patch']);
    }
    fetchXML();
  }, [])
  return (
    <SurveyComponent packageItem={packageItem} />
  );
}

export default App;
