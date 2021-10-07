import os
import cmd
# from azure.keyvault.secrets import SecretClient
# from azure.identity import DefaultAzureCredential
#
#
#
# KVUri = f"https://{KEY_VAULT_NAME}.vault.azure.net"
#
# credential = DefaultAzureCredential()
# client = SecretClient(vault_url=KVUri, credential=credential)
#
# #client.set_secret('testsecret', '12345')
# print(client.get_secret('testsecret').value)

import string
import random
print(''.join(random.choices(string.ascii_uppercase + string.digits + string.ascii_lowercase + '_?!@#$%*&^()', k=100)))