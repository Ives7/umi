import { winPath } from '@umijs/utils';
import { existsSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

// similar with resolve.extensions in webpack config
const EXT_NAMES = ['.mjs', '.js', '.jsx', '.ts', '.tsx'];

function getPathWithExt(path: string) {
  if (existsSync(path) && statSync(path).isFile()) {
    return path;
  }

  for (const extName of EXT_NAMES) {
    const newPath = `${path}${extName}`;
    if (existsSync(newPath) && statSync(newPath).isFile()) {
      return newPath;
    }
  }

  return null;
}

function getPathWithPkgJSON(path: string) {
  // TODO: 这里是否会有 symlink 问题?
  if (existsSync(path) && statSync(path).isDirectory()) {
    const pkgPath = join(path, 'package.json');
    if (existsSync(pkgPath)) {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
      // ref: https://webpack.js.org/configuration/resolve/#resolvemainfields
      // TODO: support browser object
      // ref: https://unpkg.alibaba-inc.com/browse/react-dom@17.0.2/package.json
      const entry = /*pkg.browser ||*/ pkg.module || pkg.main || 'index.js';
      const target = join(path, entry);
      return getPathWithExt(target) || getPathWithIndexFile(target);
    }
  }
  return null;
}

function getPathWithIndexFile(path: string) {
  if (existsSync(path) && statSync(path).isDirectory()) {
    for (const extName of EXT_NAMES) {
      const indexFilePath = join(path, `index${extName}`);
      if (existsSync(indexFilePath) && statSync(indexFilePath).isFile()) {
        return indexFilePath;
      }
    }
  }
  return null;
}

export function getFilePath(path: string) {
  // 1. 文件存在
  // 2. 加后缀
  const pathWithExt = getPathWithExt(path);
  if (pathWithExt) {
    return winPath(pathWithExt);
  }

  // 3. path + package.json
  const pathWithPkgJSON = getPathWithPkgJSON(path);
  if (pathWithPkgJSON) {
    return winPath(pathWithPkgJSON);
  }

  // 4. path + index.js
  const pathWithIndexFile = getPathWithIndexFile(path);
  if (pathWithIndexFile) {
    return winPath(pathWithIndexFile);
  }

  return null;
}
