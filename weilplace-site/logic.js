// basic
GATE_OR = 2;
GATE_AND = 4;
GATE_NOT = 1;
GATE_BUFFER = 0;
GATE_XOR = 6;

// compost
GATE_NOR = 3;
GATE_NAND = 5;
GATE_XNOR = 7;

// input
GATEIN_BTN = 8;

// output
GATEOUT_BIT = 9;


function draw_conn(canvas,nodea,nodeb,connP)
{
	//if(nodea.value == 1)
	//canvas.draw_color("#0A86EA");
	//else
	//canvas.draw_color("#FFFFFF");
	canvas.color_byState(nodea.value);

	//var pa = {x:(nodea.pos.x+nodea.dim.w/2)-10,y:nodea.pos.y};
	var pa = nodea.getMetrics().p_end;
	//pb = {x:nodeb.pos.x - 17,y:nodeb.pos.y+offy};
	var pb = connP;
	
	var curvesize = Math.sqrt((pa.x - pb.x)*(pa.x - pb.x) + (pa.y - pb.y)*(pa.y - pb.y))/3;
	canvas.draw_bezier(pa,{x:pa.x+curvesize,y:pa.y},{x:pb.x-curvesize,y:pb.y},pb);
	//context.moveTo(nodea.pos.x,nodea.pos.y);
	//context.lineTo(nodeb.pos.x,nodeb.pos.y);
}




function clickconn_gate(conn,node,x,y)
{
	if(!node) return;
	
	if(node.type == GATEIN_BTN) return;
	/*var x1 = node.pos.x-node.dim.w/2;
	var y1 = node.pos.y-node.dim.h/2;
	var x2 = node.pos.x+node.dim.w/2;
	var y2 = node.pos.y+node.dim.h/2;
	
	var pa = {x:x1+10,y:y1};
	var pb = {x:x2-10,y:y2};
	var p_end = {x:x2-5,y:(y1+y2)/2};
	
	var wich_conn = y > p_end.y ? 1 : 0;
	if(node.type == GATE_BUFFER || node.type == GATE_NOT)
	{
		wich_conn = 0;
	}
	
	if(node.type != GATEIN_BTN)
	{
		node.conns[wich_conn] = conn.connNode;
	}*/
	var metrics = node.getMetricsConns();
	var wich_conn = node.getConnNodeIndex({x:x,y:y},metrics,20);
	if(wich_conn >= 0)
	{
		node.connect(wich_conn,conn.connNode);
		//node.conns[wich_conn] = conn.connNode;
	}
}



function add_gate(node,x,y) // retorno verdadeiro para indicar nada
{
	LogicWorld.gate(x,y,node.type,[]);
}

function save() {


	var serialNodes = JSON.stringify(LogicWorld.toSerializable(LogicWorld.nodes));

    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(serialNodes));
    element.setAttribute('download', 'PortasLogicas.json');

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

function load() {
    var element = document.createElement('input');
    element.setAttribute('type', 'file');

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();
	
	element.addEventListener('change', function(){
		var file = element.files[0];

		var reader = new FileReader();
		reader.onload = function(progressEvent)
		{
			// Entire file
			//console.log(this.result);
			
			var convertedNodes = JSON.parse(this.result);
			//alert(paste);
			LogicWorld.clearAll();
			var newNodes = LogicWorld.fromSerializable(convertedNodes);
			MyCanvas.deselectAll();
			MyCanvas.selectThose(newNodes);
			for(var i=0; i < newNodes.length; i++) 
			{
				var node = newNodes[i];
				node.pos.x += 150;
				node.pos.y += 150;
			}
		};
		reader.readAsText(file);
		document.body.removeChild(element);
	});
}

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

class Gate {
	constructor(x,y,type)
	{
		this.pos= {x:x,y:y};
		this.dim= {w:90,h:40};
		this.type=type;
		if(type == GATEIN_BTN)
		this.conns = [];	
		else if(type == GATE_BUFFER || type == GATE_NOT || type == GATEOUT_BIT)
		this.conns= [false];
		else
		this.conns= [false,false];
		this.value= 0;
		this.next_value= 0;
		this.outconns= [];
	}
	
