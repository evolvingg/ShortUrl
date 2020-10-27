const Memcached = require('memcached');
const MEMCACHE_PORT = 11211;
// time in seconds, default set to 30 mins
const DEFAULT_CACHE_LIFETIME = 30 * 60;
const memcached = new Memcached(`localhost:${MEMCACHE_PORT}`, { retries: 10, retry: 10000, remove: true });

memcached.connect( 'localhost:11211', function( err, conn ){
  if( err ) {
  console.log( conn.server,'error while memcached connection!!');
  }
});

exports.getValue = (key) => {
  return new Promise((resolve, reject) => {
    memcached.get(key, function (err, data) {
      if (data) {
        return resolve(data);
      }
      return resolve('');
    });
  });
}

exports.setValue = (key, value, lifetime = DEFAULT_CACHE_LIFETIME) => {
  return new Promise((resolve, reject) => {
    memcached.set(key, value, lifetime, function (err) {
      if (err) {
        return reject(err);
      }
      return resolve(value);
    });
  });
}

exports.replaceValue = (key, value, lifetime = DEFAULT_CACHE_LIFETIME) => {
  return new Promise((resolve, reject) => {
    memcached.replace(key, value, lifetime, function (err) {
      if (err) {
        return reject(err);
      }
      return resolve(value);
    });
  });
}