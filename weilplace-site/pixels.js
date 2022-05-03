var pixelsapi = "http://app.passapassa.com.br/pixelart/api/";
//var pixelsapi = "http://localhost:8090/";

var palletehex = [
	'6d001a',
	'be0039',
	'ff4500',
	'ffa800',
	'ffd635',
	'fff8b8',
	'00a368',
	'00cc78',
	'7eed56',
	'00756f',
	'009eaa',
	'00ccc0',
	'2450a4',
	'3690ea',
	'51e9f4',
	'493ac1',
	'6a5cff',
	'94b3ff',
	'811e9f',
	'b44ac0',
	'e4abff',
	'de107f',
	'ff3881',
	'ff99aa',
	'6d482f',
	'9c6926',
	'ffb470',
	'000000',
	'515252',
	'898d90',
	'd4d7d9',
	'ffffff'
];

var palletergb = [
	[109,0,26],
	[190,0,57],
	[255,69,0],
	[255,168,0],
	[255,214,53],
	[255,248,184],
	[0,163,104],
	[0,204,120],
	[126,237,86],
	[0,117,111],
	[0,158,170],
	[0,204,192],
	[36,80,164],
	[54,144,234],
	[81,233,244],
	[73,58,193],
	[106,92,255],
	[148,179,255],
	[129,30,159],
	[180,74,192],
	[228,171,255],
	[222,16,127],
	[255,56,129],
	[255,153,170],
	[109,72,47],
	[156,105,38],
	[255,180,112],
	[0,0,0],
	[81,82,82],
	[137,141,144],
	[212,215,217],
	[255,255,255]
];


class CanvasElem {
	constructor(x,y,w,h,txt,type)
	{
		this.pos= {x:x+(w/2),y:y+(h/2)};
		this.dim= {w:w,h:h};
		this.txt=txt;
		this.type=type;
	}
	
	
	// funcoes utilitarias
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
	
	ondragged(node,x,y)
	{
	
	}
	
	onRightclick(node,x,y)
	{

	}
	
	onclick(node,x,y) // retorno verdadeiro para indicar que deve arrastar
	{
		return {drag:false,doselect:false,dragdraw:false};
	}
	
	ondraw_first(canvas,node)
	{

	}
	
	ondraw(canvas,node)
	{
		//canvas.draw_color("#FFFFFF");
		//canvas.fill_color("#FFFFFF");
		canvas.color_default();
		var metrics = node.getMetrics();
		var pa = metrics.pa;
		
		var pb = metrics.pb;
		
		var pcenter = {x:(pa.x+pb.x)/2,y:(pa.y+pb.y)/2};
		var pbx2 = {x:pcenter.x,y:pb.y};
		var pax2 = {x:pcenter.x,y:pa.y};
		var p_end = metrics.p_end;
		
		canvas.color_contour();
		canvas.fill_text({x:pa.x+10,y:p_end.y+10},""+node.txt);
	}
}

class CanvasPicture {
	constructor(x,y,w,h,img,imgw,imgh,type)
	{
		this.pos= {x:x+(w/2),y:y+(h/2)};
		this.dim= {w:w,h:h};
		this.imgw=imgw;
		this.imgh=imgh;
		this.type=type;
		
		this.pixcanvas = document.createElement("canvas");        
		this.pixcanvas.height=imgw;
        this.pixcanvas.width=imgh;
        this.pixctx = this.pixcanvas.getContext("2d");

		this.pixctx.drawImage(img,0,0);
		
		this.lastPixClick = {x:0,y:0};
		
	}
	
	
	// funcoes utilitarias
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
	
	ondragged(node,x,y)
	{
	
	}
	