	connect(wich_conn,connNode)
	{
		var node = this;
		if(node.conns[wich_conn])
		{
			var oldNode = node.conns[wich_conn];
			referenceSafeRemove(oldNode.outconns,oldNode.outconns.indexOf(node));
		}
		
		node.conns[wich_conn] = connNode;
		connNode.outconns.push(node);
		
	}
	
	disconnect(wich_conn)
	{
		var node = this;
		var connNode = node.conns[wich_conn];
		referenceSafeRemove(connNode.outconns,connNode.outconns.indexOf(node));
		node.conns[wich_conn] = false;
	}
	
	// funcoes utilitarias
	getMetrics()
	{
		var node = this;
		var x1 = node.pos.x-node.dim.w/2;
		var y1 = node.pos.y-node.dim.h/2;
		var x2 = node.pos.x+node.dim.w/2;
		var y2 = node.pos.y+node.dim.h/2;
		
		var pa = {x:x1+20,y:y1};
		//var pb = {x:x2-12,y:y2};
		var pb = {x:pa.x+48,y:y2};
		//var pa = {x:x1,y:y1};
		//var pb = {x:x2,y:y2};
		var p_end = {x:pb.x,y:(y1+y2)/2};

		return {
		pa:pa,
		pb:pb,
		p_end:p_end
		};
	}
	
	getMetricsConns()
	{
		var node = this;
		var metrics = node.getMetrics();
		var pa = metrics.pa;
		var pb = metrics.pb;
		var p_end = metrics.p_end;
		
		var pconns = new Array();
		var margin = 9;
		if(node.conns.length > 1)
		{
			var connoff = (node.dim.h-margin*2)/(node.conns.length-1);
			for(var i =0;i<node.conns.length;i++)
			{
				pconns.push({x:pa.x +4,y:(pa.y + (connoff*i))+margin});
			}
		}
		else pconns.push({x:pa.x +4,y:p_end.y});
		return {
		pa:pa,
		pb:pb,
		p_end:p_end,
		pconns:pconns
		};
	}
	
	getConnNodeIndex(p,metrics, factor)
	{	
		var pconns = metrics.pconns;
		var connNodeIndex = -1;
		var connNodeDist = factor;
		for(var i =0;i<pconns.length;i++)
		{
			var pa = pconns[i];
			//var d = Math.sqrt((pa.x - p.x)*(pa.x - p.x) + (pa.y - p.y)*(pa.y - p.y));
			var dx = (p.x - pa.x);
			var dy = Math.sqrt((pa.y - p.y)*(pa.y - p.y));
			if(dx < factor/2 && dy < connNodeDist)
			{
				connNodeIndex = i;
				connNodeDist = dy;
			}
		}
		return connNodeIndex;
	}
	
	ondragged(node,x,y)
	{
	}
	
	onRightclick(node,x,y)
	{
		LogicWorld.remove(node);
	}
	
