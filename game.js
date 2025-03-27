const suits = ["hearts", "diamonds", "clubs", "spades"];
const ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "jack", "queen", "king", "ace"];

let deck = [];
let players = [{hand: [], bid: 0, tricksWon: 0}, {hand: [], bid: 0, tricksWon: 0}, {hand: [], bid: 0, tricksWon: 0}, {hand: [], bid: 0, tricksWon: 0}];

let teamScores = { A: 0, B: 0 };
let teamBags = { A: 0, B: 0 };
let roundNumber = 1;
let currentPlayer = 0;
let startingPlayer = 0;
let currentTrick = [];
let leadingSuit = null;

// Create and shuffle deck
function createDeck() {
    deck = [];
    for (let suit of suits) {
        for (let rank of ranks) {
            deck.push({ suit, rank, image: `images/${rank}_of_${suit}.svg` });
        }
    }
    deck.sort(() => Math.random() - 0.5);
}

// Sorting order for suits
const suitOrder = { "clubs": 0, "diamonds": 1, "hearts": 2, "spades": 3 };

// Deal cards to players
function dealCards() {
    players.forEach(player => {
        player.hand = [];
        player.tricksWon = 0;
    });

    for (let i = 0; i < 52; i++) {
        players[i % 4].hand.push(deck[i]);
    }

    players.forEach(player => {
        player.hand.sort((a, b) => {
            let suitComparison = suitOrder[a.suit] - suitOrder[b.suit];
            if (suitComparison !== 0) {
                return suitComparison; 
            }
            return ranks.indexOf(a.rank) - ranks.indexOf(b.rank); 
        });
    });

    displayHands(); // ✅ Ensure hands are shown right after dealing
}


// Ask players to bid (random for now)
function placeBids() {
    let bidModal = document.getElementById("bid-modal");
    let bidTitle = document.getElementById("bid-modal-title");
    let bidMessage = document.getElementById("bid-modal-message");
    let bidInput = document.getElementById("bid-input");
    let bidSubmit = document.getElementById("bid-submit");

    let currentPlayerIndex = startingPlayer;

    function submitBid() {
        let player = players[currentPlayerIndex];
        let bid = parseInt(bidInput.value, 10);

        if (!isNaN(bid) && bid >= 0 && bid <= 13) {
            player.bid = bid;
            displayHands(); // ✅ Update UI immediately
            updateScoreboard(); // ✅ Ensure bids are visible
            
            bidModal.style.display = "none"; // Hide modal
            
            currentPlayerIndex = (currentPlayerIndex + 1) % 4;
            
            if (currentPlayerIndex !== startingPlayer) {
                setTimeout(askForBid, 500); // ✅ Move to next player
            }
        } else {
            alert("Invalid bid. Please enter a number between 0 and 13.");
        }
    }

    function askForBid() {
        let player = players[currentPlayerIndex];

        // ✅ Update modal with player turn
        bidTitle.innerText = `Player ${currentPlayerIndex + 1}, it's your turn to bid!`;
        bidMessage.innerText = "Enter your bid (0-13):";
        bidInput.value = "";
        bidInput.focus();
        bidModal.style.display = "block"; // Show modal

        bidSubmit.onclick = submitBid; // ✅ Handle click event

        // ✅ Handle Enter key
        bidInput.onkeydown = function(event) {
            if (event.key === "Enter") {
                submitBid();
            }
        };
    }
    
    askForBid();
}

// Display player hands
function displayHands() {
    for (let i = 0; i < 4; i++) {
        let playerDiv = document.getElementById(`player-${i + 1}`);
        playerDiv.innerHTML = `Player ${i + 1} (Bid: ${players[i].bid}, Tricks: ${players[i].tricksWon}):<br>`;

        players[i].hand.forEach((card, index) => {
            let img = document.createElement("img");
            img.src = card.image;
            img.alt = `${card.rank} of ${card.suit}`;
            img.classList.add("card");
            img.onclick = () => playCard(i, index);
            playerDiv.appendChild(img);
        });
    }
}

// Find the player with the 2 of clubs for the first round
function findFirstPlayer() {
    for (let i = 0; i < 4; i++) {
        if (players[i].hand.some(card => card.rank === "2" && card.suit === "clubs")) {
            return i;
        }
    }
    return 0; // Should never happen, but fallback
}


// Play a card
let firstTrickPlayed = false; // Track if the first trick has been played
let spadesBroken = false; // Track if spades have been played

function playCard(playerIndex, cardIndex) {
    if (playerIndex !== currentPlayer) return;

    let card = players[playerIndex].hand[cardIndex];

    // Ensure the first trick starts with the 2 of clubs, but only for the very first trick
    if (roundNumber === 1 && !firstTrickPlayed && currentTrick.length === 0) {
        if (card.rank !== "2" || card.suit !== "clubs") {
            alert("You must play the 2 of clubs to start the game!");
            return;
        }
    }

    // Standard rule: Follow suit if possible
    if (currentTrick.length > 0) {
        if (card.suit !== leadingSuit && players[playerIndex].hand.some(c => c.suit === leadingSuit)) {
            alert("You must follow suit if possible!");
            return;
        }
    } else {
        // Lead card rules (first card of the trick)
        if (card.suit === "spades" && !spadesBroken) {
            // Check if the player has any other suits available
            if (players[playerIndex].hand.some(c => c.suit !== "spades")) {
                alert("You cannot lead with a Spade until Spades have been broken!");
                return;
            }
        }
        leadingSuit = card.suit; // Set leading suit for this trick
    }

    // If a spade is played, mark spades as broken
    if (card.suit === "spades") {
        spadesBroken = true;
    }

    // Remove card from player's hand and add to trick
    players[playerIndex].hand.splice(cardIndex, 1);
    currentTrick.push({ player: playerIndex, card });

    updateTrickDisplay();

    // Move to the next player or determine the trick winner
    if (currentTrick.length === 4) {
        setTimeout(() => {
            determineTrickWinner();
            if (roundNumber === 1 && !firstTrickPlayed) {
                firstTrickPlayed = true; // Mark first trick as completed
            }
        }, 1000);
    } else {
        currentPlayer = (currentPlayer + 1) % 4;
    }
}

