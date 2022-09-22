class CanvasStyle {
	
	constructor() {
		this.backgroundColor = "#DBDBDB";
		this.lineJoin = "round";
		
		this.contourColor = "#000000";
		this.insideColor = "#FFFFFF";
		this.ContourWidth = 0.5;
		this.lineDrawWidth = 1.0;
		this.haslineFill = true;
		this.lineFillWidth = 0.65;
		this.pointDrawWidth = 0.5;
		this.pointFillRadius = 0.68;
		
		this.selectionColor = "rgba(0, 121, 219, 0.3)";
		this.selectionOutline = "#0079db";
		
		
		this.trueColor = "#0A86EA";
		this.falseColor = "#FFFFFF";
	}
	
	dark()
	{
		//this.backgroundColor = "#0C0C0C";
		this.backgroundColor = "#263238";
		this.lineJoin = "miter";
		
		//this.contourColor = "#0AD9B0";
		this.contourColor = "#AFAFAF";
		this.insideColor = "#112833";
		this.ContourWidth = 0.5;
		this.lineDrawWidth = 1.0;
		this.haslineFill = false;
		this.lineFillWidth = 0.65;
		this.pointDrawWidth = 0.5;
		this.pointFillRadius = 0.68;
		
		this.selectionColor = "rgba(64, 78, 81, 0.3)";
		this.selectionOutline = "#61767A";
		
		this.trueColor = "#0090EA";
		this.falseColor = "#666666";
	}
}

var TOOL_SELECT = 0;
var TOOL_SPAN = 1;
var TOOL_DELETE = 2;

class Canvas {
	constructor(width,height, canvasTag) {
		this.width = width;
		this.height = height;
		
		this.canvasTag = canvasTag;
		this.context = canvasTag.getContext("2d");
		canvasTag.addEventListener("mousedown",(e) => this.mousedown(e));
		
		canvasTag.addEventListener("mousemove",(e) => this.mousemove(e));
		
		canvasTag.addEventListener("contextmenu",(e) => this.mouseup(e));
		canvasTag.addEventListener("mouseup",(e) => this.mouseup(e));
		canvasTag.addEventListener("wheel",(e) => this.mousewheel(e));
		
		
		//this.touch = {t:{pageX:100,pageY:100},color:"#000000"};
		this.touchManager = new TouchManager();
		canvasTag.addEventListener("touchstart",(e) => {this.touchManager.touchstart(e);}, false);
		canvasTag.addEventListener("touchmove",(e) => {this.touchManager.touchmove(e);}, false);
		canvasTag.addEventListener("touchend", (e) => {
			
			e.preventDefault(); // prevent 300ms after a tap event?
			this.touchManager.touchend(e);
			
		}, false);
		canvasTag.addEventListener("touchcancel",(e) => {this.touchManager.touchcancel(e);}, false);
		canvasTag.addEventListener("touchleave",(e) => {this.touchManager.touchleave(e);}, false);
		
		this.touchManager.addEventListener("onTouchDown",(p,ntouches) => {this.mousedown({pageX:p.x,pageY:p.y,button:ntouches})}, false);
		this.touchManager.addEventListener("onTouchMove",(p,ntouches) => {this.mousemove({pageX:p.x,pageY:p.y,button:ntouches})}, false);
		this.touchManager.addEventListener("onTouchUp",(p,ntouches) => {this.mouseup({pageX:p.x,pageY:p.y,button:ntouches})}, false);
		this.touchManager.addEventListener("onTouchZoom",(p,zoomDelta) => {this.dozoom(p,zoomDelta)}, false);
				
		this.nodes = new Array();
		this.selectedNodes = new Array();
		this.uinodes = new Array();
		this.draggingDraw = false;
		this.dragging = false;
		
		this.spanX = 0;//-600;
		this.spanY = 0;//-400;
		this.spanning = false;
		
		this.selecting = false;
		this.style = new CanvasStyle();
		this.style.dark();
		
		this.fillColor = "#000000";
		
		this.scale = 0.8;
		this.uiscale = 0.6;
		
		this.targeting = false;
		this.target = false;
			
		this.tool = TOOL_SELECT;
	}
	