	onclick(node,x,y) // retorno verdadeiro para indicar que deve arrastar
	{
		var metrics = node.getMetricsConns();
		var pa = metrics.pa;
		var pb = metrics.pb;
		var p_end = metrics.p_end;
		
		if(node.type != GATEOUT_BIT)
		{
			//var front_conn = Math.sqrt((p_end.x - x)*(p_end.x - x) + (p_end.y - y)*(p_end.y - y));
			// adding front connection
			//if(front_conn < 15)
			var dx = (p_end.x - x);
			var dy = Math.sqrt((p_end.y - y)*(p_end.y - y));
			if(dx < 8 && dy < 20)
			{
				return {drag:{
						pos: {x:x,y:y},
						dim: {w:20,h:20},
						connNode: node,
						ondraw: function(canvas,node)
						{
							draw_conn(canvas,this.connNode,this,this.pos);
						},
						onclick: function(node,x,y){},
						ondragged: clickconn_gate
				},
				dragdraw: true
				};
			}
		}
		
		// removing back connection
		//if((pa.x - x)*(pa.x - x) < 80)
		var connNodeIndex = this.getConnNodeIndex({x:x,y:y},metrics,10);
		if(connNodeIndex >=0)
		{
			var connNode = node.conns[connNodeIndex];
			if(connNode)
			{
				node.disconnect(connNodeIndex);
				//node.conns[connNodeIndex] = false;
				return {drag:{
						pos: {x:x,y:y},
						dim: {w:20,h:20},
						connNode: connNode,
						ondraw: function(canvas,node)
						{
							draw_conn(canvas,this.connNode,this,this.pos);
						},
						onclick: function(node,x,y){},
						ondragged: clickconn_gate
				},
				dragdraw: true
				};
			}
		}
		
		
		if(node.type == GATEIN_BTN)
		{
			node.value = node.value == 1 ? 0 : 1;
		}
		
		return {drag:node,doselect:true,dragdraw:false};
	}
	