	onRightclick(node,x,y)
	{

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
	
	onclick(node,x,y) // retorno verdadeiro para indicar que deve arrastar
	{
		var metrics = node.getMetrics();
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
	}
	
	ondraw_first(canvas,node)
	{

	}
	
	drawPixel(color,x,y)
	{
		var rgb = palletergb[color];
		this.pixctx.fillStyle = "rgba("+rgb[0]+","+rgb[1]+","+rgb[2]+",1)";
		this.pixctx.fillRect( x, (this.imgh-1)-y, 1, 1 );
	}
	
	ondraw(canvas,node)
	{
		var metrics = node.getMetrics();
		var pa = metrics.pa;
		var pb = metrics.pb;
		
		//var pcenter = {x:(pa.x+pb.x)/2,y:(pa.y+pb.y)/2};
		//var pbx2 = {x:pcenter.x,y:pb.y};
		//var pax2 = {x:pcenter.x,y:pa.y};
		//var p_end = metrics.p_end;
		
		/*
		// test random change
		var rx = Math.floor(Math.random() * (this.imgw + 1));
		var ry = Math.floor(Math.random() * (this.imgh + 1));
		
		var rr = Math.floor(Math.random() * (255 + 1));
		var rg = Math.floor(Math.random() * (255 + 1));
		var rb = Math.floor(Math.random() * (255 + 1));
		
		this.pixctx.fillStyle = "rgba("+rr+","+rg+","+rb+",1)";
		this.pixctx.fillRect( rx, ry, 1, 1 );
		*/
		
		canvas.context.imageSmoothingEnabled = false;
		canvas.draw_image(this.pixcanvas,pa,pb,this.imgw,this.imgh);
		
		//transform utp to img space
		//	map from p1-->p2 to {0,0}-->{w,h}
		
		
		var center = canvas.untransfp({x:canvas.width/2,y:canvas.height/2});
		
		this.lastPixClick.x = Math.min(Math.floor(mapRange(center.x,[pa.x,pb.x],[0,this.imgw])),this.imgw-1);
		this.lastPixClick.y = Math.min(Math.floor(mapRange(center.y,[pa.y,pb.y],[0,this.imgh])),this.imgh-1);
		
		var x = this.lastPixClick.x;
		var y = this.lastPixClick.y;
		
		var color = okbutton.dataset.color;
		
		if(typeof(x) != "undefined" && typeof(y) != "undefined" && typeof(color) != "undefined")
		{
			coordinatestxt.innerHTML = "("+x+","+((this.imgh-1)-y)+")";
			coordinates2txt.innerHTML = "("+x+","+((this.imgh-1)-y)+")";
			var tclicka = {x:mapRange(x,[0,this.imgw],[pa.x,pb.x]),y:mapRange(y,[0,this.imgh],[pa.y,pb.y])};
			var tclickb = {x:mapRange(x+1,[0,this.imgw],[pa.x,pb.x]),y:mapRange(y+1,[0,this.imgh],[pa.y,pb.y])};
			var rgb = palletergb[color];
			canvas.context.fillStyle = "rgba("+rgb[0]+","+rgb[1]+","+rgb[2]+",1)";
			canvas.draw_color("rgba(230,230,230,1)");
			canvas.fill_rect( tclicka , tclickb );
		}
		
	}
}

class Pixels {
	constructor()
	{
		this.nodes = new Array();
		this.uinodes = new Array();
		/*this.uinodes.push(
			{
				pos: {x:0,y:0},
				dim: {w:170,h:395},
				ondraw: function(canvas,node)
				{ 
					canvas.fill_color("#FFFFFF");
					canvas.fill_polygon([
					{x:node.pos.x,y:node.pos.x},
					{x:node.pos.x + node.dim.w,y:node.pos.y},
					{x:node.pos.x + node.dim.w,y:node.pos.y + node.dim.h},
					{x:node.pos.x,y:node.pos.y + node.dim.h}
					]
					);
				},
				onclick: function(node,x,y){}
			}
		);*/
		
		var barraH = 48;
		
		//var uiBtns_salvar = new CanvasElem(0,0,100,48,"Salvar",0);
		//uiBtns_salvar.onclick = save;
		//this.uinodes.push(uiBtns_salvar);
		
		//var uiBtns_carregar = new CanvasElem(250,0,150,48,"Carregar",0);
		//uiBtns_carregar.onclick = load;
		//this.uinodes.push(uiBtns_carregar);
		
		this.canvasPicture = false;
		
		this.img = new Image();
		var tthis = this;
		
		tthis.fetch_pixels_finished = true;
		this.fetch_pixels_lastfull = -1;
		this.fetch_pixels_lastchanges = -1;
		this.img.onload = function(){
			if(tthis.canvasPicture === false)
			{
				tthis.canvasPicture = new CanvasPicture(-512,-512,1024,1024,tthis.img,this.width,this.height,1);
				tthis.nodes.push(tthis.canvasPicture);
			}
			else
			{
				tthis.canvasPicture.pixctx.drawImage(tthis.img,0,0);
			}
			
			tthis.fetch_pixels_finished = true;
			tthis.fetch_pixels_lastfull = performance.now();
			
			MyCanvas.redraw();
		};
		this.img.src = pixelsapi+"?req=picture";
	}
	