	setNodes(nodes)
	{
		this.nodes = nodes;
	}
	
	setUiNodes(uinodes)
	{
		this.uinodes = uinodes;
	}

	redraw()
	{
		var ctx = this.context;
		ctx.fillStyle=this.style.backgroundColor;
		ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height); // Clears the canvas
		ctx.lineJoin = "round";
		ctx.lineWidth = 1 * this.scale;
		ctx.font = (30 * this.scale)+"px Arial";
		
		for(var i=0;i < this.selectedNodes.length;i++)
		{
			var g = this.selectedNodes[i];
			this.draw_selectionGlow(g.pos,g.dim.w/2);
		}
		for(var i=0; i < this.nodes.length; i++) 
		{
			var g = this.nodes[i];
			g.ondraw_first(this,g);
		}
		for(var i=0; i < this.nodes.length; i++) 
		{
			var g = this.nodes[i];
			g.ondraw(this,g);
			
			/*var x1 = g.pos.x-g.dim.w/2;
			var y1 = g.pos.y-g.dim.h/2;
			var x2 = g.pos.x+g.dim.w/2;
			var y2 = g.pos.y+g.dim.h/2;
			
			var pa = {x:x1,y:y1};
			var pb = {x:x2,y:y2};
			
			var oldFillStyle = ctx.fillStyle;
			var oldLineWidth = ctx.lineWidth;
			
			ctx.lineWidth = 1;
			//this.fill_color(this.style.selectionColor);
			ctx.fillStyle = this.style.selectionColor;
			this.draw_color(this.style.selectionOutline);
			this.fill_rect(pa,pb);
			ctx.fillStyle = oldFillStyle;
			ctx.lineWidth = oldLineWidth;*/
		}
		if(this.draggingDraw && this.dragging)
		{
			this.dragging.ondraw(this,this.dragging);
		}
		if(this.selecting)
		{
			var oldFillStyle = ctx.fillStyle;
			var oldLineWidth = ctx.lineWidth;
			
			ctx.lineWidth = 3;
			//this.fill_color(this.style.selectionColor);
			ctx.fillStyle = this.style.selectionColor;
			this.draw_color(this.style.selectionOutline);
			this.fill_rect(this.selecting[0],this.selecting[1]);
			ctx.fillStyle = oldFillStyle;
			ctx.lineWidth = oldLineWidth;
		}
		
		/*if(this.touchManager.touches.length > 0)
		{	
			for(var i=0; i < this.touchManager.touches.length; i++) 
			{
				var touch = this.touchManager.touches[i];
				var tp = this.untransfp({x:touch.x,y:touch.y});
				if(tp.x && tp.y)
				{
					if(this.touchManager.touchDownIssued)
						this.draw_color("#FF0000");
					else
						this.draw_color("#00FF00");
					
					this.fill_text({x:tp.x+45,y:tp.y},""+this.touchManager.touches.length+","+this.touchManager.numTouches);
					//this.fill_text({x:tp.x+45,y:tp.y+45},""+this.touchManager.touchDownDistance);
					
					this.draw_polygon([
					{x:tp.x-30,y:tp.y-30},
					{x:tp.x+30,y:tp.y+30},
					{x:tp.x,y:tp.y},
					{x:tp.x+30,y:tp.y-30},
					{x:tp.x-30,y:tp.y+30},
					{x:tp.x,y:tp.y}]
					);
				}
			}
			
			if(  this.touchManager.touches.length > 1)
			{
				this.draw_point(this.untransfp(this.touchManager.getCenterTouchPos()));
			}
		}*/
		
		var last_spanX = this.spanX;
		var last_spanY = this.spanY;
		var last_scale = this.scale;
		