	ondraw_first(canvas,node)
	{
		var metrics = node.getMetricsConns();
		var pconns = metrics.pconns;
		
		for(var i =0;i<node.conns.length;i++)
		{
			if(node.conns[i])
			{
				draw_conn(canvas,node.conns[i],node,pconns[i]);
			}
			else
			{
				canvas.draw_line(pconns[i],{x:pconns[i].x-22,y:pconns[i].y});
			}
		}
		
		if(node.outconns.length == 0)
		{
			if(node.type != GATEOUT_BIT)
				canvas.draw_line(metrics.p_end,{x:metrics.p_end.x+22,y:metrics.p_end.y});
		}
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
		switch (node.type)
		{
			case GATE_XNOR:
			case GATE_XOR:
			case GATE_NOR:
			case GATE_OR:
				pax2.x -= 2;
				pa.x -= 2;
				canvas.move_start();
				canvas.move_polygon([{x:pa.x,y:pa.y},{x:pax2.x-10,y:pax2.y}]);
				
				canvas.move_bezier({x:pax2.x-10,y:pax2.y},{x:pax2.x+15,y:pax2.y},{x:p_end.x,y:p_end.y},{x:p_end.x,y:p_end.y});
				canvas.move_bezier({x:p_end.x,y:p_end.y},{x:p_end.x,y:p_end.y},{x:pbx2.x+15,y:pbx2.y},{x:pbx2.x-10,y:pbx2.y});
				
				canvas.move_polygon([{x:pbx2.x-10,y:pbx2.y},{x:pa.x,y:pb.y}]);
				
				canvas.move_bezier({x:pa.x,y:pb.y},{x:pa.x+10,y:pb.y-10},{x:pa.x+10,y:pa.y+10},pa);
				canvas.fill();
				if(node.type == GATE_NOR || node.type == GATE_XNOR)
				{
					canvas.draw_point({x:p_end.x+4,y:p_end.y});
				}
				if(node.type == GATE_XNOR || node.type == GATE_XOR)
				{
					canvas.move_start();
					pa.x -= 7;
					pb.x -= 7;
					canvas.move_bezier(pa,{x:pa.x+10,y:pa.y+10},{x:pa.x+10,y:pb.y-10},{x:pa.x,y:pb.y});
					canvas.draw();
				}
				
			break;
			case GATE_NAND:
			case GATE_AND:
				pa.x += 3;
				pb.x += 3;
				pcenter.x += 3;
				pax2.x += 3;
				pbx2.x += 3;
				canvas.move_start();
				//canvas.move_bezier(pa,{x:pa.x+8,y:pa.y+8},{x:pa.x+8,y:pb.y-8},{x:pa.x,y:pb.y});
				canvas.move_polygon([{x:pa.x,y:pa.y},{x:pax2.x,y:pax2.y}]);
				canvas.move_arc(pcenter,pcenter.y-pa.y,Math.PI*1.5,Math.PI*2.5,false);
				canvas.move_polygon([{x:pa.x,y:pb.y}]);
				//canvas.move_bezier({x:pax2.x,y:pb.y},{x:pax2.x,y:pbx2.y},{x:p_end.x,y:p_end.y+25},{x:p_end.x,y:p_end.y});
				//canvas.move_bezier({x:p_end.x,y:p_end.y},{x:p_end.x,y:p_end.y-25},{x:pa.x,y:pa.y},pa);
				canvas.fill();
				if(node.type == GATE_NAND)
				{
					canvas.draw_point({x:p_end.x+4,y:p_end.y});
				}
			break;
			case GATE_NOT:
			case GATE_BUFFER:
				canvas.fill_polygon([
				pa,
				{x:p_end.x+2,y:p_end.y},
				{x:pa.x,y:pb.y}
				]
				);
				if(node.type == GATE_NOT)
				{
					canvas.draw_point({x:p_end.x+4,y:p_end.y});
				}
			break;
			case GATEIN_BTN:
				/*if(node.value == 1)
				{
					canvas.fill_color("#0A86EA");
					canvas.draw_color("#0A86EA");
				}
				else
				{
					canvas.fill_color("#FFFFFF");
					canvas.draw_color("#FFFFFF");
				}*/
				//
				var xq1 = pa.x+7;
				var xq2 = xq1+node.dim.h;
				
				canvas.fill_polygon([
				{x:xq1,y:pa.y},
				{x:xq2,y:pa.y},
				{x:xq2,y:pb.y},
				{x:xq1,y:pb.y}
				]
				);
				
				/*
				canvas.draw_polygon([
				{x:xq1,y:pa.y},
				{x:xq2,y:pa.y},
				{x:xq2,y:pb.y},
				{x:xq1,y:pb.y}
				]
				);*/
				canvas.color_byState(node.value);
				canvas.fill_polygon([
				{x:xq1+10,y:pa.y+10},
				{x:xq2-10,y:pa.y+10},
				{x:xq2-10,y:pb.y-10},
				{x:xq1+10,y:pb.y-10}
				]
				);

				//pa = {x:p_end.x-7,y:p_end.y};
				//pb = {x:nodeb.pos.x - 17,y:nodeb.pos.y+offy};
				//pb = {x:p_end.x+5,y:p_end.y};
				
				//var curvesize = Math.sqrt((pa.x - pb.x)*(pa.x - pb.x) + (pa.y - pb.y)*(pa.y - pb.y))/3;
				//canvas.draw_bezier(pa,{x:pa.x+curvesize,y:pa.y},{x:pb.x-curvesize,y:pb.y},pb);
				
				//canvas.draw_point({x:p_end.x+5,y:p_end.y});
				//canvas.fill_color("#000000");
				//canvas.text({x:(xq1+xq2)/2-10,y:(y1+y2)/2+10},""+node.value);
			break;
			case GATEOUT_BIT:

				
				var xq1 = pa.x+3;
				var xq2 = xq1+node.dim.h;
				
				canvas.fill_polygon([
				{x:xq1,y:pa.y},
				{x:xq2,y:pa.y},
				{x:xq2,y:pb.y},
				{x:xq1,y:pb.y}
				]
				);
				
				/*if(node.value == 1)
				{
					canvas.fill_color("#0A86EA");
					canvas.draw_color("#0A86EA");
				}
				else
				{
					canvas.fill_color("#000000");
					canvas.draw_color("#000000");
				}*/
				if(node.value == 1)
				{
					canvas.color_byState(node.value);
				}
				else
				{
					canvas.color_contour();
				}
				
				canvas.fill_text({x:(xq1+xq2)/2-8,y:p_end.y+10},""+node.value);
			break;
			default:
				canvas.fill_polygon([
				{x:pa.x,y:pa.y},
				{x:pb.x,y:pa.y},
				{x:pb.x,y:pb.y},
				{x:pa.x,y:pb.y}
				]
				);
			break;
		}

		/*canvas.draw_polygon([
		{x:pa.x,y:pa.y},
		{x:pb.x,y:pa.y},
		{x:pb.x,y:pb.y},
		{x:pa.x,y:pb.y}
		]
		);*/
	}
	
