import { TrustUser } from "components/TrustUser";

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

        let old_data = this.data
        this.data = new Uint8Array(closest_length);
        this.data.set(old_data)
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
        return this.data.slice(8+32+8+8+4, 8+32+8+8+4 + this.getTrustersSize() * 32)
    }

    getIsTrusted() {
        return this.data.at(this.data.length - 1)
    }

    hasTruster(truster:Uint8Array) {
        let trusters = this.getTrusters()

        let arr = new Array<number>()
        for (let i = 0; i<32; i++) {
            arr.push(truster[i])
        }

        return arr.every(i=>trusters.includes(i).valueOf()).valueOf()
    }

    hasSubArray(master, sub) {
        return sub.every((i => v => i = master.indexOf(v, i) + 1)(0));
    }
}