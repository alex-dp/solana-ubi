from solana.keypair import Keypair
from solana.publickey import PublicKey
from solana.transaction import AccountMeta
from solana.rpc.api import Client
from solana.transaction import Transaction, TransactionInstruction
from spl.token.constants import TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID
from solana.system_program import SYS_PROGRAM_ID
from solana.sysvar import SYSVAR_RENT_PUBKEY

client = Client("http://localhost:8899")

sender = Keypair.from_seed(bytes(PublicKey(1)))

print(sender.public_key)

txn = Transaction().add(
	TransactionInstruction([
		# accounts
		# mint
		AccountMeta(PublicKey("F6uEadxH923XCSX9q3zMTLBtofmUDCmoez6Bq9DrnuFj"), False, True),
		# payer
		AccountMeta(sender.public_key, True, True),
		# token acc
		AccountMeta(PublicKey("DvKqa8hcR6HgSG6cZnmgm5FeksemJ6kmFGoPWouNsdro"), False, True),
		# system
		AccountMeta(SYS_PROGRAM_ID, False, False),
		# token
		AccountMeta(TOKEN_PROGRAM_ID, False, False),
		# ass tok prog
		AccountMeta(ASSOCIATED_TOKEN_PROGRAM_ID, False, False),
		# rent
		AccountMeta(SYSVAR_RENT_PUBKEY, False, False),
		],
	# program address
	PublicKey("EcFTDXxknt3vRBi1pVZYN7SjZLcbHjJRAmCmjZ7Js3fd"),
	# data
	# instruction offset
	bytes(b"\xac\x89\xb7\x0e\xcfn\xea8")
	)
)

txn.fee_payer = sender.public_key

 
client.send_transaction(txn, sender)
