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
      <div className="container-xxl">
        <div className="row card border-top-0 border-bottom-0 rounded-0">
          <div className="row card-body py-2">
            <div className="col-sm-3">
              {packages.map((p) => (
                <div key={p.id} onClick={() => setPackageItem(p)}>
                  {p.id}
                </div>
              ))}
            </div>
            <div className="col-sm-9">
              {packageItem && (
                <div>
                  <div>{packageItem.name}</div>
                  <div>{packageItem.overview}</div>
                  <div>{packageItem.description}</div>
                  <div>{packageItem.developer}</div>
                  紹介ページ:{' '}
                  <a href={packageItem.pageURL}>{packageItem.pageURL}</a>
                  ダウンロードページ:{' '}
                  <a href={packageItem.downloadURL}>
                    {packageItem.downloadURL}
                  </a>
                </div>
              )}
              <SurveyComponent
                packageItem={packageItem}
                onComplete={complete}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
