import { PublicKey } from "@solana/web3.js";

export type EndpointTypes = 'mainnet' | 'devnet' | 'localnet'
export function getMint(network) {
    switch (network) {
        case "mainnet":
        case "mainnet-beta":
            return "4HgYp2eiokKcqe5AVAxpwCsfUE5pwCNTiPXvpSxYnDi6";
        case "devnet":
            return "2LkCYPkW7zJu8w7Wa12ABgxcbzp8cH8siskPCjPLwV67";
    }
}
export class UBIInfo {

    data:Uint8Array;
    isTrusted:boolean;
    auth:PublicKey;
    lastIssuance:Date;
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

        this.isTrusted = this.getIsTrusted().valueOf()
        this.auth = new PublicKey(this.getAuth())
        this.lastIssuance = new Date(this.getLastIssuance().valueOf() * 1000)
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
        return this.data.at(this.data.length - 1) != 0
    }

    hasTruster(truster:Uint8Array) {
        let trusters = this.getTrusters()

        let arr = new Array<number>()
        for (let i = 0; i<32; i++) {
            arr.push(truster[i])
        }

        return arr.every(i=>trusters.includes(i).valueOf()).valueOf()
    }
}