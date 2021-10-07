# https://github.com/Azure/azure-functions-core-tools # this to install azure funcitons cli on mac
# https://docs.microsoft.com/en-us/azure/developer/python/tutorial-vs-code-serverless-python-01 # for use


##### IMPORTANT ### deployment

# next time i want to deploy this function, i remove the entire thing from this repo
# decouple repos, create new project vs and deploy always from there
# there should be complete decoupling of gits and projects!!!
# just create a new project of timer trigger and use this cron and __init__


import datetime
from dateutil.parser import parse
from azure.cosmos import exceptions, CosmosClient, PartitionKey
from azure.keyvault.secrets import SecretClient
from azure.identity import DefaultAzureCredential
from dateutil.relativedelta import *  # https://dateutil.readthedocs.org/en/latest/ - very cool for dates
import azure.functions as func
import logging


# CONSTANTS
KEY_VAULT_NAME = 'handleskv'
KV_URI = f"https://{KEY_VAULT_NAME}.vault.azure.net"
ENDPOINT = "https://handlesdb.documents.azure.com:443/"

# SECRETS
COSMOS_KEY_NAME = 'cosmoskey'
TOKEN_KEY_NAME = 'tokenkey'

SUBS_CONTAINER_NAME = 'subscriptions'
USERS_CONTAINER_NAME = 'users'
DATA_BASE_NAME = 'handles_db'
ID_LENGTH = 8
ADMIN = 'abcd'

# ALL ITEMS KEY NAMES
# USERS
ID = 'id'  # string
USERNAME = 'username'  # string
PASSWORD = 'password'  # string
SUBSCRIPTIONS = 'subscriptions'  # dict
PUBLIC_SUBSCRIPTIONS = 'publicSubscriptions'  # todo: maybe eliminate subscriptions now that i added this is enough?
CUSTOM_SUBSCRIPTIONS = 'customSubscriptions'
PAYMENT_HISTORY = 'payment_history'  # dict
EMAIL = 'email'
BIRTHDAY = 'birthday'
CITY = 'city'
PROFILE_IMAGE = 'profile_image'
VISA_TOKEN = 'visa_token'

# SUBSCRIPTIONS
NAME = 'name'  # string
SUB_PRICE = 'formattedPrice'  # float
VALUE = 'value'
CURRENCY = 'currency'
CATEGORIES = 'categories'  # list of strings
ICON = 'icon'  # url string
SIGN_UP_URL = 'signUpUrl'  # url string
BILLING_DATE = 'billingDate'  # string of format 'D-TIMEZONE'
BILLING_FREQ = 'billingFreq'
SUB_PASSWORD = 'subPassword'
SUB_USERNAME = 'subUsername'
SCRIPT = 'jsScript'
STATUS = 'status'


def billing_date_to_datetime(bill_date):
    return parse(bill_date)  # can withstand many formats


def date_time_to_bill_date(date_time):
    return date_time.strftime("%Y-%m-%d")


def init_containers():
    credential = DefaultAzureCredential()
    kv_client = SecretClient(vault_url=KV_URI, credential=credential)
    cosmos_key = kv_client.get_secret(COSMOS_KEY_NAME).value
    client = CosmosClient(ENDPOINT, cosmos_key)
    database = client.create_database_if_not_exists(id=DATA_BASE_NAME)
    subs_cont = database.get_container_client(SUBS_CONTAINER_NAME)
    user_cont = database.get_container_client(USERS_CONTAINER_NAME)

    return user_cont, subs_cont


def get_relevent_values_for_public_sub(cur_sub_fields_dict, subs_cont, cur_sub_id):
    cur_sub_from_sub_cont = subs_cont.read_item(cur_sub_id, cur_sub_id)  # get json of this cont
    cur_name = cur_sub_from_sub_cont[NAME]
    cur_sub_price = cur_sub_from_sub_cont[SUB_PRICE]
    bill_freq = cur_sub_from_sub_cont[BILLING_FREQ]

    if NAME in cur_sub_fields_dict:
        cur_name = cur_sub_fields_dict[NAME]
    if SUB_PRICE in cur_sub_fields_dict:
        cur_sub_price = cur_sub_fields_dict[SUB_PRICE]
    if BILLING_FREQ in cur_sub_fields_dict:
        bill_freq = cur_sub_fields_dict[BILLING_FREQ]

    bill_date = cur_sub_fields_dict[BILLING_DATE]  # must only be taken
    return cur_name, cur_sub_price, bill_date, bill_freq


def get_next_bill_date(bill_date_string, freq):
    _days, _months, _years = list(map(int, freq.split('-')))
    bill_datetime = billing_date_to_datetime(bill_date_string)
    next_bill_datetime = relativedelta(days=_days, months=_months, years=+_years) + bill_datetime
    return date_time_to_bill_date(next_bill_datetime)


def is_today(bill_date, cur_date):
    return billing_date_to_datetime(bill_date).date() == cur_date.date()


