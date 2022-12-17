import os from 'os';
import readline from 'readline';
import { getPath, getAbsolutePath, getNewPath } from './utils/index.js';

import { add, cat, getItem, getList, checkIfExist, checkIfNotExist, rn, copy } from './services.js';
import { AppError, InputError, OperationError } from './error.js';

const messages = {
  currentPath: (path) => `You are currently in ${path}`,
  greeting: (username) => `Welcome to the File Manager, ${username}!`,
  bye: (username) => `Thank you for using File Manager, ${username}, goodbye!`,
};

export class App {
  constructor(username) {
    this.username = this.getUsername(username);
    this.dir = null;
    this.homeDirectory = null;
  }

  getUsername(username) {
    if (!username) return username;
    return username
      .split('')
      .map((symbol, i) => (i === 0 ? symbol.toUpperCase() : symbol))
      .join('');
  }

  exit(withNewLine = false) {
    this.sayBye(withNewLine);
    process.exit(0);
  }

  sayHi() {
    console.log(messages.greeting(this.username));
  }

  async rn(itempPath, newFilename = 'qwerty.com') {
    if (!itempPath || !newFilename) throw new InputError();
    const absolutePath = this.getAbsolutePath(itempPath);
    await checkIfExist(absolutePath);
    const item = await getItem(absolutePath);
    if (!item.isFile) throw new InputError();
    const newPath = getNewPath(absolutePath, newFilename);
    await checkIfNotExist(newPath);
    await rn(absolutePath, newPath);
  }

  async copy(itempPath = 'q', itemNewPath = 'qwe') {
    if (!itempPath || !itemNewPath) throw new InputError();
    const absolutePath = this.getAbsolutePath(itempPath);
    const absoluteNewPath = this.getAbsolutePath(itemNewPath);
    await checkIfExist(absolutePath);
    await checkIfNotExist(absoluteNewPath);
    await copy(absolutePath, absoluteNewPath);
  }

  async cat(path) {
    if (!path) throw new InputError();
    const absolutePath = this.getAbsolutePath(path);
    await checkIfExist(absolutePath);
    const item = await getItem(absolutePath);
    if (!item.isFile) throw new InputError();
    await cat(absolutePath);
  }

  async add(fileName) {
    if (!fileName) throw new InputError();
    const filepath = this.getAbsolutePath(fileName);
    await checkIfNotExist(filepath);
    await add(filepath);
  }

  async ls() {
    const list = await getList(this.dir);
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
    await checkIfExist(absolutePath);
    this.dir = absolutePath;
  }

  sayBye(withNewLine) {
    const prefix = withNewLine ? '\n' : '';
    const message = `${prefix}${messages.bye(this.username)}`;
    console.log(message);
  }

  init() {
    this.homeDirectory = os.homedir();
    // TODO: replace process.cwd() with os.homedir()
    this.dir = process.cwd();
  }

  printCurrentDir() {
    console.log(messages.currentPath(this.dir));
  }

  async start() {
    this.init();
    this.sayHi();
    this.printCurrentDir();

    const commandMapping = {
      '.exit': this.exit.bind(this),
      ls: this.ls.bind(this),
      cd: this.cd.bind(this),
      up: this.up.bind(this),
      cat: this.cat.bind(this),
      add: this.add.bind(this),
      rn: this.rn.bind(this),
      copy: this.copy.bind(this),
    };

    readline.createInterface(
      process.stdin.on('data', async (chunk) => {
        try {
          const [userInput] = chunk.toString().split('\n');
          const [command, ...args] = userInput.split(' ');
          const [arg1, arg2] = args.filter((item) => !!item);
          if (commandMapping[command]) return await commandMapping[command](arg1, arg2);
          throw new OperationError();
        } catch (error) {
          if (!(error instanceof AppError)) throw new Error(error);
          console.log(error.message);
        } finally {
          this.printCurrentDir();
        }
      })
    );

    process.on('SIGINT', () => this.exit(true));
  }
}
