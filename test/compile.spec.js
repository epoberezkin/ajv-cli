'use strict';

var cli = require('./cli');
var assert = require('assert');
var fs = require('fs');


describe('compile', function() {
  this.timeout(10000);

  describe('compile single schema', function() {
    it('should compile valid schema', function (done) {
      cli('compile -s test/schema', function (error, stdout, stderr) {
        assert.strictEqual(error, null);
        assertValid(stdout, 1);
        assert.equal(stderr, '');
        done();
      });
    });

    it('should compile multiple schemas', function (done) {
      cli('compile -s test/schema -s test/meta/schema -m test/meta/meta_schema', function (error, stdout, stderr) {
        assert.strictEqual(error, null);
        assertValid(stdout, 2);
        assert.equal(stderr, '');
        done();
      });
    });

    it('should compile schema to output file', function (done) {
      cli('compile -s test/schema -o test/validate_schema.js', function (error, stdout, stderr) {
        assert.strictEqual(error, null);
        assertValid(stdout, 1);
        assert.equal(stderr, '');

        var validate = require('./validate_schema.js');
        var validData = require('./valid_data.json');
        var invalidData = require('./invalid_data.json');
        assert.strictEqual(validate(validData), true);
        assert.strictEqual(validate(invalidData), false);

        fs.unlinkSync('test/validate_schema.js');
        done();
      });
    });

    it('should compile valid v5 schema', function (done) {
      cli('compile -s test/v5/schema --v5', function (error, stdout, stderr) {
        assert.strictEqual(error, null);
        assertValid(stdout, 1);
        assert.equal(stderr, '');
        done();
      });
    });

    it('should compile valid schema with a custom meta-schema', function (done) {
      cli('compile -s test/meta/schema -m test/meta/meta_schema', function (error, stdout, stderr) {
        assert.strictEqual(error, null);
        assertValid(stdout, 1);
        assert.equal(stderr, '');
        done();
      });
    });

    it('should fail to compile invalid schema with a custom meta-schema', function (done) {
      cli('compile -s test/meta/invalid_schema -m test/meta/meta_schema', function (error, stdout, stderr) {
        assert(error instanceof Error);
        assert.equal(stdout, '');
        var lines = assertError(stderr);
        assert(/my_keyword\sshould\sbe\sboolean/.test(lines[1]));
        done();
      });
    });

    it('should fail to compile multiple schemas to output file', function (done) {
      cli('compile -s test/schema -s test/meta/schema -m test/meta/meta_schema -o test/validate_schema.js', function (error, stdout, stderr) {
        assert(error instanceof Error);
        assert.equal(stdout, '');
        var lines = stderr.split('\n');
        assert.equal(lines.length, 2);
        assert(/multiple\sschemas/.test(lines[0]));
        done();
      });
    });

    it('should fail to save compiled schemas when path does not exist', function (done) {
      cli('compile -s test/schema -o no_folder/validate_schema.js', function (error, stdout, stderr) {
        assert(error instanceof Error);
        assertValid(stdout, 1);
        var lines = stderr.split('\n');
        assert(lines.length > 1);
        assert(/error\ssaving\sfile/.test(lines[0]));
        done();
      });
    });
  });
});


function assertValid(stdout, count) {
  var lines = stdout.split('\n');
  assert.equal(lines.length, count + 1);
  for (var i=0; i<count; i++)
    assert(/\svalid/.test(lines[i]));
}


function assertError(stderr) {
  var lines = stderr.split('\n');
  assert.equal(lines.length, 3);
  assert(/schema/.test(lines[0]));
  assert(/\sinvalid/.test(lines[0]));
  assert(/error/.test(lines[1]));
  return lines;
}
