import { ethers } from "ethers";
import { WalletProvider } from "./walletSlice";
import { http } from "../../services/AxiosHelper";
import { GET_WALLET } from "../../services/APIurls";
import { IWalletModel } from "../../model/Wallet.model";
import { signAuth } from "../../utils/signingAuth";

export const walletConnector = async () => {
	const provider = new ethers.providers.Web3Provider(window.ethereum);

	// MetaMask requires requesting permission to connect users accounts
	const accounts = await provider.send("eth_requestAccounts", []);

	// The MetaMask plugin also allows signing transactions to
	// send ether and pay to change state within the blockchain.
	// For this, you need the account signer...
	const signer = provider.getSigner(accounts[0]);
	const address = await signer.getAddress();
	const balance = await signer.getBalance("latest");

	const wallet: WalletProvider = {
		address,
		signer,
		balance,
		walletInfo: {} as IWalletModel
	};

	try {
		const verifyMsg = await signAuth(signer);
		const resVerified = await http.post<any>("/auth/verify", {
			signature: verifyMsg.signature,
			nonce: verifyMsg.nonce
		});

		if (resVerified.status === 200) {
			localStorage.setItem("accessToken", resVerified.data.accessToken);
		}

		const walletInfoApiResponse = await http.get<IWalletModel>(
			`${GET_WALLET}/${wallet.address}`
		);
		wallet.walletInfo = walletInfoApiResponse.data;
		return wallet;
	} catch (e: any) {
		return undefined;
	}
};
