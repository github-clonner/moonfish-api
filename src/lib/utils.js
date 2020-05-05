exports.get = (obj, path, fallback) => {
  const fullPath = Array.isArray(path) ? path : path
    .replace(/\[/g, '.')
    .replace(/]/g, '')
    .split('.')
    .filter(Boolean);

  let tmp = obj;

  return fullPath.every((step) => {
    if (step) tmp = tmp[step];
    return tmp !== undefined;
  }) ? tmp : fallback;
};

function templateGet(p, obj) {
  return p.split('.').reduce((res, key) => {
    const r = res[key];
    if (typeof r === 'undefined') {
      throw Error(`template: was not provided a value for attribute $${key}`);
    }
    return r;
  }, obj);
}

exports.template = (template, map) => {
  return template.replace(/\$\{.+?}/g, (match) => {
    const p = match.substr(2, match.length - 3).trim();
    return templateGet(p, map);
  });
};

exports.sleep = (ms) => {
  return new Promise(r => setTimeout(r, ms));
};