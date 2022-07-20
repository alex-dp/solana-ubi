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
		# accounts
		# mint
		AccountMeta(PublicKey("HKTPz1skkSNAC8TXJiYvPyYtMCQDHtAheCL4FrBArCDJ"), False, True),
		# token prog
		AccountMeta(TOKEN_PROGRAM_ID, False, False),
		# token acc
		AccountMeta(PublicKey("GHQMHrt4j8i6bBaVhpMCLP8uoFfWUrLZsQtWCWqSJKA6"), False, True),
		# signer
		AccountMeta(sender.public_key, True, False)
		],
	# program address
    PublicKey("EcFTDXxknt3vRBi1pVZYN7SjZLcbHjJRAmCmjZ7Js3fd"),
    # data
    bytes(b"\xac\x89\xb7\x0e\xcfn\xea8")
    )
)

txn.fee_payer = sender.public_key

 
client.send_transaction(txn, sender)