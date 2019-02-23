require([ "dojo/_base/declare", "dojo/dom-construct", "dojo/dom-style", "dojo/on", "dojo/query", "dojo/dom-class", "dojo/_base/lang", "dojo/dom", "dojox/timing" ], 
        function(declare, domConstruct, domStyle, on, query, domClass, lang, dom) {
            
    declare("fenouiltonic.game100.gamemodel", null, {
        _gameGraph: null,
        _gameState: [],
        _currentVertex: null,
        _xmax: null,
        _ymax: null,
        _game: null,
        _gameController: null,
        
        constructor: function() {
        },
        
        setGameParameters: function(xmax, ymax, gameGraph) {
            if (gameGraph == null) {
                gameGraph = this._createDefaultGraph(xmax, ymax);
            }
            
            this._gameGraph = gameGraph;
            
            this._xmax = xmax;
            this._ymax = ymax;
            
            // Fire notifications
            if (this._gameController != null) {
                this._gameController.gameParametersChanged();
            }
        },
        
        _createDefaultGraph: function(xmax, ymax) {
            var graph = {};
            var mvtx = [2, 3, 2, 0, -2, -3, -2, 0];
            var mvty = [2, 0, -2, -3, -2, 0, 2, 3];
            for (var x = 0; x < xmax; x++) {
                for (var y = 0; y < ymax; y++) {
                    var edges = [];
                    for (var m = 0; m < mvtx.length; m++) {
                        var newx = x + mvtx[m];
                        var newy = y + mvty[m];
                        if (newx >= 0 && newy >= 0 && newx < xmax && newy < ymax) { // in game boundaries ?
                            edges.push(":" + newx + "-" + newy);
                        }
                    }
                    graph[":" + x + "-" + y] = edges;
                }
            }
            return graph;
        },
        
        getGameWidth: function () {
            return this._xmax;
        },
        
        getGameHeight: function () {
            return this._ymax;
        },
        
        setController: function(controller) {
            this._gameController = controller;
        },
        
        isStarted: function() {
            return this._gameState.length > 0;
        },
        
        isWon: function() {
            return this._gameState.length == (this._xmax * this._ymax);
        },
        
        getCurrentCount: function() {
            return this._gameState.length;
        },
        
        isLost: function() {
            if (! this.isStarted()) {
                return false;
            }
            if (this.isWon()) {
                return false;
            }
            
            var edges = this.getEdges(this._currentVertex);
            var cannotMove = true;
            for (var i = 0; i < edges.length; i++) {
                var cannotMoveToThisEdge = false;
                for (var j = 0; j < this._gameState.length; j++) {
                    if (this._gameState[j] == edges[i]) {
                        cannotMoveToThisEdge = true;
                        break;
                    }
                }
                cannotMove = cannotMove && cannotMoveToThisEdge;
            }
            
            return cannotMove;
        },
        
        setGameState: function(currentVertex, gameState) {
            if (currentVertex == null) {
                throw "Missing arg 'currentVertex'";
            }
            
            this._currentVertex = currentVertex;
            this._gameState = typeof gameState !== 'undefined' ? gameState : []; 

            // Fire notifications
            if (this._gameController != null) {
                this._gameController.gameStateChanged();
            }
        },
        
        getGameState: function() {
            return this._gameState;
        },
        
        startNewGame: function() {
            this._currentVertex = null;
            this._gameState = [];
            
            // Fire notifications
            if (this._gameController != null) {
                this._gameController.gameStateChanged();
            }
        },
        
        undo: function() {
            if (this._currentVertex == null) {
                return; // Very beginning, nothing to do !
            }
            
            this._gameState.pop();
            if (this._gameState.length > 0) {
                this._currentVertex = this._gameState[this._gameState.length - 1];
            } else {
                this._currentVertex = null;
            }
            
            // Fire notifications
            if (this._gameController != null) {
                this._gameController.gameStateChanged();
            }
        },
        
        canMoveTo: function(vertex) {
            if (vertex == null) {
                throw "Argument 'vertex' cannot be null";
            }
            try {
                vertex = this.ensureValidVertex(vertex);
            } catch (e) {
                return false;
            }
            
            // Cannot move if the edges is already visited
            for (var i = 0; i < this._gameState.length; i++) {
                if (this._gameState[i] == vertex) {
                    return false;
                }
            }
            
            if (this._currentVertex != null) {
                // Can move if edge is in the current vertex's edge list
                var edges = this.getEdges(this._currentVertex);
                for (var i = 0; i < edges.length; i++) {
                    if (edges[i] == vertex) {
                        return true;
                    }
                }
                
                return false;
            } 
            
            return true;
        },
        
        moveTo: function(vertex) {
            if (! this.canMoveTo(vertex)) {
                throw "Cannot move to vertex '" + vertex + "'";
            }
            
            this._gameState.push(vertex);
            this._currentVertex = vertex;
        },
        
        getEdges: function(vertex) {
            vertex = this.ensureValidVertex(vertex);
            var edges = this._gameGraph[vertex];
            return edges;
        },
        
        isValidVertex: function(vertex) {
            if (vertex == null) {
                throw "Argument 'vertex' cannot be null";
            }
            
            try {
                this.ensureValidVertex(vertex);
            } catch (e) {
                return false;
            }
            
            return true;
        },
        
        ensureValidVertex: function(vertex) {
            if (vertex == null && this._currentVertex == null) {
                throw "Argument 'vertex' is null and there is no current vertex.";
            }
            
            var v = vertex != null ? vertex : this._currentVertex;
            if (! this._gameGraph.hasOwnProperty(v)) {
                throw "There is no vertex by that name '" + v + "'";
            }
            
            return v;
        },
        
        getCurrentVertex: function() {
            return this._currentVertex;
        }
    });

    declare("fenouiltonic.game100.gamecontroller", null, {
        _gameModel: null,
        _gameBoard: null,
        _infoView: null,
        
        constructor: function() {
        },
        
        setModel: function(model) {
            this._gameModel = model;
        },
        
        setBoard: function(board) {
            this._gameBoard = board;
        },

        setInfoView: function(view) {
            this._infoView = view;
        },
        
        gameParametersChanged: function() {
            if (this._gameBoard != null) {
                this._gameBoard.createDOM();
                // TODO
            }
        },
        
        gameStateChanged: function() {
            if (this._gameBoard != null) {
                this._gameBoard.clearDOM();
                // TODO
            }
            if (this._infoView != null) {
                this._infoView.setMessage("");
                this._infoView.setClock("00:00");
                // TODO
            }
        },
        
        moveTo: function(cell) {
            if (this._gameModel.isLost() || this._gameModel.isWon()) {
                return false;
            }
            
            var allowed = this._gameModel.canMoveTo(cell);
            if (! allowed) {
                this._infoView.setMessage("You cannot move to that cell");
                return false;
            }
            
            this._infoView.setMessage("");
            this._gameModel.moveTo(cell);
            
            if (this._gameModel.isLost()) {
                this._infoView.setMessage("You lost !");
            }
            
            if (this._gameModel.isWon()) {
                this._infoView.setMessage("You won !");
            }
            
            return true;
        },
    });

    declare("fenouiltonic.game100.infoview", null, {
        _infoViewRootNode: null,
        _messageNode: null,
        _clockNode: null,

        constructor: function(domNode) {
            this._infoViewRootNode = domNode;
            this.createDOM();
        },
        
        createDOM: function() {
            var domNode = this._infoViewRootNode;
            
            // Clear everything
            domConstruct.empty(domNode);
            
            // and build the DOM structure
            var tableNode = domConstruct.create("table", { 'class': 'game-info' }, domNode);
            var tr = domConstruct.create("tr", {}, tableNode);
            this._messageNode = domConstruct.create("td", { 'class': "game-message" }, tr);
            this._clockNode = domConstruct.create("td", { 'class': "game-clock" }, tr);
        },
        
        setMessage: function(str) {
            this._messageNode.textContent = str;
        },
        
        setClock: function(str) {
            this._clockNode.textContent = str;
        }
    });

    declare("fenouiltonic.game100.gameboard", null, {
        _gameModel: null,
        _gameController: null,
        _gameTableNode: null,
        _gameBoardRootNode: null,
        _displayPossibleCells: false,
        
        constructor: function(domNode) {
            this._gameBoardRootNode = domNode;
        },
        
        setModel: function(model) {
            this._gameModel = model;
        },
        
        setDisplayPossibleCells: function(b) {
            this._displayPossibleCells = b;
        },
        
        setController: function(controller) {
            this._gameController = controller;
        },
        
        createDOM: function() {
            var xmax = this._gameModel.getGameWidth();
            var ymax = this._gameModel.getGameHeight();
            var domNode = this._gameBoardRootNode;
            
            // Clear everything
            domConstruct.empty(domNode);
            
            // and build the DOM structure
            this._gameTableNode = domConstruct.create("table", { 'class': 'game-board' }, domNode);
            for (var x = 0; x < xmax; x++) {
                var tr = domConstruct.create("tr", {}, this._gameTableNode);
                for (var y = 0; y < ymax; y++) {
                    var td = domConstruct.create("td", { 'class': ((x + y) % 2 == 0 ? 'even-cell' : 'odd-cell'), 
                                                         id: ":" + x + "-" + y }, tr);
                    on(td, "click", dojo.hitch(this, "_evtClick"));
                }
            }
            
            // Adjust the table height to be equal to its height
            var width = domStyle.get(this._gameTableNode, "width");
            domStyle.set(this._gameTableNode, "height", width + "px");
        },
        
        
        clearDOM: function() {
            // Clear CSS Classes
            query(".active-cell, .used-cell, .possible-cell, .impossible-cell", this._gameTableNode)
                .removeClass("active-cell")
                .removeClass("used-cell")
                .removeClass("possible-cell")
                .removeClass("impossible-cell");
            // Remove text content
            query("td", this._gameTableNode)
                .forEach(function (node) {
                    node.textContent = "";
                });
            
            var usedCells = this._gameModel.getGameState();
            var cell = null;
            for (var i = 0; i < usedCells.length; i++) {
                cell = dom.byId(usedCells[i]);
                cell.textContent = (i + 1)
                domClass.add(cell, "used-cell");
            }
            if (cell != null) {
                domClass.add(cell, "active-cell");
                this._displayPossibleCellsIfNeeded();
            }
        },
        
        _displayPossibleCellsIfNeeded: function() {
            if (this._displayPossibleCells) {
                var possibleCells = this._gameModel.getEdges();
                for (var i = 0; i < possibleCells.length; i++) {
                    var cell = possibleCells[i];
                    domClass.add(cell, domClass.contains(cell, "used-cell") ? "impossible-cell" : "possible-cell");
                }
            }
        },
        
        _evtClick: function(evt) {
            var cellID = evt.target.id;
            var cellNode = evt.target;
            var allowed = this._gameController.moveTo(cellID)
            if (allowed) {
                // Clear CSS Classes
                query(".active-cell, .possible-cell, .impossible-cell", this._gameTableNode)
                    .removeClass("active-cell")
                    .removeClass("possible-cell")
                    .removeClass("impossible-cell");
                
                cellNode.textContent = this._gameModel.getCurrentCount();
                domClass.add(cellNode, "active-cell");
                domClass.add(cellNode, "used-cell");
                this._displayPossibleCellsIfNeeded();
            }
        }
    });
});
