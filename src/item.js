import { getPath } from './utils/index.js';

export class Item {
  constructor(name, path, isFile, isDirectory) {
    this.name = name;
    this.path = path;
    this.isFile = isFile;
    this.isDirectory = isDirectory;
    this.type = isFile ? 'file' : 'directory';
  }

  isDirectory() {
    return !!this.isDirectory;
  }

  isFile() {
    return !!this.isFile;
  }

  getPath(directoryPath) {
    return getPath(directoryPath, this.name);
  }
}
