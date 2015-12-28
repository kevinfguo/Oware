// angular.module('myApp', ['ngTouch', 'ui.bootstrap']).factory('gameLogic', function() {
var gameLogic;
(function (gameLogic) {
    'use strict';
    /** Returns the initial Oware board, which is a 2x6 matrix containing 4. */
    function getInitialBoard() {
        return [[4, 4, 4, 4, 4, 4],
            [4, 4, 4, 4, 4, 4]];
    }
    gameLogic.getInitialBoard = getInitialBoard;
    function canSowOpponent(board, row, col) {
        return (board[row][col]) > (row === 0 ? col : 5 - col);
    }
    gameLogic.canSowOpponent = canSowOpponent;
    function hasHousesThatCanSowOpponent(board, turnIndex) {
        for (var i = 0; i < 6; i++) {
            if (canSowOpponent(board, turnIndex, i)) {
                return true;
            }
        }
        return false;
    }
    gameLogic.hasHousesThatCanSowOpponent = hasHousesThatCanSowOpponent;
    function getSeedsInRow(board, rowIndex) {
        var seeds = 0;
        for (var i = 0; i < 6; i++) {
            seeds += board[rowIndex][i];
        }
        return seeds;
    }
    gameLogic.getSeedsInRow = getSeedsInRow;
    function getWinner(board, scores) {
        if (getSeedsInRow(board, 1) === 0 && !hasHousesThatCanSowOpponent(board, 0)) {
            scores[0] += getSeedsInRow(board, 0);
            return 0;
        }
        else if (getSeedsInRow(board, 0) === 0 && !hasHousesThatCanSowOpponent(board, 1)) {
            scores[1] += getSeedsInRow(board, 1);
            return 1;
        }
        else if (scores[0] > 24) {
            return 0;
        }
        else if (scores[1] > 24) {
            return 1;
        }
        return -1;
    }
    gameLogic.getWinner = getWinner;
    function isTie(scores) {
        if (scores[0] === 24 && scores[1] === 24) {
            return true;
        }
        return false;
    }
    gameLogic.isTie = isTie;
    function isMoveOk(params) {
        var move = params.move;
        var turnIndexBeforeMove = params.turnIndexBeforeMove;
        var stateBeforeMove = params.stateBeforeMove;
        /*
        Example stateBeforeMove:
        {
            board : [[4, 4, 4, 4, 4, 4], [4, 4, 4, 4, 4, 4]],
            scores : [0, 0]
        }

        The state and turn after move are not needed in Oware (or in any game where all state is public).
        var turnIndexAfterMove = params.turnIndexAfterMove;
        var stateAfterMove = params.stateAfterMove;

        We can assume that turnIndexBeforeMove and stateBeforeMove are legal, and we need
        to verify that move is legal.
        */
        try {
            /*
            Example move:
            [{setTurn: {turnIndex : 1},
             {set: {key: 'board', value: [[4, 4, 5, 5, 5, 5], [4, 4, 4, 4, 4, 0]]}},
             {set: {key: 'delta', value: {row: 1, col: 6}}},
             {set: {key: 'scores' , value: [0, 0]}}
            ]
            */
            var deltaValue = move[2].set.value;
            var row = deltaValue.row;
            var col = deltaValue.col;
            var board = stateBeforeMove.board;
            var scores = stateBeforeMove.scores;
            var expectedMove = createMove(board, row, col, turnIndexBeforeMove, scores);
            if (!angular.equals(move, expectedMove)) {
                //console.log(JSON.stringify(move, null, 2), JSON.stringify(expectedMove, null, 2));
                return false;
            }
        }
        catch (e) {
            console.log(e);
            // if there are any exceptions then the move is illegal
            return false;
        }
        return true;
    }
    gameLogic.isMoveOk = isMoveOk;
    /**
    * Returns all the possible moves for the given board and turnIndex.
    * Returns an empty array if the game is over.
    */
    function getPossibleMoves(board, turnIndex, scores) {
        var possibleMoves = [];
        for (var j = 0; j < 6; j++) {
            try {
                if (board[turnIndex][j] !== 0) {
                    possibleMoves.push(createMove(board, turnIndex, j, turnIndex, scores));
                }
            }
            catch (e) {
            }
        }
        return possibleMoves;
    }
    gameLogic.getPossibleMoves = getPossibleMoves;
    /**
    * Returns the move that should be performed when player
    * with index turnIndexBeforeMove makes a move in cell row X col.
    */
    function createMove(board, row, col, turnIndexBeforeMove, scores) {
        if (board === undefined) {
            // Initially (at the beginning of the match), the board in state is undefined.
            board = getInitialBoard();
            scores = [0, 0];
        }
        if (turnIndexBeforeMove !== row) {
            throw new Error("One can only sow seeds from his own houses!");
        }
        if (board[row][col] === 0) {
            throw new Error("One cannot sow seeds from empty house!");
        }
        if (getWinner(board, scores) !== -1 || isTie(scores)) {
            throw new Error("Can only make a move if the game is not over!");
        }
        if (!canSowOpponent(board, row, col) && getSeedsInRow(board, 1 - row) === 0) {
            throw new Error("Cannot prevent the opponent from continuing the game!");
        }
        var boardAfterMove = angular.copy(board), scoresAfterMove = angular.copy(scores);
        var seeds = boardAfterMove[row][col];
        var r = row, c = col, cd = r === 0 ? -1 : 1;
        boardAfterMove[r][c] = 0;
        while (seeds > 0) {
            c = c + cd;
            if (c === -1) {
                r = 1;
                c = 0;
                cd *= -1;
            }
            else if (c === 6) {
                r = 0;
                c = 5;
                cd *= -1;
            }
            if (r === row && c === col) {
                continue;
            }
            boardAfterMove[r][c]++;
            seeds--;
        }
        cd *= -1;
        var capCount = 0;
        var boardAfterMoveCopy = angular.copy(boardAfterMove), scoreCopy = scoresAfterMove[turnIndexBeforeMove];
        if (r === 1 - turnIndexBeforeMove) {
            while (c >= 0 && c <= 5) {
                if (boardAfterMove[r][c] === 2 || boardAfterMove[r][c] === 3) {
                    scoresAfterMove[turnIndexBeforeMove] += boardAfterMove[r][c];
                    boardAfterMove[r][c] = 0;
                    capCount++;
                }
                else {
                    break;
                }
                c = c + cd;
            }
        }
        if (capCount === 6) {
            boardAfterMove = boardAfterMoveCopy;
            scoresAfterMove[turnIndexBeforeMove] = scoreCopy;
        }
        var winner = getWinner(boardAfterMove, scoresAfterMove);
        var firstOperation;
        if (winner !== -1 || isTie(scoresAfterMove)) {
            // Game over.
            firstOperation = { endMatch: { endMatchScores: winner === 0 ? [1, 0] : winner === 1 ? [0, 1] : [0, 0] } };
        }
        else {
            // Game continues. Now it's the opponent's turn (the turn switches from 0 to 1 and 1 to 0).
            firstOperation = { setTurn: { turnIndex: 1 - turnIndexBeforeMove } };
        }
        return [firstOperation,
            { set: { key: 'board', value: boardAfterMove } },
            { set: { key: 'delta', value: { row: row, col: col } } },
            { set: { key: 'scores', value: scoresAfterMove } }
        ];
    }
    gameLogic.createMove = createMove;
})(gameLogic || (gameLogic = {}));
;// angular.module('myApp')
//   .controller('Ctrl',
//       ['$rootScope', '$scope', '$log', '$timeout',
//        'gameService', 'stateService', 'gameLogic', 'aiService',
//        'resizeGameAreaService', '$translate', 'dragAndDropService',
//       function ($rootScope, $scope, $log, $timeout,
//         gameService, stateService, gameLogic, aiService,
//         resizeGameAreaService, $translate, dragAndDropService) {
var game;
(function (game) {
    'use strict';
    var isYourTurn;
    var board;
    var turnIndex;
    var scores;
    var delta;
    var validMoves;
    var dragEl;
    var numRows = 2, numCols = 6, dragStartPos = null, baseEl = null, baseParent = null, basePos = null, baseVal = null, nextZIndex = 15, dragSet = false, set = null, setIndex = 0, dragMove = null, boardTemp = null;
    var gameArea;
    var scoreEl = [angular.element(document.getElementById('e2e_test_player1score')).parent(),
        angular.element(document.getElementById('e2e_test_player2score')).parent()];
    function init() {
        console.log("Translation of 'RULES_OF_OWARE' is " + translate('RULES_OF_OWARE'));
        resizeGameAreaService.setWidthToHeight(1.6);
        gameService.setGame({
            minNumberOfPlayers: 2,
            maxNumberOfPlayers: 2,
            isMoveOk: gameLogic.isMoveOk,
            updateUI: updateUI
        });
        // See http://www.sitepoint.com/css3-animation-javascript-event-handlers/
        scores = [0, 0];
        dragAndDropService.addDragListener("gameArea", handleDragEvent);
    }
    game.init = init;
    function handleDragEvent(type, cx, cy) {
        gameArea = document.getElementById("gameArea");
        if (dragSet || !isYourTurn) {
            return;
        }
        var size = getSquareWidthHeight();
        var x = Math.min(Math.max(cx - gameArea.offsetLeft, 0), gameArea.clientWidth - size.width), y = Math.min(Math.max(cy - gameArea.offsetTop, 0), gameArea.clientHeight - size.height);
        var row = Math.floor(numRows * y / gameArea.clientHeight), col = Math.floor(numCols * x / gameArea.clientWidth);
        if (type === "touchstart" && !dragEl) {
            dragStartPos = { row: row, col: col };
            baseEl = angular.element(document.getElementById("e2e_test_seeds_" + dragStartPos.row + "x" + dragStartPos.col));
            baseParent = baseEl.parent();
            baseParent.addClass('selected');
            baseVal = +baseEl.text();
            boardTemp = angular.copy(board);
            boardTemp[row][col] = 0;
            //$scope.$apply();
            var rect = baseEl[0].getBoundingClientRect();
            basePos = { left: rect.left - gameArea.offsetLeft, top: rect.top - gameArea.offsetTop };
            dragEl = angular.element('<div class="seeds dragging">' + baseVal + '</div>');
            dragEl.css({
                'z-index': ++nextZIndex,
                'top': Math.round(basePos.top) + 'px',
                'left': Math.round(basePos.left) + (size.width * 0.25) + 'px',
                'width': size.width * 0.3 + 'px',
                'height': size.width * 0.3 + 'px',
                'font-size': size.width * 0.2 + 'px',
                'padding': size.width * 0.1 + 'px',
                'line-height': size.width * 0.3 + 'px'
            });
            angular.element(gameArea).append(dragEl);
        }
        if (!dragEl) {
            return;
        }
        if (type === "touchend") {
            var to = { row: row, col: col };
            var cDiff = to.col - dragStartPos.col;
            if (!(dragStartPos.row === 0 && cDiff > 0 || dragStartPos.row === 1 && cDiff < 0)) {
                /*	    		var t = $scope.board;
                                $scope.board = boardTemp;*/
                dragMove = selectCell(dragStartPos.row, dragStartPos.col);
                if (dragMove) {
                    set = getUpdatePos(dragStartPos.row, dragStartPos.col, board, dragMove[1].set.value);
                    // $scope.board = t;
                    setIndex = 0;
                    dragSet = true;
                    dragDone();
                }
            }
        }
        else {
            setDraggingPiece(row, col);
        }
        if (type === "touchend" || type === "touchcancel" || type === "touchleave") {
            if (!dragSet) {
                resetDragEl(baseVal);
            }
        }
    }
    //dragAndDropService.addDragListener("gameArea", handleDragEvent);
    function setDraggingPiece(row, col) {
        var topLeft = getSquareTopLeft(row, col);
        var squareSize = getSquareWidthHeight();
        dragEl.css({
            left: topLeft.left + ((row === 0) ? 0 : squareSize.width / 2) + "px",
            top: topLeft.top + "px"
        });
    }
    function getSquareWidthHeight() {
        return {
            width: gameArea.clientWidth / numCols,
            height: gameArea.clientHeight / numRows
        };
    }
    function getSquareTopLeft(row, col) {
        var size = getSquareWidthHeight();
        return { top: (row === 0) ? size.height * 0.42 : size.height * 1.1, left: col * size.width };
    }
    function getNextPos(row, col) {
        if (row === 0) {
            col--;
        }
        else {
            col++;
        }
        if (col < 0) {
            row = 1;
            col = 0;
        }
        else if (col > 5) {
            row = 0;
            col = 5;
        }
        return { row: row, col: col };
    }
    function resetDragEl(val) {
        dragEl[0].style.opacity = 0;
        baseParent.removeClass('selected');
        setTimeout(function () {
            boardTemp[dragStartPos.row][dragStartPos.col] = val;
            //$scope.$apply();
            dragEl.detach();
            dragEl = null;
            dragStartPos = null;
        }, 100);
    }
    function updateVals(val, callback) {
        if (setIndex < set.updates.length) {
            var pos = set.updates[setIndex++];
            setDraggingPiece(pos.row, pos.col);
            dragEl.text(--val);
            var pEl = angular.element(document.getElementById("pit_" + pos.row + "x" + pos.col)).addClass('pos');
            setTimeout(function () {
                pEl.removeClass('pos');
            }, 2500);
            var uEl = angular.element(document.getElementById("e2e_test_seeds_" + pos.row + "x" + pos.col));
            boardTemp[pos.row][pos.col] = +uEl.text() + 1;
            if (boardTemp[pos.row][pos.col] === '2' || boardTemp[pos.row][pos.col] === '3') {
                pEl.addClass('captured');
            }
            //     $scope.$apply(function(){
            setTimeout(function () {
                updateVals(val, callback);
            }, 400);
        }
        else {
            setIndex = 0;
            setTimeout(function () {
                updateCaptures(callback);
            }, 400);
        }
    }
    function updateCaptures(callback) {
        if (setIndex < set.captures.length) {
            scoreEl[turnIndex].addClass('capture');
            dragEl.addClass('capture');
            var pos = set.captures[setIndex++];
            setDraggingPiece(pos.row, pos.col);
            var uEl = angular.element(document.getElementById("e2e_test_seeds_" + pos.row + "x" + pos.col));
            dragEl.text(+dragEl.text() + (+uEl.text()));
            boardTemp[pos.row][pos.col] = 0;
            //$scope.$apply();
            setTimeout(function () {
                updateCaptures(callback);
            }, 400);
        }
        else {
            setIndex = 0;
            setTimeout(callback, 100);
        }
    }
    function dragDone() {
        updateVals(baseVal, function () {
            resetDragEl(0);
            gameService.makeMove(dragMove);
            scoreEl[turnIndex].removeClass('capture');
            dragMove = null;
            dragSet = false;
        });
    }
    //resizeGameAreaService.setWidthToHeight(1.6);
    /*	$translate('OWARE_GAME').then(function (translation) {
          console.log("Translation of 'OWARE_GAME' is " + translation);
        });*/
    function sendComputerMove() {
        var items = gameLogic.getPossibleMoves(board, turnIndex, scores);
        gameService.makeMove(items[Math.floor(Math.random() * items.length)]);
    }
    function getUpdatePos(row, col, board1, board2) {
        var updates = [], captures = [];
        var pos = { row: row, col: col }, diff, val = board1[row][col];
        while (val) {
            pos = getNextPos(pos.row, pos.col);
            if (pos.row === row && pos.col === col) {
                continue;
            }
            diff = board2[pos.row][pos.col] - board1[pos.row][pos.col];
            if (diff > 0) {
                updates.push({ row: pos.row, col: pos.col });
            }
            else if (diff < 0) {
                updates.push({ row: pos.row, col: pos.col });
                captures.push({ row: pos.row, col: pos.col });
            }
            val--;
        }
        captures.reverse();
        return { updates: updates, captures: captures };
    }
    function updateUI(params) {
        board = params.stateAfterMove.board;
        delta = params.stateAfterMove.delta;
        scores = params.stateAfterMove.scores;
        if (board === undefined) {
            board = gameLogic.getInitialBoard();
            scores = [0, 0];
        }
        validMoves = gameLogic.getPossibleMoves(board, params.turnIndexAfterMove, scores);
        isYourTurn = params.turnIndexAfterMove >= 0 &&
            params.yourPlayerIndex === params.turnIndexAfterMove; // it's my turn
        turnIndex = params.turnIndexAfterMove;
        // Is it the computer's turn?
        if (isYourTurn &&
            params.playersInfo[params.yourPlayerIndex].playerId === '') {
            isYourTurn = false; // to make sure the UI won't send another move.
            // Waiting 0.5 seconds to let the move animation finish; if we call aiService
            // then the animation is paused until the javascript finishes.
            $timeout(sendComputerMove, 500);
        }
    }
    //window.e2e_test_stateService = stateService; // to allow us to load any state in our e2e tests.
    function selectCell(row, col) {
        log.info(["Clicked on cell:", row, col]);
        if (window.location.search === '?throwException') {
            throw new Error("Throwing the error because URL has '?throwException'");
        }
        if (!isYourTurn) {
            return false;
        }
        try {
            var move = gameLogic.createMove(board, row, col, turnIndex, scores);
            isYourTurn = false; // to prevent making another move
            return move;
        }
        catch (e) {
            log.info(["Cell is already full in position:", row, col]);
            return false;
        }
    }
    function isValid(row, col) {
        for (var i = 0; i < validMoves.length; i++) {
            var pos = validMoves[i][2].set.value;
            if (row === pos.row && col === pos.col) {
                return true;
            }
        }
        return false;
    }
    game.isValid = isValid;
    ;
    function getSeeds(row, col) {
        if (dragSet) {
            return boardTemp[row][col];
        }
        else {
            return board[row][col];
        }
    }
    game.getSeeds = getSeeds;
    ;
    function getScore(row) {
        log.info(scores);
        return scores[row];
    }
    game.getScore = getScore;
    ;
})(game || (game = {}));
angular.module('myApp', ['ngTouch', 'ui.bootstrap', 'gameServices'])
    .run(function () {
    $rootScope['game'] = game;
    translate.setLanguage('en', {
        RULES_OF_OWARE: "Rules of OWARE",
        RULES_SLIDE1: "To sow you must take all the seeds of  any of your holes and lay its out along the holes against the direction of the clockwise. In every hole you should lay it out one seed.  If you reach the last hole of your ground you must continue in the land of the other player. Remember, you always have to lay out seeds in the direction against the clockwise.",
        RULES_SLIDE2: "If the last hole where you sow is in the land of the other player and there are two or three seeds in the last hole remove from the board and keep them. If the previous holes also contain two or three seeds also remove them and remove all the seeds of your opponent that contains two or three seeds.",
        RULES_SLIDE3: "As the game progresses, it is possible that one hole contains more than 12 seeds. This hole is called Kroo and makes possible complete one round. When the harvest starts at the Kroo, this hole must finish empty what means that the player shouldn’t lay out any seed.",
        RULES_SLIDE4: "To play a run  and  leaves the other player with no seeds to continue playing is not allowed. If you do it you will lose the game.",
        RULES_SLIDE5: "If the other player has only one seed in his field you will have to remove it in order to harvest and continue playing. Players must provide in advance to avoid this situation. If this is impossible, because we only have one seed in our land. The game is finished. The winner is the one that harvest more.",
        RULES_SLIDE6: "Game ends with a player having more than 23 seeds in his house. When there are few seeds left on the counter, the game may be perpetuating and hardly any of the 2 players can capture any new seed. By mutual agreement player can agree the end of the game. In this case every player is the owner of the seeds in his side.  As always, who has garnered more wins the match.",
        CLOSE: "Close"
    });
    game.init();
});
;// angular.module('myApp').factory('aiService',
//     ["alphaBetaService", "gameLogic",
//       function(alphaBetaService, gameLogic) {
var aiService;
(function (aiService) {
    'use strict';
    /**
     * Returns the move that the computer player should do for the given board.
     * alphaBetaLimits is an object that sets a limit on the alpha-beta search,
     * and it has either a millisecondsLimit or maxDepth field:
     * millisecondsLimit is a time limit, and maxDepth is a depth limit.
     */
    function createComputerMove(board, scores, playerIndex, alphaBetaLimits) {
        // We use alpha-beta search, where the search states are TicTacToe moves.
        // Recal that a Oware move has 3 operations:
        // 0) endMatch or setTurn
        // 1) {set: {key: 'board', value: ...}}
        // 2) {set: {key: 'delta', value: ...}}
        // 3) {set: {key: 'scores', value: ...}}]
        return alphaBetaService.alphaBetaDecision([null, { set: { key: 'board', value: board } }, null, { set: { key: 'scores', value: scores } }], playerIndex, getNextStates, getStateScoreForIndex0, 
        // If you want to see debugging output in the console, then surf to game.html?debug
        window.location.search === '?debug' ? getDebugStateToString : null, alphaBetaLimits);
    }
    aiService.createComputerMove = createComputerMove;
    function getStateScoreForIndex0(move) {
        if (move[0].endMatch) {
            var endMatchScores = move[0].endMatch.endMatchScores;
            return endMatchScores[0] > endMatchScores[1] ? Number.POSITIVE_INFINITY
                : endMatchScores[0] < endMatchScores[1] ? Number.NEGATIVE_INFINITY
                    : 0;
        }
        return 0;
    }
    function getNextStates(move, playerIndex) {
        return gameLogic.getPossibleMoves(move[1].set.value, playerIndex, move[3].set.value);
        //return moves;
    }
    function getDebugStateToString(move) {
        return "\n" + move[1].set.value.join("\n") + "\n";
    }
})(aiService || (aiService = {}));
