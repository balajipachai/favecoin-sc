const { expectRevert, balance } = require('@openzeppelin/test-helpers');
const { assert } = require('chai');
const BigNumber = require('bignumber.js');
const constants = require('@openzeppelin/test-helpers/src/constants');
const expectEvent = require('@openzeppelin/test-helpers/src/expectEvent');
const FAVE = artifacts.require("FAVE")

contract('FAVE is [ERC720, Ownable]', (accounts) => {
    const [owner, acc1, acc2, acc3, acc4, project, newProject, nonOwner] = accounts
    const gas = 6721975
    const fixedSupply = "10000000000000000";// 1 Billion FAVE Coins

    let FAVEConInstance;
    let txObject;

    describe('FAVE tests', () => {
        before(async () => {
            FAVEConInstance = await FAVE.new(fixedSupply, project, { from: owner, gas })
        })

        context('checks constructor invocation is successful', () => {
            let name, symbol, tokenDecimals, totalSupply, wallet;
            it('should have token name to be `Favecoin`', async () => {
                name = await FAVEConInstance.name.call()
                assert.equal(name, 'Favecoin', "Token name do not match")
            })
            it('should have token symbol to be `FAVE`', async () => {
                symbol = await FAVEConInstance.symbol.call()
                assert.equal(symbol, 'FAVE', "Token symbol do not match")
            })
            it('should have token tokenDecimals to be 7', async () => {
                tokenDecimals = await FAVEConInstance.decimals.call()
                assert.equal(tokenDecimals, 7, "Token decimals do not match")
            })
            it('should verify totalSupply is 1000000000', async () => {
                totalSupply = new BigNumber(await FAVEConInstance.totalSupply.call());
                assert.equal(totalSupply.toNumber(), fixedSupply, "Total supply do not match")
            })
            it('should verify project is set as expected', async () => {
                wallet = await FAVEConInstance.project.call();
                assert.equal(wallet, project, "Wallets do not match.")
            })
        })

        context('updateDecimals', () => {
            const actualTokenDecimals = 7;
            const updatedTokenDecimals = 18;
            let decimals;
            it('reverts when updateDecimals is invoked by non-owner', async () => {
                await expectRevert(
                    FAVEConInstance.updateDecimals(updatedTokenDecimals, { from: acc1, gas }),
                    "Ownable: caller is not the owner"
                )
            })
            it('before update tokenDecimals is 7', async () => {
                decimals = await FAVEConInstance.tokenDecimals.call()
                assert.equal(decimals, actualTokenDecimals, "Token decimals do not match")
            })
            it('updates token decimals when invoked by owner', async () => {
                txObject = await FAVEConInstance.updateDecimals(updatedTokenDecimals, { from: owner, gas })
                assert.equal(txObject.receipt.status, true, "Update token decimals failed")
            })
            it('after update tokenDecimals is 8', async () => {
                decimals = await FAVEConInstance.decimals.call()
                assert.equal(decimals, updatedTokenDecimals, "Token decimals do not match")
            })
            it('sets the tokenDecimals to actualTokenDecimals', async () => {
                txObject = await FAVEConInstance.updateDecimals(actualTokenDecimals, { from: owner, gas })
                assert.equal(txObject.receipt.status, true, "Update token decimals failed")
            })
        })

        context('updateFee', () => {
            const actualFee = 1e4;
            const updatedFee = 3.5e4;
            let fee;
            it('reverts when updateFee is invoked by non-owner', async () => {
                await expectRevert(
                    FAVEConInstance.updateFee(updatedFee, { from: acc1, gas }),
                    "Ownable: caller is not the owner"
                )
            })
            it('before update fee is 1e4', async () => {
                fee = await FAVEConInstance.projectFee.call()
                assert.equal(fee.toNumber(), actualFee, "Project fee do not match")
            })
            it('updates project fee when invoked by owner', async () => {
                txObject = await FAVEConInstance.updateFee(updatedFee, { from: owner, gas })
                assert.equal(txObject.receipt.status, true, "Update project fee failed")
            })
            it('after update project fee is 3.5e4', async () => {
                fee = await FAVEConInstance.projectFee.call()
                assert.equal(fee.toNumber(), updatedFee, "Project fee do not match")
            })
            it('sets the fee to actualFee', async () => {
                txObject = await FAVEConInstance.updateFee(actualFee, { from: owner, gas })
                assert.equal(txObject.receipt.status, true, "Update project fee failed")
            })
        })

        describe('burn', () => {
            let balance;
            const burnAmount = new BigNumber(1e10) // 1000 FAVE
            context('reverts', () => {
                before(async () => {
                    await FAVEConInstance.pause({ from: owner, gas });
                });
                it('when contract is paused', async () => {
                    await expectRevert(
                        FAVEConInstance.burn(burnAmount, { from: acc1, gas }),
                        "Pausable: paused"
                    )
                });
                after(async () => {
                    await FAVEConInstance.unpause({ from: owner, gas });
                    await FAVEConInstance.transfer(acc1, burnAmount, { from: owner, gas }) // Transfers 990 FAVE from Owner to acc1
                });
            })
            context('success', () => {
                it('should check project balance is 10 FAVE', async () => {
                    balance = new BigNumber(await FAVEConInstance.balanceOf.call(project));
                    assert.equal(balance.toNumber(), 10e7, "Balance do not match")
                })
                it("before burn account balance is 990 FAVE for acc1", async () => {
                    balance = new BigNumber(await FAVEConInstance.balanceOf.call(acc1));
                    assert.equal(balance.toNumber(), 9.9e9, "Balance do not match")
                })
                it('burns 990 FAVE coins of acc1', async () => {
                    txObject = await FAVEConInstance.burn(9.9e9, { from: acc1, gas })
                    assert.equal(txObject.receipt.status, true, "Token burn failed")
                })
                it('should check project balance is 19 FAVE', async () => {
                    balance = new BigNumber(await FAVEConInstance.balanceOf.call(project));
                    assert.equal(balance.toNumber(), 1.99e8, "Balance do not match")
                })
                it("after burn account balance is 0 for acc1", async () => {
                    balance = new BigNumber(await FAVEConInstance.balanceOf.call(acc1));
                    assert.equal(balance.toNumber(), 0, "Balance do not match")
                })
            })
        })

        describe('transfer', () => {
            const transferAmount = 5e9; // 500 FAVE
            const mintAmount = new BigNumber(1e10) // 1000 FAVE
            let balance;
            before(async () => {
                await FAVEConInstance.transferWithoutFeeDeduction(acc3, mintAmount, { from: owner, gas })
                await FAVEConInstance.transferWithoutFeeDeduction(acc4, mintAmount, { from: owner, gas })
            })
            it('should check project balance is 19 FAVE', async () => {
                balance = new BigNumber(await FAVEConInstance.balanceOf.call(project));
                assert.equal(balance.toNumber(), 1.99e8, "Balance do not match")
            })
            it("after trasfer w/o fee deduction account balance is 1000 FAVE for acc3", async () => {
                balance = new BigNumber(await FAVEConInstance.balanceOf.call(acc3));
                assert.equal(balance.toNumber(), 1e10, "Balance do not match")
            })
            it("after transfer w/o fee deduction account balance is 1000 FAVE for acc4", async () => {
                balance = new BigNumber(await FAVEConInstance.balanceOf.call(acc4));
                assert.equal(balance.toNumber(), 1e10, "Balance do not match")
            })
            it('should transfer 500 FAVE from acc3 to acc4', async () => {
                txObject = await FAVEConInstance.transfer(acc4, transferAmount, { from: acc3, gas });
                assert.equal(txObject.receipt.status, true, "Token transfer failed")
            })
            it('after transfer should check project balance is 24.9 FAVE', async () => {
                balance = new BigNumber(await FAVEConInstance.balanceOf.call(project));
                assert.equal(balance.toNumber(), 2.49e8, "Balance do not match")
            })
            it("after transfer account balance is 500 FAVE for acc3", async () => {
                balance = new BigNumber(await FAVEConInstance.balanceOf.call(acc3));
                assert.equal(balance.toNumber(), 5e9, "Balance do not match")
            })
            it("after transfer account balance is 1495 FAVE for acc4", async () => {
                balance = new BigNumber(await FAVEConInstance.balanceOf.call(acc4));
                assert.equal(balance.toNumber(), 1.495e10, "Balance do not match")
            })
        })

        describe('transferFrom', () => {
            const transferAmount = 5e9; // 500 FAVE
            let balance;
            before(async () => {
                await FAVEConInstance.approve(acc3, constants.MAX_UINT256, { from: acc4, gas })
            })
            it('should transfer 500 FAVE from acc4 to acc3', async () => {
                txObject = await FAVEConInstance.transferFrom(acc4, acc2, transferAmount, { from: acc3, gas });
                assert.equal(txObject.receipt.status, true, "Token transfer failed")
            })
            it('after transferFrom should check project balance is 29.9 FAVE', async () => {
                balance = new BigNumber(await FAVEConInstance.balanceOf.call(project));
                assert.equal(balance.toNumber(), 2.99e8, "Balance do not match")
            })
            it("after transferFrom account balance is 495 FAVE for acc2", async () => {
                balance = new BigNumber(await FAVEConInstance.balanceOf.call(acc2));
                assert.equal(balance.toNumber(), 4.95e9, "Balance do not match")
            })
            it("after transferFrom account balance is 995 FAVE for acc4", async () => {
                balance = new BigNumber(await FAVEConInstance.balanceOf.call(acc4));
                assert.equal(balance.toNumber(), 9.95e9, "Balance do not match")
            })
            it("after transferFrom account balance is unchanged for acc3 even though it was the msg.sender in transferFrom call", async () => {
                balance = new BigNumber(await FAVEConInstance.balanceOf.call(acc3));
                assert.equal(balance.toNumber(), 5e9, "Balance do not match")
            })
        })

        context('transferWithoutFeeDeduction', () => {
            const transferAmount = 2.99e8; //29.9 FAVE
            let balance;
            it('reverts when caller is not project', async () => {
                await expectRevert(
                    FAVEConInstance.transferWithoutFeeDeduction(newProject, transferAmount, { from: nonOwner, gas }),
                    "Caller is neither project nor owner"
                )
            });
            it("should transfer 29.9 FAVE to newProject", async () => {
                txObject = await FAVEConInstance.transferWithoutFeeDeduction(newProject, transferAmount, { from: project, gas });
                assert.equal(txObject.receipt.status, true, "Transfer w/o fee deduction failed");
            })
            it("after transferWithoutFeeDeduction account balance is 0 FAVE for project", async () => {
                balance = new BigNumber(await FAVEConInstance.balanceOf.call(project));
                assert.equal(balance.toNumber(), 0, "Balance do not match")
            })
            it("after transferWithoutFeeDeduction account balance is 29.9 FAVE for newProject", async () => {
                balance = new BigNumber(await FAVEConInstance.balanceOf.call(newProject));
                assert.equal(balance.toNumber(), transferAmount, "Balance do not match")
            })
        })

        context('updateProject', () => {
            it('reverts when new project is address zero', async () => {
                await expectRevert(
                    FAVEConInstance.updateProject(constants.ZERO_ADDRESS, { from: owner, gas }),
                    "New project can't be address zero"
                )
            });
            it('reverts when old & new project are the same', async () => {
                await expectRevert(
                    FAVEConInstance.updateProject(project, { from: owner, gas }),
                    "New project can't be old project"
                )
            });
            it('should update project successfully', async () => {
                txObject = await FAVEConInstance.updateProject(newProject, { from: owner, gas });
                assert.equal(txObject.receipt.status, true, "Project update failed");
            });
            it('should check for LogProjectChanged event', async () => {
                await expectEvent(
                    txObject.receipt,
                    'LogProjectChanged',
                    {
                        oldProject: project,
                        newProject
                    }
                );
            });
            it('should verify newProject is set as expected', async () => {
                const wallet = await FAVEConInstance.project.call();
                assert.equal(wallet, newProject, "Wallets do not match.")
            })
        });

        context('withdrawAll', () => {
            it('sends 1 ether to the contract', async () => {
                txObject = await FAVEConInstance.send(new BigNumber(1e18), { from: owner, gas })
                assert.equal(txObject.receipt.status, true, "Ether send failed")
            })

            it('should verify contract balance to be 1 Eth', async () => {
                const balanceEth = await balance.current(FAVEConInstance.address, 'ether')
                assert.equal(balanceEth.toNumber(), 1, "Balances do not match")
            })

            it('should withdraw 1 Eth from the contract', async () => {
                txObject = await FAVEConInstance.withdrawAll({ from: owner, gas })
                assert.equal(txObject.receipt.status, true, "Withdraw failed")
            })

            it('after withdraw should verify contract balance to be 0 Eth', async () => {
                const balanceEth = await balance.current(FAVEConInstance.address, 'ether')
                assert.equal(balanceEth.toNumber(), 0, "Balances do not match")
            })
        })
    })
})