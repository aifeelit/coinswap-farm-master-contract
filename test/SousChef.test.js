const { expectRevert, time } = require('@openzeppelin/test-helpers');
const CSS = artifacts.require('CSS');
const Master = artifacts.require('Master');
const SyrupBar = artifacts.require('SyrupBar');
const SousChef = artifacts.require('SousChef');
const MockBEP20 = artifacts.require('libs/MockBEP20');

contract('SousChef', ([alice, bob, carol, dev, minter]) => {
  beforeEach(async () => {
    this.syrup = await MockBEP20.new('LPToken', 'LP1', '1000000', {
      from: minter,
    });
    this.master = await SousChef.new(this.syrup.address, '40', '300', '400', {
      from: minter,
    });
  });

  it('sous master now', async () => {
    await this.syrup.transfer(bob, '1000', { from: minter });
    await this.syrup.transfer(carol, '1000', { from: minter });
    await this.syrup.transfer(alice, '1000', { from: minter });
    assert.equal((await this.syrup.balanceOf(bob)).toString(), '1000');

    await this.syrup.approve(this.master.address, '1000', { from: bob });
    await this.syrup.approve(this.master.address, '1000', { from: alice });
    await this.syrup.approve(this.master.address, '1000', { from: carol });

    await this.master.deposit('10', { from: bob });
    assert.equal(
      (await this.syrup.balanceOf(this.master.address)).toString(),
      '10'
    );

    await time.advanceBlockTo('300');

    await this.master.deposit('30', { from: alice });
    assert.equal(
      (await this.syrup.balanceOf(this.master.address)).toString(),
      '40'
    );
    assert.equal(
      (await this.master.pendingReward(bob, { from: bob })).toString(),
      '40'
    );

    await time.advanceBlockTo('302');
    assert.equal(
      (await this.master.pendingReward(bob, { from: bob })).toString(),
      '50'
    );
    assert.equal(
      (await this.master.pendingReward(alice, { from: alice })).toString(),
      '30'
    );

    await this.master.deposit('40', { from: carol });
    assert.equal(
      (await this.syrup.balanceOf(this.master.address)).toString(),
      '80'
    );
    await time.advanceBlockTo('304');
    //  bob 10, alice 30, carol 40
    assert.equal(
      (await this.master.pendingReward(bob, { from: bob })).toString(),
      '65'
    );
    assert.equal(
      (await this.master.pendingReward(alice, { from: alice })).toString(),
      '75'
    );
    assert.equal(
      (await this.master.pendingReward(carol, { from: carol })).toString(),
      '20'
    );

    await this.master.deposit('20', { from: alice }); // 305 bob 10, alice 50, carol 40
    await this.master.deposit('30', { from: bob }); // 306  bob 40, alice 50, carol 40

    assert.equal(
      (await this.master.pendingReward(bob, { from: bob })).toString(),
      '74'
    );
    assert.equal(
      (await this.master.pendingReward(alice, { from: alice })).toString(),
      '110'
    );

    await time.advanceBlockTo('307');
    assert.equal(
      (await this.master.pendingReward(bob, { from: bob })).toString(),
      '86'
    );
    assert.equal(
      (await this.master.pendingReward(alice, { from: alice })).toString(),
      '125'
    );

    await this.master.withdraw('20', { from: alice }); // 308 bob 40, alice 30, carol 40
    await this.master.withdraw('30', { from: bob }); // 309  bob 10, alice 30, carol 40

    await time.advanceBlockTo('310');
    assert.equal(
      (await this.master.pendingReward(bob, { from: bob })).toString(),
      '118'
    );
    assert.equal(
      (await this.master.pendingReward(alice, { from: alice })).toString(),
      '166'
    );
    assert.equal(
      (await this.syrup.balanceOf(this.master.address)).toString(),
      '80'
    );

    await time.advanceBlockTo('400');
    assert.equal(
      (await this.master.pendingReward(bob, { from: bob })).toString(),
      '568'
    );
    assert.equal(
      (await this.master.pendingReward(alice, { from: alice })).toString(),
      '1516'
    );
    assert.equal(
      (await this.master.pendingReward(carol, { from: alice })).toString(),
      '1915'
    );

    await time.advanceBlockTo('420');
    assert.equal(
      (await this.master.pendingReward(bob, { from: bob })).toString(),
      '568'
    );
    assert.equal(
      (await this.master.pendingReward(alice, { from: alice })).toString(),
      '1516'
    );
    assert.equal(
      (await this.master.pendingReward(carol, { from: alice })).toString(),
      '1915'
    );

    await this.master.withdraw('10', { from: bob });
    await this.master.withdraw('30', { from: alice });
    await expectRevert(this.master.withdraw('50', { from: carol }), 'not enough');
    await this.master.deposit('30', { from: carol });
    await time.advanceBlockTo('450');
    assert.equal(
      (await this.master.pendingReward(bob, { from: bob })).toString(),
      '568'
    );
    assert.equal(
      (await this.master.pendingReward(alice, { from: alice })).toString(),
      '1516'
    );
    assert.equal(
      (await this.master.pendingReward(carol, { from: alice })).toString(),
      '1915'
    );
    await this.master.withdraw('70', { from: carol });
    assert.equal((await this.master.addressLength()).toString(), '3');
  });

  it('try syrup', async () => {
    this.css = await CSS.new({ from: minter });
    this.syrup = await SyrupBar.new(this.css.address, { from: minter });
    this.lp1 = await MockBEP20.new('LPToken', 'LP1', '1000000', {
      from: minter,
    });
    this.master = await Master.new(
      this.css.address,
      this.syrup.address,
      dev,
      '1000',
      '300',
      { from: minter }
    );
    await this.css.transferOwnership(this.master.address, { from: minter });
    await this.syrup.transferOwnership(this.master.address, { from: minter });
    await this.lp1.transfer(bob, '2000', { from: minter });
    await this.lp1.transfer(alice, '2000', { from: minter });

    await this.lp1.approve(this.master.address, '1000', { from: alice });
    await this.css.approve(this.master.address, '1000', { from: alice });

    await this.master.add('1000', this.lp1.address, true, { from: minter });
    await this.master.deposit(1, '20', { from: alice });
    await time.advanceBlockTo('500');
    await this.master.deposit(1, '0', { from: alice });
    await this.master.add('1000', this.lp1.address, true, { from: minter });

    await this.master.enterStaking('10', { from: alice });
    await time.advanceBlockTo('510');
    await this.master.enterStaking('10', { from: alice });

    this.master2 = await Sousmaster.new(this.syrup.address, '40', '600', '800', {
      from: minter,
    });
    await this.syrup.approve(this.master2.address, '10', { from: alice });
    await time.advanceBlockTo('590');
    this.master2.deposit('10', { from: alice }); //520
    await time.advanceBlockTo('610');
    assert.equal(
      (await this.syrup.balanceOf(this.master2.address)).toString(),
      '10'
    );
    assert.equal(
      (await this.master2.pendingReward(alice, { from: alice })).toString(),
      '400'
    );
  });

  it('emergencyWithdraw', async () => {
    await this.syrup.transfer(alice, '1000', { from: minter });
    assert.equal((await this.syrup.balanceOf(alice)).toString(), '1000');

    await this.syrup.approve(this.master.address, '1000', { from: alice });
    await this.master.deposit('10', { from: alice });
    assert.equal((await this.syrup.balanceOf(alice)).toString(), '990');
    await this.master.emergencyWithdraw({ from: alice });
    assert.equal((await this.syrup.balanceOf(alice)).toString(), '1000');
    assert.equal(
      (await this.master.pendingReward(alice, { from: alice })).toString(),
      '0'
    );
  });
});