		this.spanX = 0;
		this.spanY = 0;
		this.scale = this.uiscale;
		ctx.lineWidth = 1 * this.scale;
		ctx.font = (30 * this.scale)+"px Arial";
		for(var i=0; i < this.uinodes.length; i++) 
		{
			var g = this.uinodes[i];
			g.ondraw(this,g);
		}
		this.spanX = last_spanX;
		this.spanY = last_spanY;
		this.scale = last_scale;
		
	}
	
	resize(width, height) {
		this.canvasTag.width = width;
		this.canvasTag.height = height;
		this.width = width;
		this.height = height;
		
		this.redraw();
	}
	
	// helper selection
	deselectAll()
	{
		for(var i =this.selectedNodes.length-1;i>=0;i--)
		{
			this.selectedNodes[i].selected = false;
			this.selectedNodes.pop();
		}
	}
	
	selectThose(newnodes)
	{
		for(var i =newnodes.length-1;i>=0;i--)
		{
			newnodes[i].selected = true;
			this.selectedNodes.push(newnodes[i]);
		}
	}
	
	
	// helper mosue
	getNodeAt(nodes,p)
	{
		for(var i=0;i < nodes.length; i++)
		{
			var g = nodes[i];
			var x1 = g.pos.x - g.dim.w/2;
			var y1 = g.pos.y - g.dim.h/2;
			var x2 = g.pos.x + g.dim.w/2;
			var y2 = g.pos.y + g.dim.h/2;
			
			if(x1 <= p.x && x2 >= p.x && y1 <= p.y && y2 >= p.y)
			{
				return g;
			}
		}
		return false;
	}
	
	getNodesInside(nodes,p1,p2)
	{
		var nodesret = new Array();
		var p1x = p1.x > p2.x ? p2.x : p1.x;
		var p1y = p1.y > p2.y ? p2.y : p1.y;
		var p2x = p1.x > p2.x ? p1.x : p2.x;
		var p2y = p1.y > p2.y ? p1.y : p2.y;
		for(var i=0;i < nodes.length; i++)
		{
			var g = nodes[i];
			var x1 = g.pos.x - g.dim.w/2;
			var y1 = g.pos.y - g.dim.h/2;
			var x2 = g.pos.x + g.dim.w/2;
			var y2 = g.pos.y + g.dim.h/2;
			
			if(x2 > p1x && y2 > p1y && x1 < p2x && y1 < p2y)
			{
				nodesret.push(g);
			}
		}
		return nodesret;
	}
	
	mousedown(e){
		
		var rightClick = e.button == 2;
		var tfpmouse = {x:e.pageX - this.canvasTag.offsetLeft,y:e.pageY - this.canvasTag.offsetTop};
		var uimouse = {x:tfpmouse.x/this.uiscale,y:tfpmouse.y/this.uiscale};
		this.mouse = this.untransfp(tfpmouse);
		
		//console.log("mousedown "+this.mouse.x+","+this.mouse.y);
		
		this.targeting = false;
		this.target = false;
		
		this.spanning = true;
		this.spanned = false;
		this.selecting = false;
		
		/*if(this.tool == TOOL_SPAN)
		{
			this.spanning = true;
		}
		else if(this.tool == TOOL_SELECT)
		{
			if(rightClick)
			{
				this.spanning = true;
			}
			else
			{
				this.selecting = [{x:this.mouse.x,y:this.mouse.y},this.mouse];
			}
			this.spanning = true;
		}*/
		
		//if(
		//(this.tool != TOOL_SPAN || deleting) &&
		//(this.tool == TOOL_SELECT && !rightClick)
		
		//this.tool == TOOL_SELECT
		//)		
		//{
		//	this.applyClick(e);
		//}
		
		if(this.spanning)
		{
			this.draggingOffx = this.mouse.x;
			this.draggingOffy = this.mouse.y;
		}
		
		this.redraw();
	}
	
	mousemove(e){
		this.mouse = this.untransfp({x:e.pageX - this.canvasTag.offsetLeft,y:e.pageY - this.canvasTag.offsetTop});
		
		//console.log("mousemove "+this.mouse.x+","+this.mouse.y);
		
		if(this.dragging)
		{
			var dragdeltax = (this.mouse.x + this.draggingOffx) - this.dragging.pos.x;
			var dragdeltay = (this.mouse.y + this.draggingOffy) - this.dragging.pos.y;
			if(this.dragging.selected == true)
			{
				for(var i =0;i<this.selectedNodes.length;i++)
				{
					this.selectedNodes[i].pos.x += dragdeltax;
					this.selectedNodes[i].pos.y += dragdeltay;
				}
			}
			else
			{
				this.dragging.pos.x += dragdeltax;
				this.dragging.pos.y += dragdeltay;
			}
			document.body.style.cursor = "grabbing";
			this.redraw();
		}
		else if(this.spanning)
		{
			this.spanX -= this.mouse.x - this.draggingOffx;
			this.spanY -= this.mouse.y - this.draggingOffy;
			document.body.style.cursor = "grab";
			this.spanned = true;
			this.redraw();
		}
		else if(this.selecting)
		{
			document.body.style.cursor = "default";
			this.selecting[1] = this.mouse;
			this.redraw();
		}
	}
	
	mouseup(e){
		var rightClick = e.button == 2;
		if(rightClick)
		{
			e.preventDefault();
		}

		this.mouse = this.untransfp({x:e.pageX - this.canvasTag.offsetLeft,y:e.pageY - this.canvasTag.offsetTop});
		
		//console.log("mouseup "+this.mouse.x+","+this.mouse.y);
		
		if(this.dragging)
		{
			var nodeDraggedInto = this.getNodeAt(this.nodes,this.mouse);
			this.dragging.ondragged(this.dragging,nodeDraggedInto,this.mouse.x,this.mouse.y);
		}
		if(this.selecting)
		{
			if(!e.shiftKey)
				this.deselectAll();
			this.selectThose(this.getNodesInside(this.nodes,this.selecting[0],this.selecting[1]));
		}
		
		if(this.spanning && !this.spanned)
		{
			this.applyClick(e);
		}
		//if(this.spanning)
		//{
			//var factor = (this.mouse.x - this.draggingOffx) * (this.mouse.x - this.draggingOffx) + (this.mouse.y - this.draggingOffy)*(this.mouse.y - this.draggingOffy);
			//if(factor == 0.0)
			//{
				//this.applyClick(e);
			//}
		//}
		
		this.dragging = false;
		this.draggingDraw = false;
		this.spanning = false;
		this.selecting = false;
		document.body.style.cursor = "default";
		this.redraw();
	}
	
	mousewheel(e){
		
		this.targeting = false;
		this.target = false;
		/*var delta = e.deltaY;
		if(e.deltaMode == 0)//DOM_DELTA_PIXEL)
		{	
			delta = delta / 1000.0;
		}
		
		if(e.deltaMode == 1)//MouseEvent.DOM_DELTA_LINE)
		{
			delta = delta / 500.0;
		}
		
		if(e.deltaMode == 2)//MouseEvent.DOM_DELTA_PAGE)
		{
			delta = delta / 50.0;
		}*/
		var wheelDelta = normalizeWheel(e);
		
		//var fpmousepos = this.transfp(this.mouse);
		
		//this.scale *= 1.0 - Math.max(Math.min(wheelDelta.pixelY/200.0,0.2),-0.2);
		var amount = 1.0 - Math.max(Math.min(wheelDelta.pixelY/200.0,0.2),-0.2);
		this.dozoom(this.mouse,amount);
		
		/*var utfpmousepos = this.untransfp(fpmousepos);
		
		this.spanX -= utfpmousepos.x - this.mouse.x;
		this.spanY -= utfpmousepos.y - this.mouse.y;
		
		this.redraw();*/
	}
	
	applyClick(e){
		console.log('applyClick');
		
		//var deleting = false;
		var tfpmouse = {x:e.pageX - this.canvasTag.offsetLeft,y:e.pageY - this.canvasTag.offsetTop};
		var uimouse = {x:tfpmouse.x/this.uiscale,y:tfpmouse.y/this.uiscale};
		
		var uinodeClicked = this.getNodeAt(this.uinodes,uimouse);
		if(uinodeClicked)
		{
			uinodeClicked.onclick(uinodeClicked,this.mouse.x,this.mouse.y)
			this.spanning = false;
			this.selecting = false;
		}
		
		var nodeClicked = this.getNodeAt(this.nodes,this.mouse);
		if(nodeClicked)
		{
			
			/*if(deleting)
			{
				if(nodeClicked.selected == true)
				{
					for(var i =0;i<this.selectedNodes.length;i++)
					{
						this.selectedNodes[i].onRightclick(this.selectedNodes[i],this.mouse.x,this.mouse.y);
					}
				}
				else
				{
					nodeClicked.onRightclick(nodeClicked,this.mouse.x,this.mouse.y);
				}
				this.spanning = false;
				this.selecting = false;
			}*/
			//else
			//{

				var click_result = nodeClicked.onclick(nodeClicked,this.mouse.x,this.mouse.y);
				
				if(click_result.dotarget === true)
				{
					this.targeting = true;
					this.target = click_result.target;
				}
				
				/*if(click_result.doselect == true)
				{
					if(!nodeClicked.selected)
					{
						if(!e.shiftKey)
							this.deselectAll();
						
						nodeClicked.selected = true;
						if(!this.selectedNodes.includes(nodeClicked))
							this.selectedNodes.push(nodeClicked);// n vai bugar tudo se for deletado? acho q n

					}
				}
				if(click_result.drag)
				{
					this.spanning = false;
					this.selecting = false;
					this.dragging = click_result.drag;
					this.draggingDraw = click_result.dragdraw;
					this.draggingOffx = this.dragging.pos.x - this.mouse.x;
					this.draggingOffy = this.dragging.pos.y - this.mouse.y;
				}*/
			//}
		}
		else
		{
			//if(this.tool == TOOL_SELECT && !rightClick)
			//{
			//	if(!e.shiftKey)
			//		this.deselectAll();
			//}
		}
	}
	
	dozoom(center,amount)
	{
		var fppos = this.transfp(center);
		
		this.scale *= amount;
		this.scale = Math.max(Math.min(this.scale,20.0),0.25);
		
		var utfpmousepos = this.untransfp(fppos);
		
		this.spanX -= utfpmousepos.x - center.x;
		this.spanY -= utfpmousepos.y - center.y;
		
		this.redraw();
	}
	
	// camera metods
	transfp(p)
	{
		var tp = {x:p.x - this.spanX,y:p.y - this.spanY};
		tp = {x:tp.x * this.scale,y:tp.y * this.scale};
		
		return tp;
	}
	
	untransfp(p)
	{
		var tp = {x:p.x / this.scale,y:p.y / this.scale};
		tp = {x:tp.x + this.spanX,y:tp.y + this.spanY};
		
		return tp;
	}
	
	// Drawing methods
	draw_image(img,p1,p2,w,h)
	{
		var ctx = this.context;
		
		var tp1 = this.transfp(p1);
		var tp2 = this.transfp(p2);
		
		tp1.x = Math.max(0, Math.min(tp1.x, this.width));
		tp1.y = Math.max(0, Math.min(tp1.y, this.height));
		
		tp2.x = Math.max(0, Math.min(tp2.x, this.width));
		tp2.y = Math.max(0, Math.min(tp2.y, this.height));
		
		var twidth = Math.abs(tp2.x-tp1.x);
		var theight = Math.abs(tp2.y-tp1.y);

		if(twidth <= 0 || theight <=0) return; // image outside canvas
		
		var utp1 = this.untransfp(tp1);
		var utp2 = this.untransfp(tp2);
		var utwidth = Math.abs(utp2.x-utp1.x);
		var utheight = Math.abs(utp2.y-utp1.y);
		
		//transform utp to img space
		//	map from p1-->p2 to {0,0}-->{w,h}
		
		var pixutp1 = {x:mapRange(utp1.x,[p1.x,p2.x],[0,w]),y:mapRange(utp1.y,[p1.y,p2.y],[0,h])};
		var pixutwidth = mapRange(utwidth,[0,p2.x-p1.x],[0,w])
		var pixutheight = mapRange(utheight,[0,p2.y-p1.y],[0,h])
		/*
		drawImage()
		ctx.drawImage(img, 10, 10, 150, 180);
		img	Specifies the image, canvas, or video element to use	 
		sx	Optional. The x coordinate where to start clipping	
		sy	Optional. The y coordinate where to start clipping	
		swidth	Optional. The width of the clipped image	
		sheight	Optional. The height of the clipped image	
		x	The x coordinate where to place the image on the canvas	
		y	The y coordinate where to place the image on the canvas	
		width	Optional. The width of the image to use (stretch or reduce the image)	
		height	Optional. The height of the image to use (stretch or reduce the image)
		*/
		//console.log("drawImage("+utp1.x+","+utp1.y+","+utwidth+","+utheight+","+tp1.x+","+tp1.y+","+twidth+","+theight+")");
		ctx.drawImage(img, pixutp1.x, pixutp1.y,pixutwidth,pixutheight,tp1.x,tp1.y,twidth,theight);
	}
	
	draw_color(color)
	{
		this.context.strokeStyle = color;
	}
	
	fill_color(color)
	{
		this.context.fillStyle = color;
	}
	
	color_byState(state){
		//this.paintLogicState = state;
		this.fillColor = state ? this.style.trueColor : this.style.falseColor;
	}
	
	color_default(){
		//this.paintLogicState = state;
		this.fillColor = this.style.insideColor;
	}
	
	color_contour(){
		//this.paintLogicState = state;
		this.fillColor = this.style.contourColor;
	}
	
	move_start()
	{
		this.context.beginPath();
	}
	
	move_polygon(points)
	{
		var ctx = this.context;
		//var p = this.transfp(points[0]);
		//ctx.moveTo(p.x,p.y);
		for(var i=0;i<points.length;i++)
		{
			var p = this.transfp(points[i]);
			ctx.lineTo(p.x,p.y);
		}
	}
	
	move_bezier(p1,c1,c2,p2)
	{
		p1 = this.transfp(p1);
		p2 = this.transfp(p2);
		c1 = this.transfp(c1);
		c2 = this.transfp(c2);
		
		var ctx = this.context;
		ctx.lineTo(p1.x,p1.y);
		ctx.bezierCurveTo(c1.x,c1.y,c2.x,c2.y,p2.x,p2.y);
	}
	
	move_arc(p1,radius,startAngle,endAngle,anticlockwise)
	{
		p1 = this.transfp(p1);
		radius = radius * this.scale;
		var ctx = this.context;
		ctx.arc(p1.x, p1.y, radius, startAngle, endAngle, anticlockwise);
	}
	
	draw_selectionGlow(p1,radius)
	{
		var ctx = this.context;
		p1 = this.transfp(p1);
		radius = radius * this.scale;
		var grd = ctx.createRadialGradient(p1.x, p1.y, radius/2, p1.x, p1.y, radius);
		grd.addColorStop(0, "#76ACD7");
		grd.addColorStop(1, this.style.backgroundColor);
		var oldFillStyle = ctx.fillStyle;
		ctx.fillStyle = grd;
		ctx.fillRect(p1.x-radius,p1.y-radius, radius*2, radius*2);
		ctx.fillStyle = oldFillStyle;
	}
	
	draw_polygon(points)
	{
		var ctx = this.context;
		ctx.beginPath();
		this.move_polygon(points);
		ctx.closePath();
		var lastWidth = ctx.lineWidth;
		//var lastColor = ctx.strokeStyle;
		
		ctx.lineWidth = lastWidth *  this.style.ContourWidth;
		ctx.strokeStyle = this.style.contourColor;
		
		ctx.stroke();
		
		ctx.lineWidth = lastWidth;
		//ctx.strokeStyle = lastColor;
		ctx.strokeStyle = this.fillColor;
		
		ctx.stroke();
	}
	
	fill_polygon(points)
	{
		var ctx = this.context;
		ctx.beginPath();
		this.move_polygon(points);
		ctx.closePath();
		
		ctx.fillStyle = this.fillColor;
		
		ctx.fill();
		
		var lastWidth = ctx.lineWidth;
		//var lastColor = ctx.strokeStyle;
		
		ctx.lineWidth = lastWidth *  this.style.ContourWidth;
		ctx.strokeStyle = this.style.contourColor;
		
		ctx.stroke();
		
		ctx.lineWidth = lastWidth;
		//ctx.strokeStyle = lastColor;
	}
	
	draw_bezier(p1,c1,c2,p2)
	{
		var ctx = this.context;
		ctx.beginPath();
		this.move_bezier(p1,c1,c2,p2);
		
		var lastWidth = ctx.lineWidth;
		//var lastColor = ctx.strokeStyle;
		
		ctx.lineWidth = lastWidth * this.style.lineDrawWidth;
		if(this.style.haslineFill)
		{
			ctx.strokeStyle = this.style.contourColor;
		}
		else
		{
			ctx.strokeStyle = this.fillColor;
		}
		ctx.stroke();
		
		if(this.style.haslineFill)
		{
			ctx.lineWidth = lastWidth * this.style.lineFillWidth;
			//ctx.strokeStyle = lastColor;
			ctx.strokeStyle = this.fillColor;
			ctx.stroke();
			
		}
		
		ctx.lineWidth = lastWidth;
		
	}
	
	draw_point(p1)
	{
		var ctx = this.context;
		ctx.beginPath();
		p1 = this.transfp(p1);
		
		var lastWidth = ctx.lineWidth;
		var lastColor = ctx.strokeStyle;
		
		ctx.arc(p1.x, p1.y, lastWidth * this.style.pointFillRadius, 0, 2 * Math.PI);		

		//var lastfillColor = ctx.fillStyle;
		ctx.fillStyle = this.fillColor;
		ctx.fill();
		
		
		
		ctx.lineWidth = lastWidth * this.style.pointDrawWidth;
		ctx.strokeStyle = this.style.contourColor;
		ctx.stroke();
		
		ctx.lineWidth = lastWidth;
		ctx.strokeStyle = lastColor;
		//ctx.fillStyle = lastfillColor;
	}
	
	draw_line(p1,p2)
	{
		var ctx = this.context;
		ctx.beginPath();
		var p1 = this.transfp(p1);
		var p2 = this.transfp(p2);
		ctx.moveTo(p1.x,p1.y);
		
		ctx.lineTo(p2.x,p2.y);
		
		this.draw();
	}
	
	fill_rect(p1,p2)
	{
		var ctx = this.context;
		p1 = this.transfp(p1);
		p2 = this.transfp(p2);
		ctx.beginPath();
		ctx.rect(p1.x,p1.y, p2.x-p1.x,p2.y-p1.y);
		ctx.fill();
		ctx.stroke();
	}
	
	fill()
	{
		var ctx = this.context;
		ctx.closePath();
		
		ctx.fillStyle = this.fillColor;
		ctx.fill();
		
		var lastWidth = ctx.lineWidth;
		var lastColor = ctx.strokeStyle;
		
		ctx.lineWidth = lastWidth * this.style.ContourWidth;
		ctx.strokeStyle = this.style.contourColor;
		
		ctx.stroke();
		
		ctx.lineWidth = lastWidth;
		ctx.strokeStyle = lastColor;
		
		
	}
	
	draw()
	{
		var ctx = this.context;
		var lastWidth = ctx.lineWidth;
		var lastColor = ctx.strokeStyle;
		
		ctx.lineWidth = lastWidth * this.style.ContourWidth;
		ctx.strokeStyle = this.style.contourColor;
		
		ctx.stroke();
		
		ctx.lineWidth = lastWidth;
		ctx.strokeStyle = lastColor;
	}
	
	fill_text(p1, txt)
	{
		p1 = this.transfp(p1);
		this.context.fillStyle = this.fillColor;
		this.context.fillText(txt,p1.x,p1.y); 
	}
	
}



