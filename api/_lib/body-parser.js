// 通用请求体解析函数：支持application/json和text/plain
export async function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        if (body) {
          resolve(JSON.parse(body));
        } else {
          resolve({});
        }
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', (e) => {
      reject(e);
    });
  });
}
