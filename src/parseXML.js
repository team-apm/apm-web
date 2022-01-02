import parser from "fast-xml-parser";
const J2xParser = parser.j2xParser;

const defaultKeys = [
  'id',
  'name',
  'overview',
  'description',
  'developer',
  'originalDeveloper',
  'dependencies',
  'pageURL',
  'downloadURL',
  'downloadMirrorURL',
  'directURL',
  'latestVersion',
  'detailURL',
  'files',
  'installer',
  'installArg',
  'releases',
];

/**
 * @param {object} parsedData - A object parsed from XML.
 * @returns {Array} An array of files.
 */
function parseFiles(parsedData) {
  const files = [];
  for (const file of parsedData.files[0].file) {
    const tmpFile = {
      filename: null,
      isOptional: false,
      isDirectory: false,
      archivePath: null,
    };
    if (typeof file === 'string') {
      tmpFile.filename = file;
    } else if (typeof file === 'object') {
      tmpFile.filename = file._[0];
      if (file.$optional) tmpFile.isOptional = Boolean(file.$optional[0]);
      if (file.$directory) tmpFile.isDirectory = Boolean(file.$directory[0]);
      if (file.$archivePath) tmpFile.archivePath = file.$archivePath[0];
    } else {
      continue;
    }
    Object.freeze(tmpFile);
    files.push(tmpFile);
  }
  return files;
}

/**
 * @param {object} parsedData - An object to parse into XML.
 * @returns {Array} An array of files.
 */
function parseFilesInverse(parsedData) {
  const files = [];
  for (const file of parsedData.files) {
    const ret = { '#text': file.filename };
    ret['@_tmp'] = ''; // to avoid parser bugs
    if (file.isOptional) ret['@_optional'] = true;
    if (file.isDirectory) ret['@_directory'] = true;
    if (file.archivePath) ret['@_archivePath'] = file.archivePath;
    files.push(ret);
  }
  return files;
}

/**
 *
 */
class PackageInfo {
  /**
   * Returns the package's information.
   *
   * @param {object} parsedPackage - An object parsed from XML.
   */
  constructor(parsedPackage) {
    for (const key of defaultKeys) {
      if (parsedPackage[key]) {
        if (key === 'files') {
          this.files = parseFiles(parsedPackage);
        } else if (key === 'latestVersion') {
          const tmpObj = parsedPackage[key][0];
          if (typeof tmpObj === 'string') {
            this[key] = tmpObj;
          } else if (typeof tmpObj === 'object') {
            this[key] = tmpObj._[0];
            if (tmpObj.$continuous)
              this.isContinuous = Boolean(tmpObj.$continuous[0]);
          }
        } else if (key === 'releases') {
          this.releases = {};
          for (const release of parsedPackage[key][0].release) {
            this.releases[release.$version[0]] = {
              integrities: release.integrities
                ? release.integrities[0].integrity.map((integrity) => {
                    return {
                      target: integrity.$target[0],
                      targetIntegrity: integrity._[0],
                    };
                  })
                : [],
            };
          }
        } else {
          this[key] = parsedPackage[key][0];
        }
      }
    }
    // Object.freeze(this);
  }

  /**
   *
   * @param {object} packageItem - An object to be parsed into xml
   * @returns {object} package item ready to parse.
   */
  static inverse(packageItem) {
    const newPackageItem = {};
    for (const key of defaultKeys) {
      if (packageItem[key]) {
        if (key === 'files') {
          newPackageItem.files = { file: parseFilesInverse(packageItem) };
        } else if (key === 'latestVersion') {
          const tmpItem = { '#text': packageItem[key] };
          if (packageItem.isContinuous) tmpItem['@_continuous'] = true;
          newPackageItem[key] = tmpItem;
        } else if (key === 'releases') {
          throw new Error('Writing sri is not implemented.');
        } else {
          newPackageItem[key] = packageItem[key];
        }
      }
    }
    return newPackageItem;
  }
}

const parseOptions = {
  attributeNamePrefix: '$',
  textNodeName: '_',
  ignoreAttributes: false,
  parseNodeValue: false,
  parseAttributeValue: false,
  trimValues: true,
  arrayMode: 'strict',
};

/**
 * An object which contains packages list.
 */
export class PackagesList extends Object {
  /**
   *
   * @param {string} rawXML - The path of the XML file.
   * @returns {PackagesList} A list of packages.
   */
  constructor(rawXML) {
    super();
    const valid = parser.validate(rawXML);
    if (valid === true) {
      const packagesInfo = parser.parse(rawXML, parseOptions);
      if (packagesInfo.packages) {
        for (const packageItem of packagesInfo.packages[0].package) {
          this[packageItem.id[0]] = new PackageInfo(packageItem);
        }
      } else {
        throw new Error('The list is invalid.');
      }
    } else {
      throw valid;
    }
  }

  /**
   *
   * @param {object} packages - A path of xml file.
   * 
   * @returns {string} The raw string of the XML.
   */
  static write(packages) {
    const xmlObject = [];
    for (const packageItem of packages) {
      xmlObject.push(PackageInfo.inverse(packageItem));
    }
    const parser = new J2xParser({ ignoreAttributes: false, format: true });
    const innerText = parser
      .parse({ packages: { package: xmlObject } })
      .trim()
      .replaceAll(' tmp=""', '') // to avoid parser bugs
      .replaceAll(/^(\s+)/gm, (str) => '\t'.repeat(Math.floor(str.length / 2)));
    return innerText;
  }
}
