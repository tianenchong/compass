var storageMixin = require('../lib');
var Model = require('ampersand-model');
var assert = require('assert');
var format = require('util').format;

var storageLayers = Object.keys(require('../lib/sync'));

// var debug = require('debug')('storage-mixin:test');

var Spaceship = Model.extend({
  idAttribute: 'name',
  namespace: 'Spaceship',
  props: {
    name: {
      type: 'string',
      required: true
    },
    enableJetpack: {
      type: 'boolean',
      default: false,
      required: true
    },
    warpSpeed: {
      type: 'number',
      default: 1,
      required: true
    }
  }
});

describe('storage-mixin', function() {
  storageLayers.forEach(function(layer) {
    describe(format('storage layer `%s`', layer), function() {
      var StorableSpaceship;
      var spaceship;

      before(function() {
        StorableSpaceship = Spaceship.extend(storageMixin, {
          storage: layer
        });
      });

      beforeEach(function() {
        spaceship = new StorableSpaceship({
          name: 'Battlestar Galactica',
          enableJetpacks: true,
          warpSpeed: 1
        });
      });
      it('should save and fetch correctly', function(done) {
        spaceship.save({warpSpeed: 3.14}, {
          success: function() {
            var otherSpaceship = new StorableSpaceship({
              name: 'Battlestar Galactica'
            });
            otherSpaceship.on('sync', function() {
              assert.equal(otherSpaceship.warpSpeed, 3.14);
              done();
            });
            otherSpaceship.fetch();
          },
          error: done
        });
      });
    });
  });
});
