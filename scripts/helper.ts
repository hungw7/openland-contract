import { ethers } from "ethers";

function getEnvVariable(key: string, defaultReturn?: string): string {
  if (process.env[key]) {
    return process.env[key]!;
  }

  if (!defaultReturn) {
    throw new Error(`${key} is not provided or default`);
  }

  return defaultReturn;
}

export function getProvider(): ethers.providers.BaseProvider {
  return ethers.getDefaultProvider(getEnvVariable("NETWORK", "rinkeby"), {
    etherscan: getEnvVariable("ETHERSCAN_API_KEY"),
    infura: {
      projectId: getEnvVariable("PROJECT_ID"),
      projectSecret: getEnvVariable("PROJECT_SECRET")
    }
  });
}

export function getAccount() {
  return new ethers.Wallet(
    getEnvVariable("DEPLOYER_PRIVATE_KEY"),
    getProvider()
  );
}
