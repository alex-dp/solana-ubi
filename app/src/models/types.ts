export type EndpointTypes = 'mainnet' | 'devnet' | 'localnet'
export class UBIInfo {

    data:Uint8Array;
    constructor(data:Uint8Array) {
        let validDataLengths = [61, 93, 125, 157, 189, 221, 253, 185, 317, 349, 381]
        
        this.data = data;
        
        while(this.data.at(this.data.length - 1) == 0){
            this.data = this.data.slice(0, this.data.length - 2)
        }

        validDataLengths = validDataLengths.filter((x) => {return x>=this.data.length})

        let closest_length = validDataLengths[0]

        var zero = new Uint8Array([0]);

        while(this.data.length < closest_length) {
            let old_data = this.data
            this.data = new Uint8Array(old_data.length + 1);
            this.data.set(old_data)
            this.data.set(zero, old_data.length)
        }
    }

    // authority: Pubkey,
    // last_issuance: i64,
    // last_trust_given: i64,
    // vvvvvvvv  [u8; 32] * n (variable, only fills up to TRUST_COEFF, has 4-byte size info at start)
    // trusters: Vec<Pubkey>,
    // is_trusted: bool

    getData() {
        return this.data;
    }

    getAuth() {
        return this.data.slice(8,8+32);
    }

    getLastIssuance() {
        return Number(Buffer.from(this.data).readBigInt64LE(8+32))
    }

    getLastTrustGiven() {
        return Number(Buffer.from(this.data).readBigInt64LE(8+32+8))
    }

    getTrustersSize() {
        return Number(Buffer.from(this.data).readInt32LE(8+32+8+8))
    }

    getTrusters() {
        return new Uint8Array(this.data.slice(8+32+8+8+4, 8+32+8+8+4 + this.getTrustersSize() * 32))
    }

    getIsTrusted() {
        return new Boolean(this.data.at(this.data.length - 1))
    }
}