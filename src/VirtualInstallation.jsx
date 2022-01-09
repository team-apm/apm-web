import React, { useRef, useEffect, useState, memo } from 'react'
import path from 'path-browserify';
import Sortable from 'sortablejs';

// const imageExtention = [
//   '.png',
//   '.jpg',
//   '.gif',
//   '.tiff',
//   '.tif',
//   '.webp',
//   '.svg',
// ];

// This is a work-around.
// `path.resolve` executes a function that cannot be executed by the browser.
// https://github.com/browserify/path-browserify/blob/v1.0.1/index.js#L124
path.resolve = (a) => '/' + a;

const pathRelated = (pathA, pathB) => {
  const isParent = (parent, child) => {
    const relative = path.relative(parent, child);
    return relative && relative !== '' && !relative.startsWith('..');
  };
  return isParent(pathA, pathB) || isParent(pathB, pathA);
};

const VirtualInstallation = memo((props) => {
  const listDownload = useRef(null);
  const listAviutl = useRef(null);
  const listPlugins = useRef(null);
  const listScript = useRef(null);

  const [sortables, setSortables] = useState({});

  const clearList = () => {
    if (listDownload.current)
      listDownload.current.innerHTML = null;
    if (listAviutl.current)
      [...listAviutl.current.children]
        .filter((e) => e.dataset.id !== 'exclude')
        .forEach((e) => e.parentNode.removeChild(e));
    if (listPlugins.current)
      listPlugins.current.innerHTML = null;
    if (listScript.current)
      listScript.current.innerHTML = null;
  };

  clearList();
  const filesWirhSri = Object.entries(props.files).map(([k, v]) => { return { name: k, sri: v, folder: false } });
  const folders = [...new Set(filesWirhSri.map(f => path.dirname(f.name)))].map(n => { return { name: n, folder: true } });
  const dirEntries = [].concat(filesWirhSri, folders);

  // folder
  folders
    .forEach((f) => {
      const entry = document.createElement('div');
      entry.innerText = f.name;
      entry.dataset.id = f.name;
      entry.classList.add('list-group-item');
      if (['plugins', 'script'].includes(path.basename(f.name))) {
        entry.classList.add('list-group-item-dark');
        entry.classList.add('ignore-elements');
      } else {
        entry.classList.add('list-group-item-warning');
      }

      listDownload.current.appendChild(entry);
    });

  // file
  filesWirhSri
    .forEach((f) => {
      const entry = document.createElement('div');
      entry.innerText = f.name;
      entry.dataset.id = f.name;
      entry.classList.add('list-group-item');

      listDownload.current.appendChild(entry);
    });

  // output
  const makeXML = () => {
    const files = []
      .concat(
        sortables.sortAviutl
          .toArray()
          .filter((i) => i !== 'exclude')
          .map((i) => {
            return {
              id: i,
              archivePath: path.dirname(i),
              targetPath: path.basename(i)
            }
          }),
        sortables.sortPlugins
          .toArray()
          .map((i) => {
            return {
              id: i,
              archivePath: path.dirname(i),
              targetPath: path.join('plugins', path.basename(i))
            }
          }),
        sortables.sortScript
          .toArray()
          .map((i) => {
            return {
              id: i,
              archivePath: path.dirname(i),
              targetPath: path.join('script', path.basename(i))
            }
          })
      );
    const filesJson = files
      .map((i) => {
        const ret = { 'filename': i.targetPath };
        ret['archivePath'] = (i.archivePath === '.') ? null : i.archivePath;
        ret['isDirectory'] = dirEntries.find(e => e.name === i.id).folder === true;
        ret['isOptional'] = false;
        return ret;
      });
    const integrities = files
      .flatMap((i) => {
        const fileEntry = dirEntries.find(e => e.name === i.id);
        if (fileEntry.folder) return [];
        return [{
          'targetIntegrity': fileEntry.sri,
          'target': i.targetPath
        }];
      });
    props.onChange(filesJson, integrities);
  };
  if (sortables?.sortAviutl)
    sortables.sortAviutl.options.onSort = makeXML;
  if (sortables?.sortPlugins)
    sortables.sortPlugins.options.onSort = makeXML;
  if (sortables?.sortScript)
    sortables.sortScript.options.onSort = makeXML;

  useEffect(() => {
    const usedPath = new Set();

    const updateMovableEntry = () => {
      for (const node of listDownload.current.children) {
        const nodePath = node.dataset.id;
        if (!['plugins', 'script'].includes(path.basename(nodePath))) {
          node.classList.remove('list-group-item-dark');
          node.classList.remove('ignore-elements');
        }
      }

      for (const node of listDownload.current.children) {
        const nodePath = node.dataset.id;
        usedPath.forEach((used) => {
          if (pathRelated(nodePath, used)) {
            node.classList.add('list-group-item-dark');
            node.classList.add('ignore-elements');
          }
        });
      }
    };

    new Sortable(listDownload.current, {
      group: 'nested',
      animation: 150,
      filter: '.ignore-elements',
      fallbackOnBody: true,
      sort: false,
      onRemove: (event) => {
        const itemPath = event.item.dataset.id;
        usedPath.add(itemPath);
        updateMovableEntry();
      },
      onAdd: (event) => {
        const itemPath = event.item.dataset.id;
        usedPath.delete(itemPath);
        updateMovableEntry();
      },
    });

    const [sortAviutl, sortPlugins, sortScript] = [
      listAviutl.current,
      listPlugins.current,
      listScript.current,
    ].map(
      (i) =>
        new Sortable(i, {
          group: 'nested',
          animation: 150,
          filter: '.ignore-elements',
          fallbackOnBody: true,
          invertSwap: true,
          invertedSwapThreshold: 0.6,
          emptyInsertThreshold: 8,
        })
    );

    setSortables({
      usedPath: usedPath,
      sortAviutl: sortAviutl,
      sortPlugins: sortPlugins,
      sortScript: sortScript
    });
  }, [setSortables]);

  return (
    <div className="d-flex my-2">
      <div className="col card">
        <div className="card-body">
          Download
          <div ref={listDownload} className="list-group"></div>
        </div>
      </div>
      <div className="col card">
        <div className="card-body">
          Aviutl
          <div ref={listAviutl} className="list-group nested-sortable">
            <div
              className="list-group-item list-group-item-dark ignore-elements"
              data-id="exclude"
            >
              plugins
              <div ref={listPlugins} className="list-group nested-sortable"></div>
            </div>
            <div
              className="list-group-item list-group-item-dark ignore-elements"
              data-id="exclude"
            >
              script
              <div ref={listScript} className="list-group nested-sortable"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default VirtualInstallation;
