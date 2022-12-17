import { getArg, getUsername } from './unitls.js';
import { app } from './app.js';

const rawUsername = getArg('username');
const username = getUsername(rawUsername);

app(username);
