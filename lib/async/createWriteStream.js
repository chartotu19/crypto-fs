var config = require('../config');
var filename = require('../utils/filename');
var crypto = require('../utils/crypto');
var _ = require('lodash');

module.exports = function(file, fsOptions) {
  fsOptions = fsOptions || {};
  var filePath = filename.getPath(file);
  var encoding = typeof(fsOptions.encoding) === 'string' ? fsOptions.encoding : null;
  fsOptions.encoding = 'binary';

  var fstream = config.baseFs.createWriteStream(filePath, fsOptions);
  var cipher = crypto.getCipher(file);

  fstream.cryptoWrite = fstream.write;
  fstream.cryptoEnd = fstream.end;
  fstream.write = function(data) {
    var args = _.toArray(arguments);
    args[0] = cipher.update(data, encoding, 'binary');
    fstream.cryptoWrite.apply(fstream, args);
  };
  fstream.end = function(data) {
    if (data) {
      fstream.write.apply(fstream, arguments);
    }
    fstream.cryptoWrite(cipher.final(), 'binary');
    fstream.cryptoEnd();
  };

  return fstream;
};