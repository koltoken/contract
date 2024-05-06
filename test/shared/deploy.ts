import { ZERO_ADDRESS, getAllContractAddress } from "./deploy_utils";
import { AllContractInfoWithERC20, deployAllContractWithERC20 } from "./deployWithERC20";
import { AllContractInfoWithETH, deployAllContractWithETH } from "./deployWithETH";
import { AllContractInfoWithERC20Proxy, deployAllContractWithERC20Proxy } from "./deployWithERC20Proxy";
import { AllContractInfoWithETHProxy, deployAllContractWithETHProxy } from "./deployWithETHProxy";

export type AllContractInfo = {
    erc20: AllContractInfoWithERC20,
    eth: AllContractInfoWithETH,
    erc20Proxy: AllContractInfoWithERC20Proxy,
    ethProxy: AllContractInfoWithETHProxy,
}

export { ZERO_ADDRESS };
export { getAllContractAddress }

export async function deployAllContracts(): Promise<AllContractInfo> {
    let infoWithERC20 = await deployAllContractWithERC20();
    let infoWithETH = await deployAllContractWithETH();
    let infoWithERC20Proxy = await deployAllContractWithERC20Proxy();
    let infoWithETHProxy = await deployAllContractWithETHProxy();
    return {
        erc20: infoWithERC20,
        eth: infoWithETH,
        erc20Proxy: infoWithERC20Proxy,
        ethProxy: infoWithETHProxy,
    }
}
