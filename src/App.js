import React, { useState, useEffect } from 'react';
import './App.css';
import SurveyComponent from './SurveyComponent';
import { PackagesList } from './parseXML';

function App() {
  const [packageItem, setPackageItem] = useState();
  const [packages, setPackages] = useState([]);

  useEffect(() => {
    async function fetchXML() {
      const text = await (
        await fetch(
          'https://cdn.jsdelivr.net/gh/hal-shu-sato/apm-data@main/v2/data/packages.xml'
        )
      ).text();
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
  }

  return (
    <div className="bg-light">
      <div className="d-flex flex-column h-100">
        <nav class="container-fluid navbar navbar-light">
          <span class="navbar-brand">
            <img src="../icon/apm32.png" alt="" class="d-inline-block" />
            <span class="align-middle">AviUtl Package Manager</span>
          </span>
          <form class="d-flex">
            <button class="btn btn-outline-success">💬送信</button>
          </form>
        </nav>
        <div className="flex-grow-1 overflow-auto">
          <div className="row g-0 h-100 card border-top-0 border-bottom-0 rounded-0">
            <div className="row g-0 h-100 card-body p-0">
              <div className="col-sm-3 overflow-auto h-100 list-group list-group-flush user-select-none">
                {packages.map((p) => (
                  <div
                    className={
                      'list-group-item list-group-item-action' +
                      (p.id === packageItem?.id ? ' active' : '')
                    }
                    key={p.id}
                    onClick={() => setPackageItem(p)}
                  >
                    {p?.name ? p.name : p.id}
                  </div>
                ))}
              </div>
              <div className="col-sm-9 overflow-auto h-100">
                <SurveyComponent
                  packageItem={packageItem}
                  onComplete={complete}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
