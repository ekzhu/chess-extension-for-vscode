# Chess Extension for VS Code

A comprehensive chess extension for Visual Studio Code featuring an interactive chess board, intelligent AI opponent, advanced move recommendations with clickable buttons, and immersive visual animations. Play chess directly in VS Code with professional-grade features and modern UI.

## ✨ Features

### 🏁 **Complete Chess Experience**
- **Interactive Chess Board**: Beautiful, modern chess board with proper Unicode chess pieces (♔♕♖♗♘♙♚♛♜♝♞♟)
- **Click-to-Move**: Intuitive click-to-move functionality - click source square, then destination square
- **Move Validation**: Complete chess rules validation using chess.js library
- **Game Timer**: Live game timer tracking total elapsed time
- **Move History**: Complete move log with White/Black player labels
- **New Game**: Reset functionality to start fresh games

### 🤖 **AI Opponent & Analysis**
- **Intelligent Bot**: Built-in chess engine with strategic move evaluation
- **Smart AI Moves**: AI considers captures, checks, center control, and piece development
- **Thinking Indicator**: Visual feedback when AI is calculating moves
- **Delayed Bot Moves**: 1.5-second delay for better move visibility

### 🎯 **Advanced Chat Integration**
- **AI-Powered Analysis**: Use `@openai-bot` in VS Code chat for move recommendations
- **Clickable Move Buttons**: AI recommendations include clickable buttons to apply moves directly
- **Move State Validation**: Outdated move buttons are automatically invalidated as game progresses
- **Strategic Commentary**: Get educational explanations of chess principles and tactics
- **Natural Language**: Ask questions like "What should I do?" or "Analyze this position"

### 🎬 **Visual Effects & Animations**
- **Move Trace Arrows**: Golden animated arrows showing move paths from source to destination
- **Square Highlighting**: Visual highlighting of source and destination squares
- **Smooth Animations**: 1-second fade in/out effects for all move visualizations
- **Multi-directional**: Arrows correctly point in all directions (horizontal, vertical, diagonal)
- **Move Feedback**: Animations for user moves, bot moves, and chat-applied moves

### 📊 **Game State Management**
- **Captured Pieces**: Visual display of captured pieces for both sides
- **Game Status Detection**: Automatic detection of checkmate, stalemate, and draws
- **Turn Indicator**: Clear display of whose turn it is
- **Player Color Assignment**: Automatic color assignment on first move

### 🛡️ **Smart Move Protection**
- **Button Invalidation**: Prevents applying outdated move recommendations
- **Game State Tracking**: Intelligent tracking of game progression
- **User Warnings**: Friendly notifications when move buttons become outdated
- **Chat Redirection**: Automatic guidance to request new move suggestions

## Requirements

- VS Code version 1.100.0 or higher
- Internet connection for AI-powered chat features
- `@vscode/chat-extension-utils` package (automatically installed)

## 🚀 How to Use

### Opening the Chess Board

1. Open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
2. Run the command "Chess Board: Open Chess Board"
3. A new webview tab will open with the interactive chess board
4. The game automatically starts when you make your first move

### Making Moves

1. **Manual Moves**: Click on a chess piece to select it (highlighted in green), then click destination square
2. **Move Validation**: All moves are validated against official chess rules
3. **Visual Feedback**: See golden arrow animations showing your move path
4. **AI Response**: Bot automatically responds after your move with thinking indicator

### Getting AI Move Recommendations

#### Via Chat Panel
1. Open VS Code's chat panel (`Ctrl+Shift+` ` ` ` `)
2. Type `@openai-bot` followed by your request:
   - `@openai-bot suggest a move`
   - `@openai-bot what should I do?`
   - `@openai-bot analyze this position`
   - `@openai-bot help me with my chess strategy`

#### Interactive Features
- **Clickable Buttons**: Chat responses include clickable move buttons
- **Direct Application**: Click any recommended move button to apply it instantly
- **Move Validation**: Buttons automatically become invalid as game progresses
- **Smart Warnings**: Get notified if trying to use outdated recommendations

### Game Management

- **New Game**: Click "New Game" button to reset and start over
- **Timer**: Track your total game time with the live timer
- **Move History**: Review all moves in the right sidebar with player labels
- **Captured Pieces**: See captured pieces displayed in the left sidebar

## 🎮 Advanced Features

### Move Animation System
- **Golden Arrows**: Animated arrows trace the path of every move
- **Multi-directional**: Arrows correctly point in all 8 directions
- **Timing**: 1-second animations with smooth fade effects
- **Universal Coverage**: Animations for user moves, bot moves, and chat-applied moves

### Chat Integration Benefits
- **Educational**: Get explanations of chess principles and strategy
- **Interactive**: Apply AI suggestions with single clicks
- **Context-Aware**: AI understands current position and game state
- **Flexible**: Ask questions in natural language

### Smart State Management
- **Game Progression Tracking**: Internal counter prevents outdated move applications
- **Button Lifecycle**: Move buttons automatically expire as game advances
- **User Experience**: Friendly warnings and guidance when actions aren't available
- **Seamless Integration**: Chat and board stay perfectly synchronized

## Technical Implementation

- **Frontend**: React with vanilla JavaScript (CDN-based, no build complexity)
- **Backend**: TypeScript VS Code extension with chess.js
- **Animation Engine**: CSS keyframes with JavaScript coordinate calculation
- **State Management**: Game state counter for move validation
- **Chat Integration**: `@vscode/chat-extension-utils` for AI interactions
- **Move Engine**: Strategic evaluation with capture prioritization
- **UI Framework**: Modern CSS with gradients, animations, and responsive design

## Project Structure

```
src/
├── extension.ts          # Main extension logic, AI opponent, chat handler
├── test/                 # Test files
webview.html             # Interactive chess board UI with animations
package.json             # Extension configuration and dependencies
tsconfig.json            # TypeScript configuration
README.md                # This documentation
```

## Development

To work on this extension:

1. Clone the repository
2. Run `npm install` to install dependencies (includes chat extension utils)
3. Run `npm run compile` to build the TypeScript
4. Press F5 to launch a new Extension Development Host window
5. Test the extension in the development environment

### Key Dependencies
- `chess.js`: Chess game logic and move validation
- `@vscode/chat-extension-utils`: Advanced chat integration capabilities
- `path`: File system utilities for webview content

## Release Notes

### 1.0.0

Major release with comprehensive chess experience:

#### 🆕 New Features
- **Complete AI Opponent**: Intelligent bot with strategic move evaluation
- **Move Animations**: Golden arrow traces for all moves with multi-directional support
- **Advanced Chat Integration**: Clickable move buttons from AI recommendations
- **Game State Management**: Timer, move history, captured pieces display
- **Smart Move Protection**: Automatic invalidation of outdated recommendations
- **Visual Effects**: Square highlighting and smooth animation system

#### 🔧 Technical Improvements
- **State Tracking**: Game progression counter for move validation
- **Animation Engine**: CSS custom properties for proper arrow rotation
- **Chat Tools**: Integration with VS Code's chat extension utilities
- **Error Handling**: Comprehensive move validation and user feedback
- **Performance**: Optimized rendering and state management

#### 🎨 UI Enhancements
- **Modern Layout**: Three-panel design with sidebars for game info
- **Responsive Design**: Works across different VS Code window sizes
- **Professional Styling**: Gradient backgrounds and polished animations
- **Accessibility**: Clear visual feedback and intuitive interactions

---

**Experience the future of chess in VS Code!** 🏆

Enjoy a complete chess experience with AI opponents, move animations, and intelligent chat integration - all within your favorite code editor.
# chess-extension-for-vscode
