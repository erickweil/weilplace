/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package weilplace;

import java.util.Scanner;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
A ideia é que várias threads possam esperar por uma indicação de que podem continuar.
com timeout e tudo aqui organizadinho.
*/
public class ThreadSafeDormitorio {
	
    private int needToRead;
    //public long timeoutAcordar = 100; // Esperar quanto tempo acordarem?
    public long timeoutDormir = 30000; // Dormir por até quanto tempo?
    private int waiting;
    private final boolean LOG;

    public ThreadSafeDormitorio(int timeoutDormir, boolean LOG) {
        this.LOG = LOG;
        //this.timeoutAcordar = timeoutAcordar;
        this.timeoutDormir = timeoutDormir;
    }
    
    public ThreadSafeDormitorio() {
        this.LOG = true;
    }
    
    
	public synchronized void acordarTodoMundo()
	{
            this.needToRead = waiting;
            this.notifyAll();
	}
	
	/**
	 * Acorda a todos que estão dormindo neste Handler
	 
	public void acordarTodoMundo()
	{
            long start = System.currentTimeMillis();
            _acordarTodoMundo();

            if(timeoutAcordar <= 0) return;

            while(needToRead > 0)
            {
                Thread.sleep(1);
                long elapsed = System.currentTimeMillis() - start;
                if(elapsed > timeoutAcordar)
                {
                    System.out.println("Não deu para acordar TODOS! sobraram "+needToRead+" dormindo");
                    return;
                }
            }
            if(LOG)
                System.out.println("Acordou TODOS");
	}*/
	
	
	private synchronized void setwaiting()
	{
		waiting++;
	}
	private synchronized void setawake()
	{
		waiting--;
		if(needToRead > 0) needToRead--;
	}
        
	/**
	 * Aguarda até que a próxima mensagem esteja pronta para ser lida,
	 * deve ser chamado dentro de um bloco synchronized(handler)
	 */
	public synchronized void dormir() {
		// TODO Auto-generated method stub
		try {
			this.setwaiting();
                        
                        if(timeoutDormir <=0)
                            this.wait();
                        else
                            this.wait(timeoutDormir);
                        
			this.setawake();
		} catch (InterruptedException e) {
			// TODO Auto-generated catch block
			this.setawake();
			e.printStackTrace();
		}
	}
    
    public static void main(String[] args)
    {
        final ThreadSafeDormitorio dormitorio = new ThreadSafeDormitorio();
        
        for(int i=0;i<10;i++)
        {
            final int k = i;
            new Thread(new Runnable() {
                @Override
                public void run() {
                    try {
                        System.out.println("Thread "+k+" iniciou.");
                       
                        while(true)
                        {   
                            dormitorio.dormir();
                            
                            System.out.println("Thread "+k+" acordou: "+System.currentTimeMillis());

                            Thread.sleep((int)(Math.random() * 2000));
                        }

                        //System.out.println("Thread "+k+" finalizou");
                    } catch (InterruptedException ex) {
                        Logger.getLogger(ThreadSafeHandler.class.getName()).log(Level.SEVERE, null, ex);
                    }
                }
            }).start();
        }

        Scanner leitor = new Scanner(System.in);
        String line;
        while(!(line = leitor.nextLine()).isEmpty())
        {
            System.out.println("SENT:"+System.currentTimeMillis());
            dormitorio.acordarTodoMundo();
        }

    }
}
