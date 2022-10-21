/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Main.java to edit this template
 */
package br.erickweil.weilplace;

import br.erickweil.webserver.GetUriParameters;
import br.erickweil.webserver.HttpRequest;
import br.erickweil.webserver.HttpResponse;
import br.erickweil.webserver.ProtocolFactory;
import br.erickweil.webserver.ReaderWriter;
import br.erickweil.webserver.ServerHttpProxy;
import br.erickweil.webserver.ServerPage;
import br.erickweil.webserver.ServerPageManager;
import br.erickweil.webserver.ServerProtocol;
import br.erickweil.webserver.WebServer;
import java.util.Base64;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.DataInputStream;
import java.io.DataOutputStream;
import java.io.File;
import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.net.InetSocketAddress;
import java.nio.ByteBuffer;
import java.nio.channels.SocketChannel;
import java.nio.file.Files;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 *
 * @author erick
 */
public class WeilPlace {
    //public static int pixels_width;
    //public static int pixels_height;
    //public static File bmpFile;
    //public static Bitmap8Bit bitmap;
    

    

    public static void main(String[] args) throws IOException {
        
            int porta = 8090;
            int size = 128;
            boolean longpooling = true;
            // 60 secs would the theorical maximum while working ok on all browsers and the nginx
            int poolingTimeout = 30000;
            
            // segundos que um usu�rio deve esperar antes de colocar pixels
            int placeDelay = 0;
            String filestr = "pixels.bmp";
            
            try{
            if(args.length > 0)
            {
                for(int i=0;i<args.length;i+=2)  
                {
                    String key = args[i].trim();
                    String value = args[i+1].trim();
                    
                    switch(key)
                    {
                        case "-port":
                            porta = Integer.parseInt(value);
                            break;
                        case "-size":
                            porta = Integer.parseInt(value);
                            break;
                        case "-file":
                            filestr = value;
                            break;
                        case "-longpooling":
                            longpooling = "true".equalsIgnoreCase(value);
                            break;
                        case "-poolingtimeout":
                            poolingTimeout = Integer.parseInt(value);
                            break;
                        case "-placedelay":
                            placeDelay = Integer.parseInt(value);
                            break;
                    }
                }  
            }
            }
            catch(Exception e)
            {
                e.printStackTrace();
            }
        
            for(int i=0;i<ImageSaver.pallete_size;i++)
            {
                int v = ImageSaver.pallete[i];
                int r = (v&0xFF0000)>>16;
                int g = (v&0x00FF00)>>8;
                int b = v&0x0000FF;

                System.out.println("["+r+","+g+","+b+"],");

            }
            Bitmap8Bit bitmap = null;
            File bmpFile = new File(filestr);
            try{
                if(bmpFile.exists())
                {
                    byte[] bmpImg = Files.readAllBytes(bmpFile.toPath());
                    if(bmpImg != null && bmpImg.length > 0)
                        bitmap = Bitmap8Bit.fromBytes(bmpImg);
                }
            }
            catch(Exception e)
            {
                e.printStackTrace();
            }

            if(bitmap == null)
            {
                bitmap = Bitmap8Bit.fromScratch8bit(size, size, ImageSaver.pallete);

                for(int x=0;x<bitmap._width;x++)
                {
                    for(int y=0;y<bitmap._height;y++)
                    {
                        bitmap.setPixel8(x, y, (byte)31);
                    }    
                }

                // will save later...
                //saveBitmap();
            }

            System.out.println(bitmap.toString());
            bitmap.printColorTable();
            System.out.println("COLORS ARRAY:");
            bitmap.printPixelDataRow(0);      

            
            final ThreadSafeDormitorio dormitorio = longpooling ? new ThreadSafeDormitorio(poolingTimeout,false) : null;
            
            // Save image on another thread...
            final ImageSaver saver = new ImageSaver(bitmap,bmpFile.getParentFile(),"pixels",placeDelay);
            Thread saverThread = new Thread(saver);
            saverThread.start();
            
            System.out.println("Iniciando Server Kcire... porta:"+porta);

            WebServer server = new WebServer(porta,new ProtocolFactory() {
                    @Override
                    public ServerProtocol get() {
                            // TODO Auto-generated method stub
                            return new PlaceServer(saver, dormitorio);
                    }
            });
            try {
                    server.run();
            } catch (Throwable e) {
                    // TODO Auto-generated catch block
                    e.printStackTrace();
            }
            finally
            {
                    System.out.println("Parando Server Kcire...");
                    server.stop();
            }
    }

    public static class PlaceServer extends ServerProtocol{

        public ImageSaver imageSaver;
        public boolean continueToRepeat;
        private final ThreadSafeDormitorio dormitorio;
	public PlaceServer(ImageSaver saver,ThreadSafeDormitorio dormitorio)
	{
            this.continueToRepeat = true;
            this.imageSaver = saver;
            this.dormitorio = dormitorio;
	}
	
