import { FileManager } from './file-manager.js';
import readline from 'readline';

export const app = async (username) => {
  const fm = new FileManager(username);
  fm.start();

  readline.createInterface(
    process.stdin.on('data', async (chunk) => {
      try {
        const [userInput] = chunk.toString().split('\n');
        const [command, ...args] = userInput.split(' ');
        const [arg1, arg2] = args.filter((item) => !!item);
        await fm.command(command, arg1, arg2);
      } catch (error) {
        if (!(error instanceof AppError)) throw new Error(error);
        console.log(error.message);
      } finally {
        fm.printCurrentDir();
      }
    })
  );

  process.on('SIGINT', () => fm.exit(true));
};
