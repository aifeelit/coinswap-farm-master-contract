const {expectRevert, time} = require('@openzeppelin/test-helpers');
const {assert} = require("chai");
const {BigNumber} = require("bignumber.js");

describe('MasterCSS', () => {

    let alice;
    let bob;
    let owner;
    let dev;
    let treasury;
    let css;
    let lp1;
    let lp2;
    let lp3;
    let master;
    let CSSToken;
    let MockBEP20;
    let MasterCSS;

    beforeEach(async () => {
        CSSToken = await ethers.getContractFactory("CssToken");
        [owner, alice, bob, dev, treasury] = await ethers.getSigners();
        css = await CSSToken.deploy();

        MockBEP20 = await ethers.getContractFactory("MockBEP20");

        MasterCSS = await ethers.getContractFactory("MasterCSS");

        lp1 = await MockBEP20.deploy('LPToken', 'LP1', '20000000');
        lp2 = await MockBEP20.deploy('LPToken', 'LP2', '20000000');
        lp3 = await MockBEP20.deploy('LPToken', 'LP3', '20000000');

        master = await MasterCSS.deploy(css.address, dev.address, treasury.address, 0);
        await css.transferOwnership(master.address);

        await lp1.transfer(bob.address, '10000');
        await lp2.transfer(bob.address, '10000');
        await lp3.transfer(bob.address, '10000');

        await lp1.transfer(alice.address, '10000');
        await lp2.transfer(alice.address, '10000');
        await lp3.transfer(alice.address, '10000');
    })

    it('real case', async () => {

        await master.add('1000', lp1.address, true, 0, 2);
        await master.add('500', lp2.address, true, 0, 4);
        await master.add('500', lp3.address, true, 0, 6);


        assert.equal((await master.poolLength()).toString(), "4");
        assert.equal((await master.poolInfo(3)).fee.toString(), "6");

        await time.advanceBlockTo('1');
        await lp3.connect(alice).approve(master.address, '2000');
        assert.equal((await css.balanceOf(alice.address)).toString(), '0');

        await master.connect(alice).deposit(3, "2000", bob.address);
        assert.equal((await master.userInfo(3, alice.address)).amount.toString(), '1940');
        await master.connect(alice).withdraw(3, '1940');

        assert.equal((await css.balanceOf(alice.address)).toString(), '68999999999999999');

        await css.connect(alice).approve(master.address, '68999999999999999');
        await master.connect(alice).deposit(0, '8999999999999999', bob.address);
        assert.equal((await css.balanceOf(alice.address)).toString(), '60000000000000000');
    })


    it('deposit/withdraw', async () => {
        await master.add('1000', lp1.address, true, 0, 2);
        await master.add('500', lp2.address, true, 0, 4);
        await master.add('500', lp3.address, true, 0, 6);

        await lp2.connect(alice).approve(master.address, '2000000');
        await master.connect(alice).deposit(2, '2000', bob.address);
        await master.connect(alice).deposit(2, '0', bob.address);
        await master.connect(alice).deposit(2, '4000', bob.address);
        await master.connect(alice).deposit(2, '0', bob.address);
        assert.equal((await lp2.balanceOf(alice.address)).toString(), '4000');
        await master.connect(alice).withdraw(2, '1000');
        assert.equal((await lp2.balanceOf(alice.address)).toString(), '5000');
        assert.equal((await css.balanceOf(alice.address)).toString(), '275999999999999999');
        assert.equal((await css.balanceOf(dev.address)).toString(), '24000000000000000');

        await lp1.connect(bob).approve(master.address, '2000000');
        assert.equal((await lp1.balanceOf(bob.address)).toString(), '10000');
        await master.connect(bob).deposit(1, '6000', alice.address);
        assert.equal((await lp1.balanceOf(bob.address)).toString(), '4000');
        await master.connect(bob).deposit(1, '0', alice.address);
        assert.equal((await css.balanceOf(bob.address)).toString(), '137999999999999999');
        await master.connect(bob).emergencyWithdraw(1);
        assert.equal((await lp1.balanceOf(bob.address)).toString(), '9940');
    })

    it('staking/unstaking', async () => {

        await master.add('1000', lp1.address, true, 0, 2);
        await master.add('500', lp2.address, true, 0, 4);
        await master.add('500', lp3.address, true, 0, 6);

        await lp1.connect(alice).approve(master.address, '2000000');
        await master.connect(alice).deposit(1, '2000', bob.address);
        await master.connect(alice).withdraw(1, '1980');

        await css.connect(alice).approve(master.address, '2500');
        assert.equal((await css.balanceOf(alice.address)).toString(), '137999999999999999');
        await master.connect(alice).deposit(0, '1000', bob.address);
        assert.equal((await css.balanceOf(alice.address)).toString(), '137999999999998999');
        await master.connect(alice).withdraw(0, '1000');
        assert.equal((await css.balanceOf(alice.address)).toString(), '138000000000000198');

    });


    it('check devAddress change', async () => {
        assert.equal((await master.devAddress()).valueOf(), dev.address);
        await master.setDevAddress(bob.address);
        assert.equal((await master.devAddress()).valueOf(), bob.address);
    })
});
