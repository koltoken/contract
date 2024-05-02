import { AllContractInfoWithERC20, deployAllContractWithERC20 } from "./deployWithERC20";
import { AllContractInfoWithETH, deployAllContractWithETH } from "./deployWithETH";
import { ZERO_ADDRESS, getAllContractAddress } from "./deploy_utils";

export type AllContractInfo = {
    erc20: AllContractInfoWithERC20,
    eth: AllContractInfoWithETH
}

export { ZERO_ADDRESS };
export { getAllContractAddress }

export async function deployAllContracts(): Promise<AllContractInfo> {
    let infoWithERC20 = await deployAllContractWithERC20();
    let infoWithETH = await deployAllContractWithETH();
    return {
        erc20: infoWithERC20,
        eth: infoWithETH
    }
}
