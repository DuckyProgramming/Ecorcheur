const fs=require('fs')
const getPixels=require("get-pixels")
const path=require("path")

function loadImagePixels(imagePath) {
    return new Promise((resolve, reject) => {
        // Ensure the path is absolute
        const absPath = path.resolve(imagePath);

        getPixels(absPath, (err, pixels) => {
            if (err) {
                return reject(new Error(`Failed to load image: ${err.message}`));
            }

            // pixels.shape = [width, height, channels]
            console.log(`Image loaded: ${pixels.shape[0]}x${pixels.shape[1]}, Channels: ${pixels.shape[2]}`);

            // Convert ndarray to a plain array if needed
            const pixelArray = [];
            for (let y = 0; y < pixels.shape[1]; y++) {
                for (let x = 0; x < pixels.shape[0]; x++) {
                    const r = pixels.get(x, y, 0);
                    const g = pixels.get(x, y, 1);
                    const b = pixels.get(x, y, 2);
                    const a = pixels.shape[2] === 4 ? pixels.get(x, y, 3) : 255;
                    pixelArray.push({ x, y, r, g, b, a });
                }
            }

            resolve(pixelArray);
        });
    });
}

async function main(){
    const pixels=await loadImagePixels(`../map/water.png`)
    const bits=[]
    for(let a=0,la=pixels.length;a<la;a++){
        //if(pixels[a].x%2==0&&pixels[a].y%2==0){
        bits.push(pixels[a].r>0?1:0)
        //}
    }
    while(bits.length%8!=0){
        bits.push(0)
    }

    const byteArray=[]
    for(let a=0,la=bits.length;a<la;a+=8){
        let byte=0;
        for(let b=0,lb=8;b<lb;b++){
            byte=(byte<<1)|bits[a+b];
        }
        byteArray.push(byte);
    }

    const buffer=Buffer.from(byteArray);
    fs.writeFileSync(`water.bin`,buffer);
    console.log(`Wrote ${byteArray.length} bytes to water.bin`);
}

main()