import path, { dirname } from 'path';
import { fstat, promises } from 'fs';
import { fileURLToPath } from 'url';
import { Item } from '../item.js';
import { OperationError } from '../error.js';

export const getDirname = (object) => dirname(fileURLToPath(object));

export const getPath = (...args) => {
  const getReccurPath = (list) => {
    if (list.length === 1) return list[0];
    const [head, ...tail] = list;
    return path.join(head, getReccurPath(tail));
  };

  return getReccurPath(args);
};

export const getAbsolutPath = (...args) => getPath(path.resolve(), getPath.apply(null, args));

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

export const getList = async (path) => {
  try {
    return await promises.readdir(path);
  } catch (error) {
    console.log('error: ', error);
  }
};

export const getInfo = async (filename, folderPath) => {
  try {
    const itemPath = getPath(folderPath, filename);
    const stat = await promises.stat(itemPath);
    return new Item(filename, itemPath, stat.isFile(), stat.isDirectory());
  } catch (error) {
    console.log(error);
  }
};

export const isExist = async (filename, folderPath) => {
  const path = getPath(folderPath, filename);
  try {
    await promises.stat(path);
  } catch (error) {
    if (error.code === 'ENOENT') throw new OperationError();
    throw new Error(error);
  }
};
