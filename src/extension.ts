// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { Chess } from 'chess.js';
import * as path from 'path';
import { sendChatParticipantRequest, AdHocChatTool } from '@vscode/chat-extension-utils';

// --- Chess Game State ---
let chessGame: Chess | null = null;
let userColor: 'w' | 'b' | null = null; // Track user's color
let botEnabled = false; // Track if bot is active
let capturedPieces = { white: [] as string[], black: [] as string[] };
let moveHistory: { white?: string, black?: string }[] = [];
let activeWebviewPanel: vscode.WebviewPanel | null = null; // Track active webview panel
let gameStateCounter = 0; // Track game state changes to invalidate old move buttons

// Helper function to get captured pieces from chess game
function getCapturedPieces(game: Chess): { white: string[], black: string[] } {
    const initialPieces = {
        'p': 8, 'r': 2, 'n': 2, 'b': 2, 'q': 1, 'k': 1,
        'P': 8, 'R': 2, 'N': 2, 'B': 2, 'Q': 1, 'K': 1
    };

    const currentPieces: { [key: string]: number } = {
        'p': 0, 'r': 0, 'n': 0, 'b': 0, 'q': 0, 'k': 0,
        'P': 0, 'R': 0, 'N': 0, 'B': 0, 'Q': 0, 'K': 0
    };

    // Count current pieces on board
    const fen = game.fen().split(' ')[0];
    for (const char of fen) {
        if (currentPieces.hasOwnProperty(char)) {
            currentPieces[char]++;
        }
    }

    const captured = { white: [] as string[], black: [] as string[] };

    // Calculate captured pieces
    for (const piece in initialPieces) {
        const missing = initialPieces[piece as keyof typeof initialPieces] - currentPieces[piece];
        for (let i = 0; i < missing; i++) {
            if (piece === piece.toLowerCase()) {
                // Black piece was captured by white
                captured.white.push(piece);
            } else {
                // White piece was captured by black
                captured.black.push(piece);
            }
        }
    }

    return captured;
}

