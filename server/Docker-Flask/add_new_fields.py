from azure.cosmos import exceptions, CosmosClient, PartitionKey
from utils import *
from scripts import *
from azure.keyvault.secrets import SecretClient
from azure.identity import DefaultAzureCredential

credential = DefaultAzureCredential()
kv_client = SecretClient(vault_url=KV_URI, credential=credential)
cosmos_key = kv_client.get_secret(COSMOS_KEY_NAME).value
# for guy -> debug
# cosmos_key = 'Y4iT4xA3DHeDjSlJK6OGUnPVw61AGueMuCsgJGuQ9wfcNHWArTaeUAYJiSipZ3bpdwwv9iQm0ms9X7XVpEm2Ug=='
client = CosmosClient(ENDPOINT, cosmos_key)
database = client.create_database_if_not_exists(id=DATA_BASE_NAME)
user_cont = database.get_container_client(USERS_CONTAINER_NAME)
sub_cont = database.get_container_client(SUBS_CONTAINER_NAME)


# add new entries fields to item in user container
def add_fields_to_user_cont():
    # go over all users
    for user_json in user_cont.read_all_items():
        # add new entries
        if 'email' not in user_json:
            user_json['email'] = ''
        if 'birthday' not in user_json:
            user_json['birthday'] = ''
        if 'visa_token' not in user_json:
            user_json['visa_token'] = ''
        if PUBLIC_SUBSCRIPTIONS not in user_json:
            user_json[PUBLIC_SUBSCRIPTIONS] = {}
        if CITY not in user_json:
            user_json['city'] = ''
        if PROFILE_IMAGE not in user_json:
            user_json[PROFILE_IMAGE] = ''
        user_cont.replace_item(user_json[ID], user_json)


def add_script_to_a_subscriptions(sub_id, cur_script):
    sub_json = get_json_by_id(sub_cont, sub_id)
    sub_json[SCRIPT] = cur_script
    return sub_cont.replace_item(sub_id, sub_json)


if __name__ == '__main__':
    print('Running Main')
    # print(add_script_to_a_subscriptions('9', GLOBUS_SCRIPT))
    # add_fields_to_user_cont()



