from passlib.apps import custom_app_context as pwd_context
import random
import string
import time
import requests
import datetime


# References:
# very good article about the entire server and using g-unicorn  # GO OVER THIS AGAIN TO TWEAK PERFORMANCE : ->
# : -> https://datasciencelab.nl/2019/06/11/deploying-a-python-app-on-azure/
# about serialization method: https://itsdangerous.palletsprojects.com/en/1.1.x/jws/
# important for db architecture https://docs.microsoft.com/en-us/azure/cosmos-db/sql-api-query-metrics
# important info about flasks g https://stackoverflow.com/questions/30514749/what-is-the-g-object-in-this-flask-code#:
# ~:text=g%20is%20an%20object%20provided,the%20route%20and%20other%20functions.

# remember! all this is only worth something if communication is done via Https. otherwise the clients
# username, password, token are all visible

# todo: cache users so i can first look in cache before i query? ( need to know to update them in both DB and cache)
#  so use redis cache should do it
"""
Architecture:
partition key for user: id
partition key for subscriptions: id

enable cross partition - SHOULD NOT BE NEEDED MOST OF THE TIME

"""

# CONSTANTS
KEY_VAULT_NAME = 'handleskv'
KV_URI = f"https://{KEY_VAULT_NAME}.vault.azure.net"
ENDPOINT = "https://handlesdb.documents.azure.com:443/"

# SECRETS
COSMOS_KEY_NAME = 'cosmoskey'
TOKEN_KEY_NAME = 'tokenkey'
EXCHANGE_API_KEY = '3116387e4ad24bf98fd16005c1f61e70'  # todo put in kv
SERVER_INSIGHTS_KEY_NAME = 'server-insights-secret'

# todo : make sure this only runs once a day, maybe out in in our azure function add write to blob so we can access?
currency_json = {'date': '2020-10-27 00:04:00+00', 'base': 'USD', 'rates': {'ILS': '3.37475', 'EUR': '0.843642', 'USD': '1'}}
# to get only specific currencies: 'https://api.currencyfreaks.com/latest?apikey=YOUR_APIKEY&symbols=PKR,GBP,EUR,USD'
BASE_CURRENCY = 'USD'# base in free is always USD
SUPPORTED_CURRENCIES = {'EUR', 'USD', 'ILS'}

SUBS_CONTAINER_NAME = 'subscriptions'
USERS_CONTAINER_NAME = 'users'
DATA_BASE_NAME = 'handles_db'
ID_LENGTH = 8
ADMIN = 'abcd'


# sign in with google id's
GOOGLE_CLIENT_ID = {'ios': '14356285062-fkusf2ofd2gv2mkbbot2rtf7ic4ccq2q.apps.googleusercontent.com',
                    'android': '14356285062-p8l4gfn3plhhmil2na3nql2a4i76ujkk.apps.googleusercontent.com',
                    'web': '14356285062-p8l4gfn3plhhmil2na3nql2a4i76ujkk.apps.googleusercontent.com'}

# ALL ITEMS KEY NAMES
# USERS
ID = 'id'  # string
USERNAME = 'username'  # string
PASSWORD = 'password'  # string
SUBSCRIPTIONS = 'subscriptions'  # dict
PUBLIC_SUBSCRIPTIONS = 'publicSubscriptions'  # todo: maybe eliminate subscriptions now that i added this is enough?
CUSTOM_SUBSCRIPTIONS = 'customSubscriptions'
PAYMENT_HISTORY = 'payment_history'  # dict
MONTH = 'month'
YEAR = 'year'
EMAIL = 'email'
BIRTHDAY = 'birthday'
FIRST_NAME = 'firstName'
LAST_NAME = 'lastName'
PHONE_NUMBER = 'phoneNumber'
LOCALE = 'locale'

ADDRESS = 'address'  # dict {'country', 'city', 'street', 'number', 'isEdited': boolean}
COUNTRY = 'country'
CITY = 'city'
STREET = 'street'
NUMBER = 'number'
EDITED_ADDRESS = 'isEdited' # boolean

PROFILE_IMAGE = 'profile_image'
VISA_TOKEN = 'visaToken'


# SUBSCRIPTIONS
NAME = 'name'  # string

SUB_PRICE = 'formattedPrice' # dict of:
VALUE = 'value'
CURRENCY = 'currency'

