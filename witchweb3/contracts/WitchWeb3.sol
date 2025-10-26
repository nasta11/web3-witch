// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

/**
 * WitchWeb3 — ERC-721 с несколькими колодами по 21 карте
 * - Любое число колод (addDeck)
 * - В каждой колоде ровно 21 NFT
 * - Отдельные baseURI / placeholder / reveal / price на колоду
 * - Общая пауза, роялти (ERC2981), вывод средств
 * OZ: ^5.x
 */

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {ERC2981} from "@openzeppelin/contracts/token/common/ERC2981.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

contract WitchWeb3 is
    ERC721,
    ERC721Enumerable,
    ERC2981,
    Ownable,
    Pausable,
    ReentrancyGuard
{
    using Strings for uint256;

    uint256 public constant CARDS_PER_DECK = 21;
    uint256 public maxPerTx = 3;      // лимит за одну транзу для ОДНОЙ колоды
    uint256 public maxPerWallet = 5;  // лимит на кошелек внутри ОДНОЙ колоды

    struct Deck {
        string name;
        string baseURI;
        string placeholderURI;
        bool   revealed;
        bool   active;
        uint256 minted;      // 0..21
        uint256 priceWei;    // цена минта в этой колоде
    }

    uint256 public deckCount;
    mapping(uint256 => Deck) public decks;                              // deckId => Deck
    mapping(uint256 => uint256) public tokenToDeck;                     // tokenId => deckId
    mapping(uint256 => uint256) public tokenNumberInDeck;               // tokenId => 1..21
    mapping(uint256 => mapping(address => uint256)) public mintedByWalletInDeck; // deckId => wallet => count

    uint256 private _nextTokenId = 1;

    event DeckAdded(uint256 indexed deckId, string name, string baseURI, uint256 priceWei);
    event DeckUpdated(uint256 indexed deckId, string baseURI, bool active, uint256 priceWei);
    event DeckRevealSet(uint256 indexed deckId, bool revealed, string placeholderURI);
    event TokenMinted(address indexed minter, uint256 indexed deckId, uint256 tokenId, uint256 numberInDeck);
    event LimitsUpdated(uint256 maxPerTx, uint256 maxPerWallet);
    event Withdrawn(address to, uint256 amount);

    constructor(
        // Инициализируем 2 колоды: Arcana и Meme
        string memory arcanaBaseURI,
        string memory memeBaseURI,
        string memory arcanaPlaceholderURI,
        string memory memePlaceholderURI,
        uint256 arcanaPriceWei,
        uint256 memePriceWei,
        address royaltyReceiver,
        uint96 royaltyBps
    )
        ERC721("WitchWeb3", "W3W")
        Ownable(msg.sender)
    {
        _addDeckInternal(
            "Arcana",
            arcanaBaseURI,
            arcanaPlaceholderURI,
            bytes(arcanaPlaceholderURI).length == 0, // "" => сразу revealed
            true,
            arcanaPriceWei
        );
        _addDeckInternal(
            "Meme",
            memeBaseURI,
            memePlaceholderURI,
            bytes(memePlaceholderURI).length == 0,
            true,
            memePriceWei
        );

        _setDefaultRoyalty(royaltyReceiver, royaltyBps);
    }

    // ---------- Минт ----------
    function mintFromDeck(uint256 deckId, uint256 amount)
        external
        payable
        whenNotPaused
        nonReentrant
    {
        require(deckId > 0 && deckId <= deckCount, "Invalid deck");
        require(amount > 0 && amount <= maxPerTx, "Invalid amount");

        Deck storage deck = decks[deckId];
        require(deck.active, "Deck not active");
        require(deck.minted + amount <= CARDS_PER_DECK, "Deck full");

        require(
            mintedByWalletInDeck[deckId][msg.sender] + amount <= maxPerWallet,
            "Wallet limit exceeded for deck"
        );

        uint256 need = deck.priceWei * amount;
        require(msg.value >= need, "Insufficient ETH");

        for (uint256 i = 0; i < amount; i++) {
            uint256 tokenId = _nextTokenId++;
            uint256 numberInDeck = ++deck.minted; // 1..21
            tokenToDeck[tokenId] = deckId;
            tokenNumberInDeck[tokenId] = numberInDeck;
            mintedByWalletInDeck[deckId][msg.sender] += 1;
            _safeMint(msg.sender, tokenId);
            emit TokenMinted(msg.sender, deckId, tokenId, numberInDeck);
        }

        if (msg.value > need) {
            (bool ok, ) = payable(msg.sender).call{value: msg.value - need}("");
            require(ok, "Refund failed");
        }
    }

    // ---------- Управление колодами ----------
    function addDeck(
        string calldata name_,
        string calldata baseURI_,
        string calldata placeholderURI_,
        bool active_,
        bool revealed_,
        uint256 priceWei_
    ) external onlyOwner returns (uint256) {
        return _addDeckInternal(name_, baseURI_, placeholderURI_, revealed_, active_, priceWei_);
    }

    function _addDeckInternal(
        string memory name_,
        string memory baseURI_,
        string memory placeholderURI_,
        bool revealed_,
        bool active_,
        uint256 priceWei_
    ) internal returns (uint256) {
        deckCount += 1;
        decks[deckCount] = Deck({
            name: name_,
            baseURI: baseURI_,
            placeholderURI: placeholderURI_,
            revealed: revealed_,
            active: active_,
            minted: 0,
            priceWei: priceWei_
        });
        emit DeckAdded(deckCount, name_, baseURI_, priceWei_);
        return deckCount;
    }

    function setDeckBaseURI(uint256 deckId, string calldata newBaseURI) external onlyOwner {
        decks[deckId].baseURI = newBaseURI;
        emit DeckUpdated(deckId, newBaseURI, decks[deckId].active, decks[deckId].priceWei);
    }

    function setDeckActive(uint256 deckId, bool active_) external onlyOwner {
        decks[deckId].active = active_;
        emit DeckUpdated(deckId, decks[deckId].baseURI, active_, decks[deckId].priceWei);
    }

    function setDeckReveal(uint256 deckId, bool revealed_) external onlyOwner {
        decks[deckId].revealed = revealed_;
        emit DeckRevealSet(deckId, revealed_, decks[deckId].placeholderURI);
    }

    function setDeckPlaceholder(uint256 deckId, string calldata uri) external onlyOwner {
        decks[deckId].placeholderURI = uri;
        emit DeckRevealSet(deckId, decks[deckId].revealed, uri);
    }

    function setDeckPrice(uint256 deckId, uint256 priceWei_) external onlyOwner {
        decks[deckId].priceWei = priceWei_;
        emit DeckUpdated(deckId, decks[deckId].baseURI, decks[deckId].active, priceWei_);
    }

    // ---------- Продажи (общ.)
    function setLimits(uint256 newMaxPerTx, uint256 newMaxPerWallet) external onlyOwner {
        require(newMaxPerTx > 0 && newMaxPerWallet > 0, "Zero limit");
        maxPerTx = newMaxPerTx;
        maxPerWallet = newMaxPerWallet;
        emit LimitsUpdated(newMaxPerTx, newMaxPerWallet);
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    // ---------- Вывод средств ----------
    function withdraw(address payable to) external onlyOwner nonReentrant {
        uint256 bal = address(this).balance;
        require(bal > 0, "No funds");
        (bool ok, ) = to.call{value: bal}("");
        require(ok, "Withdraw failed");
        emit Withdrawn(to, bal);
    }

    // ---------- Метаданные ----------
    function tokenURI(uint256 tokenId) public view override(ERC721) returns (string memory) {
        _requireOwned(tokenId);
        uint256 deckId = tokenToDeck[tokenId];
        Deck memory deck = decks[deckId];

        if (!deck.revealed && bytes(deck.placeholderURI).length > 0) {
            return deck.placeholderURI;
        }
        uint256 n = tokenNumberInDeck[tokenId]; // 1..21
        return string(abi.encodePacked(deck.baseURI, n.toString(), ".json"));
    }

    // ---------- Совместимость интерфейсов ----------
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC2981)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }
}

