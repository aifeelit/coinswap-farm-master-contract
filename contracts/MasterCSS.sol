 // SPDX-License-Identifier: MIT
import './libraries/SafeMath.sol';
import './interfaces/IBEP20.sol';
import './libraries/BEP20.sol';
import './CSSToken.sol';
import './libraries/SafeBEP20.sol';

pragma solidity 0.6.12;

//  referral
interface CssReferral {
    function setCssReferral(address farmer, address referrer) external;
    function getCssReferral(address farmer) external view returns (address);
}

contract IRewardDistributionRecipient is Ownable {
    address public rewardReferral;
    address public rewardVote;


    function setRewardReferral(address _rewardReferral) external onlyOwner {
        rewardReferral = _rewardReferral;
    }

}
/**
 * @dev Implementation of the {IBEP20} interface.
 *
 * This implementation is agnostic to the way tokens are created. This means
 * that a supply mechanism has to be added in a derived contract using {_mint}.
 * For a generic mechanism see {BEP20PresetMinterPauser}.
 *
 * TIP: For a detailed writeup see our guide
 * https://forum.zeppelin.solutions/t/how-to-implement-BEP20-supply-mechanisms/226[How
 * to implement supply mechanisms].
 *
 * We have followed general OpenZeppelin guidelines: functions revert instead
 * of returning `false` on failure. This behavior is nonetheless conventional
 * and does not conflict with the expectations of BEP20 applications.
 *
 * Additionally, an {Approval} event is emitted on calls to {transferFrom}.
 * This allows applications to reconstruct the allowance for all accounts just
 * by listening to said events. Other implementations of the EIP may not emit
 * these events, as it isn't required by the specification.
 *
 * Finally, the non-standard {decreaseAllowance} and {increaseAllowance}
 * functions have been added to mitigate the well-known issues around setting
 * allowances. See {IBEP20-approve}.
 */

