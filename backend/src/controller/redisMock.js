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

	async APPEND(key,value) {
		let v = this.keys[key];
		if(v === undefined)
			this.keys[key] = value;
		else
			this.keys[key] += value; // https://josephmate.github.io/java/javascript/stringbuilder/2020/07/27/javascript-does-not-need-stringbuilder.html
		return this.keys[key].length;
	}

	// Não está de acordo com os docs, tanto o start e o end são inclusivos no redis
	async GETRANGE(key,start,end) {
		let v = this.keys[key];
		if(v === undefined)
			return "";
		else {
			if(end == -1)
				return v.slice(start);
			else
				return v.slice(start,end); 
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