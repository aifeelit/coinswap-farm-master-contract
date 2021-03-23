const { assert } = require("chai");

const CSS = artifacts.require('CSS');

contract('CSS', ([alice, bob, carol, dev, minter]) => {
    beforeEach(async () => {
        this.css = await CSS.new({ from: minter });
    });


    it('mint', async () => {
        await this.css.mint(alice, 1000, { from: minter });
        assert.equal((await this.css.balanceOf(alice)).toString(), '1000');
    })
});