// Helper function to update move history
function updateMoveHistory(game: Chess) {
    const history = game.history();
    const moveHist: { white?: string, black?: string }[] = [];

    for (let i = 0; i < history.length; i += 2) {
        const movePair: { white?: string, black?: string } = {
            white: history[i]
        };
        if (i + 1 < history.length) {
            movePair.black = history[i + 1];
        }
        moveHist.push(movePair);
    }

    return moveHist;
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "helloworld" is now active!');

    // Register the OpenAI chat participant using ChatRequestHandler
    const chatParticipant = vscode.chat.createChatParticipant('chess-master', openAIChatHandler);
    context.subscriptions.push(chatParticipant);

    // Register command to open chess webview
    const disposable = vscode.commands.registerCommand('helloworld.openChessBoard', () => {
        const panel = vscode.window.createWebviewPanel(
            'chessBoard',
            'Chess',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'dist'))]
            }
        );

        // Store reference to active panel
        activeWebviewPanel = panel;

        // Handle panel disposal
        panel.onDidDispose(() => {
            activeWebviewPanel = null;
        });

        // Initial chess state
        const initialFen = chessGame ? chessGame.fen() : new Chess().fen();
        panel.webview.html = getWebviewContent(panel.webview, context, initialFen);

        // Handle messages from the webview
        panel.webview.onDidReceiveMessage(
            message => {
                if (message.command === 'move') {
                    if (!chessGame) {
                        chessGame = new Chess();
                    }

                    // Check if this is the first move (user color not set)
                    let isFirstMove = false;
                    if (userColor === null) {
                        userColor = chessGame.turn(); // 'w' for white, 'b' for black
                        botEnabled = true;
                        isFirstMove = true;
                    }

                    const move = chessGame.move({ from: message.from, to: message.to });
                    if (move) {
                        // Increment game state counter for move tracking
                        gameStateCounter++;

                        // Update game state tracking
                        capturedPieces = getCapturedPieces(chessGame);
                        moveHistory = updateMoveHistory(chessGame);

                        // Send updated game state with move details
                        panel.webview.postMessage({
                            command: 'move-update',
                            fen: chessGame.fen(),
                            capturedPieces: capturedPieces,
                            moveHistory: moveHistory,
                            lastMove: { from: message.from, to: message.to }
                        });

                        // Send user color info on first move only
                        if (isFirstMove) {
                            panel.webview.postMessage({
                                command: 'user-color',
                                color: userColor === 'w' ? 'White' : 'Black'
                            });
                        }

                        // Check if game is over
                        if (chessGame.isGameOver()) {
                            let gameResult = '';
                            if (chessGame.isCheckmate()) {
                                gameResult = `Checkmate! ${chessGame.turn() === 'w' ? 'Black' : 'White'} wins!`;
                            } else if (chessGame.isDraw()) {
                                gameResult = 'Game ended in a draw!';
                            }
                            panel.webview.postMessage({
                                command: 'game-over',
                                result: gameResult
                            });
                            return;
                        }

                        // Bot makes a move if enabled and it's bot's turn
                        if (botEnabled && chessGame.turn() !== userColor) {
                            // Send "thinking" message
                            panel.webview.postMessage({
                                command: 'bot-thinking'
                            });

                            setTimeout(() => {
                                const botMove = getBestMove(chessGame!);
                                if (botMove !== 'No moves available') {
                                    const move = chessGame!.move(botMove);
                                    if (move) {
                                        // Increment game state counter for bot move
                                        gameStateCounter++;

                                        // Update game state tracking after bot move
                                        capturedPieces = getCapturedPieces(chessGame!);
                                        moveHistory = updateMoveHistory(chessGame!);

                                        panel.webview.postMessage({
                                            command: 'bot-move',
                                            fen: chessGame!.fen(),
                                            move: botMove,
                                            capturedPieces: capturedPieces,
                                            moveHistory: moveHistory,
                                            lastMove: { from: move.from, to: move.to }
                                        });

                                        // Check if game is over after bot move
                                        if (chessGame!.isGameOver()) {
                                            let gameResult = '';
                                            if (chessGame!.isCheckmate()) {
                                                gameResult = `Checkmate! ${chessGame!.turn() === 'w' ? 'Black' : 'White'} wins!`;
                                            } else if (chessGame!.isDraw()) {
                                                gameResult = 'Game ended in a draw!';
                                            }
                                            panel.webview.postMessage({
                                                command: 'game-over',
                                                result: gameResult
                                            });
                                        }
                                    }
                                }
                            }, 1500); // Delay to make bot move more visible
                        }
                    } else {
                        panel.webview.postMessage({ command: 'invalid', fen: chessGame.fen() });
                    }
                } else if (message.command === 'request-fen') {
                    const currentGame = chessGame || new Chess();
                    panel.webview.postMessage({
                        command: 'move-update',
                        fen: currentGame.fen(),
                        capturedPieces: chessGame ? capturedPieces : { white: [], black: [] },
                        moveHistory: chessGame ? moveHistory : []
                    });
                } else if (message.command === 'new-game') {
                    // Reset game state
                    chessGame = new Chess();
                    userColor = null;
                    botEnabled = false;
                    capturedPieces = { white: [], black: [] };
                    moveHistory = [];
                    gameStateCounter = 0; // Reset game state counter
                    panel.webview.postMessage({
                        command: 'new-game',
                        fen: chessGame.fen()
                    });
                }
            },
            undefined,
            context.subscriptions
        );
    });
    context.subscriptions.push(disposable);

    // Register command to apply moves from chat recommendations
    const applyMoveDisposable = vscode.commands.registerCommand('helloworld.applyMove',
        (from: string, to: string, moveNotation: string, expectedGameState?: number) => {
            if (!chessGame) {
                vscode.window.showErrorMessage('No chess game is currently active.');
                return;
            }

            if (!activeWebviewPanel) {
                vscode.window.showErrorMessage('Chess is not open.');
                return;
            }

            // Check if this move button is outdated
            if (expectedGameState !== undefined && expectedGameState !== gameStateCounter) {
                vscode.window.showWarningMessage(
                    `This move suggestion is outdated. The game has progressed since this recommendation was made. Ask the chat assistant for new move suggestions!`,
                    'Get New Suggestions'
                ).then(selection => {
                    if (selection === 'Get New Suggestions') {
                        // Focus the chat panel to encourage asking for new suggestions
                        vscode.commands.executeCommand('workbench.panel.chat.view.copilot.focus');
                    }
                });
                return;
            }

            try {
                const move = chessGame.move({ from, to });
                if (move) {
                    // Increment game state counter
                    gameStateCounter++;

                    // Update game state
                    capturedPieces = getCapturedPieces(chessGame);
                    moveHistory = updateMoveHistory(chessGame);

                    // Send move update to webview
                    activeWebviewPanel.webview.postMessage({
                        command: 'move-update',
                        fen: chessGame.fen(),
                        capturedPieces: capturedPieces,
                        moveHistory: moveHistory,
                        lastMove: { from: move.from, to: move.to }
                    });

                    vscode.window.showInformationMessage(`Move applied: ${moveNotation}`);

                    // Check game status
                    if (chessGame.isGameOver()) {
                        let result = '';
                        if (chessGame.isCheckmate()) {
                            result = `Checkmate! ${chessGame.turn() === 'w' ? 'Black' : 'White'} wins!`;
                        } else if (chessGame.isStalemate()) {
                            result = 'Stalemate! Game is a draw.';
                        } else if (chessGame.isDraw()) {
                            result = 'Draw!';
                        }
                        if (result) {
                            activeWebviewPanel.webview.postMessage({
                                command: 'game-over',
                                result: result
                            });
                        }
                    } else if (botEnabled && chessGame.turn() !== userColor) {
                        // Send "thinking" message
                        activeWebviewPanel!.webview.postMessage({
                            command: 'bot-thinking'
                        });

                        // Make bot move
                        setTimeout(() => {
                            const botMove = getBestMove(chessGame!);
                            if (botMove !== 'No moves available') {
                                try {
                                    const botMoveResult = chessGame!.move(botMove);
                                    if (botMoveResult) {
                                        // Increment game state counter for bot move
                                        gameStateCounter++;

                                        capturedPieces = getCapturedPieces(chessGame!);
                                        moveHistory = updateMoveHistory(chessGame!);

                                        activeWebviewPanel!.webview.postMessage({
                                            command: 'bot-move',
                                            fen: chessGame!.fen(),
                                            move: botMove,
                                            capturedPieces: capturedPieces,
                                            moveHistory: moveHistory,
                                            lastMove: { from: botMoveResult.from, to: botMoveResult.to }
                                        });

                                        // Check if bot move ends the game
                                        if (chessGame!.isGameOver()) {
                                            let result = '';
                                            if (chessGame!.isCheckmate()) {
                                                result = `Checkmate! ${chessGame!.turn() === 'w' ? 'Black' : 'White'} wins!`;
                                            } else if (chessGame!.isStalemate()) {
                                                result = 'Stalemate! Game is a draw.';
                                            } else if (chessGame!.isDraw()) {
                                                result = 'Draw!';
                                            }
                                            if (result) {
                                                activeWebviewPanel!.webview.postMessage({
                                                    command: 'game-over',
                                                    result: result
                                                });
                                            }
                                        }
                                    }
                                } catch (error) {
                                    console.error('Bot move error:', error);
                                }
                            }
                        }, 1500); // Delay to make bot move more visible
                    }
                } else {
                    vscode.window.showErrorMessage('Invalid move!');
                }
            } catch (error) {
                vscode.window.showErrorMessage(`Error applying move: ${error}`);
            }
        }
    );
    context.subscriptions.push(applyMoveDisposable);
}

