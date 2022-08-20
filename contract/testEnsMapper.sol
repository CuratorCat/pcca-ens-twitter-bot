// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

contract TestEnsMapper {
   event RegisterSubdomain(address indexed registrar, uint256 indexed token_id, string indexed label);
   function setDomain(string calldata label, uint256 token_id) public {      
      emit RegisterSubdomain(msg.sender, token_id, label);     
   }
}