import { spawn } from 'child_process';
import os from 'os';
import readline from 'readline';
import { getInfo, getList, isExist } from './utils/index.js';
import { AppError, InputError } from './error.js';

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

  defaultPromt() {
    console.log('I did not get you');
  }

  runCommand(command, arggs) {
    const child = spawn(command, arggs);
    process.stdin.pipe(child.stdin);
    child.stdout.pipe(process.stdout);
  }

  async getDir() {
    const list = (await getList(this.dir));
    return Promise.all(list.map((item) => getInfo(item, this.dir)));
  }

  async ls() {
    const list = await this.getDir();
    const simpleList = list.map(({ name, type }) => ({ name, type }));
    console.table(simpleList);
  }

  up() {
    console.log('up');
  }

  set dir(path) {
    this.currentDirectory = path;
    this.printCurrentDir();
  }

  get dir() {
    return this.currentDirectory;
  }

  async cd(args) {
    try {
      const directoryName = args[0];
      if (!directoryName) throw new InputError();
      await isExist(directoryName, this.dir);
      const directoryContent = await this.getDir(this.dir);
      const target = directoryContent.find(({ name }) => directoryName === name);
      if (target.isFile) throw new InputError();
      this.dir = target.getPath(this.dir);
    } catch (error) {
      if (!(error instanceof AppError)) throw new Error(error);
      throw new Error(error);
    }
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

  start() {
    this.init();
    this.sayHi();
    this.printCurrentDir();

    const commandMapping = {
      '.exit': this.exit.bind(this),
      default: this.defaultPromt,
      up: this.up.bind(this),
      ls: this.ls.bind(this),
      cd: this.cd.bind(this),
    };

    readline.createInterface(
      process.stdin.on('data', (chunk) => {
        try {
          const [userInput] = chunk.toString().split('\n');
          const [command, ...args] = userInput.split(' ');
          const filteredArgs = args.filter((item) => !!item);
          if (commandMapping[command]) return commandMapping[command](filteredArgs);
          return commandMapping.default();
        } catch (error) {
          if (!(error instanceof AppError)) throw new Error(error);
          console.log(error.message);
        }
      })
    );

    process.on('SIGINT', () => this.exit(true));
  }
}
