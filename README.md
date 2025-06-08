# Chess Extension for VS Code

Play chess directly in VS Code with an intelligent AI opponent, clickable move recommendations from chat, and smooth visual animations.

## 🎥 Demo

[Chess Extension Demo](https://github.com/user-attachments/assets/2d752a73-3745-40ff-9d4c-a0372401f18d)

## ✨ Key Features

- **Interactive Chess Board**: Click-to-move gameplay with full rules validation
- **Smart AI Opponent**: Built-in chess engine with strategic evaluation
- **Chat Integration**: Get AI move recommendations via `@chess-master` with clickable buttons
- **Move Animations**: Golden arrows trace move paths in all directions
- **Game Management**: Timer, move history, captured pieces, and new game functionality
- **Smart Validation**: Outdated move buttons automatically invalidated as game progresses

## 🚀 Quick Start

1. Open Command Palette (`Ctrl+Shift+P`)
2. Run "Chess: Open Chess Board"
3. Click pieces to move them
4. Use `@chess-master suggest a move` in chat for AI recommendations

## 💬 Chat Commands

Open VS Code chat panel and use:
- `@chess-master suggest a move`
- `@chess-master what should I do?`
- `@chess-master analyze this position`

AI responses include clickable move buttons that apply moves directly to the board.

## 🎮 Features

### Gameplay
- Click-to-move with visual highlighting
- Complete chess rules validation
- AI opponent with 1.5s thinking delay
- Game timer and move history with player labels

### Visual Effects
- Golden animated arrows for all moves
- Square highlighting for source/destination
- 1-second smooth fade animations
- Multi-directional arrow support

### Smart Protection
- Move buttons expire when game progresses
- Friendly warnings for outdated actions
- Automatic chat redirection for new suggestions

## Requirements

- VS Code 1.100.0+
- Internet connection for chat features

## Development

```bash
npm install
npm run compile
# Press F5 to launch Extension Development Host
```

## Technical Stack

- **Frontend**: React with vanilla JavaScript
- **Backend**: TypeScript with chess.js
- **Chat**: `@vscode/chat-extension-utils`
- **Animations**: CSS keyframes with coordinate calculation

---

**Play chess with AI intelligence and modern animations - all in VS Code!** 🏆
