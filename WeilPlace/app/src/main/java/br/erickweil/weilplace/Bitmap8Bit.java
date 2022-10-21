/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package br.erickweil.weilplace;

/**

* 
 */
public class Bitmap8Bit {
    //Header 14 bytes
    public static final int Signature = 0; //2 bytes 'BM'
    public static final int FileSize = 2;  //4 bytes 
    public static final int reserved = 6;  //4 bytes = 0
    public static final int DataOffset = 10; // 4 bytes The offset, i.e. starting address, of the byte where the bitmap image data (pixel array) can be found.
    
    // 14
    //InfoHeader  40 bytes
    public static final int Size = 14;      //4 bytes = 40
    public static final int Width = 18;     //4 bytes 
    public static final int Height = 22;    //4 bytes
    public static final int Planes = 26;    //2 bytes = 1
    public static final int BitCount = 28;  //2 bytes (1 -> 1 color, 4 -> 16 colors, 8 -> 256 colors, 16 -> 65536 colors, 24 -> 16M colors)
    public static final int Compression = 30; //4 bytes (0 -> no compression, 1 -> 8 bit rle, 2 -> 4 bit rle)
    public static final int Imagesize = 34; //4 bytes ( = 0 if compression = 0 )
    public static final int XpixelsPerM = 38; //4 bytes (pixels/meter)
    public static final int YpixelsPerM = 42; //4 bytes (pixels/meter)
    public static final int ColorsUsed = 46; //4 bytes 
    public static final int ColorsImportant = 50; //4 bytes (0 = all)
    
    
    // 54
    public final int ColorTable; 
    //ColorTable 4 * NumColors bytes (If bitcount less than 8)
    //* Red   //1 byte
    //* Green //1 byte
    //* Blue  //1 byte
    //* reserved //1 byte = 0
    //* bytes of the pixels 
    public final byte[] contents;
    
    public final int _bitcount;
    public final int _width;
    public final int _height;
    public final int _dataoffset;
    public final int _alignedrowsize;
    
    
    public static Bitmap8Bit fromBytes(byte[] bitmapContents)
    {
        return new Bitmap8Bit(bitmapContents);
    }
    
    public static Bitmap8Bit fromScratch8bit(int width,int height,int[] pallete)
    {
        int headerSize = 54;
        int colorTableSize = pallete.length * 4;
        int alignedRow = calcAlignedRow(8, width);
        int datasize = alignedRow * height;
        
        byte[] arr = new byte[headerSize + colorTableSize + datasize];
        Bitmap8Bit bmp = new Bitmap8Bit(arr);
        
        bmp.setField(Signature, 0x4D42);
        bmp.setField(FileSize, arr.length);
        bmp.setField(DataOffset, headerSize + colorTableSize);
        
        bmp.setField(Size, 40);
        bmp.setField(Width, width);
        bmp.setField(Height, height);
        bmp.setField(Planes, 1);
        bmp.setField(BitCount, 8);
        bmp.setField(Compression, 0);
        bmp.setField(Imagesize, 0);
        bmp.setField(XpixelsPerM, 3780);
        bmp.setField(YpixelsPerM, 3780);
        
        bmp.setField(ColorsUsed, pallete.length);
        bmp.setField(ColorsImportant, pallete.length);
        // re-set final fields using array values
        bmp = new Bitmap8Bit(arr);
        bmp.setColorTable(pallete);
        
        return bmp;
    }
    
    private Bitmap8Bit(byte[] bitmapContents)
    {
        this.contents = bitmapContents;
        this._dataoffset = getField(DataOffset);
        this._bitcount = getField(BitCount);
        this._width = getField(Width);
        this._height = Math.abs(getField(Height));
        
        ColorTable = 14 + getField(Size);
        
        int numColors =  getNumColors();
        //if(numColors != -1)
//            RasterData = ColorTable + numColors * 4;
//        else
//            RasterData = ColorTable;
        
        /*
        https://en.wikipedia.org/wiki/BMP_file_format
        The bits representing the bitmap pixels are packed in rows. The size of each row is rounded up to a multiple of 4 bytes (a 32-bit DWORD) by padding.
        For images with height above 1, multiple padded rows are stored consecutively, forming a Pixel Array.
        The total number of bytes necessary to store one row of pixels can be calculated as:
        
        */
        this._alignedrowsize = calcAlignedRow(_bitcount, _width);
        
    }
    
    public static int calcAlignedRow(int bitcount, int width)
    {
        return ((bitcount * width + 31) / 32) * 4;
    }
    
    public void setPixel8(int x,int y,byte color)
    {
        contents[_dataoffset + (y*_alignedrowsize + x)] = color;
    }
    
    public byte getPixel8(int x,int y)
    {
        return contents[_dataoffset + (y*_alignedrowsize + x)];
    }
    
    
    
    public final int getNumColors()
    { 
        if(_bitcount == 1) return 1;
        else if(_bitcount == 4) return 16;
        else if(_bitcount == 8) return 256;
        else return -1;
    }
    
    // int colors
    public void setColorTable(int[] rgbacolors)
    {
        int bitcount = getField(BitCount);
        if(bitcount > 8) return;
        
        
        setField(ColorsUsed, rgbacolors.length);
        setField(ColorsImportant, rgbacolors.length);
        for(int i=0;i<rgbacolors.length;i++)
        {
            int v = rgbacolors[i];
            int r = (v&0xFF0000)>>16;
            int g = (v&0x00FF00)>>8;
            int b = v&0x0000FF;
            contents[(ColorTable + i*4) + 2] = (byte)r;
            contents[(ColorTable + i*4) + 1] = (byte)g;
            contents[(ColorTable + i*4) + 0] = (byte)b;
            contents[(ColorTable + i*4) + 3] = (byte)0xFF;
        }
    }
    
