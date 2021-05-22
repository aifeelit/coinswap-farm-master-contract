const {assert} = require("chai");


describe('CSSToken', () => {

    let alice;
    let owner;
    let css;

    beforeEach(async () => {
        const CSSToken = await ethers.getContractFactory("CssToken");
        [owner, alice] = await ethers.getSigners();

        css = await CSSToken.deploy();

    });

    it("Should set the right owner", async function () {
        assert.equal(await css.owner(), owner.address);
    });

    it('check initial balance', async () => {
        const balance = await css.balanceOf(alice.address);
        const balanceOwner = await css.balanceOf(owner.address);
        assert.equal(balance.toString(), '0');
        assert.equal(balanceOwner.toString(), '400000000000000000000000');
    })

    it('check balance after mint', async () => {
        await css['mint(address,uint256)'](alice.address, 1000);

        const balance = await css.balanceOf(alice.address);

        assert.equal(balance.toString(), '1000');
    })
});
