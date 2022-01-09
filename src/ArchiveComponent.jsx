import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import JSZip from 'jszip';

function ArchiveComponent() {
  const [sri, setSri] = useState({});

  const onDrop = useCallback(acceptedFiles => {
    async function onDropAsync(acceptedFiles) {
      const zip = await JSZip.loadAsync(acceptedFiles[0]);
      const files = {};
      for (const file of Object.values(zip.files)) {
        const buffer = await zip.file(file.name).async("arraybuffer");
        const hash = await crypto.subtle.digest('SHA-384', buffer);
        const sri = 'sha384-' + window.btoa(String.fromCharCode(...new Uint8Array(hash)));
        files[file.name] = sri;
      }
      setSri(files);
    }
    onDropAsync(acceptedFiles);
  }, [setSri])
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
      {Object.entries(sri).map(([k, v]) => <div key={k}>{`${k}: ${v}`}</div>)}
    </>
  )
}

export default ArchiveComponent;
