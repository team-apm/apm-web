import React, { useRef, useEffect, useState, memo } from 'react';
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

const defaultFolders = ['plugins', 'script'];

const VirtualInstallation = memo(
  (props: {
    files: { [fileName: string]: string };
    onChange: (
      filesJson: {
        filename: string;
        archivePath: string | undefined;
        isDirectory: boolean | undefined;
      }[],
      integrities: { hash: string | null; target: string }[]
    ) => void;
  }) => {
    const listDownload = useRef<HTMLDivElement>(null);
    const listAviutl = useRef<HTMLDivElement>(null);

    const [rootSortable, setRootSortable] = useState<Sortable>();
    const [sortables, setSortables] = useState<
      {
        id: string;
        sortable: Sortable;
      }[]
    >([]);

    const [inputFolderName, setInputFolderName] = useState('');

    useEffect(() => {
      // clearList
      if (listDownload.current) listDownload.current.innerHTML = '';
      if (listAviutl.current) listAviutl.current.innerHTML = '';

      setSortables(
        defaultFolders.map((f) => {
          const entry = document.createElement('div');
          entry.dataset.id = f;
          entry.classList.add('list-group-item');
          entry.classList.add('list-group-item-dark');
          entry.classList.add('ignore-elements');

          const descText = document.createElement('p');
          descText.innerText = f;
          entry.appendChild(descText);

          const nestedEntry = document.createElement('div');
          nestedEntry.classList.add('list-group');
          nestedEntry.classList.add('mt-3');
          nestedEntry.classList.add('nested-sortable');
          entry.appendChild(nestedEntry);

          listAviutl.current?.appendChild(entry);

          return {
            id: f,
            sortable: new Sortable(nestedEntry, {
              group: 'nested',
              animation: 150,
              filter: '.ignore-elements',
              fallbackOnBody: true,
              invertSwap: true,
              invertedSwapThreshold: 0.6,
              emptyInsertThreshold: 16,
            }),
          };
        })
      );

      const filesWirhSri = Object.entries(props.files).map(([k, v]) => {
        return { name: k, sri: v as string | null, folder: false };
      });
      const folders = [
        ...new Set(filesWirhSri.map((f) => path.dirname(f.name))),
      ]
        .filter((n) => n !== '.')
        .map((n) => {
          return { name: n, sri: null, folder: true };
        });
      const dirEntries = filesWirhSri.concat(folders);

      dirEntries.forEach((f) => {
        const entry = document.createElement('div');
        entry.innerText = f.name;
        entry.dataset.id = f.name;
        entry.classList.add('list-group-item');
        if (f.folder) {
          if (['plugins', 'script'].includes(path.basename(f.name))) {
            entry.classList.add('list-group-item-dark');
            entry.classList.add('ignore-elements');
          } else {
            entry.classList.add('list-group-item-warning');
          }
        }
        listDownload.current?.appendChild(entry);
      });
    }, [props.files]);

    useEffect(() => {
      const filesWirhSri = Object.entries(props.files).map(([k, v]) => {
        return { name: k, sri: v as string | null, folder: false };
      });
      const folders = [
        ...new Set(filesWirhSri.map((f) => path.dirname(f.name))),
      ]
        .filter((n) => n !== '.')
        .map((n) => {
          return { name: n, sri: null, folder: true };
        });
      const dirEntries = filesWirhSri.concat(folders);
      type DirEntry = (typeof dirEntries)[number];

      const getEntries = (
        sortable: Sortable | undefined,
        currentDir: string
      ): { id: string; archivePath: string; targetPath: string }[] =>
        !sortable
          ? []
          : sortable.toArray().flatMap((i) => {
              const fullPath = path.join(currentDir, path.basename(i));
              const childSortable = sortables.find(
                (s) => s.id === path.basename(i)
              );
              if (childSortable) {
                return getEntries(childSortable.sortable, fullPath);
              } else {
                return [
                  {
                    id: i,
                    archivePath: path.dirname(i),
                    targetPath: fullPath,
                  },
                ];
              }
            });

      const makeXML = () => {
        const files = getEntries(rootSortable, '');
        const filesJson = files.map((i) => {
          return {
            filename: i.targetPath,
            archivePath: i.archivePath === '.' ? undefined : i.archivePath,
            isDirectory: (dirEntries.find((e) => e.name === i.id) as DirEntry)
              .folder
              ? true
              : undefined,
          };
        });
        const integrities = files.flatMap((i) => {
          const fileEntry = dirEntries.find((e) => e.name === i.id) as DirEntry;
          if (fileEntry?.folder) return [];
          return [
            {
              hash: fileEntry.sri,
              target: i.targetPath,
            },
          ];
        });
        props.onChange(filesJson, integrities);
      };
      if (rootSortable) rootSortable.options.onSort = makeXML;
      sortables.forEach((s) => (s.sortable.options.onSort = makeXML));
    }, [props, rootSortable, sortables]);

    useEffect(() => {
      if (listDownload.current === null || listAviutl.current === null) {
        console.log(`${listDownload} or ${listAviutl} not found.`);
        return;
      }

      const usedPath = new Set();

      const updateMovableEntry = () => {
        if (listDownload.current === null) return;
        for (const node of listDownload.current.children) {
          node.classList.remove('list-group-item-dark');
          node.classList.remove('ignore-elements');

          const nodePath = (node as HTMLDivElement).dataset.id as string;
          if (
            defaultFolders.includes(path.basename(nodePath)) ||
            Array.from(usedPath).find((used) => pathRelated(nodePath, used))
          ) {
            node.classList.add('list-group-item-dark');
            node.classList.add('ignore-elements');
          }
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

      setRootSortable(
        new Sortable(listAviutl.current, {
          group: 'nested',
          animation: 150,
          filter: '.ignore-elements',
          fallbackOnBody: true,
          invertSwap: true,
          invertedSwapThreshold: 0.6,
          emptyInsertThreshold: 16,
        })
      );
    }, [setRootSortable]);

    const addFolder = (name) => {
      name = name.trim();
      if (!name) return;
      if (sortables.find((s) => s.id === name)) return;

      setSortables(
        sortables.concat(
          [name].map((f) => {
            const entry = document.createElement('div');
            entry.innerText = f;
            entry.dataset.id = f;
            entry.classList.add('list-group-item');

            const nestedEntry = document.createElement('div');
            nestedEntry.classList.add('list-group');
            nestedEntry.classList.add('mt-3');
            nestedEntry.classList.add('nested-sortable');
            entry.appendChild(nestedEntry);

            listAviutl.current?.appendChild(entry);

            return {
              id: f,
              sortable: new Sortable(nestedEntry, {
                group: 'nested',
                animation: 150,
                filter: '.ignore-elements',
                fallbackOnBody: true,
                invertSwap: true,
                invertedSwapThreshold: 0.6,
                emptyInsertThreshold: 16,
              }),
            };
          })
        )
      );
    };

    return (
      <div className="row my-2">
        <div className="col">
          <div className="card">
            <div className="card-body">
              Zipファイル
              <div ref={listDownload} className="list-group mt-3"></div>
            </div>
          </div>
        </div>
        <div className="col">
          <div className="card">
            <div className="card-body">
              Aviutl
              <div
                ref={listAviutl}
                className="list-group mt-3 nested-sortable"
              ></div>
              <div className="input-group mt-3">
                <input
                  type="text"
                  className="form-control"
                  value={inputFolderName}
                  onChange={(e) => setInputFolderName(e.target.value)}
                  placeholder="フォルダ名"
                ></input>
                <button
                  className="btn btn-outline-secondary"
                  type="button"
                  onClick={() => addFolder(inputFolderName)}
                >
                  <i className="bi bi-folder-plus me-2"></i>追加
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

export default VirtualInstallation;
