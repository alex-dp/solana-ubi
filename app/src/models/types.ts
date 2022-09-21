export type EndpointTypes = 'mainnet' | 'devnet' | 'localnet'
export class UBIInfo {
    data:Uint8Array;
    constructor(data:Uint8Array) {
        this.data = data;
        console.log(this.data)
        while(this.data.at(this.data.length - 1) == 0){
            this.data = this.data.slice(0, this.data.length - 2)
        }
        
    }

    // authority: Pubkey,
    // last_issuance: i64,
    // last_trust_given: i64,
    // // [u8; 32] * 10 (constant, only fills up to TRUST_COEFF)
    // trusters: Vec<Pubkey>,
    // is_trusted: bool

    getData() {
        return this.data;
    }

    getAuth() {
        return this.data.slice(1,1+32);
    }

    getIsTrusted() {
        return new Boolean(this.data.at(this.data.length - 1))
    }
}