// MasterCSS is the master of CSS. He can make Css and he is a fair guy.
//
// Note that it's ownable and the owner wields tremendous power. The ownership
// will be transferred to a governance smart contract once CSS is sufficiently
// distributed and the community can show to govern itself.
//
// Have fun reading it. Hopefully it's bug-free. God bless.
contract MasterCSS is IRewardDistributionRecipient {
    using SafeMath for uint256;
    using SafeBEP20 for IBEP20;

    // Info of each user.
    struct UserInfo {
        uint256 amount;     // How many LP tokens the user has provided.
        uint256 rewardDebt; // Reward debt. See explanation below.
        //
        // We do some fancy math here. Basically, any point in time, the amount of CSS
        // entitled to a user but is pending to be distributed is:
        //
        //   pending reward = (user.amount * pool.accCssPerShare ) - user.rewardDebt
        //
        // Whenever a user deposits or withdraws LP tokens to a pool. Here's what happens:
        //   1. The pool's `accCssPerShare ` (and `lastRewardBlock`) gets updated.
        //   2. User receives the pending reward sent to his/her address.
        //   3. User's `amount` gets updated.
        //   4. User's `rewardDebt` gets updated.
    }

    // Info of each pool.
    struct PoolInfo {
        IBEP20 lpToken;           // Address of LP token contract.
        uint256 allocPoint;       // How many allocation points assigned to this pool. CSS to distribute per block.
        uint256 lastRewardBlock;  // Last block number that CSS distribution occurs.
        uint256 accCssPerShare;   // Accumulated CSS per share, times 1e12. See below.
        uint256 fee;
    }

    // The CSS TOKEN!
    CssToken public st;

    uint256 public immutable timeFirstStep;
    uint256 public immutable timeSecondStep;
    uint256 public immutable timeThirdStep;
    uint256 public immutable timeForthStep;
    uint256 public immutable timeFifthStep;

    // Dev address
    address public devAddress;

    address public divPoolAddress;
    // CSS tokens created per block.
    uint256 public cssPerBlock;

    // Multiplier that can be use to multiply all farm rewards (allocationPoints)
    uint256 public bonusMultiplier = 1;

    // Info of each pool.
    PoolInfo[] public poolInfo;
    // Info of each user that stakes LP tokens.
    mapping(uint256 => mapping(address => UserInfo)) public userInfo;
    // Total allocation points. Must be the sum of all allocation points in all pools.
    uint256 public totalAllocPoint;
    // The block number when This   mining starts.
    uint256 public startBlock;

    // Mint fee that is fixed on 8%
    uint256 public constant MINT_FEE = 800;

    // Referral fee that is fixed on 15%
    uint256 public constant DIV_REFERRAL_FEE = 1500;

    //Fees to dev and treasury (initially 3,75% and 1,25%) it can be modified by using updateFees function
    uint256 public divPoolFee = 375;
    uint256 public divDevFee = 125;

    //Sum of dev and treasury fee cannot be higher than 5%
    uint256 public constant MAX_FEE_ALLOWED = 500;

    uint256 public immutable stakePoolId;

    event Deposit(address indexed user, uint256 indexed pid, uint256 amount);
    event Withdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event EmergencyWithdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event RewardPaid(address indexed user, uint256 reward);
    event ReferralPaid(address indexed user,address indexed userTo, uint256 reward);
    event Burned(uint256 reward);

    mapping(uint256 => bool) public enableMethod;

    constructor(
        CssToken _st,
        address _devAddress,
        address _divPoolAddress,
        uint256 _cssPerBlock,
        uint256 _startBlock
    ) public {
        st = _st;
        devAddress = _devAddress;
        divPoolAddress = _divPoolAddress;
        cssPerBlock = _cssPerBlock;
        startBlock = _startBlock;


        // adds CSS as first pool token with pid = 0
        poolExistence[_st] = true;
        poolInfo.push(PoolInfo({
            lpToken: _st,
            allocPoint: 1500,
            lastRewardBlock: startBlock,
            accCssPerShare: 0,
            fee: 0
        }));

        // stakePoolId cannot be changed afterwards
        stakePoolId = 0;

        // Must be the sum of all allocation points in all pools. Initially 1500 because of stake CssToken  pool
        totalAllocPoint = 1500;

        enableMethod[0] = false;
        enableMethod[1] = false;
        enableMethod[2] = true;

        timeFirstStep = now + 10 days;
        timeSecondStep = now + 365 days;
        timeThirdStep = now + 730 days;
        timeForthStep = now + 1095 days;
        timeFifthStep = now + 1460 days;
    }

    function updateMultiplier(uint256 multiplierNumber) public onlyOwner {
        bonusMultiplier = multiplierNumber;
    }

    function poolLength() external view returns (uint256) {
        return poolInfo.length;
    }

    //used to prevent LP token duplication
    mapping(IBEP20 => bool) public poolExistence;
    modifier nonDuplicated(IBEP20 _lpToken) {
        require(poolExistence[_lpToken] == false, "nonDuplicated: duplicated");
        _;
    }

    // Add a new lp to the pool. Can only be called by the owner.
    // Each LP token address can be added only once- safeguarded by poolExistence
    function add(uint256 _allocPoint, IBEP20 _lpToken, bool _withUpdate, uint256 __lastRewardBlock,uint256 __fee) public onlyOwner nonDuplicated(_lpToken) {

        // if _fee == 10 then 100% of dev and treasury fee is applied, if _fee = 5 then 50% discount, if 0 , no fee
        require(__fee<=10);

        if (_withUpdate) {
            massUpdatePools();
        }
        uint256 lastRewardBlock = __lastRewardBlock == 0 ? block.number > startBlock ? block.number : startBlock : __lastRewardBlock;
        totalAllocPoint = totalAllocPoint.add(_allocPoint);
        poolExistence[_lpToken] = true;
        poolInfo.push(PoolInfo({
            lpToken: _lpToken,
            allocPoint: _allocPoint,
            lastRewardBlock: lastRewardBlock,
            accCssPerShare: 0,
            fee:__fee
        }));
    }

    // Update the given pool's CSS allocation point. Can only be called by the owner. If update lastrewardblock, need update pools
    function set(uint256 _pid, uint256 _allocPoint, bool _withUpdate, uint256 __lastRewardBloc,uint256 __fee) public onlyOwner {
        // if _fee == 10 then 100% of dev and treasury fee is applied, if _fee = 5 then 50% discount, if 0 , no fee
         require(__fee<=10);

         if (_withUpdate) {
            massUpdatePools();
        }
        totalAllocPoint = totalAllocPoint.sub(poolInfo[_pid].allocPoint).add(_allocPoint);
        poolInfo[_pid].allocPoint = _allocPoint;
        if(__lastRewardBloc>0)
            poolInfo[_pid].lastRewardBlock = __lastRewardBloc;

        poolInfo[_pid].fee = __fee;
    }

   // Return reward multiplier over the given _from to _to block.
    function getMultiplier(uint256 _from, uint256 _to) public view returns (uint256) {
        return _to.sub(_from).mul(bonusMultiplier);
    }

    // View function to see pending tokens on frontend.
    function pendingReward(uint256 _pid, address _user) external returns (uint256) {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][_user];
        uint256 accCssPerShare = pool.accCssPerShare;
        uint256 lpSupply = pool.lpToken.balanceOf(address(this));

        if(now < timeFirstStep)
            cssPerBlock = 6*10**17;
        else if(timeFirstStep < now && now < timeSecondStep)
            cssPerBlock = 45*10**16;
        else if(timeSecondStep < now && now < timeThirdStep)
            cssPerBlock = 41*10**16;
        else if(timeThirdStep < now && now < timeForthStep)
            cssPerBlock = 37*10**16;
        else if(timeForthStep < now && now < timeFifthStep)
            cssPerBlock = 33*10**16;
        else if(timeFifthStep < now)
            cssPerBlock = 29*10**16;

        if (block.number > pool.lastRewardBlock && lpSupply != 0) {
            uint256 multiplier = getMultiplier(pool.lastRewardBlock, block.number);
            uint256 cssReward = multiplier.mul(cssPerBlock).mul(pool.allocPoint).div(totalAllocPoint);
            accCssPerShare = accCssPerShare.add(cssReward.mul(1e12).div(lpSupply));
        }
        return user.amount.mul(accCssPerShare).div(1e12).sub(user.rewardDebt);
    }

    // Update reward variables for all pools. Be careful of gas spending!
    function massUpdatePools() public {
        uint256 length = poolInfo.length;
        for (uint256 pid = 0; pid < length; ++pid) {
            updatePool(pid);
        }
    }

    // Update reward variables of the given pool to be up-to-date.
    function updatePool(uint256 _pid) public {
        PoolInfo storage pool = poolInfo[_pid];
        if (block.number <= pool.lastRewardBlock) {
            return;
        }
        uint256 lpSupply = pool.lpToken.balanceOf(address(this));
        if (lpSupply == 0) {
            pool.lastRewardBlock = block.number;
            return;
        }

        if(now < timeFirstStep)
            cssPerBlock = 6*10**17;
        else if(timeFirstStep < now && now < timeSecondStep)
            cssPerBlock = 45*10**16;
        else if(timeSecondStep < now && now < timeThirdStep)
            cssPerBlock = 41*10**16;
        else if(timeThirdStep < now && now < timeForthStep)
            cssPerBlock = 37*10**16;
        else if(timeForthStep < now && now < timeFifthStep)
            cssPerBlock = 33*10**16;
        else if(timeFifthStep < now)
            cssPerBlock = 29*10**16;

        uint256 multiplier = getMultiplier(pool.lastRewardBlock, block.number);
        uint256 cssReward = multiplier.mul(cssPerBlock).mul(pool.allocPoint).div(totalAllocPoint);

        st.mint(address(this), cssReward);
        //mint to dev - fixed 8%
        st.mint(devAddress, cssReward.mul(MINT_FEE).div(10000));

        pool.accCssPerShare = pool.accCssPerShare.add(cssReward.mul(1e12).div(lpSupply));
        pool.lastRewardBlock = block.number;
    }

    // Harvest All Rewards pools where user has pending balance at same time!  Be careful of gas spending!
    function massHarvest(uint256[] memory idsx) public {
            require(enableMethod[0]);

        uint256 idxlength = idsx.length;
        address nulladdress = address(0);
          for (uint256 i = 0; i < idxlength;  i++) {
                 deposit(idsx[i],0,nulladdress);
            }

    }

    // Stake All Rewards to stakepool all pools where user has pending balance at same time!  Be careful of gas spending!
    function massStake(uint256[] memory idsx) public {
         require(enableMethod[1]);
        uint256 idxlength = idsx.length;
          for (uint256 i = 0; i < idxlength;  i++) {
                 stakeReward(idsx[i]);
            }
    }

    // Deposit LP tokens to MasterCSS for CSS allocation.
    function deposit(uint256 _pid, uint256 _amount,address referrer) public   {


        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];

        // anti -backdoor
        require((block.number >= pool.lastRewardBlock || _amount == 0), "pool didnt start yet");

        updatePool(_pid);
        if (_amount > 0 && rewardReferral != address(0) && referrer != address(0)) {
            CssReferral(rewardReferral).setCssReferral(msg.sender, referrer);
        }

        if (user.amount > 0) {
            uint256 pending = user.amount.mul(pool.accCssPerShare).div(1e12).sub(user.rewardDebt);
            if (pending > 0) {
                payRefFees(pending);
                safeTransfer(msg.sender, pending);
                emit RewardPaid(msg.sender, pending);
            }
        }
        if (_amount > 0) {
            pool.lpToken.safeTransferFrom(address(msg.sender), address(this), _amount);
            if (pool.fee > 0) {
                // if pool.fee = 10 ==>  375 * 10/100000 = 3,75% fee
                // if pool.fee = 5 ==>  375 * 5/100000 = 1,875% fee
                // if pool.fee = 0 ==>  375 * 0/100000 = 0 fee
                uint256 treasuryFee = _amount.mul(pool.fee).mul(divPoolFee).div(100000);
                uint256 devFee = _amount.mul(pool.fee).mul(divDevFee).div(100000);

                pool.lpToken.safeTransfer(divPoolAddress, treasuryFee);
                pool.lpToken.safeTransfer(devAddress, devFee);

                user.amount = user.amount.add(_amount).sub(treasuryFee).sub(devFee);
            } else {
                user.amount = user.amount.add(_amount);
            }
        }

        user.rewardDebt = user.amount.mul(pool.accCssPerShare).div(1e12);
        emit Deposit(msg.sender, _pid, _amount);
    }

    // user can choose autoStake reward to stake pool instead just harvest
    function stakeReward(uint256 _pid) public {
        require(enableMethod[2] && _pid != stakePoolId);

        UserInfo storage user = userInfo[_pid][msg.sender];

        if (user.amount > 0) {
            PoolInfo storage pool = poolInfo[_pid];

            updatePool(_pid);

            uint256 pending = user.amount.mul(pool.accCssPerShare).div(1e12).sub(user.rewardDebt);
            if (pending > 0) {
                payRefFees(pending);

                safeTransfer(msg.sender, pending);
                emit RewardPaid(msg.sender, pending);

                deposit(stakePoolId, pending, address(0));

            }
            user.rewardDebt = user.amount.mul(pool.accCssPerShare).div(1e12);
        }

    }

    // Withdraw LP tokens from MasterCSS.
    function withdraw(uint256 _pid, uint256 _amount) public {


        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        require(user.amount >= _amount, "withdraw: not good");
        updatePool(_pid);
        uint256 pending = user.amount.mul(pool.accCssPerShare).div(1e12).sub(user.rewardDebt);
        if (pending > 0) {
            safeTransfer(msg.sender, pending);
            emit RewardPaid(msg.sender, pending);
        }
        if (_amount > 0) {
            user.amount = user.amount.sub(_amount);
            pool.lpToken.safeTransfer(address(msg.sender), _amount);
        }
        user.rewardDebt = user.amount.mul(pool.accCssPerShare).div(1e12);
        emit Withdraw(msg.sender, _pid, _amount);
    }

    function payRefFees(uint256 pending) internal
    {
        uint256 toReferral = pending.mul(DIV_REFERRAL_FEE).div(10000);
        // 15%

        address referrer = address(0);
        if (rewardReferral != address(0)) {
            referrer = CssReferral(rewardReferral).getCssReferral(msg.sender);
        }

        if (referrer != address(0)) {// send commission to referrer
            st.mint(referrer, toReferral);
            emit ReferralPaid(msg.sender, referrer, toReferral);
        }
    }


    // Withdraw without caring about rewards. EMERGENCY ONLY.
    function emergencyWithdraw(uint256 _pid) public {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        pool.lpToken.safeTransfer(address(msg.sender), user.amount);
        emit EmergencyWithdraw(msg.sender, _pid, user.amount);
        delete pool[msg.sender];
    }

    function safeTransfer(address _to, uint256 _amount) internal {
        uint256 sbal = st.balanceOf(address(this));
        if (_amount > sbal) {
            st.transfer(_to, sbal);
        } else {
            st.transfer(_to, _amount);
        }
    }


    function updateFees(uint256 _devFee, uint256 _divPoolFee) public onlyOwner {

        require(_devFee.add(_divPoolFee) <= MAX_FEE_ALLOWED);
        divDevFee = _devFee;
        divPoolFee = _divPoolFee;
    }

    function setdivPoolAddress(address _divPoolAddress) public onlyOwner {
        divPoolAddress = _divPoolAddress;
    }

    // Update dev address by the previous dev.
    function devAddress(address _devaddr) public onlyOwner {
        devAddress = _devaddr;
    }

    function enableMethod(uint256 _id, bool enabled) public onlyOwner
    {
        enableMethod[_id] = enabled;
    }
}