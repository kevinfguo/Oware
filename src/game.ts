// angular.module('myApp')
//   .controller('Ctrl',
//       ['$rootScope', '$scope', '$log', '$timeout',
//        'gameService', 'stateService', 'gameLogic', 'aiService',
//        'resizeGameAreaService', '$translate', 'dragAndDropService',
//       function ($rootScope, $scope, $log, $timeout,
//         gameService, stateService, gameLogic, aiService,
//         resizeGameAreaService, $translate, dragAndDropService) {

module game{

	'use strict';

  var isYourTurn : any;
  var board : any;
  var turnIndex : any;
  var scores : any;
  var delta : any;
  var validMoves : any;
  var dragEl : any;
  var           numRows = 2, numCols = 6,
            dragStartPos : any = null,
            baseEl : any = null,
            baseParent : any = null,
            basePos : any = null,
            baseVal : any = null,
            nextZIndex = 15,
            dragSet = false,
            set : any = null,
            setIndex = 0,
            dragMove : any = null,
            boardTemp : any = null;
  var gameArea : any;
  var scoreEl : any;

    export function init() {
      console.log("Translation of 'RULES_OF_OWARE' is " + translate('RULES_OF_OWARE'));
      resizeGameAreaService.setWidthToHeight(1.6);
      gameService.setGame({
        minNumberOfPlayers: 2,
        maxNumberOfPlayers: 2,
        isMoveOk: gameLogic.isMoveOk,
        updateUI: updateUI
      });

      // See http://www.sitepoint.com/css3-animation-javascript-event-handlers/
      dragAndDropService.addDragListener("gameArea", handleDragEvent);
    }

