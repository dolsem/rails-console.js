import fs from 'fs';
import path from 'path';

export const findRailsRoot = (startingDirectory: string) => {
  let currentPath = startingDirectory;
  const systemRoot = path.parse(currentPath).root;
  for (;;) {
    const configPath = path.join(currentPath, 'config.ru');
    if (fs.existsSync(configPath)) return currentPath;
    if (currentPath === systemRoot) return;
    currentPath = path.dirname(currentPath);
  }
};
