import React, { useState, useEffect } from 'react';
import './App.css';
import SurveyComponent from './SurveyComponent';
import { PackagesList } from './parseXML';

function App() {
  const [packageItem, setPackageItem] = useState();
  const [packages, setPackages] = useState([]);

  useEffect(() => {
    async function fetchXML() {
      const text = await (await fetch("https://cdn.jsdelivr.net/gh/hal-shu-sato/apm-data@main/v2/data/packages.xml")).text();
      const parsedPackages = new PackagesList(text);

      const tmpPackages = [];
      for (const value of Object.values(parsedPackages)) {
        tmpPackages.push(value);
      }
      setPackages(tmpPackages);
    }
    fetchXML();
  }, []);

  function complete(json) {
    // Open google forms in a new tab instead
    console.log(PackagesList.write([json]));
  };

  return (
    <div>
      {packages.map(p => <div key={p.id} onClick={() => setPackageItem(p)}>{p.id}</div>)}
      <SurveyComponent packageItem={packageItem} onComplete={complete} />
    </div>
  );
}

export default App;
