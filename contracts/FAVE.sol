// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/access/Ownable.sol";
import "openzeppelin-solidity/contracts/security/Pausable.sol";

/// @title FAVE
/// @notice ERC-20 implementation of FAVE token
contract FAVE is ERC20, Ownable, Pausable {
    uint8 public tokenDecimals;
    address payable public project;

    // PERCENT ARE DEFINED IN TERMS OF 10000
    // i.e. 1% = 10000
    uint256 public projectFee = 1_0000;
    uint256 public constant DIVISION_FACTOR = 1_000_000;

    event LogFeeChanged(uint256 oldFee, uint256 newFee);

    modifier onlyProject() {
        require(msg.sender == project, "Caller is not project");
        _;
    }

    /**
     * @dev Sets the values for {name = Favecoin}, {totalSupply = 1000000000} and {symbol = FAVE}.
     *
     * All two of these values are immutable: they can only be set once during
     * construction.
     */
    constructor(uint256 initialSupply, address payable _project)
        ERC20("Favecoin", "FAVE")
    {
        require(_project != address(0), "Project cannot be address zero.");
        tokenDecimals = 7;
        project = _project;
        super._mint(msg.sender, initialSupply); // Since Total supply 1000000000
    }

    /**
     * @dev Contract might receive/hold ETH as part of the maintenance process.
     * The receive function is executed on a call to the contract with empty calldata.
     */
    // solhint-disable-next-line no-empty-blocks
    receive() external payable {}

    fallback() external payable {}

    /**
     * @dev To transfer project tokens without deducting fee
     *
     * Requirements:
     * - can only be invoked by the project
     */
    function transferWithoutFeeDeduction(address recipient, uint256 amount)
        external
        onlyProject
    {
        super.transfer(recipient, amount);
    }

    /**
     * @dev To update number of decimals for a token
     *
     * Requirements:
     * - invocation can be done, only by the contract owner.
     */
    function updateDecimals(uint8 noOfDecimals) public onlyOwner whenNotPaused {
        tokenDecimals = noOfDecimals;
    }

    /**
     * @dev To update fee percentage
     * @notice _newFee should be specified in terms of 10,000
     * For Example: 3.5% => 3.5*10000 => 35000
     *
     * Requirements:
     * - invocation can be done, only by the contract owner.
     */
    function updateFee(uint256 _newFee) public onlyOwner {
        uint256 oldFee = projectFee;
        projectFee = _newFee;
        emit LogFeeChanged(oldFee, _newFee);
    }

    /**
     * @dev Destroys `amount` tokens from `account`, reducing the
     * total supply.
     *
     * Emits a {Transfer} event with `to` set to the zero address.
     *
     * Requirements:
     * - invocation can be done, only by the contract owner.
     */
    function burn(address account, uint256 amount) public whenNotPaused {
        // Calculate fee and transfer the amount - fee
        uint256 fee = calculateFee(amount);
        amount -= fee;
        super.transfer(project, fee);
        _burn(account, amount);
    }

    /** @dev Creates `amount` tokens and assigns them to `account`, increasing
     * the total supply.
     *
     * Emits a {Transfer} event with `from` set to the zero address.
     *
     * Requirements:
     *
     * - invocation can be done, only by the contract owner.
     */
    function mint(address account, uint256 amount) public whenNotPaused {
        // Calculate fee and transfer the amount - fee
        uint256 fee = calculateFee(amount);
        amount -= fee;
        super.transfer(project, fee);
        _mint(account, amount);
    }

    /**
     * @dev To transfer all BNBs stored in the contract to the caller
     *
     * Requirements:
     * - invocation can be done, only by the contract owner.
     */
    function withdrawAll() public payable onlyOwner whenNotPaused {
        require(
            payable(msg.sender).send(address(this).balance),
            "Withdraw failed"
        );
    }

    /**
     * @dev Triggers stopped state.
     *
     * Requirements:
     *
     * - The contract must not be paused.
     */
    function pause() public onlyOwner whenNotPaused {
        _pause();
    }

    /**
     * @dev Returns to normal state.
     *
     * Requirements:
     *
     * - The contract must be paused.
     */
    function unpause() public onlyOwner whenPaused {
        _unpause();
    }

    /**
     * @dev See {IERC20-transferFrom}.
     *
     * Emits an {Approval} event indicating the updated allowance. This is not
     * required by the EIP. See the note at the beginning of {ERC20}.
     *
     * Requirements:
     *
     * - `sender` and `recipient` cannot be the zero address.
     * - `sender` must have a balance of at least `amount`.
     * - the caller must have allowance for ``sender``'s tokens of at least
     * `amount`.
     */
    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) public override returns (bool) {
        return transfer(recipient, amount);
    }

    /**
     * @dev See {IERC20-transfer}.
     *
     * Requirements:
     *
     * - `recipient` cannot be the zero address.
     * - the caller must have a balance of at least `amount`.
     */
    function transfer(address recipient, uint256 amount)
        public
        override
        returns (bool)
    {
        // Calculate fee and transfer the amount - fee
        uint256 fee = calculateFee(amount);
        amount -= fee;
        super.transfer(project, fee);
        return super.transfer(recipient, amount);
    }

    /**
     * @dev Returns the number of decimals used to get its user representation.
     * For example, if `decimals` equals `2`, a balance of `505` tokens should
     * be displayed to a user as `5,05` (`505 / 10 ** 2`).
     *
     * Tokens usually opt for a value of 18, imitating the relationship between
     * Ether and Wei. This is the value {ERC20} uses, unless this function is
     * overridden;
     *
     * NOTE: This information is only used for _display_ purposes: it in
     * no way affects any of the arithmetic of the contract, including
     * {IERC20-balanceOf} and {IERC20-transfer}.
     */
    function decimals() public view override returns (uint8) {
        return tokenDecimals;
    }

    /**
     * @dev Calculate and returns the fee amount
     */
    function calculateFee(uint256 amount) internal view returns (uint256) {
        return ((projectFee * amount) / DIVISION_FACTOR);
    }
}
