/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package br.erickweil.weilplace;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.ServerSocket;
import java.nio.ByteBuffer;
import java.nio.channels.SelectionKey;
import java.nio.channels.Selector;
import java.nio.channels.ServerSocketChannel;
import java.nio.channels.SocketChannel;
import java.nio.charset.Charset;
import java.util.Iterator;
import java.util.Set;

//https://jenkov.com/tutorials/java-nio/non-blocking-server.html

public class NonBlockingServer {

    private static Selector selector = null;
    private static ByteBuffer read_buffer = null;
    private static Charset charset_utf8 = null;
    
    private static int port = 80;
    
    public static void main(String[] args) {
        charset_utf8 = Charset.forName("UTF-8");
        try {
            selector = Selector.open();
//            We have to set connection host, port and non-blocking mode
            ServerSocketChannel socket = ServerSocketChannel.open();
            ServerSocket serverSocket = socket.socket();
            serverSocket.bind(new InetSocketAddress("localhost", port));
            socket.configureBlocking(false);
            int ops = socket.validOps();
            socket.register(selector, ops, null);
            while (true) {
                System.out.println("ESPERANDO...");
                selector.select();
                Set<SelectionKey> selectedKeys = selector.selectedKeys();
                
                if(selectedKeys.isEmpty()) continue;
                
                Iterator<SelectionKey> crunchifyIterator = selectedKeys.iterator();
 
                while (crunchifyIterator.hasNext()) {
                    SelectionKey key = crunchifyIterator.next();
                    
                    //if(!key.isValid()){
                    //    key.cancel();
                    //    continue;
                    //}
                    
                    if (key.isAcceptable()) 
                    {
                        // New client has been accepted
                        handleAccept(socket, key);
                    } 
                    else if (key.isReadable()) 
                    {
                        // We can run non-blocking operation READ on our client
                        handleRead(key);
                    }
                    
                    crunchifyIterator.remove();
                }
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    private static void handleAccept(ServerSocketChannel mySocket,
                                     SelectionKey key) throws IOException {

        System.out.println("Connection Accepted...");

        // Accept the connection and set non-blocking mode
        SocketChannel client = mySocket.accept();
        client.configureBlocking(false);

        // Register that client is reading this channel
        client.register(selector, SelectionKey.OP_READ);
    }

    private static void handleRead(SelectionKey key)
            throws IOException {
        System.out.println("Reading...");
        // create a ServerSocketChannel to read the request
        SocketChannel client = (SocketChannel) key.channel();

        // Create buffer to read data
        if(read_buffer == null)
        {
            read_buffer = ByteBuffer.allocate(4096);
        }
        else
        {
            read_buffer.clear();
        }
        
        //StringBuilder requestString = new StringBuilder();
        System.out.println("Received message:\n<START>");
        int readed = client.read(read_buffer);
                
        if(readed != -1){
            String line = new String(read_buffer.array(),charset_utf8);
            //requestString.append(line);
            System.out.print(line);
            read_buffer.clear();
        }
        System.out.println("<END>");
        
        if(readed == -1)
        {
        client.close();
        }
        else
        {
            System.out.println("NÃO LEU ATÉ O FIM");
        }
        /*client.read(buffer);
//        Parse data from buffer to String
        String data = new String(buffer.array()).trim();
        if (data.length() > 0) {
            System.out.println("Received message: " + data);
            if (data.equalsIgnoreCase("exit")) {
                client.close();
                System.out.println("Connection closed (exit)...");
            }
        }
        else
        {
                client.close();
                System.out.println("Connection closed (empty message)...");
        }*/
    }
}
