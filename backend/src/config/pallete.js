import config_pallete from "../../config/pallete.json" assert { type: 'json'};

const pallete = [];
for(let c of config_pallete.pallete) {
    pallete.push(parseInt(c,16));
}

export default pallete;