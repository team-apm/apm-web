import React, { useState, useEffect, useCallback } from 'react';
import { Packages } from 'apm-schema';
import './App.css';
import SurveyComponent from './SurveyComponent';
import Fuse from 'fuse.js';
import { Modal } from 'bootstrap';

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
  const [packageItem, setPackageItem] = useState<
    Packages['packages'][number] | null
  >();
  const [packages, setPackages] = useState<{
    [name: string]: Packages['packages'][number];
  }>({});
  const [addedPackages, setAddedPackages] = useState<{
    [name: string]: Packages['packages'][number];
  }>({});
  const [searchString, setSearchString] = useState('');

  useEffect(() => {
    async function fetchJson() {
      const text = await (
        await fetch(
          'https://cdn.jsdelivr.net/gh/team-apm/apm-data@main/v3/packages.json'
        )
      ).text();
      setPackages(
        Object.assign(
          {},
          ...(JSON.parse(text) as Packages).packages.map((x) => ({ [x.id]: x }))
        )
      );
      setAddedPackages(
        JSON.parse(localStorage.getItem('v3-packages') ?? '{}') ?? {}
      );
    }
    fetchJson();
  }, []);

  const surveyComplete = useCallback(
    (json) => {
      const newPackages = { ...addedPackages };
      newPackages[json.id] = json;
      setAddedPackages(newPackages);
      setPackageItem(json);
      localStorage.setItem('v3-packages', JSON.stringify(newPackages));
    },
    [addedPackages]
  );

  function submit() {
    const formsUrl = makeFormsUrl({
      data: JSON.stringify(Object.values(addedPackages), null, '  '),
    });

    if (formsUrl.length < 8000) {
      window.open(formsUrl);
    } else {
      const myModalEl = document.querySelector('#sendModal')!;
      const modal = Modal.getOrCreateInstance(myModalEl);
      modal.show();
    }
  }

  const options = {
    threshold: 0.3,
    keys: ['id', 'name', 'overview', 'description', 'developer'],
  };

  const merged = Object.values(Object.assign({}, packages, addedPackages));
  const ps = searchString
    ? new Fuse(merged, options).search(searchString).map((p) => p.item)
    : merged;
  function createItem(p, badge?) {
    function removeItem(id) {
      const newPackages = { ...addedPackages };
      delete newPackages[id];
      setAddedPackages(newPackages);
      localStorage.setItem('v3-packages', JSON.stringify(newPackages));
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
      <div
        className="modal fade"
        id="sendModal"
        tabIndex={-1}
        aria-labelledby="sendModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="sendModalLabel">
                <i className="bi bi-send me-2"></i>プレビューと送信
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              <form>
                <div className="mb-3">
                  <label htmlFor="message-text" className="col-form-label">
                    以下の文字列を送信ページのデータ欄にコピーアンドペーストしてください。
                  </label>
                  <textarea
                    className="form-control"
                    id="message-text"
                    value={JSON.stringify(
                      Object.values(addedPackages),
                      null,
                      '  '
                    )}
                    rows={6}
                    readOnly
                  ></textarea>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                data-bs-dismiss="modal"
              >
                閉じる
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => window.open(makeFormsUrl({}))}
              >
                送信ページを開く
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="d-flex flex-column h-100">
        <nav className="navbar navbar-expand-lg navbar-light">
          <div className="container-fluid">
            <a
              className="navbar-brand"
              href="https://team-apm.github.io/apm/"
              target="_blank"
              rel="noreferrer"
            >
              <img src="../icon/apm32.png" alt="" className="d-inline-block" />
              <span className="align-middle">apm-web</span>
            </a>
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
                  <span
                    className="nav-link"
                    onClick={() => setPackageItem(null)}
                  >
                    <i className="bi bi-plus-square me-2"></i>
                    パッケージの追加
                  </span>
                </li>
                <li className="nav-item me-3">
                  <a
                    className="nav-link"
                    href="https://github.com/team-apm/apm-data/issues?q=is%3Aissue+label%3Aplugin%2Cscript"
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
                  disabled={Object.values(addedPackages).length === 0}
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
                    type="search"
                    name="name"
                    value={searchString}
                    placeholder="🔍検索"
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
