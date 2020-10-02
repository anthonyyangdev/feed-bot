import {describe, it} from 'mocha';
import {expect} from 'chai';

function getBestIvyHacksTeam() {
  return "Us";
}

describe('This is a test to test the test.', function () {
  it('should pass with no problems', function () {
    expect(getBestIvyHacksTeam()).equals("Us");
  });
});
