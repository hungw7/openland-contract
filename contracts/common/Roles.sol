//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <=0.9.0;

library Roles {
	struct Role {
		mapping(address => bool) bearer;
	}

	function add(Role storage role, address account) internal {
		require(!has(role, account), "Roles#add: account already has role");
		role.bearer[account] = true;
	}

	function remove(Role storage role, address account) internal {
		require(has(role, account), "Roles#remove: account does not have role");
		role.bearer[account] = false;
	}

	function has(Role storage role, address account) internal view returns(bool) {
		require(account != address(0), "Roles#has: account is not valid");
		return role.bearer[account];
	}
}