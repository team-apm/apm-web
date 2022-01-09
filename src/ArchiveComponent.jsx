import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import JSZip from 'jszip';
import VirtualInstallation from './VirtualInstallation';

async function getSriFromArrayBuffer(buffer) {
  const hash = await crypto.subtle.digest('SHA-384', buffer);
  return 'sha384-' + window.btoa(String.fromCharCode(...new Uint8Array(hash)));
}

function ArchiveComponent(props) {
  const [sri, setSri] = useState({});
  const [archiveSri, setArchiveSri] = useState({});

  const onDrop = useCallback(acceptedFiles => {
    async function onDropAsync(acceptedFiles) {
      // unzip
      const zip = await JSZip.loadAsync(acceptedFiles[0]);
      const files = {};
      for (const file of Object.values(zip.files)) {
        const buffer = await zip.file(file.name).async("arraybuffer");
        files[file.name] = await getSriFromArrayBuffer(buffer);
      }
      setSri(files);

      // archive
      const archiveBuffer = await new Promise((resolve, reject) => {
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
        reader.readAsArrayBuffer(acceptedFiles[0]);
      });
      setArchiveSri(await getSriFromArrayBuffer(archiveBuffer));
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
            <p>ここにファイルをドロップ ...</p> :
            <p>ここにプラグイン・スクリプトのzipファイルをドラッグアンドドロップ</p>
        }
      </div>
      <VirtualInstallation files={sri} onChange={setData}></VirtualInstallation>
    </>
  )
}

export default ArchiveComponent;
