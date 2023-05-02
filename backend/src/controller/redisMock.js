// Para testes e alternativa a utilizar o redis
// Apenas utilizado pelo PixelChanges quando é iniciado sem passar um cliente
class RedisMock {
	constructor(options) {
		this.keys = {};
	}

	async GET(key) {
		let v = this.keys[key];
		return v === undefined ? null : v;
	}

	async SET(key,value) {
		let v = this.keys[key];
		this.keys[key] = value;
		return v === undefined ? null : v;
	}

	async MGET(arrkeys) {
		let ret = [];
		for(let i =0;i<arrkeys.length;i++) {
			const value = await this.GET(arrkeys[i]);
			ret.push(value);
		}
		return ret;
	}

	async MSET(arrkeyvalues) {
		for(let i =0;i<arrkeyvalues.length/2;i++) {
			const key = arrkeyvalues[i*2+0];
			const value = arrkeyvalues[i*2+1];

			await this.SET(key,value);
		}
		return "OK";
	}

	async APPEND(key,value) {
		let v = this.keys[key];
		if(v === undefined)
			this.keys[key] = value;
		else
			this.keys[key] += value; // https://josephmate.github.io/java/javascript/stringbuilder/2020/07/27/javascript-does-not-need-stringbuilder.html
		return this.keys[key].length;
	}

	// tanto o start e o end são inclusivos no redis
	// a saída é limitada ao tamanho da string
	async GETRANGE(key,start,end) {
		let v = this.keys[key];
		if(v === undefined)
			return "";
		else {
			let len = v.length;
			let strstart = start < 0 ? Math.max(start + len,0) : Math.min(Math.max(start,0),len);
			let strend = end < 0 ? Math.max(end + len,0) : Math.min(Math.max(end,0),len);
			
			// +1 no end pq o slice do js o fim não é inclusivo
			return v.slice(strstart,strend+1); 
		}
	}

	async resetchanges(key_changes,key_identifier,key_savedindex,trimindex,newidentifier,newsavedindex) {
		let changes = await this.GETRANGE(key_changes,trimindex,-1);
		await this.SET(key_changes,changes);
		await this.SET(key_identifier,newidentifier);
		await this.SET(key_savedindex,newsavedindex);

		return "OK";
	}
}

export default RedisMock;