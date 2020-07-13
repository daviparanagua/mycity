module.exports = class{
    constructor(status, message, details = {}){
        this.status = status;
        this.message = message;
        this.details = details;
        this.isException = true;
    }

    toString(){
        return `${this.status}: ${this.message}`
    }
}