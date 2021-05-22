const {assert} = require("chai");
const {expectRevert, time} = require('@openzeppelin/test-helpers');

describe('MasterCSS', () => {

    let alice;
    let bob;
    let owner;
    let dev;
    let treasury;
    let css;
    let master;
    let referral;
    let lp1;
    let CSSToken;
    let MasterCSS;
    let CSSReferral;
    let MockBEP20;

    beforeEach(async () => {

        CSSToken = await ethers.getContractFactory("CssToken");
        [owner, alice, bob, dev, treasury] = await ethers.getSigners();
        css = await CSSToken.deploy();

        MasterCSS = await ethers.getContractFactory("MasterCSS");

        MockBEP20 = await ethers.getContractFactory("MockBEP20");

        CSSReferral = await ethers.getContractFactory("contracts/CSSReferral.sol:CssReferral");

        master = await MasterCSS.deploy(css.address, dev.address, treasury.address, 0);

        referral = await CSSReferral.deploy();

        lp1 = await MockBEP20.deploy('LPToken', 'LP1', '20000000');

        master.setRewardReferral(referral.address);
        referral.setAdminStatus(master.address, true);

        await css.transfer(alice.address, '10000');
        await lp1.transfer(alice.address, '10000');

        await css.transferOwnership(master.address);
    })

    it('Check if master did set rewardReferral address', async () => {
        assert.equal(await master.rewardReferral(), referral.address);
    })

    it('Check if referral did set master address as admin', async () => {
        assert.equal(await referral.isAdmin(master.address), true);
    })

    it('Check if master adds referrer', async () => {
        await css.connect(alice).approve(master.address, '10000');
        await master.connect(alice).deposit(0, '10000', bob.address);

        assert.equal(await referral.getCssReferral(alice.address), bob.address);
    })

    it('Check if referral is paid on Harvest', async () => {
        assert.equal((await css.balanceOf(bob.address)).toString(), '0');

        await css.connect(alice).approve(master.address, '10000');
        await master.connect(alice).deposit(0, '10000', bob.address);

        await time.advanceBlockTo('1');

        assert.equal((await css.balanceOf(alice.address)).toString(), '0');

        //harvest
        await master.connect(alice).deposit(0, '0', bob.address);
        assert.equal((await css.balanceOf(alice.address)).toString(), '552000000000000000');
        assert.equal((await css.balanceOf(bob.address)).toString(), '82800000000000000');
    })


    it('Check if referral is paid on Withdraw', async () => {
        assert.equal((await css.balanceOf(bob.address)).toString(), '0');

        await css.connect(alice).approve(master.address, '10000');
        await master.connect(alice).deposit(0, '10000', bob.address);

        await time.advanceBlockTo('1');

        assert.equal((await css.balanceOf(alice.address)).toString(), '0');

        //harvest
        await master.connect(alice).withdraw(0, '10000');
        assert.equal((await css.balanceOf(alice.address)).toString(), '552000000000010000');
        assert.equal((await css.balanceOf(bob.address)).toString(), '82800000000000000');
    })

    it('Check if referral is paid on StakeReward', async () => {
        assert.equal((await css.balanceOf(bob.address)).toString(), '0');

        await master.add('2000', lp1.address, true, 0, 0);

        await css.connect(alice).approve(master.address, '414000000000000000');
        await lp1.connect(alice).approve(master.address, '414000000000000000');

        assert.equal((await lp1.balanceOf(alice.address)).toString(), '10000');
        await master.connect(alice).deposit(1, '10000', bob.address);

        await time.advanceBlockTo('1');

        assert.equal((await css.balanceOf(alice.address)).toString(), '10000');
        assert.equal((await lp1.balanceOf(alice.address)).toString(), '0');

        //stake Reward
        await master.connect(alice).stakeReward(1);

        assert.equal((await css.balanceOf(alice.address)).toString(), '10000');
        assert.equal((await css.balanceOf(bob.address)).toString(), '41400000000000000');
    })

});
