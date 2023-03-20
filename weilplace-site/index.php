<?php
// Não funciona em HTTPS
if (array_key_exists('HTTPS', $_SERVER) && $_SERVER['HTTPS'] == 'on') {
    $url = "http://" . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'];
    header('Location: ' . $url, true, 301);
    exit();
}

// Start the session
session_start();

?>
<!DOCTYPE html>
<html style="height:100%; width:100%; position: absolute">
<head>
<style>
    html, body {
        overflow: hidden;
		padding:0;
		margin:0;
		
		font-family: "Lucida Console", "Courier New", monospace;
    }

	#placenow {
		white-space: nowrap;
		
		position: fixed;
		background-color:white;
		
		bottom: 0;
		margin-bottom: 1em;
		padding-left: 1em;
		padding-right: 1em;
		border: 3px solid #eee;
		border-radius: 64px;
		
		box-shadow:  2px 4px 6px #666;
		left: 50%;
		transform: translate(-50%, 0);
	}
	
	#colorpicker {
		
		
		position: fixed;
		background-color:white;
		padding:0.5em;
		bottom: 0;
		left: 0;
		right: 0;
		display: none;
		
		text-align: center;
	}
	
	td {
	  text-align: center;
	}

	#colorpickertablediv
	{
		overflow-x:auto;
	}

	#colorpickertable{
		
		margin-left:auto;
		margin-right:auto;
		border-collapse: separate;
		border-spacing: 4px;
		
	}
	
	.colorbutton{

		border: 1px solid #aaa;

		width: 2em;
		min-width: 2em;
	}
	
	.colorbutton.pressed{
		border: 1px solid #fff;
		box-shadow:  2px 4px 6px #666;

	}
	
	.button.pressed{
		border: 3px solid #e00;
		box-shadow:  2px 4px 6px #666;
		padding: 5px;
	}
	
	.button {
		background-color: white;
		border: 2px solid #aaa;
		color: #444;
		width: 8em;
		height: 2em;
		text-align: center;
		text-decoration: none;
		display: inline-block;
		font-size: 16px;
		margin-top:0.5em;
		margin-left:16px;
		margin-right:16px;
		border-radius: 16px;
	}
	
	#coordinates {
		margin: 0.25em;
		font-size: 1.5em;
	}
	
	@media (max-width:600px){
		
		.colorbutton{

			border: 1px solid #aaa;
			height: 2em;
			width: 4em;
			min-width: 4em;
		}
	}
</style>
	<meta http-equiv="pragma" content="no-cache">
	
	<meta name="viewport" content="width=device-width, minimum-scale=1, maximum-scale=1, user-scalable=no" />
</head>
<body style="height:100%; width:100%; position: absolute" onresize="resizeCanvas()" >
<canvas id="canvasInAPerfectWorld" style="height:100%" ></canvas>


<div id="placenow">
<p >Insira um pixel <span id="coordinates2">(0,0)</span></p>
</div>

<div id="colorpicker">
<div id="colorpickertxt">
<p id="coordinates">(0,0)</p>
</div>
<div id="colorpickertablediv">
<table id="colorpickertable">
<tr>
<th class="colorbutton" style="background-color:#6d001a;">&nbsp;</th>
<th class="colorbutton" style="background-color:#be0039;">&nbsp;</th>
<th class="colorbutton" style="background-color:#ff4500;">&nbsp;</th>
<th class="colorbutton" style="background-color:#ffa800;">&nbsp;</th>
<th class="colorbutton" style="background-color:#ffd635;">&nbsp;</th>
<th class="colorbutton" style="background-color:#fff8b8;">&nbsp;</th>                               
<th class="colorbutton" style="background-color:#00a368;">&nbsp;</th>                               
<th class="colorbutton" style="background-color:#00cc78;">&nbsp;</th>                               
<th class="colorbutton" style="background-color:#7eed56;">&nbsp;</th>                               
<th class="colorbutton" style="background-color:#00756f;">&nbsp;</th>                               
<th class="colorbutton" style="background-color:#009eaa;">&nbsp;</th>                               
<th class="colorbutton" style="background-color:#00ccc0;">&nbsp;</th>                               
<th class="colorbutton" style="background-color:#2450a4;">&nbsp;</th>                               
<th class="colorbutton" style="background-color:#3690ea;">&nbsp;</th>                               
<th class="colorbutton" style="background-color:#51e9f4;">&nbsp;</th>                               
<th class="colorbutton" style="background-color:#493ac1;">&nbsp;</th>                               
<th class="colorbutton" style="background-color:#6a5cff;">&nbsp;</th>                               
<th class="colorbutton" style="background-color:#94b3ff;">&nbsp;</th>                              
<th class="colorbutton" style="background-color:#811e9f;">&nbsp;</th>                               
<th class="colorbutton" style="background-color:#b44ac0;">&nbsp;</th>                               
<th class="colorbutton" style="background-color:#e4abff;">&nbsp;</th>                               
<th class="colorbutton" style="background-color:#de107f;">&nbsp;</th>                               
<th class="colorbutton" style="background-color:#ff3881;">&nbsp;</th>                               
<th class="colorbutton" style="background-color:#ff99aa;">&nbsp;</th>                               
<th class="colorbutton" style="background-color:#6d482f;">&nbsp;</th>                               
<th class="colorbutton" style="background-color:#9c6926;">&nbsp;</th>                               
<th class="colorbutton" style="background-color:#ffb470;">&nbsp;</th>                               
<th class="colorbutton" style="background-color:#000000;">&nbsp;</th>                               
<th class="colorbutton" style="background-color:#515252;">&nbsp;</th>                               
<th class="colorbutton" style="background-color:#898d90;">&nbsp;</th>                               
<th class="colorbutton" style="background-color:#d4d7d9;">&nbsp;</th>                               
<th class="colorbutton" style="background-color:#ffffff;">&nbsp;</th>
</tr>
</table>
</div>
<div id="colorpickerbuttondiv">
<button class="button" id="cancelbutton">✕</button><button class="button" id="okbutton">✓</button>
</div>
</div>

<script src="trash.js"></script>
<script>
	<?php 
	$api = getenv('APISERVER');
	if(!$api)
	{
		$api = "http://localhost:8090/";
	}
	
	?>
	var pixelsapi = "<?php echo($api); ?>";
</script>
<script src="pixels.js"></script>
<script src="canvas.js"></script>
</body>
</html>