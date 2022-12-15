import { App } from './app.js';
import { getArg } from './utils/index.js';

const username = getArg('username');

const app = new App(username);
app.start();
