const { zoomCanvasToPage, pageToZoomCanvas } = require("../Canvas/ZoomableCanvas");

export const mapRange = (value, oldRange, newRange) => {
	var newValue = (value - oldRange[0]) * (newRange[1] - newRange[0]) / (oldRange[1] - oldRange[0]) + newRange[0];
	return Math.min(Math.max(newValue, newRange[0]) , newRange[1]);
};
  
export default class CanvasPicture {
	constructor(pos,img,imgw,imgh)
	{
		this.pos= {x:pos.x,y:pos.y};
		this.imgw=imgw;
		this.imgh=imgh;
		
		this.pixcanvas = document.createElement("canvas");        
		this.pixcanvas.height=imgw;
        this.pixcanvas.width=imgh;

        this.pixctx = this.pixcanvas.getContext("2d");
		this.pixctx.imageSmoothingEnabled = false;
		this.pixctx.drawImage(img,0,0);
		
		this.lastPixClick = {x:0,y:0};
	}
	
	/*// funcoes utilitarias
	getMetrics()
	{
		var node = this;
		var x1 = node.pos.x-node.dim.w/2;
		var y1 = node.pos.y-node.dim.h/2;
		var x2 = node.pos.x+node.dim.w/2;
		var y2 = node.pos.y+node.dim.h/2;
		
		var pa = {x:x1,y:y1};
		//var pb = {x:x2-12,y:y2};
		var pb = {x:x2,y:y2};
		//var pa = {x:x1,y:y1};
		//var pb = {x:x2,y:y2};
		var p_end = {x:pb.x,y:(y1+y2)/2};

		return {
		pa:pa,
		pb:pb,
		p_end:p_end
		};
	}
	
	trasnfPosToImg(p,pa,pb)
	{
		var x = Math.min(Math.floor(mapRange(p.x,[pa.x,pb.x],[0,this.imgw])),this.imgw-1);
		var y = Math.min(Math.floor(mapRange(p.y,[pa.y,pb.y],[0,this.imgh])),this.imgh-1);
		
		return {x:x,y:y};
	}
	
	trasnfImgToPos(p,pa,pb)
	{
		var ret = {x:mapRange(p.x,[0,this.imgw],[pa.x,pb.x]),y:mapRange(p.y,[0,this.imgh],[pa.y,pb.y])};
		
		return ret;
	}
	
	getPixelTransfPos(x,y,pa,pb)
	{		
		var imgP = {x:x,y:y};
		
		var tclicka = this.trasnfImgToPos(imgP,pa,pb);
		var tclickb = this.trasnfImgToPos({x:imgP.x+1,y:imgP.y+1},pa,pb);
			
		var tclickCenter = {x:(tclicka.x + tclickb.x)/2,y:(tclicka.y + tclickb.y)/2};
		
		return tclickCenter;
	}
	
	onclick(x,y) // retorno verdadeiro para indicar que deve arrastar
	{
		var metrics = this.getMetrics();
		var pa = metrics.pa;
		var pb = metrics.pb;
		
		//transform utp to img space
		//	map from p1-->p2 to {0,0}-->{w,h}
		//x = Math.min(Math.floor(mapRange(x,[pa.x,pb.x],[0,this.imgw])),this.imgw-1);
		//y = Math.min(Math.floor(mapRange(y,[pa.y,pb.y],[0,this.imgh])),this.imgh-1);	
		var imgP = this.trasnfPosToImg({x:x,y:y},pa,pb);
		
		//var tclicka = {x:mapRange(x,[0,this.imgw],[pa.x,pb.x]),y:mapRange(y,[0,this.imgh],[pa.y,pb.y])};
		//var tclickb = {x:mapRange(x+1,[0,this.imgw],[pa.x,pb.x]),y:mapRange(y+1,[0,this.imgh],[pa.y,pb.y])};
			
		var tclicka = this.trasnfImgToPos(imgP,pa,pb);
		var tclickb = this.trasnfImgToPos({x:imgP.x+1,y:imgP.y+1},pa,pb);
			
		var tclickCenter = {x:(tclicka.x + tclickb.x)/2,y:(tclicka.y + tclickb.y)/2};
		
		return {drag:false,doselect:false,dragdraw:false,dotarget:true,target:tclickCenter};
	}*/
	
	drawPixel(rgb,x,y)
	{
		//var rgb = this.pallete[color];
		this.pixctx.fillStyle = "rgba("+rgb[0]+","+rgb[1]+","+rgb[2]+",1)";
		this.pixctx.fillRect( x, y, 1, 1 );
	}
	
	ondraw(ctx,estado)
	{		
		const w = estado.width;
        const h = estado.height;
		
		//this.drawPixel([255,0,0],this.lastPixClick.x,this.lastPixClick.y);

		ctx.imageSmoothingEnabled = false;
		ctx.drawImage(this.pixcanvas,
			this.pos.x, this.pos.y,
			this.imgw, this.imgh);

		let center = pageToZoomCanvas({x:w/2,y:h/2},estado.offsetLeft,estado.offsetTop,estado.span,estado.scale);
		this.lastPixClick.x = Math.min(Math.max(Math.floor(center.x),0),this.imgw-1);
		this.lastPixClick.y = Math.min(Math.max(Math.floor(center.y),0),this.imgh-1);
		
		let rgb = [255,0,0];
		ctx.fillStyle = "rgba("+rgb[0]+","+rgb[1]+","+rgb[2]+",1)";
		ctx.strokeStyle = "rgba(230,230,230,1)";
		ctx.lineWidth = 0.5;
		ctx.strokeRect( this.lastPixClick.x, this.lastPixClick.y, 1, 1 );
		ctx.fillRect( this.lastPixClick.x, this.lastPixClick.y, 1, 1 );		
	}
}
