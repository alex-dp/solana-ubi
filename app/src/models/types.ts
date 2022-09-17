export type EndpointTypes = 'mainnet' | 'devnet' | 'localnet'
export class UBIInfo {
    data:number[];
    constructor(data) {
        this.data = data;
    }

    // authority: Pubkey,
    // last_issuance: i64,
    // last_trust_given: i64,
    // // [u8; 32] * 10 (constant, only fills up to TRUST_COEFF)
    // trusters: Vec<Pubkey>,
    // is_trusted: bool

    getAuth() {
        return this.data.slice(1,1+32);
    }
}