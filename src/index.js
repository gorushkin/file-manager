import { getArg, getUsername } from './utils.js';
import { app } from './app.js';

const rawUsername = getArg('username');
const username = getUsername(rawUsername);

app(username);