    public int getField(int field)
    {
        if(field == Signature || field == Planes || field == BitCount)
        return readShortLittle(contents, field);    
        else
        return readIntLittle(contents, field);
    }
    
    public void setField(int field,int value)
    {
        if(field == Signature || field == Planes || field == BitCount)
        writeShortLittle(value,contents, field);    
        else
        writeIntLittle(value,contents, field);
    }
    
    // All integer values in bitmap are little endian
    public static void writeIntLittle(int value,byte[] arr,int offset)
    {
        arr[offset+0] = (byte)((value&0x000000FF));
        arr[offset+1] = (byte)((value&0x0000FF00)>>8);
        arr[offset+2] = (byte)((value&0x00FF0000)>>16);
        arr[offset+3] = (byte)((value&0xFF000000)>>24);
    }
    
    public static int readIntLittle(byte[] arr,int offset)
    {
        return 
        ((arr[offset+3]&0xFF) <<  24  ) | 
        ((arr[offset+2]&0xFF) <<  16  ) |
        ((arr[offset+1]&0xFF) <<  8   ) | 
        ((arr[offset+0]&0xFF)         );
    }
    
    public static void writeShortLittle(int value,byte[] arr,int offset)
    {
        arr[offset+0] = (byte)((value&0x000000FF));
        arr[offset+1] = (byte)((value&0x0000FF00)>>8);
    }
    
    public static int readShortLittle(byte[] arr,int offset)
    {
        return
        ((arr[offset+1]&0xFF) <<  8   ) | 
        ((arr[offset+0]&0xFF)         );
    }

    
    public void printColorTable()
    {
        int numColors = getNumColors();
        if(numColors == -1){
            System.out.println("No color table for num colors of "+numColors);
            return;
        }
        
        int sqr = (int)Math.sqrt(numColors);
        for(int i=0;i<numColors;i++)
        {
            // a color with hex C98023 is:
            // v[0] = 23
            // v[1] = 80
            // v[2] = C9
            // v[3] = FF
            byte r = contents[(ColorTable + i*4) + 2];
            byte g = contents[(ColorTable + i*4) + 1];
            byte b = contents[(ColorTable + i*4) + 0];
            byte a = contents[(ColorTable + i*4) + 3];
            
            System.out.print(String.format("%02X ", r)+String.format("%02X ", g)+String.format("%02X ", b)+String.format("%02X ", a)+"\t");
            if((i+1) % sqr == 0) System.out.println("");
        }
    }
    
    public void printPixelDataRow(int h)
    {
        int sqr = (int)Math.sqrt(_width);
        for(int i =0;i< _width;i++)
        {
            byte pix = getPixel8(i, h);
            System.out.print(String.format("%02X ", pix)+"\t");
            if((i+1) % sqr == 0) System.out.println("");
        }
    }
    
    @Override
    public String toString() {
        StringBuilder ret = new StringBuilder();
        
        /*
            //Header 14 bytes
    public static final int Signature = 0; //2 bytes 'BM'
    public static final int FileSize = 2;  //4 bytes 
    public static final int reserved = 6;  //4 bytes = 0
    public static final int DataOffset = 10; // 4 bytes ?
    
    // 14
    //InfoHeader  40 bytes
    public static final int Size = 14;      //4 bytes = 40
    public static final int Width = 18;     //4 bytes 
    public static final int Height = 22;    //4 bytes
    public static final int Planes = 26;    //2 bytes = 1
    public static final int BitCount = 28;  //2 bytes (1 -> 1 color, 4 -> 16 colors, 8 -> 256 colors, 16 -> 65536 colors, 24 -> 16M colors)
    public static final int Compression = 30; //4 bytes (0 -> no compression, 1 -> 8 bit rle, 2 -> 4 bit rle)
    public static final int Imagesize = 34; //4 bytes ( = 0 if compression = 0 )
    public static final int XpixelsPerM = 38; //4 bytes (pixels/meter)
    public static final int YpixelsPerM = 42; //4 bytes (pixels/meter)
    public static final int ColorsUsed = 46; //4 bytes 
    public static final int ColorsImportant = 50; //4 bytes (0 = all)
    
        */
        
        ret.append("Header:\n\t");
        int signature = getField(Signature);
        ret.append((char)(signature&0xFF));
        ret.append((char)((signature&0xFF00) >> 8));
        ret.append('\n');
        
        ret.append("\tFileSize:"+getField(FileSize)+"\n");
        ret.append("\treserved:"+getField(reserved)+"\n");
        ret.append("\tDataOffset:"+getField(DataOffset)+"\n");
        
        ret.append("InfoHeader:\n");
        ret.append("\tSize:"+getField(Size)+"\n");
        
        if(getField(Size) == 40)
        {
            ret.append("\tWidth:"+getField(Width)+"\n");
            ret.append("\tHeight:"+getField(Height)+"\n");
            ret.append("\tPlanes:"+getField(Planes)+"\n");
            ret.append("\tBitCount:"+getField(BitCount)+"\n");
            ret.append("\tCompression:"+getField(Compression)+"\n");
            ret.append("\tImagesize:"+getField(Imagesize)+"\n");
            ret.append("\tXpixelsPerM:"+getField(XpixelsPerM)+"\n");
            ret.append("\tYpixelsPerM:"+getField(YpixelsPerM)+"\n");
            ret.append("\tColorsUsed:"+getField(ColorsUsed)+"\n");
            ret.append("\tColorsImportant:"+getField(ColorsImportant)+"\n");
        }
        
        return ret.toString();
    }
    
    
    
}
