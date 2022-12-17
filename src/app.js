import os from 'os';
import readline from 'readline';
import { services } from './services.js';
import { AppError, InputError, OperationError } from './error.js';
import { getPath, getAbsolutePath, getNewPath } from './utils/index.js';

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
    await services.checkIfExist(absolutePath);
    const item = await services.getItem(absolutePath);
    if (!item.isFile) throw new InputError();
    const newPath = getNewPath(absolutePath, newFilename);
    await services.checkIfNotExist(newPath);
    await services.rn(absolutePath, newPath);
  }

  async cp(itempPath, itemNewPath) {
    if (!itempPath || !itemNewPath) throw new InputError();
    const absolutePath = this.getAbsolutePath(itempPath);
    const absoluteNewPath = this.getAbsolutePath(itemNewPath);
    await services.checkIfExist(absolutePath);
    await services.checkIfNotExist(absoluteNewPath);
    await services.cp(absolutePath, absoluteNewPath);
  }

  async rm(itempPath = 'qwe') {
    if (!itempPath ) throw new InputError();
    const absolutePath = this.getAbsolutePath(itempPath);
    await services.checkIfExist(absolutePath);
    await services.rm(absolutePath);
  }

  async mv(itempPath = 'q', itemNewPath = 'qwe1111') {
    if (!itempPath || !itemNewPath) throw new InputError();
    const absolutePath = this.getAbsolutePath(itempPath);
    const absoluteNewPath = this.getAbsolutePath(itemNewPath);
    await services.checkIfExist(absolutePath);
    await services.checkIfNotExist(absoluteNewPath);
    await services.mv(absolutePath, absoluteNewPath);
  }

  async cat(path) {
    if (!path) throw new InputError();
    const absolutePath = this.getAbsolutePath(path);
    await services.checkIfExist(absolutePath);
    const item = await services.getItem(absolutePath);
    if (!item.isFile) throw new InputError();
    await services.cat(absolutePath);
  }

  async add(fileName) {
    if (!fileName) throw new InputError();
    const filepath = this.getAbsolutePath(fileName);
    await services.checkIfNotExist(filepath);
    await services.add(filepath);
  }

  async ls() {
    const list = await services.getList(this.dir);
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
    await services.checkIfExist(absolutePath);
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
      cp: this.cp.bind(this),
      mv: this.mv.bind(this),
      rm: this.rm.bind(this),
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