	public void echo(DataOutputStream output, String txt) throws IOException
	{
		System.out.print(txt.replace("\n","\n--> "));
		ReaderWriter.write(txt, output,charset);
	}
	
        public void echoStatus(HttpResponse Response,int status) throws IOException
        {
            String statusString = "";
            switch(status)
            {
                    case 200: statusString= "OK"; break;
                    case 404: statusString= "Not Found"; break;
            }
            Response.status_code = ""+status;
            Response.reason_frase = statusString;
        }

	@Override
	public void processRequest() throws IOException {
		// TODO Auto-generated method stub

		HttpRequest Request = new HttpRequest();
		boolean sucesso = Request.buildfromInputStream(input);
		if(!sucesso) {
                    continueToRepeat = false; // Evitar que fique tentando ler EOF em loop infinito
                    return;
                }
	
		//System.out.print("->Processando Resposta...\n--> ");
		
		//HttpResponse Response = new HttpResponse();
		//response_output = Response.getcontentOutputStream();
		
                HttpResponse Response = processProtocol(Request);
                
		//System.out.println("->Enviando Resposta...");
		
                if(Response.content == imageSaver.bitmap.contents)
                {
                    // // SYNCHRONIZED TO PREVENT READING THE ARRAY WHILE IT IS BEING CHANGED
                    synchronized (imageSaver.bitmap.contents) {
                        Response.writeIntoOutputStream(output);
                    }
                }
                else
                {
                    Response.writeIntoOutputStream(output);
                }
		//new Proxy(this).get();
	}
        
