// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * Web3 Witch — Daily Card (ERC-721)
 * — 1 бесплатный минт в сутки на адрес (платят только газ)
 * — tokenURI передаём с фронта (ipfs://.../YYYY-MM-DD/<slug>.json)
 * — Пауза минта через setPaused
 * Совместимо с OpenZeppelin v4.x (Ownable() без аргументов)
 */
contract DailyCard is ERC721URIStorage, Ownable {
    uint256 public nextId;
    bool public paused;

    // UTC-день последнего минта для адреса
    mapping(address => uint64) public lastMintDay;

    // OZ v4: конструктор Ownable() БЕЗ аргументов
    constructor() ERC721("Web3 Witch: Daily Card", "W3WDC") Ownable() {}

    function _todayUTC() internal view returns (uint64) {
        return uint64(block.timestamp / 1 days);
    }

    function canMint(address user) public view returns (bool) {
        return lastMintDay[user] < _todayUTC();
    }

    function mint(string calldata tokenURI_) external {
        require(!paused, "Mint is paused");
        uint64 today = _todayUTC();
        require(lastMintDay[msg.sender] < today, "Already minted today");

        uint256 tokenId = ++nextId;
        lastMintDay[msg.sender] = today;

        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, tokenURI_);
    }

    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
    }
}