	toSerializable(selectedNodes)
	{
		var indexedConns = new Array();
		for(var i=0;i<this.conns.length;i++)
		{
			if(this.conns[i])
			{
				var index = selectedNodes.indexOf(this.conns[i]);
				if(index >= 0)
					indexedConns.push(index);
				else
					indexedConns.push(-1);
			}
			else
			{
				indexedConns.push(-1);
			}
		}
		return {
			pos:this.pos,
			type:this.type,
			value:this.value,
			conns:indexedConns
		};
	}
	
	fromSerializable(data,selectedNodes)
	{
		this.pos = data.pos;
		this.type = data.type;
		this.value = data.value;
		if(this.type == GATEIN_BTN)
		this.conns = [];	
		else if(this.type == GATE_BUFFER || this.type == GATE_NOT || this.type == GATEOUT_BIT)
		this.conns= [false];
		else
		this.conns= [false,false];
		
		//this.outconns = [];
		for(var i=0;i<this.conns.length;i++)
		{
			if(data.conns[i] >= 0)
			{
				this.conns[i] = selectedNodes[data.conns[i]];
				this.conns[i].outconns.push(this);
			}
			else
			{
				this.conns[i] = false;
			}
		}
	}
}

class Logic {
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
		
		var uiBtns_salvar = new CanvasElem(0,0,100,48,"Salvar",0);
		uiBtns_salvar.onclick = save;
		this.uinodes.push(uiBtns_salvar);
		
		var uiBtns_carregar = new CanvasElem(250,0,150,48,"Carregar",0);
		uiBtns_carregar.onclick = load;
		this.uinodes.push(uiBtns_carregar);
		