CATEGORIES = 'categories' # list of strings
ICON = 'icon'  # url string
SIGN_UP_URL = 'signUpUrl'  # url string
BILLING_DATE = 'billingDate'  # string, this is format:
# our_date_format_example = "Fri Oct 30 2020 12:00:00"
# convert_to_python_date = datetime.datetime.strptime(our_date_format_example, "%a %b %d %Y %H:%M:%S")
DATE_STRING_DEFAULT_FORMAT = "%Y-%m-%d"  # no timezone! timezone should be converted to UTC when stored in
# db, it is only used by server not client! so if all are converted to UTC upon input we can forget about it
BILLING_FREQ = 'billingFreq'   # for now this is format: "dd-mm-yy" examples: "3-0-0" every third day "0-0-0" - never
SUB_PASSWORD = 'subPassword'
SUB_USERNAME = 'subUsername'
SCRIPT = 'jsScript'
STATUS = 'status'
LEGAL_USER_UPDATE_FIELDS = {NAME, SUB_PRICE, CATEGORIES, ICON, SIGN_UP_URL, BILLING_DATE, SUB_PASSWORD, SUB_USERNAME,
                            STATUS, PROFILE_IMAGE, EMAIL, BIRTHDAY, BILLING_FREQ}


def time_function(f):
    def wrapper(*args, **kwargs):
        start = time.time()
        res = f(*args, **kwargs)
        end = time.time()
        print("function runtime is: ", end-start)
        return res
    return wrapper


def make_tuple_sql_ready(tup):
    if len(tup) == 1:
        tup = '(\'{0}\')'.format(tup[0])  # format makes it int so wrap with ''
    return tup


def hash_password(password):
    """
    The custom_app_context object is an easy to use option based on the sha256_crypt hashing algorithm.
    it is important to notice: hashing is different than encrypting. if we hash a password, we can *verify* it if we are
    given it, but we cannot restore the password by only knowing the algorithm and the hash.
    bottom line it seems more convenient but also less safe because any collision will let us in
    :param password: password to encrypt
    :return: encrypted password
    """
    password_hash = pwd_context.hash(password)
    return password_hash


def verify_password(password, password_hash):
    """
    :param password: password to verify
    :param password_hash: the encrypted password to verify password with
    :return: True iff pwd_context.encrypt(password) == password_hash
    """
    return pwd_context.verify(password, password_hash)


def generate_new_cont_id(cont):
    """
    generate random id that doesnt exist for given container
    :return:
    """
    ret = True
    cur_id = ''
    while ret:
        cur_id = ''.join(random.choices(string.ascii_uppercase + string.digits + string.ascii_lowercase, k=ID_LENGTH))
        ret = get_json_by_id(cont, cur_id)
    return cur_id


# this function is deprecated - should not be used
def add_id_to_items(subs_cont, no_id_items_list):
    all_item_names_tuple = tuple(x[NAME] for x in no_id_items_list)
    all_item_names_tuple = make_tuple_sql_ready(all_item_names_tuple)
    query_subscription = """
                    SELECT sub.name,
                        sub.id
                    FROM sub
                    WHERE sub.name IN {0}
                    """.format(all_item_names_tuple)

    subs_list = list(subs_cont.query_items(query_subscription, enable_cross_partition_query=True))
    for item in subs_list:
        # find corresponding item in no id item list:  todo- make this more efficient and smarter aggregating and stuff
        for no_id_item in no_id_items_list:
            if no_id_item[NAME] == item[NAME]:
                no_id_item[ID] = item[ID]

    return no_id_items_list


def create_query(fields):
    if len(fields) == 0:
        return 'SELECT * FROM item'
    query = 'SELECT'
    for field_name in fields:
        query += ' item.' + field_name + ','
    return query[:len(query)-1] + ' FROM item'


def get_json_by_id(cont, _id, selected_fields=()):
    """
    :param selected_fields: optional param, tuple of strings being the fields to fetch, default is *
    :param cont: container from cosmos db
    :param _id: id of item to find
    :return: the json item that repr that item
    """
    ret = list(cont.query_items(create_query(selected_fields), partition_key=_id))
    if len(ret) == 0:
        return None
    return ret[0]  # assuming ids are unique


def get_user_json_by_username(user_cont, cur_username):
    """
    :param user_cont: container for users from cosmos db
    :param cur_username: id of user to find
    :return: the password of the first user that matches this username
    """
    query_users = """
                    SELECT *
                    FROM user   
                    WHERE user.username = '{0}'
                    """.format(cur_username)
    ret = list(user_cont.query_items(query_users, enable_cross_partition_query=True))
    if len(ret) == 0:
        return None
    if len(ret) > 1:
        raise NameError('Too many users with this username')
    return ret[0]


