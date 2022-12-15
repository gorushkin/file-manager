import { createReadStream } from 'fs';
import { spawn, fork } from 'child_process';
import os from 'os';
import readline from 'readline';

const messages = {
  currentPath: (path) => `You are currently in ${path}`,
  greeting: (username) => `Welcome to the File Manager, ${username}!`,
  bye: (username) => `Thank you for using File Manager, ${username}, goodbye!`,
};

export class App {
  constructor(username) {
    this.username = this.getUsername(username);
    this.dir = null;
    this.homeDir = null;
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
    this.homeDir = os.homedir();
  }

  showCurrentDir() {
    console.log(messages.currentPath(this.homeDir));
  }

  start() {
    this.init();
    this.sayHi();
    this.showCurrentDir()
    const commandMapping = { '.exit': () => this.exit(), default: this.defaultPromt };

    readline.createInterface(
      process.stdin.on('data', (chunk) => {
        const [command] = chunk.toString().split('\n');
        if (commandMapping[command]) return commandMapping[command]();
        return commandMapping.default();
      })
    );

    process.on('SIGINT', () => this.exit(true));
  }
}
