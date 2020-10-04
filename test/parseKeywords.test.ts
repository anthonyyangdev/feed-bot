import {describe, it} from 'mocha';
import {expect} from 'chai';
import {parseKeywords} from "../src/commands/keywords/parseKeywords";

describe('Test suite for parseKeywords', function () {

  it('should parse into empty array', function () {
    const keywords = parseKeywords("!hello-world", "!hello-world");
    expect(keywords).has.length(0);
  });

  it('should parse into multiple keywords', function () {
    const command = "!hello";
    const keywords = parseKeywords(command + " 1223 hello world", command);
    expect(keywords).has.length(3);
  });

  it('should parse into two keywords', function () {
    const command = "!hello";
    const keywords = parseKeywords(command + ' 1223 "hello world"', command);
    expect(keywords).has.length(2);
    expect(keywords).includes('1223');
    expect(keywords).includes('hello world');
  });

});
