import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import SurveyComponent from './SurveyComponent';
import { PackagesList } from './parseXML';
import Fuse from 'fuse.js';

const formsUrl =
  'https://docs.google.com/forms/d/e/1FAIpQLSfxQWxsCp9QQYHpe9oxL4gZEdJmMVQxFZijXKI1NmygeHgHkg/viewform?usp=pp_url';
const formsAttribute = { name: 'entry.1336975935', data: 'entry.447338863' };

function makeFormsUrl(data) {
  let url = formsUrl;
  for (const key of Object.keys(formsAttribute)) {
    if (Object.prototype.hasOwnProperty.call(data, key))
      url += '&' + formsAttribute[key] + '=' + encodeURIComponent(data[key]);
  }
  return url;
}

function App() {
  const [packageItem, setPackageItem] = useState();
  const [packages, setPackages] = useState({});
  const [addedPackages, setAddedPackages] = useState({});
  const [searchString, setSearchString] = useState('');

  useEffect(() => {
    async function fetchXML() {
      const text = await (
        await fetch(
          'https://cdn.jsdelivr.net/gh/hal-shu-sato/apm-data@main/v2/data/packages.xml'
        )
      ).text();
      setPackages(new PackagesList(text));

      setAddedPackages(JSON.parse(localStorage.getItem('packages')) ?? {});
    }
    fetchXML();
  }, []);

  const surveyComplete = useCallback(
    (json) => {
      const newPackages = { ...addedPackages };
      newPackages[json.id] = json;
      setAddedPackages(newPackages);
      setPackageItem(json);
      localStorage.setItem('packages', JSON.stringify(newPackages));
    },
    [addedPackages]
  );

  function submit() {
    window.open(
      makeFormsUrl({ data: PackagesList.write(Object.values(addedPackages)) })
    );
  }

  const options = {
    threshold: 0.1,
    keys: ['id', 'name', 'overview', 'description', 'developer'],
  };

  const merged = Object.values(Object.assign({}, packages, addedPackages));
  const ps = searchString
    ? new Fuse(merged, options).search(searchString).map((p) => p.item)
    : merged;
  function createItem(p, badge) {
    function removeItem(id) {
      const newPackages = { ...addedPackages };
      delete newPackages[id];
      setAddedPackages(newPackages);
      localStorage.setItem('packages', JSON.stringify(newPackages));
    }

    return (
      <div
        className={
          'list-group-item list-group-item-action position-relative' +
          (p.id === packageItem?.id ? ' active' : '') +
          (ps.filter((pp) => pp.id === p.id).length > 0 ? '' : ' d-none')
        }
        key={p.id}
        onClick={() => setPackageItem(p)}
      >
        {badge === 'new' && <span className="badge bg-success me-2">New</span>}
        {badge === 'edit' && (
          <span className="badge bg-warning me-2">Edit</span>
        )}
        {p?.name ? p.name : p.id}
        {['new', 'edit'].includes(badge) && (
          <div
            className="position-absolute top-50 end-0 translate-middle-y fs-4 px-3"
            onClick={() => removeItem(p.id)}
          >
            ×
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-light">
      <div className="d-flex flex-column h-100">
        <nav className="navbar navbar-expand-lg navbar-light">
          <div className="container-fluid">
            <span className="navbar-brand">
              <img src="../icon/apm32.png" alt="" className="d-inline-block" />
              <span className="align-middle">apm-web</span>
            </span>
            <button
              className="navbar-toggler"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#navbarSupportedContent"
              aria-controls="navbarSupportedContent"
              aria-expanded="false"
              aria-label="Toggle navigation"
            >
              <span className="navbar-toggler-icon"></span>
            </button>
            <div
              className="collapse navbar-collapse"
              id="navbarSupportedContent"
            >
              <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                <li className="nav-item me-3">
                  <div className="nav-link" onClick={() => setPackageItem({})}>
                    <i className="bi bi-plus-square me-2"></i>
                    パッケージの追加
                  </div>
                </li>
                <li className="nav-item me-3">
                  <a
                    className="nav-link"
                    href="https://github.com/hal-shu-sato/apm-data/issues?q=is%3Aissue+%E3%83%91%E3%83%83%E3%82%B1%E3%83%BC%E3%82%B8"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <i className="bi bi-github me-2"></i>
                    みんなの送信パッケージを見る
                  </a>
                </li>
              </ul>
              <form className="d-flex">
                <button
                  className="btn btn-success"
                  onClick={submit}
                  type="button"
                >
                  <i className="bi bi-send me-2"></i>
                  プレビューと送信
                </button>
              </form>
            </div>
          </div>
        </nav>
        <div className="flex-grow-1 overflow-auto">
          <div className="row g-0 h-100 card border-0 rounded-0">
            <div className="row g-0 h-100 card-body p-0">
              <div className="col-sm-3 d-flex flex-column h-100">
                <div className="input-group p-2">
                  <input
                    className="form-control shadow-none"
                    type="text"
                    name="name"
                    value={searchString}
                    placeholder="🔍search"
                    onChange={(e) => setSearchString(e.target.value)}
                  />
                </div>
                <div className="overflow-auto h-100 list-group list-group-flush user-select-none">
                  {Object.values(addedPackages)
                    .filter(
                      (p) =>
                        !Object.prototype.hasOwnProperty.call(packages, p.id)
                    )
                    .map((p) => createItem(p, 'new'))}
                  {Object.values(addedPackages)
                    .filter((p) =>
                      Object.prototype.hasOwnProperty.call(packages, p.id)
                    )
                    .map((p) => createItem(p, 'edit'))}
                  {Object.values(packages)
                    .filter(
                      (p) =>
                        !Object.prototype.hasOwnProperty.call(
                          addedPackages,
                          p.id
                        )
                    )
                    .map((p) => createItem(p))}
                </div>
              </div>
              <div className="col-sm-9 overflow-auto h-100">
                {packageItem && (
                  <SurveyComponent
                    packageItem={packageItem}
                    onComplete={surveyComplete}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
