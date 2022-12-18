import { AppError, OperationError } from './error.js';
import { createReadStream, createWriteStream, promises } from 'fs';
import { Item } from './item.js';
import { createBrotliCompress, createBrotliDecompress, createGzip } from 'zlib';
import path from 'path';
import { createHash } from 'crypto';
import { pipeline } from 'stream';

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

export const cp = async (itempPath, itemNewPath) => {
  return await new Promise((res, rej) => {
    const readableStream = createReadStream(itempPath);
    const writeableStream = createWriteStream(itemNewPath);

    readableStream.on('error', rej);
    readableStream.on('end', res);

    readableStream.on('data', (chunk) => {
      writeableStream.write(chunk);
    });
  });
};

const arch = async (itempPath, itemNewPath, direction) => {
  const directionMapping = {
    compress: createBrotliCompress,
    decompress: createBrotliDecompress,
  };

  return await new Promise((res, rej) => {
    const readableStream = createReadStream(itempPath);
    const writeableStream = createWriteStream(itemNewPath);
    const archStream = directionMapping[direction]();
    readableStream.on('error', rej);
    readableStream.on('end', res);

    pipeline(readableStream, archStream, writeableStream, (err) => {
      if (err) console.log(err);
    });
  });
};

const compress = async (itempPath, itemNewPath) => arch(itempPath, itemNewPath, 'compress');
const decompress = async (itempPath, itemNewPath) => arch(itempPath, itemNewPath, 'decompress');

export const rm = async (itempPath) => {
  await promises.rm(itempPath);
};

export const mv = async (itempPath, itemNewPath) => {
  await cp(itempPath, itemNewPath);
  await rm(itempPath);
};

const hash = async (itemPath) => {
  const fileContent = await promises.readFile(itemPath);
  const hash = createHash('sha256');
  hash.update(fileContent);
  const fileHash = hash.digest('hex');
  console.log(fileHash);
};

export const fs = {
  compress,
  decompress,
  hash,
  cat,
  add,
  mv,
  getList,
  getItem,
  rm,
  cp,
  rn,
  checkIfExist,
  checkIfNotExist,
};
