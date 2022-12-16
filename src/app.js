import { spawn } from 'child_process';
import os from 'os';
import readline from 'readline';
import {
  add,
  cat,
  getInfo,
  getList,
  getPath,
  checkIfExist,
  checkIfNotExist,
} from './utils/index.js';
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

  async rn(args) {
    const fileName = args[0];
  }

  async cat(fileName) {
    const target = await this.getFile(fileName);
    await cat(target.path);
  }

  async add(fileName) {
    if (!fileName) throw new InputError();
    const filepath = this.getPath(fileName);
    await checkIfNotExist(filepath);
    await add(filepath);
  }

  async getDir() {
    const list = await getList(this.dir);
    return Promise.all(list.map((item) => getInfo(item, this.dir)));
  }

  async ls() {
    const list = await this.getDir();
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

  async getItem(itemName, type) {
    if (!itemName) throw new InputError();
    const itemPath = this.getPath(itemName);
    await checkIfExist(itemPath);
    const directoryContent = await this.getDir(this.dir);
    const target = directoryContent.find(({ name }) => name === itemName);
    if (target.type !== type) throw new InputError();
    return target;
  }

  async getDirectory(directoryName) {
    return await this.getItem(directoryName, 'directory');
  }

  getPath(filename) {
    return getPath(this.dir, filename);
  }

  async getFile(path) {
    return await this.getItem(path, 'file');
  }

  async cd(directoryName) {
    const target = await this.getDirectory(directoryName);
    this.dir = target.getPath(this.dir);
  }

  sayBye(withNewLine) {
    const prefix = withNewLine ? '\n' : '';
    const message = `${prefix}${messages.bye(this.username)}`;
    console.log(message);
  }

  getCureentFolder() {
    const child = spawn('ls', ['-la']);
    process.stdin.pipe(child.stdin);
    child.stdout.pipe(process.stdout);
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
