/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package weilplace;

import br.erickweil.webserver.HttpClientProtocol;
import br.erickweil.webserver.HttpResponse;
import br.erickweil.webserver.ProtocolFactory;
import br.erickweil.webserver.ServerProtocol;
import br.erickweil.webserver.WebClient;
import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.util.HashMap;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 *
 * @author Usuario
 */
public class FakeLoadTest implements Runnable{
    
    int i;
    public FakeLoadTest(int i)
    {
        this.i = i;
    }
    
    public static void main(String[] args)
    {
        for(int i=0;i<100;i++)
        {
            new Thread(new FakeLoadTest(i)).start();
        }
    }
    
    @Override
    public void run() {
        try 
        {
            while(true)
            {
                int x = (int)(Math.random()*128) % 128;
                int y = (int)(Math.random()*128) % 128;
                int color = (int)(Math.random()*32) % 32;
                
                if(!runSetRequest(x,y,color))
                {
                    System.out.println("Thread "+i+" vai parar pq deu erro no request");
                }

                Thread.sleep((int)(Math.random() * 5000));
            }
        }
        catch (InterruptedException ex) {
            ex.printStackTrace();
        }
    }
    
    public boolean runSetRequest(int x, int y, int color)
    {
        try
        {
            WebClient client = null;
            HashMap<String,String> cookies = new HashMap<>();
            
            
            
            final HttpClientProtocol httpprotocol = new HttpClientProtocol(
            "localhost",
            "/",
            cookies,
            "GET",
            "req=set"
            +"&x="+x
            +"&y="+y
            +"&c="+color);

            client = new WebClient("localhost",8090, 
            new ProtocolFactory() {
                @Override
                public ServerProtocol get() {
                    return httpprotocol;
                }
            }
            );
            //client.LOG = false;
            client.run();
            HttpResponse response = httpprotocol.response;
            if(!response.status_code.equals("200"))
                return false;

            String responseText = response.getResponseAsText();
            if(responseText == null || responseText.trim().isEmpty())
                return false;

            //System.out.println("Resposta do servidor:\n"+responseText);

            return responseText.startsWith("OK");            
        }
        catch (IOException ex) 
        {
            ex.printStackTrace();
        }

        return false;
    }

    
}
