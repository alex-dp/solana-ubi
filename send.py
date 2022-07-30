from solana.keypair import Keypair
from solana.publickey import PublicKey
from solana.transaction import AccountMeta
from solana.rpc.api import Client
from solana.transaction import Transaction, TransactionInstruction
from spl.token.constants import TOKEN_PROGRAM_ID

client = Client("http://localhost:8899")

sender = Keypair.from_seed(bytes(PublicKey(1)))

print(sender.public_key)

txn = Transaction().add(
	TransactionInstruction([
		# pda
		AccountMeta(PublicKey("Bd4vag5JXn2RrGFw8VySP93QYouw5J8D3f1KCy3iUXRN"), False, False),
		# mint
		AccountMeta(PublicKey("4jzEiVCdX5DbcadqChrrvWaYJT7YHGy3cnH4peN3fc54"), False, True),
		# user
		AccountMeta(sender.public_key, True, False),
		# token acc
		AccountMeta(PublicKey("HfNY5k4T4xQVeYASUvDZE12MRyCj4hqGNJ6yuZGPshAx"), False, True),
		# token prog
		AccountMeta(TOKEN_PROGRAM_ID, False, False),
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
