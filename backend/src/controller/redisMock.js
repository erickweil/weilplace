// Para testes e alternativa a utilizar o redis

class RedisMock {
	constructor(options) {
		this.keys = {};
	}

	async GET(key) {
		let v = this.keys[key];
		return v === undefined ? null : v;
	}

	async SET(key,value) {
		this.keys[key] = value;
		return true;
	}

	async APPEND(key,value) {
		let v = this.keys[key];
		if(v === undefined)
			this.keys[key] = value;
		else
			this.keys[key] += value; // https://josephmate.github.io/java/javascript/stringbuilder/2020/07/27/javascript-does-not-need-stringbuilder.html
		return true;
	}

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
}

export default RedisMock;