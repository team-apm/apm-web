import React, { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import JSZip from 'jszip';

function ArchiveComponent() {
  const onDrop = useCallback(acceptedFiles => {
    async function onDropAsync(acceptedFiles) {
      // Do something with the files
      console.log(acceptedFiles);
      const zip = await JSZip.loadAsync(acceptedFiles[0]);
      console.log(zip);
      const buffer = await zip.file(Object.values(zip.files)[0].name).async("arraybuffer");
      console.log(buffer);
    }
    onDropAsync(acceptedFiles);
  }, [])
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop })

  return (
    <div {...getRootProps()}>
      <input {...getInputProps()} />
      {
        isDragActive ?
          <p>Drop the files here ...</p> :
          <p>Drag 'n' drop some files here, or click to select files</p>
      }
    </div>
  )
}

export default ArchiveComponent;