def get_subscriptions_from_sub_container(subs_cont, home_subscription_ids, home_page):
    if len(home_subscription_ids) == 0:
        home_subscription_ids = '(\'{0}\')'.format(None)  # so that query wont have empty brackets like: 'NOT IN ()'
    if len(home_subscription_ids) == 1:
        home_subscription_ids = '(\'{0}\')'.format(home_subscription_ids[0])  # format makes it int so wrap with ''

    op_not_string = 'NOT '
    if home_page:
        op_not_string = ''
    query_subscription = """
            SELECT *
            FROM sub
            WHERE sub.id {0}IN {1}
            """.format(op_not_string, home_subscription_ids)

            # todo(important): for now sends everything, later on make sure to only send what we need

    cur_list = list(
        subs_cont.query_items(query_subscription, enable_cross_partition_query=True))  # one day: speed up by
    # going straight for id?
    return cur_list


def real_time_currency_exchange_rate(api_key, tc):
    # todo handles errors, # add
    symbols = ','.join(SUPPORTED_CURRENCIES)
    main_url = 'https://api.currencyfreaks.com/latest?apikey=' + api_key + '&symbols=' + symbols
    global currency_json
    # get currency every day
    utc_timestamp = datetime.datetime.utcnow()
    cur_date = utc_timestamp.strftime("%d")
    if len(currency_json) == 0 or currency_json['date'].split(' ')[0].split('-')[2] != cur_date:
        # if it is not defined or out of date
        req_ob = requests.get(main_url)
        currency_json = req_ob.json()
        tc.track_event('Pulled Currency Json', currency_json)
        tc.flush()
    return currency_json


def get_all_currency_values(val, in_currency, tc):
    """
    gets currency and value
    :param tc tracer
    :param val: float
    :param in_currency:
    :return: tuple, value in all 3 major currencies
    """
    currency_dict = real_time_currency_exchange_rate(EXCHANGE_API_KEY, tc)
    rates_dict = {k: float(currency_dict['rates'][k]) for k in currency_dict['rates']}
    return {cur_a: val * (1 / rates_dict[in_currency]) * rates_dict[BASE_CURRENCY] * rates_dict[cur_a]
            for cur_a in rates_dict}


def get_cur_table_for_client(tc):
    return {curr: get_all_currency_values(1, curr, tc) for curr in SUPPORTED_CURRENCIES}


def sort_dates(date_string):
    if date_string[-4:-2] != '20':
        date_string = date_string[:-2] + '20' + date_string[-2:]
    new_date = datetime.datetime.strptime(date_string, "%b \'%Y")
    return new_date


def create_on_boarding():
    """
    "id": "PEG61z3I",
            "name": "Gym",
            "billingDate": "Tue Nov 17 2020 12:00:00 GMT+0200",
            "billingFreq": "0-1-0",
            "formattedPrice": {
                "value": 0,
                "currency": "ILS"
            },
            "icon": "https://icons.iconarchive.com/icons/sonya/swarm/256/gym-icon.png",
            "categories": [
                "Gym"
            ],
            "status": false
    :return:
    """
    return {'EXAMPLE1': {ID: 'EXAMPLE1', NAME: 'Example Subscription', BILLING_DATE: "Tue Nov 17 2020 12:00:00 GMT+0200",
                         USERNAME: 'SampleUsername', BILLING_FREQ: "0-0-1", SUB_PRICE: {"value": 10, "currency": "USD"},
                         ICON: 'https://handles.azurewebsites.net/static/img/logo.png',
                         CATEGORIES: ['Sample1'], STATUS: False}
            }


def create_new_user(tc, user_cont, email, hashed_password_or_provider, first_name='', last_name='', profile_pic='',
                    locale=''):
    # create user
    custom_subs = create_on_boarding()
    if not first_name:
        first_name = email.split('@')[0]
    cur_id = generate_new_cont_id(user_cont)
    cur_user = {ID: cur_id, USERNAME: email, PASSWORD: hashed_password_or_provider, SUBSCRIPTIONS: {},
                PAYMENT_HISTORY: {}, PUBLIC_SUBSCRIPTIONS: {}, CUSTOM_SUBSCRIPTIONS: custom_subs, EMAIL: email,
                BIRTHDAY: '', ADDRESS: {}, PROFILE_IMAGE: profile_pic, VISA_TOKEN: '', FIRST_NAME: first_name,
                LAST_NAME: last_name, LOCALE: locale}
    resp = user_cont.upsert_item(cur_user)
    tc.track_event('new_user', {'user_id': cur_id, USERNAME: email})
    tc.flush()
    return resp