        public static final byte[] ok_response = new byte[]{'O','K'};
        public static final byte[] error_response = new byte[]{'E','R','R','O'};
        public HttpResponse processProtocol(HttpRequest requestData) throws UnsupportedEncodingException
        {
            // Identificar cada usu�rio pela sess�o do PHP, que � um cookie setado ao abrir a p�gina.
            String identifier = null;
            if(requestData.cookies != null && requestData.cookies.containsKey("PHPSESSID"))
            {
                identifier = requestData.cookies.get("PHPSESSID");
            }
            
            HttpResponse response = new HttpResponse();
            response.closeConnection = false;
            response.setHeader("Cache-Control", "max-age=0, no-cache, no-store, must-revalidate");
            response.setHeader("Expires", "Wed, 11 Jan 1984 05:00:00 GMT");
            response.setHeader("Pragma", "no-cache");
            response.setHeader("Accept-Ranges", "bytes");  
            response.setHeader("Content-Encoding", "identity");
            
            // CORS
            //response.setHeader("Access-Control-Allow-Origin", "http://localhost");
            // https://stackoverflow.com/questions/24687313/what-exactly-does-the-access-control-allow-credentials-header-do#:~:text=The%20server%20must%20respond%20with,included%20on%20cross%2Dorigin%20requests.
            //response.setHeader("Access-Control-Allow-Credentials","true");
            
            //response.setHeader("Access-Control-Allow-Origin", "*");
            response.setHeader("Connection", "Keep-Alive");
            response.setHeader("Content-Type", "text/plain");
            byte[] responseBody;

            String urlQuery = requestData.uri.substring(requestData.uri.lastIndexOf('?')+1, requestData.uri.length());


            if(urlQuery.isEmpty() || !requestData.uri.contains("?"))
            {
                if(requestData.uri.contains("favicon"))
                {
                    response.delHeader("Cache-Conrol");
                    response.delHeader("Expires");
                    response.delHeader("Pragma");
                    //response.setHeader("Content-Type", "image/bmp");
                    //responseBody = bitmap.contents;
                    
                    responseBody = error_response;
                }
                else
                {
                    System.out.println("N�o cont�m os get parameters");
                    responseBody = error_response;
                }
            }
            else
            {
            Map<String, List<String>> getparameters = GetUriParameters.splitQuery(urlQuery);

            if(getparameters == null || !getparameters.containsKey("req")){
                response.setContent(error_response);
                return response;
            }
            
            String req = getparameters.get("req").get(0);
            //System.out.println("Req '"+req+"':");
            switch(req)
            {
                // Read single pixel
                case "read":
                {
                    if(!getparameters.containsKey("x") || !getparameters.containsKey("y")){
                        response.setContent(error_response);
                        return response;
                    }
                    
                    int coord_x = Integer.parseInt(getparameters.get("x").get(0));
                    int coord_y = Integer.parseInt(getparameters.get("y").get(0));
                    coord_x = Math.max(0,Math.min(coord_x,imageSaver.width-1));
                    coord_y = Math.max(0,Math.min(coord_y,imageSaver.height-1));

                    byte[] onebyte_response = new byte[1];
                    onebyte_response[0] = imageSaver.getPixel(coord_x, coord_y);//bitmap.getPixel8(coord_x, coord_y);

                    response.setHeader("Content-Type", "text/plain");
                    responseBody = onebyte_response;
                break;
                }
                // Set single pixel
                case "set":
                {
                    if(!getparameters.containsKey("x") || !getparameters.containsKey("y") || !getparameters.containsKey("c")){
                        response.setContent(error_response);
                        return response;
                    }
                    
                    int coord_x = Integer.parseInt(getparameters.get("x").get(0));
                    int coord_y = Integer.parseInt(getparameters.get("y").get(0));
                    coord_x = Math.max(0,Math.min(coord_x,imageSaver.width-1));
                    coord_y = Math.max(0,Math.min(coord_y,imageSaver.height-1));
                    int color = Integer.parseInt(getparameters.get("c").get(0));
                    color = Math.max(0,Math.min(color,imageSaver.pallete_size-1));
                    
                    int delayToPlaceAgain = imageSaver.setPixel(coord_x, coord_y, (byte)color, identifier);
                    if(delayToPlaceAgain >= 0)
                    {
                        if(dormitorio != null)
                            dormitorio.acordarTodoMundo();
                    
                        response.setHeader("Content-Type", "application/json");
                        responseBody = ("{\"status\":\"OK\",\"delay\":\""+delayToPlaceAgain+"\"}").getBytes(this.charset);
                    }
                    else
                    {
                        response.setHeader("Content-Type", "application/json");
                        responseBody = ("{\"status\":\"ERRO\",\"delay\":\""+(-delayToPlaceAgain)+"\"}").getBytes(this.charset);
                    }
                break;
                }
                // read entire picture
                case "picture":
                {
                    response.setHeader("Content-Type", "image/bmp");
                    responseBody = imageSaver.bitmap.contents;                    
                break;
                }
                
                // get base64 changes
                // optional long pooling 
                case "changes":
                {
                    if(!getparameters.containsKey("i")){
                        response.setContent(error_response);
                        return response;
                    }
                    
                    response.setHeader("Content-Type", "application/json");
                    int index = Integer.parseInt(getparameters.get("i").get(0));    
                    
                    
                    int[] retIndex = new int[]{index};
                    String resptxt = imageSaver.getChanges(retIndex);
                    
                    // Long-pooling
                    // S� faz o long pooling se n�o tem mudan�as e n � a primeira vez
                    if(dormitorio != null && resptxt == null && index != -1)
                    {
                        dormitorio.dormir(); // Espera por um setPixel, ou ent�o pelo timeout.
                    
                        retIndex[0] = index;
                        resptxt = imageSaver.getChanges(retIndex); // pega novamente os 
                    }
                    
                    String respjson;
                    if(resptxt == null) respjson = "{\"i\":\""+retIndex[0]+"\"}";
                    else                respjson = "{\"i\":\""+retIndex[0]+"\",\"changes\":\""+resptxt+"\"}";
                    
                    //System.out.println("Written Changes:"+resptxt);
                    
                    responseBody = respjson.getBytes(this.charset);
                break;
                }
                
                default:
                {
                    System.out.println("Req '"+req+"' desconhecido");
                    response.setHeader("Content-Type", "text/plain");
                    responseBody = error_response;
                break;
                }
            }
            }

            response.setContent(responseBody);

            return response;
        }
        
        @Override
        protected boolean repeat()
        {
            return continueToRepeat;
        }
        
    }
    
    // only class to handle the bitmap
    public static class ImageSaver implements Runnable{
        // max 256
        public static int pallete_size = 32;
        public static int[] pallete = {
            0x6d001a, //00000
            0xbe0039, //00001
            0xff4500, //00010
            0xffa800, //00011
            0xffd635, //00100
            0xfff8b8, //00101
            0x00a368, //00110
            0x00cc78, //00111
            0x7eed56, //01000
            0x00756f, //01001
            0x009eaa, //01010
            0x00ccc0, //01011
            0x2450a4, //01100
            0x3690ea, //01101
            0x51e9f4, //01110
            0x493ac1, //01111
            0x6a5cff, //10000
            0x94b3ff, //10001
            0x811e9f, //10010
            0xb44ac0, //10011
            0xe4abff, //10100
            0xde107f, //10101
            0xff3881, //10110
            0xff99aa, //10111
            0x6d482f, //11000
            0x9c6926, //11001
            0xffb470, //11010
            0x000000, //11011
            0x515252, //11100
            0x898d90, //11101
            0xd4d7d9, //11110
            0xffffff  //11111
        };
        