// This method is called when your extension is deactivated
export function deactivate() { }

// Simple move evaluation function
function getBestMove(game: Chess): string {
    const moves = game.moves({ verbose: true });
    if (moves.length === 0) {
        return 'No moves available';
    }

    // Score moves based on simple heuristics
    const scoredMoves = moves.map(move => {
        let score = 0;

        // Prioritize captures
        if (move.captured) {
            const pieceValues = { 'p': 1, 'n': 3, 'b': 3, 'r': 5, 'q': 9, 'k': 0 };
            score += pieceValues[move.captured as keyof typeof pieceValues] || 0;
        }

        // Prioritize checks
        const tempGame = new Chess(game.fen());
        tempGame.move(move);
        if (tempGame.isCheck()) {
            score += 0.5;
        }

        // Prioritize center control (e4, e5, d4, d5)
        if (['e4', 'e5', 'd4', 'd5'].includes(move.to)) {
            score += 0.3;
        }

        // Small random factor to break ties
        score += Math.random() * 0.1;

        return { move: move.san, score };
    });

    // Sort by score and return the best move
    scoredMoves.sort((a, b) => b.score - a.score);
    return scoredMoves[0].move;
}

// Chess move analysis function for use as a tool
function analyzeChessPosition(game: Chess) {
    const moves = game.moves({ verbose: true });
    if (moves.length === 0) {
        return { moves: [], analysis: 'No legal moves available.' };
    }

    // Score and sort moves
    const scoredMoves = moves.map(move => {
        let score = 0;
        let explanation = '';

        // Prioritize captures
        if (move.captured) {
            const pieceValues = { 'p': 1, 'n': 3, 'b': 3, 'r': 5, 'q': 9, 'k': 0 };
            const captureValue = pieceValues[move.captured as keyof typeof pieceValues] || 0;
            score += captureValue;
            explanation += `Captures ${move.captured.toUpperCase()} (+${captureValue}). `;
        }

        // Check for checks
        const tempGame = new Chess(game.fen());
        tempGame.move(move);
        if (tempGame.isCheck()) {
            score += 0.5;
            explanation += 'Gives check. ';
        }

        // Check for checkmate
        if (tempGame.isCheckmate()) {
            score += 10;
            explanation += 'Checkmate! ';
        }

        // Prioritize center control
        if (['e4', 'e5', 'd4', 'd5'].includes(move.to)) {
            score += 0.3;
            explanation += 'Controls center. ';
        }

        // Piece development
        if (['n', 'b'].includes(move.piece) && ['1', '8'].includes(move.from[1])) {
            score += 0.2;
            explanation += 'Develops piece. ';
        }

        score += Math.random() * 0.1;

        return {
            move: move.san,
            from: move.from,
            to: move.to,
            score,
            explanation: explanation || 'Solid move.',
            piece: move.piece,
            captured: move.captured
        };
    });

    // Get top 3 moves
    scoredMoves.sort((a, b) => b.score - a.score);
    const topMoves = scoredMoves.slice(0, 3);

    return {
        moves: topMoves,
        analysis: `Found ${moves.length} legal moves. Top recommendations analyzed.`,
        boardState: {
            fen: game.fen(),
            turn: game.turn() === 'w' ? 'White' : 'Black',
            isCheck: game.isCheck(),
            isCheckmate: game.isCheckmate(),
            isStalemate: game.isStalemate(),
            isDraw: game.isDraw()
        }
    };
}

