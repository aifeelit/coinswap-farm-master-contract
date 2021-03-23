const { expectRevert, time } = require('@openzeppelin/test-helpers');
const CSS = artifacts.require('CSS');
const SyrupBar = artifacts.require('SyrupBar');
const Master = artifacts.require('Master');
const MockBEP20 = artifacts.require('libs/MockBEP20');

contract('Master', ([alice, bob, carol, dev, minter]) => {
    beforeEach(async () => {
        this.css = await CSS.new({ from: minter });
        this.syrup = await SyrupBar.new(this.css.address, { from: minter });
        this.lp1 = await MockBEP20.new('LPToken', 'LP1', '1000000', { from: minter });
        this.lp2 = await MockBEP20.new('LPToken', 'LP2', '1000000', { from: minter });
        this.lp3 = await MockBEP20.new('LPToken', 'LP3', '1000000', { from: minter });
        this.master = await Master.new(this.css.address, this.syrup.address, dev, '1000', '100', { from: minter });
        await this.css.transferOwnership(this.master.address, { from: minter });
        await this.syrup.transferOwnership(this.master.address, { from: minter });

        await this.lp1.transfer(bob, '2000', { from: minter });
        await this.lp2.transfer(bob, '2000', { from: minter });
        await this.lp3.transfer(bob, '2000', { from: minter });

        await this.lp1.transfer(alice, '2000', { from: minter });
        await this.lp2.transfer(alice, '2000', { from: minter });
        await this.lp3.transfer(alice, '2000', { from: minter });
    });
    it('real case', async () => {
      this.lp4 = await MockBEP20.new('LPToken', 'LP1', '1000000', { from: minter });
      this.lp5 = await MockBEP20.new('LPToken', 'LP2', '1000000', { from: minter });
      this.lp6 = await MockBEP20.new('LPToken', 'LP3', '1000000', { from: minter });
      this.lp7 = await MockBEP20.new('LPToken', 'LP1', '1000000', { from: minter });
      this.lp8 = await MockBEP20.new('LPToken', 'LP2', '1000000', { from: minter });
      this.lp9 = await MockBEP20.new('LPToken', 'LP3', '1000000', { from: minter });
      await this.master.add('2000', this.lp1.address, true, { from: minter });
      await this.master.add('1000', this.lp2.address, true, { from: minter });
      await this.master.add('500', this.lp3.address, true, { from: minter });
      await this.master.add('500', this.lp3.address, true, { from: minter });
      await this.master.add('500', this.lp3.address, true, { from: minter });
      await this.master.add('500', this.lp3.address, true, { from: minter });
      await this.master.add('500', this.lp3.address, true, { from: minter });
      await this.master.add('100', this.lp3.address, true, { from: minter });
      await this.master.add('100', this.lp3.address, true, { from: minter });
      assert.equal((await this.master.poolLength()).toString(), "10");

      await time.advanceBlockTo('170');
      await this.lp1.approve(this.master.address, '1000', { from: alice });
      assert.equal((await this.css.balanceOf(alice)).toString(), '0');
      await this.master.deposit(1, '20', { from: alice });
      await this.master.withdraw(1, '20', { from: alice });
      assert.equal((await this.css.balanceOf(alice)).toString(), '263');

      await this.css.approve(this.master.address, '1000', { from: alice });
      await this.master.enterStaking('20', { from: alice });
      await this.master.enterStaking('0', { from: alice });
      await this.master.enterStaking('0', { from: alice });
      await this.master.enterStaking('0', { from: alice });
      assert.equal((await this.css.balanceOf(alice)).toString(), '993');
      // assert.equal((await this.master.getPoolPoint(0, { from: minter })).toString(), '1900');
    })


    it('deposit/withdraw', async () => {
      await this.master.add('1000', this.lp1.address, true, { from: minter });
      await this.master.add('1000', this.lp2.address, true, { from: minter });
      await this.master.add('1000', this.lp3.address, true, { from: minter });

      await this.lp1.approve(this.master.address, '100', { from: alice });
      await this.master.deposit(1, '20', { from: alice });
      await this.master.deposit(1, '0', { from: alice });
      await this.master.deposit(1, '40', { from: alice });
      await this.master.deposit(1, '0', { from: alice });
      assert.equal((await this.lp1.balanceOf(alice)).toString(), '1940');
      await this.master.withdraw(1, '10', { from: alice });
      assert.equal((await this.lp1.balanceOf(alice)).toString(), '1950');
      assert.equal((await this.css.balanceOf(alice)).toString(), '999');
      assert.equal((await this.css.balanceOf(dev)).toString(), '100');

      await this.lp1.approve(this.master.address, '100', { from: bob });
      assert.equal((await this.lp1.balanceOf(bob)).toString(), '2000');
      await this.master.deposit(1, '50', { from: bob });
      assert.equal((await this.lp1.balanceOf(bob)).toString(), '1950');
      await this.master.deposit(1, '0', { from: bob });
      assert.equal((await this.css.balanceOf(bob)).toString(), '125');
      await this.master.emergencyWithdraw(1, { from: bob });
      assert.equal((await this.lp1.balanceOf(bob)).toString(), '2000');
    })

    it('staking/unstaking', async () => {
      await this.master.add('1000', this.lp1.address, true, { from: minter });
      await this.master.add('1000', this.lp2.address, true, { from: minter });
      await this.master.add('1000', this.lp3.address, true, { from: minter });

      await this.lp1.approve(this.master.address, '10', { from: alice });
      await this.master.deposit(1, '2', { from: alice }); //0
      await this.master.withdraw(1, '2', { from: alice }); //1

      await this.css.approve(this.master.address, '250', { from: alice });
      await this.master.enterStaking('240', { from: alice }); //3
      assert.equal((await this.syrup.balanceOf(alice)).toString(), '240');
      assert.equal((await this.css.balanceOf(alice)).toString(), '10');
      await this.master.enterStaking('10', { from: alice }); //4
      assert.equal((await this.syrup.balanceOf(alice)).toString(), '250');
      assert.equal((await this.css.balanceOf(alice)).toString(), '249');
      await this.master.leaveStaking(250);
      assert.equal((await this.syrup.balanceOf(alice)).toString(), '0');
      assert.equal((await this.css.balanceOf(alice)).toString(), '749');

    });


    it('updaate multiplier', async () => {
      await this.master.add('1000', this.lp1.address, true, { from: minter });
      await this.master.add('1000', this.lp2.address, true, { from: minter });
      await this.master.add('1000', this.lp3.address, true, { from: minter });

      await this.lp1.approve(this.master.address, '100', { from: alice });
      await this.lp1.approve(this.master.address, '100', { from: bob });
      await this.master.deposit(1, '100', { from: alice });
      await this.master.deposit(1, '100', { from: bob });
      await this.master.deposit(1, '0', { from: alice });
      await this.master.deposit(1, '0', { from: bob });

      await this.css.approve(this.master.address, '100', { from: alice });
      await this.css.approve(this.master.address, '100', { from: bob });
      await this.master.enterStaking('50', { from: alice });
      await this.master.enterStaking('100', { from: bob });

      await this.master.updateMultiplier('0', { from: minter });

      await this.master.enterStaking('0', { from: alice });
      await this.master.enterStaking('0', { from: bob });
      await this.master.deposit(1, '0', { from: alice });
      await this.master.deposit(1, '0', { from: bob });

      assert.equal((await this.css.balanceOf(alice)).toString(), '700');
      assert.equal((await this.css.balanceOf(bob)).toString(), '150');

      await time.advanceBlockTo('265');

      await this.master.enterStaking('0', { from: alice });
      await this.master.enterStaking('0', { from: bob });
      await this.master.deposit(1, '0', { from: alice });
      await this.master.deposit(1, '0', { from: bob });

      assert.equal((await this.css.balanceOf(alice)).toString(), '700');
      assert.equal((await this.css.balanceOf(bob)).toString(), '150');

      await this.master.leaveStaking('50', { from: alice });
      await this.master.leaveStaking('100', { from: bob });
      await this.master.withdraw(1, '100', { from: alice });
      await this.master.withdraw(1, '100', { from: bob });

    });

    it('should allow dev and only dev to update dev', async () => {
        assert.equal((await this.master.devaddr()).valueOf(), dev);
        await expectRevert(this.master.dev(bob, { from: bob }), 'dev: wut?');
        await this.master.dev(bob, { from: dev });
        assert.equal((await this.master.devaddr()).valueOf(), bob);
        await this.master.dev(alice, { from: bob });
        assert.equal((await this.master.devaddr()).valueOf(), alice);
    })
});
