import os from 'os';
import { fs } from './fs.js';
import { InputError } from './error.js';
import { getPath, getAbsolutePath, getNewPath, getArgs } from './utils.js';

const messages = {
  currentPath: (path) => `You are currently in ${path}`,
  greeting: (username) => `Welcome to the File Manager, ${username}!`,
  bye: (username) => `Thank you for using File Manager, ${username}, goodbye!`,
};

export class FileManager {
  constructor(username) {
    this.username = username;
    this.dir = null;
    this.homeDirectory = null;
  }

  init() {
    this.homeDirectory = os.homedir();
    // TODO: replace process.cwd() with os.homedir()
    this.dir = process.cwd();
  }

  exit(withNewLine = false) {
    this.sayBye(withNewLine);
    process.exit(0);
  }

  sayHi() {
    console.log(messages.greeting(this.username));
  }

  sayBye(withNewLine) {
    const prefix = withNewLine ? '\n' : '';
    const message = `${prefix}${messages.bye(this.username)}`;
    console.log(message);
  }

  async rn(itempPath, newFilename = 'qwerty.com') {
    if (!itempPath || !newFilename) throw new InputError();
    const absolutePath = this.getAbsolutePath(itempPath);
    await fs.checkIfExist(absolutePath);
    const item = await fs.getItem(absolutePath);
    if (!item.isFile) throw new InputError();
    const newPath = getNewPath(absolutePath, newFilename);
    await fs.checkIfNotExist(newPath);
    await fs.rn(absolutePath, newPath);
  }

  async cp(itempPath, itemNewPath) {
    if (!itempPath || !itemNewPath) throw new InputError();
    const absolutePath = this.getAbsolutePath(itempPath);
    const absoluteNewPath = this.getAbsolutePath(itemNewPath);
    await fs.checkIfExist(absolutePath);
    await fs.checkIfNotExist(absoluteNewPath);
    await fs.cp(absolutePath, absoluteNewPath);
  }

  async rm(itempPath = 'qwe') {
    if (!itempPath) throw new InputError();
    const absolutePath = this.getAbsolutePath(itempPath);
    await fs.checkIfExist(absolutePath);
    await fs.rm(absolutePath);
  }

  async mv(itempPath, itemNewPath) {
    if (!itempPath || !itemNewPath) throw new InputError();
    const absolutePath = this.getAbsolutePath(itempPath);
    const absoluteNewPath = this.getAbsolutePath(itemNewPath);
    await fs.checkIfExist(absolutePath);
    await fs.checkIfNotExist(absoluteNewPath);
    await fs.mv(absolutePath, absoluteNewPath);
  }

  async cat(path) {
    if (!path) throw new InputError();
    const absolutePath = this.getAbsolutePath(path);
    await fs.checkIfExist(absolutePath);
    const item = await fs.getItem(absolutePath);
    if (!item.isFile) throw new InputError();
    await fs.cat(absolutePath);
  }

  async hash(path) {
    if (!path) throw new InputError();
    const absolutePath = this.getAbsolutePath(path);
    await fs.checkIfExist(absolutePath);
    const item = await fs.getItem(absolutePath);
    if (!item.isFile) throw new InputError();
    await fs.hash(absolutePath);
  }

  async add(fileName) {
    if (!fileName) throw new InputError();
    const filepath = this.getAbsolutePath(fileName);
    await fs.checkIfNotExist(filepath);
    await fs.add(filepath);
  }

  async ls() {
    const list = await fs.getList(this.dir);
    const groupedList = list.reduce(
      (acc, item) => {
        acc[item.type].push(item);
        return acc;
      },
      { directory: [], file: [] }
    );
    const sortedList = Object.entries(groupedList)
      .reduce((acc, [type, items]) => {
        const sortedGroup = items.sort((a, b) => (a.name > b.name ? 1 : -1));
        return [...acc, { type, items: sortedGroup }];
      }, [])
      .sort((a, b) => (a.type > b.type ? 1 : -1))
      .reduce((acc, item) => [...acc, ...item.items], []);

    const simpleList = sortedList.map(({ name, type }) => ({ name, type }));
    console.table(simpleList);
  }

  up() {
    this.dir = getPath(this.dir, '../');
  }

  getAbsolutePath(path) {
    return getAbsolutePath(path, this.dir);
  }

  async cd(path) {
    if (!path) throw new InputError();
    const absolutePath = this.getAbsolutePath(path);
    await fs.checkIfExist(absolutePath);
    const item = await fs.getItem(absolutePath);
    if (!item.isDirectory) throw new InputError();
    this.dir = absolutePath;
  }

  printCurrentDir() {
    console.log(messages.currentPath(this.dir));
  }

  async start() {
    this.init();
    this.sayHi();
    this.printCurrentDir();
  }

  async os(param) {
    const osParamsMapping = {
      '--EOL': () => JSON.stringify(os.EOL, null, 2),
      '--cpus': os.cpus,
      '--homedir': os.homedir,
      '--username': () => this.username,
      '--architecture': os.arch,
    };
    if (osParamsMapping[param]) return await console.log(osParamsMapping[param]());
    throw new InputError();
  }

  async arch(direction, itempPath, itemNewPath) {
    const mapping = {
      compress: fs.compress,
      decompress: fs.decompress,
    }
    if (!itempPath || !itemNewPath) throw new InputError();
    const absolutePath = this.getAbsolutePath(itempPath);
    const absoluteNewPath = this.getAbsolutePath(itemNewPath);
    await fs.checkIfExist(absolutePath);
    await fs.checkIfNotExist(absoluteNewPath);
    await mapping[direction](absolutePath, absoluteNewPath);

  }

  async command(command, arg1, arg2) {
    const commandMapping = {
      '.exit': this.exit.bind(this),
      ls: this.ls.bind(this),
      cd: this.cd.bind(this),
      up: this.up.bind(this),
      cat: this.cat.bind(this),
      add: this.add.bind(this),
      rn: this.rn.bind(this),
      cp: this.cp.bind(this),
      mv: this.mv.bind(this),
      rm: this.rm.bind(this),
      os: this.os.bind(this),
      hash: this.hash.bind(this),
      compress: this.arch.bind(this, 'compress'),
      decompress: this.arch.bind(this, 'decompress')
    };

    if (commandMapping[command]) return await commandMapping[command](arg1, arg2);
    throw new InputError();
  }
}
