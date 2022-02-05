import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import JSZip from 'jszip';
import VirtualInstallation from './VirtualInstallation';
import Encoding from 'encoding-japanese';
import { Archive } from 'libarchive.js/main.js';

const splitUrl = window.location.href.split('/');
const workerBaseUrl = (splitUrl[splitUrl.length - 1] === '') ? '' : splitUrl[splitUrl.length - 1] + '/';
Archive.init({
  workerUrl: workerBaseUrl + 'dist/worker-bundle.js'
});

async function getSriFromArrayBuffer(buffer) {
  const hash = await crypto.subtle.digest('SHA-384', buffer);
  return 'sha384-' + window.btoa(String.fromCharCode(...new Uint8Array(hash)));
}

function ArchiveComponent(props) {
  const [sri, setSri] = useState({});
  const [archiveSri, setArchiveSri] = useState({});

  const onDrop = useCallback(acceptedFiles => {
    async function onDropAsync(acceptedFiles) {
      const extention = acceptedFiles[0].name.split('.').pop();

      async function arrayBufferFromFile(f) {
        return await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = async () => {
            try {
              resolve(reader.result);
            } catch (e) {
              reject(e);
            }
          };
          reader.onerror = (e) => {
            reject(e);
          };
          reader.readAsArrayBuffer(f);
        });
      }
      const archiveBuffer = await arrayBufferFromFile(acceptedFiles[0]);
      const fileSRI = await getSriFromArrayBuffer(archiveBuffer);
      setArchiveSri(fileSRI);

      if (['zip', '7z', 'lzh', 'rar'].includes(extention)) {
        // unzip
        try {
          // JSZip
          const zip = await JSZip.loadAsync(acceptedFiles[0], {
            decodeFileName: function (bytes) {
              return Encoding.convert(bytes, {
                to: 'UNICODE',
                from: 'SJIS',
                type: 'string'
              });
            }
          });
          const files = {};
          for (const file of Object.values(zip.files)) {
            if (file.dir) continue;
            const buffer = await zip.file(file.name).async("arraybuffer");
            files[file.name] = await getSriFromArrayBuffer(buffer);
          }
          setSri(files);
        } catch {
          // Libarchivejs
          console.log('Fallback to libarchive');
          try {
            const archive = await Archive.open(acceptedFiles[0]);
            const files = {};

            // L-SMASH_Works_r940_plugins can't be extracted, but the file list can be read.
            // Therefore, loading is done in two steps.
            for (const file of await archive.getFilesArray()) {
              files[file.file._path] = '';
            }
            try {
              for (const file of await archive.getFilesArray()) {
                const buffer = await arrayBufferFromFile(await file.file.extract());
                files[file.file._path] = await getSriFromArrayBuffer(buffer);
              }
            } catch (e) {
              console.log('SRI calculations are not performed.');
              console.log(e);
            }
            setSri(files);
          } catch (e) {
            console.log(e);
          }
        }

      } else {
        const files = {};
        files[acceptedFiles[0].name] = fileSRI;
        setSri(files);
      }
    }
    onDropAsync(acceptedFiles);
  }, [setSri])

  const setData = useCallback((filesJson, integrities) => {
    props.onComplete(filesJson,
      { archiveIntegrity: archiveSri, integrities: integrities });
  }, [archiveSri, props]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop })

  return (
    <>
      <div {...getRootProps()}>
        <input {...getInputProps()} />
        {
          isDragActive ?
            <p className="dropZone rounded p-4">ここにファイルをドロップ ...</p> :
            <p className="dropZone rounded p-4">ここにプラグイン・スクリプトのzipファイル（またはファイル）をドラッグアンドドロップ</p>
        }
      </div>
      <VirtualInstallation files={sri} onChange={setData}></VirtualInstallation>
    </>
  )
}

export default ArchiveComponent;
