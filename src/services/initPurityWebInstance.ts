import { default as PurityWeb } from "../contracts/PurityWeb";
import { ExtendedWeb3Client } from "../IApp";
import { Environment } from "../environments/Environment";

//Necessary to put into separate service because the childContracts sometimes initializate their parentContract
export function initPurityWebInstance(web3: ExtendedWeb3Client) {
  const purityContractAddress = Environment.purityWebAddress;

  const purityWeb = new PurityWeb({
    web3: web3,
    contractAddress: purityContractAddress
  });
  return purityWeb;
}
