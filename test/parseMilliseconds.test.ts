import {describe, it} from 'mocha';
import {expect} from 'chai';
import {parseMilliseconds} from "../src/commands/period/parseMilliseconds";

describe('Test suite for parseMilliseconds', function () {
  it('should return 0', function () {
    const {hours, minutes, days, seconds} = parseMilliseconds(0);
    expect(hours).equals(minutes).equals(days).equals(seconds).equals(0);
  });

  it('should evaluate to 1 second', function () {
    const {hours, minutes, days, seconds} = parseMilliseconds(1000);
    expect(hours).equals(minutes).equals(days).equals(0);
    expect(seconds).equals(1);
  });

  it('should evaluate to 1 minute', function () {
    const {hours, minutes, days, seconds} = parseMilliseconds(60000);
    expect(hours).equals(days).equals(seconds).equals(0);
    expect(minutes).equals(1);
  });

  it('should evaluate to 1 hour', function () {
    const {hours, minutes, days, seconds} = parseMilliseconds(3600000);
    expect(minutes).equals(days).equals(seconds).equals(0);
    expect(hours).equals(1);
  });

  it('should evaluate to 1 day', function () {
    const {hours, minutes, days, seconds} = parseMilliseconds(86400000);
    expect(minutes).equals(hours).equals(seconds).equals(0);
    expect(days).equals(1);
  });

  it('should take remainders', function () {
    const {hours, minutes, days, seconds} = parseMilliseconds(90061000);
    expect(days).equals(1);
    expect(hours).equals(1);
    expect(minutes).equals(1);
    expect(seconds).equals(1);
  });

});