def make_changes_to_user_json(cur_sub_fields_dict, bill_date, bill_freq, status, month_name, cur_sub_id, cur_name,
                              cur_sub_price, user_json, user_cont):
    # update next billing date by frequency if billing date is customly changed
    if BILLING_DATE in cur_sub_fields_dict:  # otherwise it will be updated in the public table
        cur_sub_fields_dict[BILLING_DATE] = get_next_bill_date(bill_date, bill_freq)
    if status:  # so add bill to history
        if month_name in user_json[PAYMENT_HISTORY]:
            # now check if subname id is already there to not override it
            if cur_sub_id in user_json[PAYMENT_HISTORY][month_name]:
                if cur_sub_price[CURRENCY] != user_json[PAYMENT_HISTORY][month_name][cur_sub_id][CURRENCY]:
                    # this is an edge case where within the same month a user changes curency for a specifc
                    # subscription that is being billed twice in same month with different currencies
                    logging.error('user: ' + user_json[
                        ID] + 'had values summed for different currnecies')  # todo - test that i get an error
                user_json[PAYMENT_HISTORY][month_name][cur_sub_id][VALUE] += cur_sub_price[VALUE]

            else:
                user_json[PAYMENT_HISTORY][month_name][cur_sub_id] = {"name": cur_name, **cur_sub_price}
        else:
            user_json[PAYMENT_HISTORY][month_name] = {cur_sub_id: {"name": cur_name, **cur_sub_price}}
        user_cont.replace_item(user_json[ID], user_json)


def set_user_json(user_json, subscriptions_type, subs_cont, user_cont, cur_date):
    """

    :param user_json:
    :param subscriptions_type: custom or public
    :param subs_cont:
    :param cur_date:
    :return:
    """
    cur_sub_dict = user_json[subscriptions_type]
    for cur_sub_id in cur_sub_dict:  # public_sub is id of subscription
        cur_sub_fields_dict = cur_sub_dict[cur_sub_id]

        # first get missing data for public sub such as price and billing date if its not in
        if (subscriptions_type == PUBLIC_SUBSCRIPTIONS) and (
                SUB_PRICE not in cur_sub_fields_dict or BILLING_DATE not in cur_sub_fields_dict or NAME not in cur_sub_fields_dict):
            cur_name, cur_sub_price, bill_date, bill_freq = get_relevent_values_for_public_sub(cur_sub_fields_dict,
                                                                                               subs_cont, cur_sub_id)

        else:  # so its custom
            cur_name = cur_sub_fields_dict[NAME]
            cur_sub_price = cur_sub_fields_dict[SUB_PRICE]
            bill_date = cur_sub_fields_dict[BILLING_DATE]
            bill_freq = cur_sub_fields_dict[BILLING_FREQ]

        # either way get status
        status = cur_sub_fields_dict[STATUS]

        month_label = cur_date.strftime("%b") + ' \'' + cur_date.strftime("%Y")[2:]

        if is_today(bill_date, cur_date):
            make_changes_to_user_json(cur_sub_fields_dict, bill_date, bill_freq, status, month_label,
                                      cur_sub_id, cur_name, cur_sub_price, user_json, user_cont)


def update_history_and_next_bill_date_all_users(user_cont, subs_cont, cur_date):
    """
    important: when scaling thing function design, if to pull all users? if for each user to pull subs? use cache!!
    or keep in dict all subscriptions we fetched? --> this i can even do now
    :param user_cont:
    :param subs_cont:
    :param cur_date:
    :return:
    """
    for user_json in user_cont.read_all_items():  # for each user
        set_user_json(user_json, PUBLIC_SUBSCRIPTIONS, subs_cont, user_cont, cur_date)
        set_user_json(user_json, CUSTOM_SUBSCRIPTIONS, subs_cont, user_cont, cur_date)


def update_subs_container_billing_date(_subs_cont, cur_date):
    for sub_json in _subs_cont.read_all_items():
        if is_today(sub_json[BILLING_DATE], cur_date):
            # so update this subs date
            sub_json[BILLING_DATE] = get_next_bill_date(sub_json[BILLING_DATE], sub_json[BILLING_FREQ])
            _subs_cont.replace_item(sub_json[ID], sub_json)


def main(mytimer: func.TimerRequest) -> None:

    if mytimer.past_due:
        logging.info('The timer is past due!')
    print('running...')

    utc_timestamp = datetime.datetime.utcnow()

    ts = utc_timestamp.replace(tzinfo=datetime.timezone.utc)  # need time zone for format

    logging.info('Python timer trigger function ran at %s', ts.isoformat())
    # todo -- how should public subscriptions be updated?
    # it depends probably on usage statistics but can be need a table where ids are date stamps
    # when a user adds a bill date it gets written to the corresponding item which is just a list of all
    # the users that need to be updated, then this function can every day read the matching item from the
    # table and update only the users that need to be billed that day and not iterate over everyone and everysubscription
    # every day -- todo when scaling. for now we will update all the subscriptions also every hour

    _user_cont, _subs_cont = init_containers()
    update_subs_container_billing_date(_subs_cont, utc_timestamp)
    update_history_and_next_bill_date_all_users(_user_cont, _subs_cont, cur_date=ts)