	set_pixel(color)
	{
		var x = this.canvasPicture.lastPixClick.x;
		var y = (this.canvasPicture.imgh-1)-this.canvasPicture.lastPixClick.y;
		const url = pixelsapi+"?req=set&x="+x+"&y="+y+"&c="+color;

		fetch(url)
		.then(function(response) {
			return response.text();
		})
		.then(function(data) {
			console.log(data);
		})
		.catch(function(error) {
			console.log(error);
		});
	}
	
	fetch_pixels(MyCanvas)
	{
		var tthis = this;
		this.fetch_pixels_finished = false;
		
		var now = performance.now();
		if( this.fetch_pixels_lastfull > 0 && (now - this.fetch_pixels_lastfull) < (60000 * 10)) // if under 10 mins since last full update
		{
			// Implementar WebSockets?
			// https://stackoverflow.blog/2019/12/18/websockets-for-fun-and-profit/
			const url = pixelsapi+"?req=changes&i="+this.fetch_pixels_lastchanges;

			fetch(url)
			.then(function(response) {
				return response.json();
			})
			.then(function(data) {
				
				//console.log("Json Resp: "+JSON.stringify(data));
				
				if(data.hasOwnProperty("i"))
				{
					tthis.fetch_pixels_lastchanges = parseInt(data["i"]);
				}
				if(data.hasOwnProperty("changes"))
				{
					if(data["changes"].length > 0)
					{
						var changes_base64 = data["changes"];
						const changes_chars = atob(changes_base64);
						for(var i = 0;i<changes_chars.length;i+=3)
						{
							var cb0 = changes_chars.charCodeAt(i+0);
							var cb1 = changes_chars.charCodeAt(i+1);
							var cb2 = changes_chars.charCodeAt(i+2);
						
							//console.log(cb0+" "+cb1+" "+cb2);
							/*
							// 95        6         20
							// 001011111 000000110 010100
							// 00101111 10000001 10010100
							// 001011 111000 000110 010100
							// X      w      Y      U
							
							changesbuff[0] = (byte)((x & 0b1_1111_1110)>> 1);
							changesbuff[1] = (byte)(
								((x & 0b0_0000_0001)<<7)|
								((y & 0b1_1111_1100)>>2)
							);
							changesbuff[2] = (byte)(
								((y & 0b0_0000_0011)<<6)|
								(color & 0b0_0011_1111)
							);
							*/
							var x = (cb0 << 1) | ((cb1&0x80) >> 7);
							var y = ((cb1&0x7F) << 2) | ((cb2&0xC0) >> 6);
							var c = cb2&0x3F;
							
							//console.log(x+" "+y+" "+c);
							tthis.canvasPicture.drawPixel(c,x,y);
						}
						
						
						MyCanvas.redraw();
					}
				}
				tthis.fetch_pixels_finished = true;
			})
			.catch(function(error) {
				console.log(error);
				tthis.fetch_pixels_finished = true;
			});
			return false;
		}
		else
		{
			//this.img.src = "pixels.bmp?t=" + new Date().getTime();
			//this.img.src = "pixels.bmp";
			this.img.src = pixelsapi+"?req=picture&t=" + new Date().getTime(); // t para quebrar o cache do navegador desgracento
			return true;
		}		
	}
}

var MyPixels = new Pixels();


const colorbuttons = document.getElementsByClassName("colorbutton");

const okbutton = document.getElementById("okbutton");
const cancelbutton = document.getElementById("cancelbutton");
okbutton.dataset.color=0;

const coordinatestxt = document.getElementById("coordinates");
const coordinates2txt = document.getElementById("coordinates2");

const colorpicker = document.getElementById("colorpicker");
const placenow = document.getElementById("placenow");

for (var i = 0; i < colorbuttons.length; i++) {
	var btn = colorbuttons[i];
	btn.dataset.color=""+i;
	addListenerMulti(btn, 'click touchend', function(e){
		event.stopPropagation();
		event.preventDefault();
			for (var k = 0; k < colorbuttons.length; k++) {
				colorbuttons[k].classList.remove("pressed");
			}
			this.classList.add("pressed");
			
			okbutton.dataset.color=this.dataset.color;
			
			okbutton.classList.add("pressed");
			
			MyCanvas.redraw();
		
	});
}

addListenerMulti(okbutton, 'click touchend',  function(e){
	event.stopPropagation();
	event.preventDefault();
		
		MyPixels.set_pixel(this.dataset.color);
	
	okbutton.classList.remove("pressed");
});

addListenerMulti(cancelbutton, 'click touchend',  function(e){
	event.stopPropagation();
	event.preventDefault();
		
	okbutton.classList.remove("pressed");
	
		colorpicker.style.display = 'none';	
		placenow.style.display = 'block';
});

addListenerMulti(placenow, 'click touchend',  function(e){
	event.stopPropagation();
	event.preventDefault();
		
		placenow.style.display = 'none';	
		colorpicker.style.display = 'block';
});


//detecting arrow key presses
document.addEventListener('keydown', function(e) {
	var offx = 0;
	var offy = 0;
    switch (e.keyCode) {
        case 37:
            offx--;
            break;
        case 38:
            offy--;
            break;
        case 39:
			offx++;
            break;
        case 40:
			offy++;
            break;
		case 13: // enter
			MyPixels.set_pixel(okbutton.dataset.color);
			break;
    }
	
	if(offx != 0 || offy != 0)
	{
		var node = MyPixels.canvasPicture;
		var metrics = node.getMetrics();
		var pa = metrics.pa;
		var pb = metrics.pb;
		
		var pixelPos = node.lastPixClick;
		
		var targetPos = node.getPixelTransfPos(pixelPos.x+offx,pixelPos.y+offy,pa,pb);
		
		MyCanvas.targeting = true;
		MyCanvas.target = targetPos;
	}
});

/*
var inA = LogicWorld.gate(50,100,GATEIN_BTN);
var inB = LogicWorld.gate(50,200,GATEIN_BTN);
var norA = LogicWorld.gate(200,100,GATE_NOR);
var norB = LogicWorld.gate(200,200,GATE_NOR);

inA.value = 1;

norA.conns = [inA,norB];
norB.conns = [inB,norA];*/

//LogicWorld.fromSerializable(serializedMap);

//var logicMem = "'{'pos':{'x':-198.66174768518522,'y':70.80108265817907},'dim':{'w':70,'h':40},'type':8,'conns':[-1,-1],'value':0},{'pos':{'x':-197.71984712577165,'y':220.72181230709884},'dim':{'w':70,'h':40},'type':8,'conns':[-1,-1],'value':0},{'pos':{'x':203.7676022376544,'y':81.1619888117284},'dim':{'w':70,'h':40},'type':3,'conns':[5,3],'value':0},{'pos':{'x':207.53520447530866,'y':221.66371286651236},'dim':{'w':70,'h':40},'type':3,'conns':[6,2],'value':1},{'pos':{'x':878.9048635223769,'y':107.4483386381172},'dim':{'w':70,'h':40},'type':2,'conns':[2,-1],'value':0},{'pos':{'x':49.86713927469134,'y':73.318805459105},'dim':{'w':70,'h':40},'type':4,'conns':[7,1],'value':0},{'pos':{'x':62.111846547067785,'y':214.60388937114206},'dim':{'w':70,'h':40},'type':4,'conns':[0,1],'value':0},{'pos':{'x':-45.26481722608037,'y':69.55120322145066},'dim':{'w':70,'h':40},'type':1,'conns':[0],'value':1}'";
