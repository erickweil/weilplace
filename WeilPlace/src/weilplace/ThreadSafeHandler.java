/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package weilplace;

import java.util.Scanner;
import java.util.logging.Level;
import java.util.logging.Logger;


/**
 * Classe mais sensível do projeto. trabalha com o envio das mensagens da
 * thread da interface gráfica para todas as thread's de conexão ativas,
 * problemas que devem ser observados nessa classe:
 * - Memory Leak
 * - Thread Syncronization
 * 
 * como é utilizado pelas threads:
 * inicio:
 *    1. aguarda que uma nova mensagem chegue pelo método waitMessage()
 *    2. link é capturado pelo método getMessage()
 * sempre:
 *    3. lê a mensagem pelo método GetData() do DataLink
 *    4. captura o próximo link pelo método next() do DataLink
 *       4.1 aguarda a mensagem pelo método waitMessage() caso o next() retornar nulo.
 * @author Usuario
 * @param <T> 
 */
public class ThreadSafeHandler<T> {
    
    public static class DataLink<T>
    {
        private final T data;
        private DataLink<T> next;
        public DataLink(T data)
        {
            this.data = data;
        }
        
        public synchronized T getData()
        {
            return this.data;
        }
        
        public synchronized DataLink<T> next()
        {
            return this.next;
        }
        
        private synchronized void setNext(DataLink<T> next)
        {
            this.next = next;
        }
    }
    
    private DataLink<T> head;
	private int needToRead;
    public long timeout = 1000;
    public boolean instant_send = false;
    private long nonce_count = 0;
    private int waiting;
    private final boolean LOG;

    public ThreadSafeHandler() {
        this.LOG = true;
    }
    
    public ThreadSafeHandler(boolean LOG) {
        this.LOG = LOG;
    }
    
    
	private synchronized void _addMessage(T data)
	{
		this.needToRead = waiting;
        
        DataLink<T> n = new DataLink<>(data);
        if(head != null)
        {
            head.setNext(n);
        }
        head = n;
        this.notifyAll();
	}
	
	/**
	 * Envia uma mensagem a todos que estão escutando este Handler
	 * @param data objeto a ser enviado
	 * @throws InterruptedException
	 */
	public void sendMessage(T data) throws InterruptedException
	{
        long start = System.currentTimeMillis();
		_addMessage(data);
        
        if(instant_send) return;
        
            while(needToRead > 0)
            {
                Thread.sleep(1);
                long elapsed = System.currentTimeMillis() - start;
                if(elapsed > timeout)
                {
                    System.out.println("Can't send to ALL! needToRead:"+needToRead);
                    return;
                }
            }
        if(LOG)
		System.out.println("Send To ALL --> '"+data+"' ");
	}
	
	
	private synchronized void setwaiting()
	{
		waiting++;
		//System.out.println("setwaiting() waiting:"+waiting+" needToRead:"+needToRead);
	}
	private synchronized void setawake()
	{
		waiting--;
		if(needToRead > 0) needToRead--;
		//System.out.println("setawake() waiting:"+waiting+" needToRead:"+needToRead);
	}
	/**
	 * Aguarda até que a próxima mensagem esteja pronta para ser lida,
	 * deve ser chamado dentro de um bloco synchronized(handler)
	 */
	public synchronized void waitMessage() {
		// TODO Auto-generated method stub
		try {
			this.setwaiting();
			this.wait();
			this.setawake();
		} catch (InterruptedException e) {
			// TODO Auto-generated catch block
			this.setawake();
			e.printStackTrace();
		}
	}
	/**
	 * lê a mensagem atual do handler
     * Deve ser usado na primeira vez apenas, depois acessa o next() do DataLink
	 * @return
	 */
    public synchronized DataLink<T> getMessage()
    {
        return head;
    }

    
    public static void main(String[] args)
    {
        final ThreadSafeHandler<String> handler = new ThreadSafeHandler<>(true);
        
        for(int i=0;i<10;i++)
        {
            final int k = i;
            new Thread(new Runnable() {
                @Override
                public void run() {
                    try {
                        System.out.println("Thread "+k+" acordou");

                        handler.waitMessage();
                        DataLink<String> link = handler.getMessage();
                        
                        StringBuilder str = new StringBuilder();
                        while(true)
                        {
                            String msg = link.getData();
                            if (msg == null || msg.isEmpty()) {
                                break;
                            }

                            str.append(msg);
                            
                            System.out.println("Thread "+k+":"+str.toString());

                            Thread.sleep((int)(Math.random() * 2000));
                                

                            DataLink<String> n = link.next();
                            if (n == null) {
                                handler.waitMessage();
                                n = link.next();
                            }
                            link = n;
                        }

                        System.out.println("Thread "+k+" dormiu");
                    } catch (InterruptedException ex) {
                        Logger.getLogger(ThreadSafeHandler.class.getName()).log(Level.SEVERE, null, ex);
                    }
                }
            }).start();
        }
        try {
            Scanner leitor = new Scanner(System.in);
            String line;
            while(!(line = leitor.nextLine()).isEmpty())
            {
                handler.sendMessage(line);
            }

            handler.sendMessage("");
        }
        catch (InterruptedException ex) 
        {
            ex.printStackTrace();
        }
    }
}
