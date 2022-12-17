import { AppError, OperationError } from './error.js';
import { createReadStream, promises } from 'fs';
import { Item } from './item.js';
import path from 'path';

export const cat = async (path) => {
  return await new Promise((res, rej) => {
    const readableStream = createReadStream(path);
    const writeableStream = process.stdout;
    readableStream.pipe(writeableStream);
    readableStream.on('error', rej);
    readableStream.on('end', res);
  });
};

export const add = async (path) => {
  try {
    await promises.writeFile(path, '');
  } catch (error) {
    console.log('error: ', error);
  }
};

export const rn = async (oldPath, newPath) => {
  try {
    await promises.rename(oldPath, newPath);
  } catch (error) {
    console.log('error: ', error);
  }
};

export const checkIfExist = async (path, isExist = false) => {
  try {
    await promises.stat(path);
    if (isExist) throw new OperationError();
  } catch (error) {
    if (isExist && error.code === 'ENOENT') return;
    if (!isExist && error.code === 'ENOENT') throw new OperationError();
    if (error instanceof AppError) throw new OperationError();

    throw new Error(error);
  }
};

export const checkIfNotExist = async (path) => checkIfExist(path, true);

export const getItem = async (itemPath) => {
  const stat = await promises.stat(itemPath);
  const { name, ext } = path.parse(itemPath);
  return new Item(`${name}${ext}`, itemPath, stat.isFile(), stat.isDirectory());
};

export const getList = async (directoryPath) => {
  const itemNames = await promises.readdir(directoryPath);
  const itemPaths = itemNames.map(async (filename) => {
    const itemPath = path.join(directoryPath, filename);
    return await getItem(itemPath);
  });
  return await Promise.all(itemPaths);
};
