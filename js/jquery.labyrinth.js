/* Labyrinth: a jQuery plugin for creating labyrinth games
              by Matteo Sisti Sette
              
   v. 0.0.5
   
   Copyright 2014 Matteo Sisti Sette
   Released under the GPLv2 licence

http://gitgub.com/matteosistisette/jquery-ui-labyrinth

*/

(function($){
	
	$.widget("matteosistisette.labyrinth", {
		
		
		ver: null,		//[]
		hor: null,		//[]
		currentdrawpos: -1,
		drawing: false,
		enteredfrom: -1,
		
		started: false,
		drawn: null,		//[]
		
		canvas:null,
		drawContext: null,
		
		prevx:0,
		prevy:0,
		
		complete:null,		//[]
		ncomplete: 0,
		
		
		options: {
			columns: 8,
			rows: 8,
			cellSize: 50,
			density: 2,
			drawColor: "#000000",
			drawWidth: 1,
			borderColor: "#000000",
			borderWidth: 1,
			borderLineCap: "square",
			backgroundColor: "rgba(255,255,255,0)",
			inOutPairs: [],
			padding: [50, 50, 50, 50],
			onStart: function() {},
			onComplete: function() {},
			onCompleteAll: function() {}
		},
		
		reset: function() {
			this._cleanUp();
			this._build();
		},
		
		clearDrawing: function() {
			this._clearDrawingInternally();
			this.drawContext.clearRect(0,0,this.canvas.width, this.canvas.height);
			this._drawBorders();
			this.complete=[];
			this.ncomplete=0;
		},
		
		destroy: function () {
			this._cleanUp();
			$.Widget.prototype.destroy.call(this);
		},
		
		resize: function (newColumns, newHeight) {
			this.options.columns=newColumns;
			this.options.rows=newHeight;
			this._update();
		},
		
		_setOption: function (key,value) {
			this._super(key,value);
		},
		_setOptions: function(options) {
			this._super(options);
			if (options.columns!=undefined
				|| options.rows!=undefined
				|| options.cellSize!=undefined
				|| options.density!=undefined
				|| options.inOutPairs!=undefined
			) {
				this.reset();
			}
			else if (options.borderColor!=undefined
				|| options.borderWidth!=undefined
				|| options.borderLineCap!=undefined
				|| options.padding!=undefined
				
			) {
				this.clearDrawing();
			}
			
		},
		
		_create: function () {
			this._build();
			this._activateDraw();
		},
		
		_update: function () {
			reset();
		},
		
		_cleanUp: function() {
			$(this.canvas).remove();
			this.canvas=null;
			this.ver=[];
			this.hor=[];
			this.currentdrawpos=-1;
			this.drawing=false;
			this.enteredfrom=-1;
		
			this.started=false;
			this.drawn=[];
			this.complete=[];
			this.ncomplete=0;
			
			
			this.canvas=null;
			this.drawContext=null;
		},
		
		_clearDrawingInternally: function() {
			this.drawn=[];
			this.currentdrawpos=-1;
			this.started=false;
			this.enteredfrom=-1;
			
		},
				
		_build: function() {
			this.ver=[];
			this.hor=[];
			this.drawn=[];
			this.complete=[];
			
			var fullCanvasWidth=this.options.columns*this.options.cellSize+this.options.padding[3]+this.options.padding[1];
			var fullCanvasHeight=this.options.rows*this.options.cellSize+this.options.padding[0]+this.options.padding[2];
			this.canvas=$("<canvas>").attr("width", fullCanvasWidth).attr("height", fullCanvasHeight).appendTo(this.element).addClass("labyrinth").get()[0];
			this.element.css({
				width: fullCanvasWidth,
				height: fullCanvasHeight,
			});
			
			for (var i=0;i<=this.options.rows;i++) {
				this.hor[i]=[];
				for (var j=0;j<this.options.columns;j++) this.hor[i][j]=true;
			}
			for (var i=0;i<this.options.rows;i++) {
				this.ver[i]=[];
				for (var j=0;j<=this.options.columns;j++) this.ver[i][j]=true;
			}
		
			for (var i=0;i<this.options.inOutPairs.length;i++) {
				var p=this.computeRandomPath(this.options.inOutPairs[i]);
				this.openPath(p);
				for (var j=0;j<2;j++) for (var k=0;k<4;k++)
				  if (this.getNeighbourCell(this.options.inOutPairs[i][j],k)==-1) {
					  this.openWall(this.options.inOutPairs[i][j],k,true); break;
				  }
			}
		
			for (var i=0;i<this.options.columns*this.options.rows;i++) {
				var nopen=0;
				for (var j=0;j<4;j++) {
					if (this.isOpen(i,j)) {
						nopen++;
					
					}
				}
				if (nopen<this.options.density) {
					for (var x=0;x<this.options.density-nopen;x++) this.openWall(i,Math.floor(Math.random()*4));
				}
			}
			var ctx=this.canvas.getContext("2d");
			this.drawContext=ctx;
			
			this._drawBorders();
		},
		
		_drawBorders: function() {
			
			var ctx=this.drawContext;
			
			ctx.fillStyle=this.options.backgroundColor;
			ctx.fillRect(this.options.padding[3], this.options.padding[0], this.options.columns*this.options.cellSize, this.options.rows*this.options.cellSize);
			
			ctx.strokeStyle=this.options.borderColor;
			ctx.lineWidth=this.options.borderWidth;
			ctx.beginPath();
			ctx.lineCap=this.options.borderLineCap;
			var paddingLeft=this.options.padding[3];
			var paddingTop=this.options.padding[0];
			for (var i=0;i<this.hor.length;i++) {
				for (var j=0;j<this.hor[i].length;j++) if (this.hor[i][j]) {
					ctx.moveTo(paddingLeft+j*this.options.cellSize,paddingTop+i*this.options.cellSize);
					ctx.lineTo(paddingLeft+(j+1)*this.options.cellSize,paddingTop+i*this.options.cellSize);
					//debug(j*this.options.cellSize,i*this.options.cellSize, 
					  //"->", (j+1)*this.options.cellSize,i*this.options.cellSize);
					
				}
			}
			for (var i=0;i<this.ver.length;i++) {
				for (var j=0;j<this.ver[i].length;j++) if (this.ver[i][j]) {
					ctx.moveTo(paddingLeft+j*this.options.cellSize,paddingTop+i*this.options.cellSize);
					ctx.lineTo(paddingLeft+j*this.options.cellSize,paddingTop+(i+1)*this.options.cellSize);
					//debug(j*this.options.cellSize,i*this.options.cellSize,
					  //"->", j*this.options.cellSize,(i+1)*this.options.cellSize);
					
				}
			}
			ctx.stroke();
			
			//debug(this.hor);
			//debug(this.ver);
			
			
		},
		
		computeRandomPath: function(extremes) {
			var info=[];
			var visited=[];
			var cur=extremes[0];
			
			while (cur!=extremes[1] /*&& XXXX<100*/) {
				//XXXX++;
				//trace("Trying "+cur);
				visited[cur]=true;
		
				var candidates=[];
				for (var i=0;i<4;i++) {
					var n=this.getNeighbourCell(cur,i);
					if (n>=0 && !visited[n]) candidates.push(n);
				}
			
				if (candidates.length>0) {
					var r=Math.floor(Math.random()*candidates.length);
					info.push(cur);
			    		cur=candidates[r];
				
				}
				else {
					//debug("Deleting "+cur);
					cur=info.pop();
				}
			}
			info.push(extremes[1]);
			return info;
		
		},
		
		openPath: function(path) {
			for (var i=0;i<path.length-1;i++) {
				this.openWall(path[i],this.getDirection(path[i],path[i+1]));
			}
		},
		
		getNeighbourCellLeft: function(x) {
			if (x%this.options.columns>0) return x-1;
			else return -1;
		},
		getNeighbourCellRight: function(x)  {
			if (x%this.options.columns<this.options.columns-1) return x+1;
			else return -1;
		},
		getNeighbourCellUp: function(x)  {
			if (x>=this.options.columns) return x-this.options.columns;
			else return -1;
		},
		getNeighbourCellDown: function(x) {
			if (x<(this.options.rows-1)*this.options.columns) return x+this.options.columns;
			else return -1;
		},
	
		getNeighbourCell: function(x, direction) {
			switch (direction) {
				case 0: return this.getNeighbourCellRight(x); break;
				case 1: return this.getNeighbourCellUp(x); break;
				case 2: return this.getNeighbourCellLeft(x); break;
				case 3: return this.getNeighbourCellDown(x); break;
			}
		
		},
	
		getDirection: function(from,to) {
			switch (to-from) {
				case 1: return 0; break;
				case -1: return 2; break;
				case this.options.columns: return 3; break;
				case -this.options.columns: return 1; break;
				default: return -1;
			}
		},
		openWall: function(x,dir, force) {
			if (this.getNeighbourCell(x,dir)!=-1 || force) {
				var col=x%this.options.columns;
				var row=Math.floor(x/this.options.columns);
				switch (dir) {
					case 0: this.ver[row][col+1]=false; break;
					case 1: this.hor[row][col]=false;break;
					case 2: this.ver[row][col]=false;break;
					case 3: this.hor[row+1][col]=false;break;
				}
			}
		},
		isOpen: function(x,dir) {
				var col=x%this.options.columns;
				var row=Math.floor(x/this.options.columns);
				var res;
				switch (dir) {
					case 0: res= !(this.ver[row][col+1]); break;
					case 1: res= !(this.hor[row][col]);break;
					case 2: res= !(this.ver[row][col]);break;
					case 3: res= !(this.hor[row+1][col]);break;
				}
				//debug("Isopen("+x+","+dir+")="+res);
				return res;
		},
		
		/*
		_activateDraw: function() {
			debug("Activate draw");
			debug($(this.canvas).length);
			$(this.canvas).mouse({
				_mouseCapture: function() {
					debug("_mouseCapture() called");
					return true;
				},
		
				_mouseStart: function() {
					debug("_mouseStart() called");
					return this;
				}
			});
		
		}
		*/
		
		_handleMouseDown: function (mouseEvent) {
			
			this.drawing=true;
			var oldpos=this.currentdrawpos;
			
			var offset=$(this.canvas).offset();
			var mousex=mouseEvent.pageX-offset.left;
			var mousey=mouseEvent.pageY-offset.top;
						
			this.currentdrawpos=this._getDrawPos(mousex,mousey);
			if (this.currentdrawpos!=-1 && !this.drawn[this.currentdrawpos]) {
				this.drawing=false;
				return false;
			}
			this.drawContext.lineWidth=this.options.drawWidth;
			this.drawContext.strokeStyle=this.options.drawColor;
			
			
			
			if (this.currentdrawpos==-1 || this.currentdrawpos!=oldpos) {
				this.prevx=mousex;
				this.prevy=mousey;
				
			}
			else {
				
				this.drawContext.beginPath();
				this.drawContext.moveTo(this.prevx,this.prevy);
				this.drawContext.lineTo(mousex,mousey);
				this.drawContext.stroke();
				this.prevx=mousex;
				this.prevy=mousey;
			}
		},
		
		_handleMouseUp: function(mouseEvent) {
			this.drawing=false;
		},
		
		_handleMouseMove: function(mouseEvent) {
			if (!this.drawing) return;
			
			var offset=$(this.canvas).offset();
			var mousex=mouseEvent.pageX-offset.left;
			var mousey=mouseEvent.pageY-offset.top;
			
			
			var newpos=this._getDrawPos(mousex,mousey);
			var havetodraw=false;
			var complete=-1;
			if (newpos!=this.currentdrawpos) {
				//debug (this.currentdrawpos+"=>"+newpos);
				if (this.currentdrawpos==-1) {
					var isentrance=false;
					if (this.enteredfrom<0) for (var i=0;i<this.options.inOutPairs.length;i++) {
						if (this.options.inOutPairs[i][0]==newpos && !this.complete[i]) {
							isentrance=true;
							break;
						}
					}
					else if (this.enteredfrom==newpos) {
						isentrance=true;
					}
					if (isentrance) {
						this.enteredfrom=newpos;
						this.currentdrawpos=newpos;
						this.drawn[newpos]=true;
						if (!this.started) {
							this.started=true;
							this.options.onStart.call(this);
						}
						havetodraw=true;
					}
					else {
						this.drawing=false;
					}
				}
				else if (newpos==-1) {
					for (var i=0;i<this.options.inOutPairs.length;i++) {
						if (this.options.inOutPairs[i][0]==this.enteredfrom && this.options.inOutPairs[i][1]==this.currentdrawpos) {
							complete=i;
							break;

						}
					}
					if (complete>=0) {
						
						//debug("won");

						this.drawing=false;
						havetodraw=true;
					}
					else {
						this.drawing=false;
					}
				}
				else {
					var gd=this.getDirection(this.currentdrawpos,newpos);
					//debug(this.isOpen(this.currentdrawpos,gd));
					if (gd!=-1 && this.isOpen(this.currentdrawpos,gd)) {
						this.currentdrawpos=newpos;
						this.drawn[this.currentdrawpos]=true;
						havetodraw=true;
					}
					else {
						this.drawing=false;
						
					}
				}
			
			}
			else havetodraw=true;
			if (havetodraw) {
				this.drawContext.lineWidth=this.options.drawWidth;
				this.drawContext.strokeStyle=this.options.drawcolor;
			
				this.drawContext.beginPath();
				this.drawContext.moveTo(this.prevx,this.prevy);
				this.drawContext.lineTo(mousex,mousey);
				this.drawContext.stroke();
				this.prevx=mousex;
				this.prevy=mousey;
			}
			if (complete>=0) {
				this.complete[complete]=true;
				this.ncomplete++;
				this._clearDrawingInternally();	
				this.options.onComplete.call(this,complete, this.ncomplete==this.options.inOutPairs.length);
				if (this.ncomplete==this.options.inOutPairs.length) {
					this.options.onCompleteAll.call(this);
				}
			}
		},
		
		_activateDraw: function() {
		
			//var lab=this;
			$(this.element).mousedown(function(mouseEvent) {
				var lab=$(this).data("matteosistisette-labyrinth");
				lab._handleMouseDown(mouseEvent);
				return false;
			});
			
			
			$(this.element).mouseup(function(mouseEvent) {
				var lab=$(this).data("matteosistisette-labyrinth");
				lab._handleMouseUp(mouseEvent);
				return false;
			});
			
			
			$(this.element).mousemove(function(mouseEvent) {
				var lab=$(this).data("matteosistisette-labyrinth");
				lab._handleMouseMove(mouseEvent);
				return false;
			});
		},
		
		_getDrawPos: function(x,y) {
			var xpos=Math.floor((x-this.options.padding[3])/this.options.cellSize);
			var ypos=Math.floor((y-this.options.padding[0])/this.options.cellSize);
			if (0<=xpos && xpos<this.options.columns && 0<=ypos && ypos<this.options.rows) return ypos*this.options.columns+xpos;
			else return -1;
		}
	
	
	});
	
	function debug(){
		if (window.console) console.log.apply(console,arguments);
	}

}(jQuery));
