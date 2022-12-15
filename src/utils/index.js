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