// Display trick area
function updateTrickDisplay() {
    let trickDiv = document.getElementById("trick-area");
    trickDiv.innerHTML = "Current Trick: ";
    
    currentTrick.forEach(entry => {
        let img = document.createElement("img");
        img.src = entry.card.image;
        img.alt = `${entry.card.rank} of ${entry.card.suit}`;
        img.classList.add("card");
        trickDiv.appendChild(img);
    });
}

// Determine trick winner
function determineTrickWinner() {
    let highestCard = null;
    let winner = null;

    for (let entry of currentTrick) {
        if (!highestCard) {
            highestCard = entry.card;
            winner = entry.player;
        } else {
            // If current card is spades and previous highest is not spades, it wins
            if (entry.card.suit === "spades" && highestCard.suit !== "spades") {
                highestCard = entry.card;
                winner = entry.player;
            }
            // If both cards are spades, the higher-ranked one wins
            else if (entry.card.suit === "spades" && highestCard.suit === "spades") {
                if (ranks.indexOf(entry.card.rank) > ranks.indexOf(highestCard.rank)) {
                    highestCard = entry.card;
                    winner = entry.player;
                }
            }
            // If both are the leading suit, the higher-ranked one wins
            else if (entry.card.suit === leadingSuit && highestCard.suit === leadingSuit) {
                if (ranks.indexOf(entry.card.rank) > ranks.indexOf(highestCard.rank)) {
                    highestCard = entry.card;
                    winner = entry.player;
                }
            }
        }
    }

    players[winner].tricksWon++;
    alert(`Player ${winner + 1} wins the trick with the ${highestCard.rank} of ${highestCard.suit}!`);
    currentTrick = [];
    leadingSuit = null;
    currentPlayer = winner;

    if (players[0].hand.length === 0) {
        calculateScores();
    } else {
        displayHands();
    }
}

// Calculate scores and handle bags
function calculateScores() {
    let teamATricks = players[0].tricksWon + players[3].tricksWon;
    let teamBTricks = players[1].tricksWon + players[2].tricksWon;
    
    let teamABid = players[0].bid + players[3].bid;
    let teamBBid = players[1].bid + players[2].bid;

    let teamAPoints = (teamATricks >= teamABid) ? 
        (teamABid * 10 + Math.max(0, teamATricks - teamABid)) : 
        (-teamABid * 10); // Penalty for failing bid

    let teamBPoints = (teamBTricks >= teamBBid) ? 
        (teamBBid * 10 + Math.max(0, teamBTricks - teamBBid)) : 
        (-teamBBid * 10); // Penalty for failing bid

    let teamABags = Math.max(0, teamATricks - teamABid);
    let teamBBags = Math.max(0, teamBTricks - teamBBid);

    teamScores.A += teamAPoints;
    teamScores.B += teamBPoints;
    
    teamBags.A += teamABags;
    teamBags.B += teamBBags;

    if (teamBags.A >= 10) {
        teamScores.A -= 100;
        teamBags.A -= 10;
    }

    if (teamBags.B >= 10) {
        teamScores.B -= 100;
        teamBags.B -= 10;
    }

    updateScoreboard();
    
    if (teamScores.A >= 500 || teamScores.B >= 500) {
        alert(`Game Over! Team ${teamScores.A >= 500 ? "A" : "B"} wins!`);
    } else {
        startNewRound();
    }
}

// Update scoreboard
function updateScoreboard() {
    document.getElementById("scoreboard").innerHTML = `
        Team A: ${teamScores.A} points, Bags: ${teamBags.A} <br>
        Team B: ${teamScores.B} points, Bags: ${teamBags.B}
    `;
}

// Start a new round, rotating the starting player clockwise
function startNewRound() {
    roundNumber++;
    createDeck();
    dealCards();
    displayHands(); // ✅ Show hands immediately after dealing
    setTimeout(placeBids, 1000); // ✅ Slight delay to ensure rendering before bidding

    
    // First round: find the player with the 2 of clubs
    if (roundNumber === 1) {
        currentPlayer = findFirstPlayer();
    } else {
        // Subsequent rounds: rotate clockwise
        currentPlayer = (startingPlayer + 1) % 4;
    }

    startingPlayer = currentPlayer; // Track new starting player
    updateScoreboard();
}

// Start game
function startGame() {
    createDeck();
    dealCards();
    displayHands(); // ✅ Show hands immediately after dealing
    setTimeout(placeBids, 1000); // ✅ Slight delay to ensure rendering before bidding
    updateScoreboard();

    if (roundNumber === 1) {
        currentPlayer = findFirstPlayer();
    } else {
        currentPlayer = (startingPlayer + 1) % 4;
    }

    startingPlayer = currentPlayer;
}


// Initialize the game on window load
window.onload = startGame;