MyCanvas = new Canvas(100,100,document.getElementById('canvasInAPerfectWorld'));
MyCanvas.setNodes(MyPixels.nodes);
MyCanvas.setUiNodes(MyPixels.uinodes);

function resizeCanvas() {
	MyCanvas.resize(window.innerWidth,window.innerHeight);
}
resizeCanvas();


var center = MyCanvas.untransfp({x:MyCanvas.width/2,y:MyCanvas.height/2});
MyCanvas.spanX = -center.x;
MyCanvas.spanY = -center.y;
console.log(MyCanvas.spanX+" "+MyCanvas.spanY);

MyCanvas.redraw();

function simulateAll()
{

	//LogicWorld.step_calculate();
	//var changed = LogicWorld.step_apply();
	if(MyPixels.fetch_pixels_finished)
	{
		var changed = MyPixels.fetch_pixels(MyCanvas);	
		if(changed)
		{
			MyCanvas.redraw();
		}
	}
}

var simulationInterval = setInterval(simulateAll, 500);


function canvasInteraction()
{
	if(MyCanvas.targeting && 
	typeof(MyCanvas.target) != "undefined" && MyCanvas.target !== false && typeof(MyCanvas.target.x) != "undefined" && typeof(MyCanvas.target.y) != "undefined")
	{
		var center = MyCanvas.untransfp({x:MyCanvas.width/2,y:MyCanvas.height/2});
		var offx = center.x - MyCanvas.target.x;
		var offy = center.y - MyCanvas.target.y;
		
		if(offx * offx + offy * offy > 0.0001)
		{
			MyCanvas.spanX -= offx * 0.25;
			MyCanvas.spanY -= offy * 0.25;
		
			
					
			var scenter = MyCanvas.untransfp({x:MyCanvas.width/2,y:MyCanvas.height/2});
			var fppos = MyCanvas.transfp(scenter);
			
			var offScale = 5.0 - MyCanvas.scale;		
			MyCanvas.scale += offScale * 0.05;
			
			var utfpmousepos = MyCanvas.untransfp(fppos);
			
			MyCanvas.spanX -= utfpmousepos.x - scenter.x;
			MyCanvas.spanY -= utfpmousepos.y - scenter.y;
		}
		else
		{
			MyCanvas.targeting = false;
			MyCanvas.target = false;
		}
		
		MyCanvas.redraw();
	}
	
	var node = MyPixels.canvasPicture;
	var pixelPos = node.lastPixClick;
	var coordtxt = "("+pixelPos.x+","+((node.imgh-1)-pixelPos.y)+")";
		
	if(performance.now() < timeToPlaceAgain)
	{
		var timeWaitSecs = Math.floor((timeToPlaceAgain - performance.now())/1000) + 1;
		var timeWaitMins = 0;
		var timeWaittxt = " novamente em ";
		if(timeWaitSecs >= 60)
		{
			timeWaitMins = Math.floor(timeWaitSecs/60);
			timeWaitSecs = timeWaitSecs % 60;
			
			
			timeWaittxt += timeWaitMins+":"+timeWaitSecs+"";
		}
		else
		{
			
			timeWaittxt += timeWaitSecs+"s";
		}
		coordinatestxt.innerHTML = timeWaittxt;
		coordinates2txt.innerHTML = timeWaittxt;		
	}
	else
	{
		coordinatestxt.innerHTML = coordtxt;
		coordinates2txt.innerHTML = coordtxt;
	}
}

var canvasInteractionInterval = setInterval(canvasInteraction, 20);

function updateSpeed(newSpeed){
    clearInterval(simulationInterval);

    simulationInterval = setInterval(simulateAll, newSpeed);
}