        protected File bmpFileDir;
        protected String bmpFileName;
        protected Bitmap8Bit bitmap;
        private boolean pixelSet;
        public final int width;
        public final int height;
        public StringBuilder changes;
        byte[] changesbuff;
        Base64.Encoder b64encoder;
        public int placeDelay;
        private final HashMap<String,Long> lastPlaced;
        
        public ImageSaver(Bitmap8Bit bitmap, File bmpFileDir, String bmpFileName, int placeDelay)
        {
            this.bitmap = bitmap;
            this.bmpFileDir = bmpFileDir;
            this.bmpFileName = bmpFileName;
            this.width = bitmap._width;
            this.height = bitmap._height;
            this.pixelSet = true;
            this.changes = new StringBuilder();
            this.placeDelay = placeDelay;
            changesbuff = new byte[3];
            b64encoder = Base64.getEncoder();
            this.lastPlaced = new HashMap<>();
        }
        
        
        /*
        each 6 bits are a BASE64 Letter
        3 Bytes are 4 Leters in BASE64
        3 * 8 = 24, 24 / 6 = 4
        M       a       n
        77      97      110
        010011010110000101101110
        19    22    5     46
        T     W     F     u 
        
        Store each change into base64 fragments:
        4 Letters are 24 bits (3 Bytes) Maximum grid of 512x512, pallete of 64 colors
        X coord Y coord Color  
        9 bits 9 bits 6 bits
        
        
        8 Letters are 48 bits (6 Bytes) Maximum grid of 1048576x1048576, pallete of 256 colors
        X coord Y coord Color  
        20 bits 20 bits 8 bits
        */
        public int setPixel(int x,int y,byte color,String identifier)
        {
            // SYNCHRONIZED TO PREVENT WRITING THE ARRAY WHILE IT IS BEING READ
            synchronized (bitmap.contents) {
                
                // if there is a delay to place tiles
                if(placeDelay > 0)
                {
                    long timeLastPlaced = lastPlaced.getOrDefault(identifier, -1L);
                    if(timeLastPlaced > 0)
                    {
                        long timeElapsed = (System.currentTimeMillis() - timeLastPlaced)/1000;
                        if( timeElapsed < placeDelay)
                        {
                            return -((int)(placeDelay - timeElapsed) + 1);
                        }
                    }
                }
                
                bitmap.setPixel8(x, y, (byte)color);
                
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
                changes.append(b64encoder.encodeToString(changesbuff));
                
                if(placeDelay > 0)
                {
                    lastPlaced.put(identifier, System.currentTimeMillis());
                }
                
                pixelSet = true;
                
                return placeDelay;
            }
        }
        
        public byte getPixel(int x,int y)
        {
            // SYNCHRONIZED TO PREVENT READING THE ARRAY WHILE IT IS BEING CHANGED
            synchronized (bitmap.contents) {
                return bitmap.getPixel8(x, y);
            }
        }
        
        public void writeBmpContents(DataOutputStream outputStream)
        {
            // SYNCHRONIZED TO PREVENT READING THE ARRAY WHILE IT IS BEING CHANGED
            synchronized (bitmap.contents) {
                try {
                    outputStream.write(bitmap.contents);
                } catch (IOException ex) {
                    ex.printStackTrace();
                }
            }
        }
            
        public void saveBitmap(int n)
        {
            try {
                File bmpFile = new File(bmpFileDir,bmpFileName+"_"+n+".bmp");
                Files.write(bmpFile.toPath(), bitmap.contents);
                System.out.println("Saved bitmap.");
            } catch (IOException ex) {
                ex.printStackTrace();
            }
        }
        
        public String getChanges(int[] ret)
        {
            int index = ret[0];
            synchronized (bitmap.contents) {
                int changeslength = changes.length();
                ret[0] = changeslength;
                if(index <= -1 || index >= changeslength)
                {
                    return null;
                }
                else
                {
                    String txt = changes.substring(index, changeslength);
                    return txt;
                }
            }
        }
    
        @Override
        public void run() {            
            int lastChanges = 0;
            while(true){
                // SYNCHRONIZED TO PREVENT READING THE ARRAY WHILE IT IS BEING CHANGED
                synchronized (bitmap.contents) {
                    // only save bitmap if it changed
                    if(pixelSet)
                    {
                        pixelSet = false;
                        
                        int changeslength = changes.length();
                        
                        saveBitmap(changeslength / 4);
                        
                        //if( (changeslength - lastChanges) < 32)
                        //System.out.println("Changes:"+changes.substring(lastChanges, changes.length()));
                        // 4 letter per pixel
                        System.out.println(((changeslength - lastChanges)/4)+" Pixels placed");
                        lastChanges = changeslength;
                    }
                }

                // check every 1s
                try {
                    Thread.sleep(10000);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
        }
    }
}