// Chess analysis tool implementation
const chessAnalysisTool: AdHocChatTool<{ requestType: string }> = {
    name: 'analyzeChessPosition',
    description: 'Analyze the current chess position and get move recommendations with detailed explanations',
    inputSchema: {
        type: 'object',
        properties: {
            requestType: {
                type: 'string',
                description: 'Type of analysis requested: "moves" for move recommendations, "position" for general position analysis',
                enum: ['moves', 'position']
            }
        },
        required: ['requestType']
    },
    async invoke(options) {
        if (!chessGame) {
            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart('No chess game is currently active.')
            ]);
        }

        const analysis = analyzeChessPosition(chessGame);

        return new vscode.LanguageModelToolResult([
            new vscode.LanguageModelTextPart(JSON.stringify(analysis, null, 2))
        ]);
    }
};

// Enhanced chat handler using chat extension utils
const openAIChatHandler: vscode.ChatRequestHandler = async (request, context, stream, token) => {
    if (!chessGame) {
        stream.markdown('No chess game is currently active. Please open the chess board first using the "Chess: Open Chess Board" command.');
        return;
    }

    // Get current game state for context
    const boardAscii = chessGame.ascii();
    const gameState = {
        fen: chessGame.fen(),
        turn: chessGame.turn() === 'w' ? 'White' : 'Black',
        moveNumber: Math.ceil(chessGame.history().length / 2),
        isCheck: chessGame.isCheck(),
        isCheckmate: chessGame.isCheckmate(),
        recentMoves: chessGame.history().slice(-4) // Last 4 moves for context
    };

    // Check if user is asking for move analysis/recommendations
    const userInput = request.prompt.toLowerCase();
    const isAskingForMoves = userInput.includes('move') || userInput.includes('suggest') ||
        userInput.includes('recommend') || userInput.includes('analyze') ||
        userInput.includes('best') || userInput.includes('what should') ||
        userInput.includes('help') || userInput.includes('advice');

    // If asking for moves, call tool directly and provide structured response
    if (isAskingForMoves) {
        try {
            // Call the chess analysis tool directly
            const toolResult = await chessAnalysisTool.invoke(
                {
                    toolInvocationToken: undefined,
                    input: { requestType: 'moves' }
                }
            );

            // Parse the tool result
            let analysisResult: any = null;
            if (toolResult.content && toolResult.content.length > 0) {
                const firstContent = toolResult.content[0];
                if (firstContent instanceof vscode.LanguageModelTextPart) {
                    analysisResult = JSON.parse(firstContent.value);
                }
            }

            if (analysisResult && analysisResult.moves && analysisResult.moves.length > 0) {
                // Provide AI analysis using the tool results
                const prompt = `You are a chess expert. Based on this position analysis, provide educational commentary and strategic advice.

Current Position:
${boardAscii}

Game State: ${gameState.turn} to move, Move ${gameState.moveNumber}
Status: ${gameState.isCheckmate ? 'Checkmate' : gameState.isCheck ? 'In Check' : 'Normal'}

Move Analysis Results:
${JSON.stringify(analysisResult, null, 2)}

Provide a natural, educational response explaining the top moves and chess principles. Keep it concise but informative.`;

                // Get AI commentary
                const aiRequest: vscode.ChatRequest = {
                    command: request.command,
                    prompt: prompt,
                    references: [],
                    toolReferences: [],
                    toolInvocationToken: request.toolInvocationToken,
                    model: request.model
                };

                const { result, stream: responseStream } = sendChatParticipantRequest(
                    aiRequest,
                    context,
                    {
                        prompt,
                        responseStreamOptions: {
                            stream,
                            responseText: true,
                            references: false
                        }
                    },
                    token
                );

                // Wait for AI response
                await result;

                // Add clickable move buttons
                stream.markdown('\n\n**🎯 Clickable Move Recommendations:**\n\n');

                const currentGameState = gameStateCounter;
                for (let i = 0; i < Math.min(analysisResult.moves.length, 3); i++) {
                    const moveData = analysisResult.moves[i];
                    const rank = i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉';
                    const scoreDisplay = moveData.score > 0 ? ` (Score: ${moveData.score.toFixed(1)})` : '';

                    // Create clickable button for the move with current game state
                    stream.button({
                        title: `${rank} Play ${moveData.move}${scoreDisplay}`,
                        command: 'helloworld.applyMove',
                        arguments: [moveData.from, moveData.to, moveData.move, currentGameState]
                    });

                    // Add explanation below the button
                    stream.markdown(`\n*${moveData.explanation}*\n\n`);
                }

                stream.markdown('💡 *Click any move button above to play it directly on the board!*\n');
                stream.markdown('⚠️ *Note: These move buttons will become outdated once the game progresses.*\n');
                return;
            }
        } catch (error) {
            console.error('Error calling chess analysis tool:', error);
        }
    }

    // For general chess questions, provide context-aware responses
    const prompt = `You are a chess expert assistant helping with the current chess game.

Current Position:
${boardAscii}

Game State:
- Turn: ${gameState.turn} to move
- Move Number: ${gameState.moveNumber}
- Status: ${gameState.isCheckmate ? 'Checkmate' : gameState.isCheck ? 'In Check' : 'Normal'}
- Recent Moves: ${gameState.recentMoves.join(', ') || 'Game just started'}

User Question: ${request.prompt}

Provide helpful, educational chess advice based on the current position. Be encouraging and explain chess principles clearly.`;

    try {
        const { result } = sendChatParticipantRequest(
            request,
            context,
            {
                prompt,
                responseStreamOptions: {
                    stream,
                    responseText: true,
                    references: false
                }
            },
            token
        );

        await result;
    } catch (error) {
        console.error('Chess chat handler error:', error);
        stream.markdown('🤔 I can help you with chess strategy and move analysis! Try asking me:\n\n');
        stream.markdown('- "What\'s the best move here?"\n');
        stream.markdown('- "Should I castle?"\n');
        stream.markdown('- "How can I improve my position?"\n');
        stream.markdown('- "Analyze this position"\n');
        stream.markdown('- "What are my tactical options?"\n');
    }
};
function getWebviewContent(webview: vscode.Webview, context: vscode.ExtensionContext, fen: string): string {
    const htmlPath = path.join(context.extensionPath, 'webview.html');
    const htmlUri = webview.asWebviewUri(vscode.Uri.file(htmlPath));

    console.log('HTML URI:', htmlUri.toString());

    // Read the HTML file and return it
    const fs = require('fs');
    return fs.readFileSync(htmlPath, 'utf8');
}
