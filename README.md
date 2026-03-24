# UNO Multiplayer Game

A real-time, beautifully animated, highly polished multiplayer UNO card game built for the browser. Play seamlessly with friends or challenging bots without installing anything.

![UNO](https://uno-cards.vercel.app/favicon.ico) *(Replace with actual screenshot)*

## ✨ Features

*   **Real-time Multiplayer:** Play instantly with friends using room codes.
*   **Smart Bots:** AI players automatically fill empty seats and think logically.
*   **Advanced Stacking Engine:** 
    *   `+2` stacks on `+2`.
    *   `+4` stacks on `+4` AND `+2`.
    *   If you can't stack, you draw the *entire* accumulated penalty!
*   **Power Card Restrictions:** No lucky single draws when under a stack attack. You must stack or face the penalty!
*   **Color Discard All:** A brand-new custom `✹` card rule that instantly discards all cards in your hand matching the active color.
*   **Match Timers:** Set games to Unlimited, 3 Minutes, or 5 Minutes. The player with the fewest cards when the timer hits zero wins organically!
*   **Reverse Logic:** Authentic 2-player reverse mechanics (Reverse acts as a Skip).
*   **Framer Motion UI:** Hyper-smooth card dragging, sliding drops, dropping animations, and mobile-responsive overlaps.
*   **Sound Engine:** Satisfying Web Audio API sounds for drawing, playing, and attacking.

## 🛠️ Tech Stack

*   **Frontend:** Next.js 14 (App Router), React 19, TypeScript
*   **Styling:** Custom CSS, Tailwind CSS, Framer Motion
*   **Backend:** Node.js, [Colyseus](https://colyseus.io/) (Real-time Multiplayer Framework)
*   **Deployment:** Vercel (Frontend), Render / Fly.io (Backend WebSocket Server)

## 🚀 How to Run Locally

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/uno-cards.git
cd uno-cards
```

### 2. Start the Backend (Colyseus WebSocket Server)
```bash
cd backend
npm install
npm run dev
```
The server will start on `ws://localhost:2567`.

### 3. Start the Frontend (Next.js)
Open a new terminal window:
```bash
cd frontend
npm install
npm run dev
```

### 4. Play
Open `http://localhost:3000` in your browser. (The framework automatically connects to your local `ws://localhost:2567` during development).

## 📜 Game Rules

*   **Objective:** Be the first player to get rid of all the cards in your hand.
*   **Matching:** Play a card that matches the **color** or **value/symbol** of the top card on the discard pile.
*   **Action Cards:**
    *   **Skip (`⊘`):** Skips the next player's turn.
    *   **Reverse (`↺`):** Reverses the direction of play. (In a 2-player game, this skips the opponent!).
    *   **Draw 2 (`+2`):** Next player must draw 2 cards and skip their turn, UNLESS they can stack another `+2` or `+4` on top!
    *   **Wild (`★`):** Change the active color. Can be played on anything.
    *   **Wild Draw 4 (`+4`):** Change the color AND force the next player to draw 4 cards. They can *only* respond by stacking another `+4`!
    *   **Discard All (`✹`):** Discards *all* cards from your hand that match the current active color.
*   **Say UNO:** When you have exactly 2 cards left, you must hit the **UNO!** button before playing a card to warn others you are on your last card. If you forget and someone catches you, you draw a penalty!

## 🔮 Future Improvements
*   Global leaderboards and player accounts.
*   More custom card varieties (e.g., Swap Hands, Blank Wild).
*   In-game chat / emoji reactions.

---
Built with ❤️ using Next.js & Colyseus.
