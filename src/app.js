import { spawn } from 'child_process';
import os from 'os';
import readline from 'readline';
import { cat, getInfo, getList, getPath, isExist } from './utils/index.js';
import { AppError, InputError, OperationError } from './error.js';

const messages = {
  currentPath: (path) => `You are currently in ${path}`,
  greeting: (username) => `Welcome to the File Manager, ${username}!`,
  bye: (username) => `Thank you for using File Manager, ${username}, goodbye!`,
};

export class App {
  constructor(username) {
    this.username = this.getUsername(username);
    this.currentDirectory = null;
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

  runCommand(command, arggs) {
    const child = spawn(command, arggs);
    process.stdin.pipe(child.stdin);
    child.stdout.pipe(process.stdout);
  }

  async cat(args) {
    const fileName = args[0];
    const target = await this.getFile(fileName);
    await cat(target.path);
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

  set dir(path) {
    this.currentDirectory = path;
    this.printCurrentDir();
  }

  get dir() {
    return this.currentDirectory;
  }

  async getItem(path, type) {
    if (!path) throw new InputError();
    await isExist(path, this.dir);
    const directoryContent = await this.getDir(this.dir);
    const target = directoryContent.find(({ name }) => path === name);
    if (target.type === type) throw new InputError();
    return target;
  }

  async getDirectory(path) {
    return this.getItem(path, 'file');
  }

  async getFile(path) {
    return this.getItem(path, 'directory');
  }

  async cd(args) {
    const directoryName = args[0];
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
      default: this.defaultPromt,
      up: this.up.bind(this),
      ls: this.ls.bind(this),
      cd: this.cd.bind(this),
      cat: this.cat.bind(this),
    };

    readline.createInterface(
      process.stdin.on('data', async (chunk) => {
        try {
          const [userInput] = chunk.toString().split('\n');
          const [command, ...args] = userInput.split(' ');
          const filteredArgs = args.filter((item) => !!item);
          if (commandMapping[command]) return await commandMapping[command](filteredArgs);
          throw new OperationError();
        } catch (error) {
          if (!(error instanceof AppError)) throw new Error(error);
          console.log(error.message);
        }
      })
    );

    process.on('SIGINT', () => this.exit(true));
  }
}