		for(var i =0;i<10;i++)
		{
			var x = ((i % 2) * 75) + 45;
			var y = (Math.trunc(i/2) * 75) + 45 + barraH;
			var uiGate = new Gate(x,y,i);
			uiGate.onclick = add_gate;
			this.uinodes.push(uiGate);
			/*this.uinodes.push(
			{
				pos: {x:x,y:y},
				dim: {w:70,h:40},
				type:i,
				conns: [],
				value: 0,
				ondraw: draw_gate,
				onclick: add_gate
			}
			);*/
		}
	}
	
	clearAll()
	{
		for(var i =this.nodes.length-1;i>=0;i--)
		{
			this.remove(this.nodes[i]);
		}
	}
	
	remove(node){
		for(var i =0;i<this.nodes.length;i++)
		{
			var conns = this.nodes[i].conns;
			for(var k =0;k<conns.length;k++)
			{
				if(conns[k] === node)
				{
					conns[k] = false;
				}
			}
		}
		
		
		var index = this.nodes.indexOf(node);
		if (index > -1) {
			referenceSafeRemove(this.nodes,index);
		}
	}
	
	gate(x,y,type){
	
		/*var newgate = 
		{
			pos: {x:x,y:y},
			dim: {w:70,h:40},
			type:type,
			conns: conns,
			value: 0,
			next_value: 0,
			ondraw: draw_gateConn,
			ondraw2: draw_gate,
			onclick: click_gate,
			ondragged: function(node,x,y){}
		};*/
		var newgate = new Gate(x,y,type);
		
		this.nodes.push(newgate);
		for(var i =0;i<10;i++)
		{
			this.step_calculate();
			this.step_apply();
		}
		
		return newgate;
	}

	step_calculate()
	{
		for(var i=0; i < this.nodes.length; i++) 
		{
			var node = this.nodes[i];
			
			var A = 0;
			var B = 0;
			
			if(node.conns.length > 0 && node.conns[0])
			A = node.conns[0].value;
			
			if(node.conns.length > 0 && node.conns[1])
			B = node.conns[1].value;
			
			var V = node.value;
			switch (node.type)
			{
				case GATE_OR:
					V = A + B > 0 ? 1 : 0;
				break;
				case GATE_NOR:
					V = A + B > 0 ? 0 : 1;
				break;
				case GATE_AND:
					V = A + B == 2 ? 1 : 0;
				break;
				case GATE_NAND:
					V = A + B == 2 ? 0 : 1;
				break;
				case GATE_NOT:
					V = A == 0 ? 1 : 0;
				break;
				case GATEOUT_BIT:
				case GATE_BUFFER:
					V = A;
				break;
				case GATE_XOR:
					V = A + B == 1 ? 1 : 0;
				break;
				case GATE_XNOR:
					V = A + B == 1 ? 0 : 1;
				break;
				default:
					V = V;
				break;
			}
			node.next_value = V;
		}
	}

	step_apply()
	{
		var changed = false;
		for(var i=0; i < this.nodes.length; i++) 
		{
			var node = this.nodes[i];
			if(node.value !== node.next_value)
			{
				changed = true;
				node.value = node.next_value;
			}
		}
		return changed;
	}
	
	toSerializable(selectedNodes)
	{
		var serialNodes = new Array();
		for(var i=0; i < selectedNodes.length; i++) 
		{
			var node = selectedNodes[i];
			serialNodes.push(node.toSerializable(selectedNodes));
		}
		return serialNodes;
	}
	
	fromSerializable(serialNodes)
	{
		var selectedNodes = new Array();
		for(var i=0; i < serialNodes.length; i++) 
		{
			var new_gate = new Gate(0,0,0);
			selectedNodes.push(new_gate);
		}
		for(var i=0; i < serialNodes.length; i++) 
		{
			var node = serialNodes[i];
			var new_gate = selectedNodes[i];
			new_gate.fromSerializable(node,selectedNodes);
			this.nodes.push(new_gate);
		}
		return selectedNodes;
	}
}

LogicWorld = new Logic();
/*
var inA = LogicWorld.gate(50,100,GATEIN_BTN);
var inB = LogicWorld.gate(50,200,GATEIN_BTN);
var norA = LogicWorld.gate(200,100,GATE_NOR);
var norB = LogicWorld.gate(200,200,GATE_NOR);

inA.value = 1;

norA.conns = [inA,norB];
norB.conns = [inB,norA];*/

LogicWorld.fromSerializable(serializedMap);

//var logicMem = "'{'pos':{'x':-198.66174768518522,'y':70.80108265817907},'dim':{'w':70,'h':40},'type':8,'conns':[-1,-1],'value':0},{'pos':{'x':-197.71984712577165,'y':220.72181230709884},'dim':{'w':70,'h':40},'type':8,'conns':[-1,-1],'value':0},{'pos':{'x':203.7676022376544,'y':81.1619888117284},'dim':{'w':70,'h':40},'type':3,'conns':[5,3],'value':0},{'pos':{'x':207.53520447530866,'y':221.66371286651236},'dim':{'w':70,'h':40},'type':3,'conns':[6,2],'value':1},{'pos':{'x':878.9048635223769,'y':107.4483386381172},'dim':{'w':70,'h':40},'type':2,'conns':[2,-1],'value':0},{'pos':{'x':49.86713927469134,'y':73.318805459105},'dim':{'w':70,'h':40},'type':4,'conns':[7,1],'value':0},{'pos':{'x':62.111846547067785,'y':214.60388937114206},'dim':{'w':70,'h':40},'type':4,'conns':[0,1],'value':0},{'pos':{'x':-45.26481722608037,'y':69.55120322145066},'dim':{'w':70,'h':40},'type':1,'conns':[0],'value':1}'";