    function handleDragEvent(type: any , cx: any , cy: any ) {

      gameArea = document.getElementById("gameArea");
      scoreEl = [angular.element(document.getElementById('e2e_test_player1score')).parent(),
      		angular.element(document.getElementById('e2e_test_player2score')).parent()];

    	if(dragSet || !isYourTurn) {
            return;
        }

        var size = getSquareWidthHeight();
        var x = Math.min(Math.max(cx - gameArea.offsetLeft, 0), gameArea.clientWidth - size.width),
            y = Math.min(Math.max(cy - gameArea.offsetTop, 0), gameArea.clientHeight - size.height);

        var row = Math.floor( numRows * y / gameArea.clientHeight ),
            col = Math.floor( numCols * x / gameArea.clientWidth );

        if (type === "touchstart" && !dragEl) {

            dragStartPos = {row: row, col: col};
            baseEl = angular.element(document.getElementById("e2e_test_seeds_" + dragStartPos.row + "x" + dragStartPos.col));
            baseParent = baseEl.parent();
            baseParent.addClass('selected');
            baseVal = +baseEl.text();
            boardTemp = angular.copy(board);

            boardTemp[row][col] = 0;
            //$scope.$apply();

			var rect = baseEl[0].getBoundingClientRect();
			basePos = {left: rect.left - gameArea.offsetLeft, top: rect.top - gameArea.offsetTop};
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
            var to = {row: row, col: col};
	    	var cDiff = to.col - dragStartPos.col;
	    	if(!(dragStartPos.row === 0 && cDiff > 0 || dragStartPos.row === 1 && cDiff < 0)) {
/*	    		var t = $scope.board;
	    		$scope.board = boardTemp;*/
	            dragMove = selectCell(dragStartPos.row, dragStartPos.col);
	            if(dragMove) {
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
            if(!dragSet) {
				resetDragEl(baseVal);
            }
        }
    }
    //dragAndDropService.addDragListener("gameArea", handleDragEvent);

    function setDraggingPiece(row : any, col : any) {
    	var topLeft = getSquareTopLeft(row, col);
        var squareSize = getSquareWidthHeight();
        dragEl.css({
        	left: topLeft.left + ((row === 0 ) ? 0 : squareSize.width / 2) + "px",
        	top: topLeft.top + "px"
        });
    }

    function getSquareWidthHeight() {
        return {
            width: gameArea.clientWidth / numCols,
            height: gameArea.clientHeight / numRows
        };
    }

    function getSquareTopLeft(row : any, col : any) {
        var size = getSquareWidthHeight();
        return {top: (row === 0) ? size.height * 0.42 : size.height * 1.1, left: col * size.width};
    }

    function getNextPos(row : any, col : any) {
    	if(row === 0) {
    		col--;
    	}
    	else {
    		col++;
    	}

    	if(col < 0) {
    		row = 1;
    		col = 0;
    	}
    	else if(col > 5) {
    		row = 0;
    		col = 5;
    	}
    	return {row: row, col: col};
    }

    function resetDragEl(val : any){
	    dragEl[0].style.opacity = 0;
	    baseParent.removeClass('selected');
	    setTimeout(function(){
	    	boardTemp[dragStartPos.row][dragStartPos.col] = val;
            //$scope.$apply();

	    	dragEl.detach();
	    	dragEl = null;
	    	dragStartPos = null;
	    }, 100);
    }

    function updateVals(val : any, callback : any){
		if(setIndex < set.updates.length) {
	    	var pos = set.updates[setIndex++];
			setDraggingPiece(pos.row, pos.col);
			dragEl.text(--val);
			var pEl = angular.element(document.getElementById("pit_" + pos.row + "x" + pos.col)).addClass('pos');
			setTimeout(function(){
				pEl.removeClass('pos');
			}, 2500);
			var uEl = angular.element(document.getElementById("e2e_test_seeds_" + pos.row + "x" + pos.col));

			boardTemp[pos.row][pos.col] = +uEl.text() + 1;
			if(boardTemp[pos.row][pos.col] === '2' || boardTemp[pos.row][pos.col] === '3'){
				pEl.addClass('captured');
			}
        //     $scope.$apply(function(){
				// setTimeout(function(){
					updateVals(val, callback);
				// }, 400);
        //     });


		}
		else {
			setIndex = 0;
			setTimeout(function(){
				updateCaptures(callback);
			}, 400);
		}
    }

    function updateCaptures(callback : any){
		if(setIndex < set.captures.length) {
			scoreEl[turnIndex].addClass('capture');
			dragEl.addClass('capture');
	    	var pos = set.captures[setIndex++];
	    	setDraggingPiece(pos.row, pos.col);
	    	var uEl = angular.element(document.getElementById("e2e_test_seeds_" + pos.row + "x" + pos.col));
	    	dragEl.text(+dragEl.text() + (+uEl.text()));

			boardTemp[pos.row][pos.col] = 0;
            //$scope.$apply();

			setTimeout(function(){
				updateCaptures(callback);
			}, 400);
		}
		else {
			setIndex = 0;
			setTimeout(callback, 100);
		}
    }


    function dragDone() {
    	updateVals(baseVal, function(){
    		resetDragEl(0);
    		gameService.makeMove(dragMove);
    		scoreEl[turnIndex].removeClass('capture');
    		dragMove = null;
    		dragSet = false;
    	});
    }

    scores = [0, 0];
	//resizeGameAreaService.setWidthToHeight(1.6);

/*	$translate('OWARE_GAME').then(function (translation) {
      console.log("Translation of 'OWARE_GAME' is " + translation);
    });*/


    function sendComputerMove() {
        var items = gameLogic.getPossibleMoves(board, turnIndex, scores);
        gameService.makeMove(items[Math.floor(Math.random()*items.length)]);
    }


  	function getUpdatePos(row : any, col : any, board1 : any, board2 : any) {
  		var updates : any[] = [], captures : any[] = [];
  		var pos = {row: row, col: col}, diff : any, val = board1[row][col];
  		while(val){
  			pos = getNextPos(pos.row, pos.col);
            if(pos.row === row && pos.col === col) {
                continue;
            }
  			diff = board2[pos.row][pos.col] - board1[pos.row][pos.col];
  			if(diff > 0) {
  				updates.push({row: pos.row, col: pos.col});
  			}
  			else if(diff < 0){
  				updates.push({row: pos.row, col: pos.col});
  				captures.push({row: pos.row, col: pos.col});
  			}
            val--;
  		}
  		captures.reverse();
  		return { updates: updates, captures: captures };
  	}

	function updateUI(params : any) {
		board = params.stateAfterMove.board;
		delta = params.stateAfterMove.delta;
		scores = params.stateAfterMove.scores;

		if (board === undefined) {
			board = gameLogic.getInitialBoard();
			scores = [0, 0];
		}

		validMoves = gameLogic.getPossibleMoves(board, params.turnIndexAfterMove, scores);

		isYourTurn = params.turnIndexAfterMove >= 0 && // game is ongoing
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

	function selectCell(row : any, col : any)  : any{
		log.info(["Clicked on cell:", row, col]);
		if (window.location.search === '?throwException') { // to test encoding a stack trace with sourcemap
			throw new Error("Throwing the error because URL has '?throwException'");
		}
		if (!isYourTurn) {
			return false;
		}
		try {
			var move = gameLogic.createMove(board, row, col, turnIndex, scores);
			isYourTurn = false; // to prevent making another move
			return move;

		} catch (e) {
			log.info(["Cell is already full in position:", row, col]);
			return false;
		}
	}

    export function isValid(row : any, col : any) {
        for(var i = 0; i < validMoves.length; i++) {
            var pos = validMoves[i][2].set.value;
            if(row === pos.row && col === pos.col) {
                return true;
            }
        }
        return false;
    };

	export function getSeeds(row : any, col : any) {
		if(dragSet) {
			return boardTemp[row][col];
		}
		else{
			return board[row][col];
		}

	};

	export function getScore (row : any) {
		return scores[row];
	};

// 	gameService.setGame({
// 	  gameDeveloperEmail: "rsjangle27@gmail.com",
// 	  minNumberOfPlayers: 2,
// 	  maxNumberOfPlayers: 2,
// 	  isMoveOk: gameLogic.isMoveOk,
// 	  updateUI: updateUI
// 	});
// }]);
}

angular.module('myApp', ['ngTouch', 'ui.bootstrap', 'gameServices'])
  .run(function () {
  $rootScope['game'] = game;
  translate.setLanguage('en',  {
    RULES_OF_OWARE:"Rules of OWARE",
  	RULES_SLIDE1: "To sow you must take all the seeds of  any of your holes and lay its out along the holes against the direction of the clockwise. In every hole you should lay it out one seed.  If you reach the last hole of your ground you must continue in the land of the other player. Remember, you always have to lay out seeds in the direction against the clockwise.",
  	RULES_SLIDE2: "If the last hole where you sow is in the land of the other player and there are two or three seeds in the last hole remove from the board and keep them. If the previous holes also contain two or three seeds also remove them and remove all the seeds of your opponent that contains two or three seeds.",
  	RULES_SLIDE3: "As the game progresses, it is possible that one hole contains more than 12 seeds. This hole is called Kroo and makes possible complete one round. When the harvest starts at the Kroo, this hole must finish empty what means that the player shouldn’t lay out any seed.",
  	RULES_SLIDE4: "To play a run  and  leaves the other player with no seeds to continue playing is not allowed. If you do it you will lose the game.",
  	RULES_SLIDE5: "If the other player has only one seed in his field you will have to remove it in order to harvest and continue playing. Players must provide in advance to avoid this situation. If this is impossible, because we only have one seed in our land. The game is finished. The winner is the one that harvest more.",
  	RULES_SLIDE6: "Game ends with a player having more than 23 seeds in his house. When there are few seeds left on the counter, the game may be perpetuating and hardly any of the 2 players can capture any new seed. By mutual agreement player can agree the end of the game. In this case every player is the owner of the seeds in his side.  As always, who has garnered more wins the match.",
  	CLOSE:"Close"
  });
  game.init();
});
