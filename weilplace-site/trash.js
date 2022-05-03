// Reasonable defaults
var PIXEL_STEP  = 10;
var LINE_HEIGHT = 40;
var PAGE_HEIGHT = 800;

/* Add one or more listeners to an element
** @param {DOMElement} element - DOM element to add listeners to
** @param {string} eventNames - space separated list of event names, e.g. 'click change'
** @param {Function} listener - function to attach for each event as a listener
*/
function addListenerMulti(element, eventNames, listener) {
  var events = eventNames.split(' ');
  for (var i=0, iLen=events.length; i<iLen; i++) {
    element.addEventListener(events[i], listener, false);
  }
}


function mapRange(value, oldRange, newRange) {
  var newValue = (value - oldRange[0]) * (newRange[1] - newRange[0]) / (oldRange[1] - oldRange[0]) + newRange[0];
  return Math.min(Math.max(newValue, newRange[0]) , newRange[1]);
}

const byteToHex = [];

for (let n = 0; n <= 0xff; ++n)
{
	const hexOctet = n.toString(16).padStart(2, "0");
	byteToHex.push(hexOctet);
}

function buffer2hex(arrayBuffer)
{
	const buff = new Uint8Array(arrayBuffer);
	const hexOctets = []; // new Array(buff.length) is even faster (preallocates necessary array size), then use hexOctets[i] instead of .push()

	for (let i = 0; i < buff.length; ++i)
		hexOctets.push(byteToHex[buff[i]]);

	return hexOctets.join("");
}


function normalizeWheel(/*object*/ event) /*object*/ {
	var sX = 0, sY = 0,       // spinX, spinY
	  pX = 0, pY = 0;       // pixelX, pixelY

	// Legacy
	if ('detail'      in event) { sY = event.detail; }
	if ('wheelDelta'  in event) { sY = -event.wheelDelta / 120; }
	if ('wheelDeltaY' in event) { sY = -event.wheelDeltaY / 120; }
	if ('wheelDeltaX' in event) { sX = -event.wheelDeltaX / 120; }

	// side scrolling on FF with DOMMouseScroll
	if ( 'axis' in event && event.axis === event.HORIZONTAL_AXIS ) {
		sX = sY;
		sY = 0;
	}

	pX = sX * PIXEL_STEP;
	pY = sY * PIXEL_STEP;

	if ('deltaY' in event) { pY = event.deltaY; }
	if ('deltaX' in event) { pX = event.deltaX; }

	if ((pX || pY) && event.deltaMode) {
	if (event.deltaMode == 1) {          // delta in LINE units
		pX *= LINE_HEIGHT;
		pY *= LINE_HEIGHT;
	} else {                             // delta in PAGE units
		pX *= PAGE_HEIGHT;
		pY *= PAGE_HEIGHT;
	}
	}

	// Fall-back if spin cannot be determined
	if (pX && !sX) { sX = (pX < 1) ? -1 : 1; }
	if (pY && !sY) { sY = (pY < 1) ? -1 : 1; }

	return { spinX  : sX,
		   spinY  : sY,
		   pixelX : pX,
		   pixelY : pY };
}


function referenceSafeRemove(array,index)
{
	for(var i = index;i<array.length;i++)
	{
		if(i < (array.length -1))
		{
			array[i] = array[i+1];
		}
	}
	array.pop();
}

class TouchManager {
	constructor()
	{
		this.touches = new Array();
		this.events = {};
		this.TOUCH_DELAY = 150;
		this.numTouches = 0;
		this.touchDownIssued = false;
		this.touchDownDistance = 0;
	}
	
	getTouchByID(id)
	{
		for(var i=0;i<this.touches.length;i++)
		{
			if(this.touches[i].id == id) return this.touches[i];
		}
		return false;
	}
	
	addEventListener(e,func)
	{
		this.events[e] = func;
	}
	
	getFingerDistance()
	{
		if(this.touches.length == 2)
		{
			var ta = this.touches[0];
			var tb = this.touches[1];
			return Math.sqrt((ta.x - tb.x)*(ta.x - tb.x) + (ta.y - tb.y)*(ta.y - tb.y));
		}
		else return 1;
	}
	
	touchstart(e)
	{
		if(this.touches.length == 0)
		{
			this.touchDownIssued = false;
			this.numTouches=0;
			this.touchDownDistance = 0;
			this.touchDownPosition = false;
		}
		
		for(var i=0;i<e.touches.length;i++)
		{
			var new_t = e.touches[i];
			var t = this.getTouchByID(new_t.identifier);
			if(!t)
			{
				this.touches.push(
				{
					id:new_t.identifier,
					x:new_t.pageX,
					y:new_t.pageY
				}
				);
			}
			else
			{
				t.x	= new_t.pageX;
				t.y = new_t.pageY;
			}
		}
		
		if(!this.touchDownIssued)
		{
			this.numTouches= Math.max(this.numTouches,this.touches.length);
		}
		
		//this.events["onTouchDown"](this.getCenterTouchPos(),this.touches);
	}
	
	touchmove(e)
	{
		for(var i=0;i<e.changedTouches.length;i++)
		{
			var new_t = e.changedTouches[i];
			
			var t = this.getTouchByID(new_t.identifier);
			//alert(t);
			t.x	= new_t.pageX;
			t.y = new_t.pageY;
		}
		
		var touchPos = this.getCenterTouchPos();
		
		if(!this.touchDownIssued)
		{
			if(this.events["onTouchDown"])
			this.events["onTouchDown"](touchPos,this.numTouches);
			this.touchDownIssued = true;
			this.touchDownDistance = this.getFingerDistance();
		}
		else
		{
			if(this.touches.length == 2 && this.touchDownDistance > 50)
			{
				var zoomDelta = this.getFingerDistance() / this.touchDownDistance;
				if(zoomDelta)
				{
					if(this.events["onTouchZoom"])
					this.events["onTouchZoom"](touchPos,zoomDelta);
				}
				this.touchDownDistance = this.getFingerDistance();
			}
			
			if(this.numTouches <= this.touches.length)
			{
				if(this.events["onTouchMove"])
				this.events["onTouchMove"](touchPos,this.numTouches);
			}
		}
	}
	
	touchend(e)
	{
		var touchPos = this.getCenterTouchPos();
		//var touchPos = this.touchDownPosition;
		for(var i=0;i<e.changedTouches.length;i++)
		{
			var new_t = e.changedTouches[i];
			var t = this.getTouchByID(new_t.identifier);
			referenceSafeRemove(this.touches,this.touches.indexOf(t));
		}
		
		//if(this.touches.length == 0)
		//{
		if(this.numTouches > 0)
		{
			if(!this.touchDownIssued)
			{
				if(this.events["onTouchDown"])
				this.events["onTouchDown"](touchPos,this.numTouches);
				this.touchDownIssued = true;
			}
			
			if(this.events["onTouchUp"])
			this.events["onTouchUp"](touchPos,this.numTouches);
			this.numTouches=0;
		}
			
	}
	
	touchcancel(e)
	{
		this.touchend(e);
	}
	
	touchleave(e)
	{
		this.touchend(e);
	}
	
	getCenterTouchPos()
	{
		var p = {x:0,y:0};
		for(var i=0;i<this.touches.length;i++)
		{
			p.x += this.touches[i].x;
			p.y += this.touches[i].y;
		}
		
		p.x /= this.touches.length;
		p.y /= this.touches.length;
		return p;
	}
}