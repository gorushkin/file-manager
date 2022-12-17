import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

export const getDirname = (object) => dirname(fileURLToPath(object));

export const getPath = (...args) => {
  const getReccurPath = (list) => {
    if (list.length === 1) return list[0];
    const [head, ...tail] = list;
    return path.join(head, getReccurPath(tail));
  };

  return getReccurPath(args);
};

export const parseArgs = () => {
  const argPrefix = '--';
  const args = process.argv.slice(2);

  return args.reduce((acc, item) => {
    const [keyWithPrefix, value] = item.split('=');
    if (keyWithPrefix.slice(0, argPrefix.length) !== argPrefix) return acc;
    const key = keyWithPrefix.slice(2);
    return { ...acc, [key]: value };
  }, {});
};

export const getArg = (argName) => parseArgs()[argName];

export const getAbsolutePath = (filePath, curentDir) => {
  return path.isAbsolute(filePath) ? filePath : path.join(curentDir, filePath);
};

export const getNewPath = (itemPath, filename) => {
  const { root, dir } = path.parse(itemPath);
  return path.join(root, dir, filename);
};

export const getUsername = (username) => {
  if (!username) return username;
  return username
    .split('')
    .map((symbol, i) => (i === 0 ? symbol.toUpperCase() : symbol))
    .join('');
};
