# Favecoin-sc

List of smart contracts for Favecoin

# For Testnet

- Open remix online compiler [Remix](https://remix.ethereum.org/#optimize=false&runs=200&evmVersion=null&version=soljson-v0.8.1+commit.df193b15.js)

- In the file explorer, on the left-hand side, `contracts` -> right click -> `New File` -> `FAVE.sol` -> Paste `/flattened_contracts/FAVE.sol` -> `Ctrl+s`

- Compile the contracts (`Blue Button`)

- From the left-panel, click `Deploy & run transactions`

- For FAVE.sol -> Deploy -> specify the initialSupply value, you can use `0x2c781f708c50a0000000` => 210000 FAVE Coins

# For Mainnet

- We can follow above steps or we can also add scripts in the package json for mainnet deployment

# Flattening contracts

Execute from the root of the project:

`truffle-flattener contracts/FAVE.sol --output flattened_contracts/FAVE.sol`

# For running tests locally

1. npm i -g ganache-cli

2. Open a terminal `ganache-cli`

3. Open another terminal

    - npm run compile

    - npm run test 

4. Generate coverage report `npm run coverage`

5. To view coverage report

    - Open coverage/index.html
