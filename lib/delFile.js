var fs = require('fs')
/**
 * 
 * @param {*} path 必传参数可以是文件夹可以是文件
 * @param {*} reservePath 保存path目录 path值与reservePath值一样就保存
 */
function delFile(path, reservePath) {
  if (fs.existsSync(path)) {
    if (fs.statSync(path).isDirectory()) {
      let files = fs.readdirSync(path);
      files.forEach((file, index) => {
        let currentPath = path + "/" + file;
        if (fs.statSync(currentPath).isDirectory()) {
          delFile(currentPath, reservePath);
        } else {
          fs.unlinkSync(currentPath);
        }
      });
      if (path != reservePath) {
        fs.rmdirSync(path);
      }
    } else {
      fs.unlinkSync(path);
    }
  }
}

module.exports = delFile
