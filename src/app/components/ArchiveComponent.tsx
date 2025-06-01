import React, { useState, useCallback } from 'react';
import { type DropzoneOptions, useDropzone } from 'react-dropzone';
import JSZip from 'jszip';
import VirtualInstallation from './VirtualInstallation';
import Encoding from 'encoding-japanese';
import { Archive } from 'libarchive.js';
import type { CompressedFile } from 'libarchive.js/dist/build/compiled/compressed-file';

type FileData = { file: CompressedFile; path: string };

const splitUrl = window.location.href.split('/');
const workerBaseUrl =
  splitUrl[splitUrl.length - 1] === ''
    ? ''
    : splitUrl[splitUrl.length - 1] + '/';
Archive.init({
  workerUrl: workerBaseUrl + 'dist/worker-bundle.js',
});

async function getSriFromArrayBuffer(buffer: BufferSource) {
  const hash = await crypto.subtle.digest('SHA-384', buffer);
  return 'sha384-' + window.btoa(String.fromCharCode(...new Uint8Array(hash)));
}

type OnCompleteFunc = (
  filesJson: {
    filename: string;
    archivePath: string | undefined;
    isDirectory: boolean | undefined;
  }[],
  release: {
    integrity: {
      archive: string;
      file: {
        hash: string;
        target: string;
      }[];
    };
  },
) => void;
type OnCompleteFuncParams = Parameters<OnCompleteFunc>;

function ArchiveComponent(props: { onComplete: OnCompleteFunc }) {
  const [sri, setSri] = useState({});
  const [archiveSri, setArchiveSri] = useState<string>('');

  type OnDropFunc = Required<DropzoneOptions>['onDrop'];
  const onDrop = useCallback<OnDropFunc>(
    (acceptedFiles) => {
      async function onDropAsync(acceptedFiles: Parameters<OnDropFunc>[0]) {
        const extention = acceptedFiles[0].name.split('.').pop();

        async function arrayBufferFromFile(f: Blob) {
          return await new Promise<ArrayBuffer>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              try {
                resolve(reader.result as ArrayBuffer);
              } catch (e) {
                if (e instanceof Error) {
                  reject(e);
                }
                reject(new Error('unknown error'));
              }
            };
            reader.onerror = () => {
              reject(new Error('file read error'));
            };
            reader.readAsArrayBuffer(f);
          });
        }
        const archiveBuffer = await arrayBufferFromFile(acceptedFiles[0]);
        const fileSRI = await getSriFromArrayBuffer(archiveBuffer);
        setArchiveSri(fileSRI);

        if (extention && ['zip', '7z', 'lzh', 'rar'].includes(extention)) {
          // unzip
          try {
            // JSZip
            const zip = await JSZip.loadAsync(acceptedFiles[0], {
              decodeFileName: function (bytes) {
                return Encoding.convert(bytes as Uint8Array, {
                  to: 'UNICODE',
                  from: 'SJIS',
                  type: 'string',
                });
              },
            });
            const files = {};
            for (const file of Object.values(zip.files)) {
              if (file.dir) continue;
              const buffer = await zip.file(file.name)!.async('arraybuffer');
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
              for (const f of (await archive.getFilesArray()) as FileData[]) {
                files[f.path + f.file.name] = '';
              }
              try {
                for (const f of (await archive.getFilesArray()) as FileData[]) {
                  const buffer = await arrayBufferFromFile(
                    (await f.file.extract()) as Blob,
                  );
                  files[f.path + f.file.name] =
                    await getSriFromArrayBuffer(buffer);
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
      void onDropAsync(acceptedFiles);
    },
    [setSri],
  );

  const setData = useCallback(
    (
      filesJson: OnCompleteFuncParams[0],
      integrities: OnCompleteFuncParams[1]['integrity']['file'],
    ) => {
      props.onComplete(filesJson, {
        integrity: {
          archive: archiveSri,
          file: integrities,
        },
      });
    },
    [archiveSri, props],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <>
      <div {...getRootProps()}>
        <input {...getInputProps()} />
        {isDragActive ? (
          <p className="dropZone rounded p-4">ここにファイルをドロップ ...</p>
        ) : (
          <p className="dropZone rounded p-4">
            ここにプラグイン・スクリプトのzipファイル（またはファイル）をドラッグアンドドロップ
          </p>
        )}
      </div>
      <VirtualInstallation files={sri} onChange={setData}></VirtualInstallation>
    </>
  );
}

export default ArchiveComponent;
