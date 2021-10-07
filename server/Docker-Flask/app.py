from utils import *
import json
from flask import Flask, request, g, jsonify, send_from_directory, render_template
from azure.cosmos import exceptions, CosmosClient, PartitionKey
from azure.keyvault.secrets import SecretClient
from azure.identity import DefaultAzureCredential
from flask_httpauth import HTTPBasicAuth
from itsdangerous import (TimedJSONWebSignatureSerializer as Serializer, BadSignature, SignatureExpired)
from applicationinsights import TelemetryClient
from applicationinsights.flask.ext import AppInsights
# using SendGrid's Python Library
# https://github.com/sendgrid/sendgrid-python
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from dateutil.parser import parse
from google.oauth2 import id_token
from google.auth.transport import requests  # todo - do i need to install these?
import braintree  # https://developers.braintreepayments.com/start/hello-server/python

# took this keys from sandbox!!
# when going live i need a real busness account and connect it to paypal and get keys from there

gateway = braintree.BraintreeGateway(
    braintree.Configuration(
        braintree.Environment.Sandbox,
        merchant_id="wsd3wqds4q7skx63",
        public_key="q7hqytmphx6pgvww",
        private_key="bb6aa8ccac55f1c089ce0f515d15e472"
    )
)

# # push notifications?
# from webpush_handler import trigger_push_notifications_for_subscriptions
# app = Flask(__name__, instance_relative_config=True)

# https://github.com/microsoft/ApplicationInsights-Python -> more in here for adding contexts and more

app = Flask(__name__)
# # do i need this for something??
# CORS(app, supports_credentials=True)
auth = HTTPBasicAuth()
#app.config['TEMPLATES_AUTO_RELOAD'] = True # should disable the cache if template changed todo works?

# get secrets from key vault
credential = DefaultAzureCredential()
kv_client = SecretClient(vault_url=KV_URI, credential=credential)
cosmos_key = kv_client.get_secret(COSMOS_KEY_NAME).value
app.config[TOKEN_KEY_NAME] = kv_client.get_secret(TOKEN_KEY_NAME).value

# application insights
tc_key = kv_client.get_secret(SERVER_INSIGHTS_KEY_NAME).value
app.config['APPINSIGHTS_INSTRUMENTATIONKEY'] = tc_key
appinsights = AppInsights(app)  # log requests, traces and exceptions to the Application Insights service
tc = TelemetryClient(tc_key)  # added ability to also be able to log events and metrics to app insights

# for guy -> debug
# tc_key = '7d30e5cc-6473-4c8c-9f8b-a317caae58ab'
# cosmos_key = 'Y4iT4xA3DHeDjSlJK6OGUnPVw61AGueMuCsgJGuQ9wfcNHWArTaeUAYJiSipZ3bpdwwv9iQm0ms9X7XVpEm2Ug=='
# app.config[TOKEN_KEY_NAME] = 'y9jitmPxgcT24&sUF9RMt5qtvdeiS0Gdot#!Bk?7$@xNO^0zz#Zep%SOFNwgJYZA*I2xuh!4fH#OE6H2J%GS?%A@C3KGBssu1Q$w'

# define global vars to stay in memory throughout entire run
client = CosmosClient(ENDPOINT, cosmos_key)
database = client.create_database_if_not_exists(id=DATA_BASE_NAME)
subs_cont = database.get_container_client(SUBS_CONTAINER_NAME)
user_cont = database.get_container_client(USERS_CONTAINER_NAME)


# TODO: it seems like instead of cont.query i can just use cont.read_item(id, id) and get it better


def verify_auth_token(token):
    s = Serializer(app.config[TOKEN_KEY_NAME])
    try:
        data = s.loads(token)
    except SignatureExpired:
        return None  # valid token, but expired
    except BadSignature:
        return None  # invalid token
    return data[ID]


@auth.verify_password
def verify_username_password(username_or_token, password):
    """
    any route that has the decorator: @auth.login_required needs this function to return it true
    :param username_or_token: the input username or token
    :param password: the input password
    :return: True iff it matched the users password
    """
    # first check if we got valid token (should be the case for majority of requests)
    user_id = verify_auth_token(username_or_token)
    print('user id', user_id)
    if not user_id:
        # try to authenticate with username password
        cur_user = get_user_json_by_username(user_cont, username_or_token.lower())
        if not cur_user:  # so no user matches username
            return False
        hashed_pwd = cur_user[PASSWORD]
        if not verify_password(password, hashed_pwd):
            # so all attempts to authenticate failed
            return False
        user_id = cur_user[ID]
    g.user_id = user_id  # this can be used by any function that has @auth.login_required
    # because that means that it was set on this request, since g's lifetime is one request
    tc.context.user.id = g.user_id  # i wonder if i need also this, but i defiantly need the bottom one
    appinsights.context.user.id = g.user_id
    return True


def generate_auth_token(user_id):
    s = Serializer(app.config[TOKEN_KEY_NAME], expires_in=3600000)  # todo take away expire time?
    return s.dumps({ID: user_id})


@app.route('/check_token', methods=['POST'])
def check_auth_token():
    token_type = request.args.get('type')
    token = request.json.get('token')
    platform = request.json.get('platform')
    if token_type == 'handles-token':
        s = Serializer(app.config[TOKEN_KEY_NAME])
        try:
            data = s.loads(token)
        except SignatureExpired:
            return 'expired_token'  # valid token, but expired
        except BadSignature:
            tc.track_exception('bad_token', {'token_type': token_type, 'request': request.json})
            tc.flush()
            return 'bad_token_here'  # invalid token
        return 'valid_token'
    if token_type == 'push-token':
        return 'not yet implemented'

    if token_type == 'google-login-token':
        id_info = id_token.verify_oauth2_token(token, requests.Request())
        if id_info['aud'] not in GOOGLE_CLIENT_ID.values():
            tc.track_exception('bad_audience', {'audience': id_info['aud'], 'request': request.json})
            tc.flush()
            return 'bad_audience'
        if not id_info['email_verified']:
            tc.track_exception('google email not verified', {'request': request.json})
            tc.flush()
            return 'email_not_verified'

        email = id_info['email']

        # check if user is new or already exists
        user_json = get_user_json_by_username(user_cont, email)
        if not user_json:
            # so create new user
            try:
                first_name = id_info['given_name']
                family_name = id_info['family_name']
                profile_picture = id_info['picture']
                locale = id_info['locale']
            except KeyError as e:
                tc.track_exception('key error for google sign in', {'request': request.json, 'exception': e})
                tc.flush()
                first_name, family_name, profile_picture, locale = '', '', '', ''
            user_json = create_new_user(tc, user_cont, email, 'google_authorized',
                                        first_name, family_name, profile_picture, locale)
        handles_token = generate_auth_token(user_json[ID])  # using the id that was fetched while authorizing login
        tc.track_event('google_user_sign_in', {'user_id': user_json[ID], 'email': user_json[EMAIL],
                                               'platform': platform})
        print('google_user_sign_in', {'user_id': user_json[ID], 'email': user_json[EMAIL]})
        tc.flush()
        return jsonify({'response': 'success', 'token': handles_token.decode('ascii')})

    tc.track_exception('bad_request_check_token', {'request': request.json})
    tc.flush()
    return 'bad request', 400


@app.route('/forgot_password', methods=['POST'])
def check_forgot_password():
    email = request.json.get('email')
    # check email is in db as a username:
    if not get_user_json_by_username(user_cont, email):
        # so user does not exist
        tc.track_event('forgot_password_no_email_exists', {USERNAME: email})
        tc.flush()
        return 'email_not_exists'

    # send activation link to email
    s = Serializer(app.config[TOKEN_KEY_NAME], expires_in=(60 * 60 * 24))
    act_token = s.dumps({'email': email})  # todo make sure this flow is safe and we don't have people stealing accounts
    act_token = act_token.decode('ascii')

    message = Mail(
        from_email='authorization.handles@gmail.com',
        to_emails=email,
        subject='Reset Your Handles Password',
        html_content=render_template('email_reset_password.html',
                                     activate_url='https://handles.azurewebsites.net/reset_password?token={0}'
                                     .format(act_token)))
    # todo put key in kv
    try:

        sg = SendGridAPIClient('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')
        response = sg.send(message)
        print('sent to: ', email)
        print(response.status_code)
        print(response.body)
        print(response.headers)
        # todo if response says email was not delivered i need to tell client to do with phone number
        return email
    except Exception as e:
        print(e)

        return 'email_sending_error'  # todo be more expicit what the exact error is


@app.route('/get_token', methods=['GET'])
@auth.login_required
def get_auth_token():
    token = generate_auth_token(g.user_id)  # using the id that was fetched while authorizing login
    tc.track_event('Generated Token', {'user_id': g.user_id})
    tc.flush()
    return jsonify({'token': token.decode('ascii')})


@app.route('/onBoarding', methods=['GET'])
def on_boarding():
    tc.track_event('onBoarding')
    tc.flush()
    return 'On boarding instructions'


@app.route('/')
def home():
    tc.track_event('Handles Home')
    tc.flush()
    # use url_for function
    html = render_template('index.html', name='')
    # app.logger.info('Hello World from route') # not sure where to find this log # make need to run appinsights init?
    return html


@app.route('/reset_password', methods=['GET', 'POST'])
def reset_password():
    """
    this is called either from the email with token as a url param or from the form for updating
    :return:
    """
    # if we can input in email this can be done in one move
    activate_token = request.args.get('token')
    new_password_hash = None
    if not activate_token:
        # so it came via post from the this form we sent him
        activate_token = request.form['token']
        if request.form['pwd1'] != request.form['pwd2']:
            return render_template('reset_password.html', token=activate_token, message='Passwords don\'t match!')
        if len(request.form['pwd1']) < 4:
            return render_template('reset_password.html', token=activate_token, message='Password too short!')
        new_password_hash = hash_password(request.form.get('pwd1'))

    s = Serializer(app.config[TOKEN_KEY_NAME])
    try:
        data = s.loads(activate_token)
    except SignatureExpired:
        return 'Link Expired'  # valid token, but expired
    except BadSignature:
        return 'Bad Token'  # invalid token

    # so till now the user sent us a valid token he MUST have gotten from us from his email
    if not new_password_hash:
        return render_template('reset_password.html', token=activate_token, message='')

    email = data['email']
    user_json = get_user_json_by_username(user_cont, email)
    user_json[PASSWORD] = new_password_hash
    user_cont.replace_item(user_json[ID], user_json)
    tc.track_event('password_reset_success', {'user_id': user_json[ID], USERNAME: email})
    tc.flush()
    html = render_template('index.html', name='Reset Successful! You can now log in through the app')
    return html


@app.route('/activate', methods=['GET'])
def activate():
    activate_token = request.args.get('token')
    # todo merge this dup code with auth token func?
    # todo: problems that can happen: 1. 2 people use same email, activation token is sent twice,
    # if the token gets on thee loose, and in the wrong hands, all the adversary can do with it is create a user with that username and password, but the adv wont know the passwrod unless he can unhash it
    s = Serializer(app.config[TOKEN_KEY_NAME])
    try:
        data = s.loads(activate_token)
    except SignatureExpired:
        return 'Link Expired'  # valid token, but expired
    except BadSignature:
        return 'Bad Token'  # invalid token

    email = data['email']
    hashed_password = data['hashed_password']

    # check if user exists:  if link was clicked twice
    if get_user_json_by_username(user_cont, email):
        # so user exists
        tc.track_event('failed_new_user_exists', {USERNAME: email})
        tc.flush()
        return 'User with email: ' + email + 'has been activated already if this was not done by you, please contact us'

    resp = create_new_user(tc, user_cont, email, hashed_password)

    html = render_template('index.html', name='Activation Successful!  ' + resp[USERNAME].split('@')[0] +
                                              'You can now log in through the app')
    return html


@app.route('/activate_phone', methods=['POST'])
def send_activation_text():
    print(request.json.get(USERNAME))
    print(request.json.get(PASSWORD))
    print(request.json.get(PHONE_NUMBER))
    username = request.json.get(USERNAME).lower()  # todo: make sure it is password
    password = request.json.get(PASSWORD)
    number = request.json.get(PHONE_NUMBER)
    return {'response': number}


@app.route('/terms', methods=['GET'])
def get_terms():
    return 'Terms of service: there are none'


@app.route('/pay_button', methods=['GET'])
def paypal_button():
    return render_template('paypal.html')

# todo finish this!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! get it client ready
@app.route('/braintreeToken', methods=['GET'])
def braintree_get_token():

    # pass client_token to your front-end Including a customer_id when generating the client token lets returning
    # customers select from previously used payment method options,
    # improving user experience over multiple checkouts.
    # client_token = gateway.client_token.generate({
    #     "customer_id": "FAKE_PAYER_ID"
    # })
    return gateway.client_token.generate()
    # return client_token


@app.route("/sendNonce", methods=["POST"])
def create_purchase():
    print(request.data)
    try:
        nonce_from_the_client = request.json.get('nonce')
        # Use payment method nonce here...
        # nonce_from_the_client = 'de118373-2f2a-02a1-7a5a-9138a5968efb'
        result = gateway.transaction.sale({
          "amount": "2.00",
          "payment_method_nonce": nonce_from_the_client,
          "device_data": '',
          "options": {
              "submit_for_settlement": True
          }
        })
    except Exception as e:
        print(e)
        return "fail"
    print(str(result))
    return "success"


@app.route('/privacy_policy', methods=['GET'])
def get_privacy_policy():
    return 'Privacy Policy: there is none'


def send_activation_email(to_email, act_token, route='activate'):
    url = 'https://handles.azurewebsites.net/{0}?token={1}'.format(route, act_token)
    message = Mail(
        from_email='authorization.handles@gmail.com',
        to_emails=to_email,
        subject='Welcome to Handles! Confirm Your Email',
        html_content=render_template('email.html', activate_url=url))
    # html_content='<strong>Follow the link to activate your account \n this link expires in 3 minutes:'
    #             ' http://0.0.0.0/activate?token={0} </strong>'.format(act_token))
    # todo put key in kv
    try:

        sg = SendGridAPIClient('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')
        response = sg.send(message)
        print('sent to: ', to_email)
        print(response.status_code)
        print(response.body)
        print(response.headers)
        # todo if response says email was not delivered i need to tell client to do with phone number
        return True
    except Exception as e:
        print(e)
        return False


@app.route('/create_user', methods=['POST'])
def new_user():
    # todo!!!!!! check input validity!
    username = request.json.get(USERNAME).lower()  # todo: make sure it is password
    password = request.json.get(PASSWORD)

    # check if user exists:
    if get_user_json_by_username(user_cont, username):
        # so user exists
        tc.track_event('failed_new_user_exists', {USERNAME: username})
        tc.flush()
        return jsonify({USERNAME: 'username_exists'})

    s = Serializer(app.config[TOKEN_KEY_NAME], expires_in=(60*60*24))
    act_token = s.dumps({'email': username, 'hashed_password': hash_password(password)})  # todo consider maybe not encrypting password and writing in to db maybe
    act_token = act_token.decode('ascii')

    # return jsonify({USERNAME: 'activate_in_cell'})

    if send_activation_email(username, act_token):
        return jsonify({USERNAME: username})
    else:
        return jsonify({USERNAME: 'error'})


@app.route('/send_card', methods=['POST'])
@auth.login_required
def send_card():
    values = request.json.get('values')
    cur_user_json = user_cont.read_item(g.user_id, g.user_id)
    cur_user_json[VISA_TOKEN] = values
    user_cont.replace_item(g.user_id, cur_user_json)
    tc.track_event('Added Card Details', {'user_id': g.user_id})
    tc.flush()
    return values


@app.route('/add', methods=['POST'])
@auth.login_required
def add_home_subscriptions():
    sub_id = request.json.get(ID)
    new_price = request.json.get(SUB_PRICE)
    new_billing_date = parse(request.json.get(BILLING_DATE)).strftime(DATE_STRING_DEFAULT_FORMAT) # todo: convert to UTC?

    sub_user_name = request.json.get(SUB_USERNAME)
    sub_password = request.json.get(SUB_PASSWORD)
    cur_user_dict = get_json_by_id(user_cont, g.user_id)

    new_public_subscription_custom_values = {SUB_PRICE: new_price, BILLING_DATE: new_billing_date,
                                             SUB_USERNAME: sub_user_name, SUB_PASSWORD: sub_password}

    # now check if any of parameters are not None i need to add to public subscription the edits for this user
    cur_user_dict[PUBLIC_SUBSCRIPTIONS][sub_id] = {k: new_public_subscription_custom_values[k]
                                                   for k in new_public_subscription_custom_values
                                                   if new_public_subscription_custom_values[k] is not None}
    cur_user_dict[PUBLIC_SUBSCRIPTIONS][sub_id][STATUS] = True

    user_cont.replace_item(g.user_id, cur_user_dict)
    tc.track_event('added_subscription', {'user_id': g.user_id, 'sub_id': sub_id})
    tc.flush()
    return "Imported subscription to home"  # todo : make sure whole add process is one api call


@app.route('/remove', methods=['POST'])
@auth.login_required
def remove_home_subscription():
    removed_sub_id = request.json.get(ID)
    cur_user_dict = get_json_by_id(user_cont, g.user_id)
    if removed_sub_id in cur_user_dict[PUBLIC_SUBSCRIPTIONS]:
        del cur_user_dict[PUBLIC_SUBSCRIPTIONS][removed_sub_id]
    if removed_sub_id in cur_user_dict[CUSTOM_SUBSCRIPTIONS]:
        del cur_user_dict[CUSTOM_SUBSCRIPTIONS][removed_sub_id]

    ret = user_cont.replace_item(g.user_id, cur_user_dict)
    remaining_subs = ret[PUBLIC_SUBSCRIPTIONS]
    remaining_subs.update(ret[CUSTOM_SUBSCRIPTIONS])

    tc.track_event('removed_subscription', {'user_id': g.user_id, 'sub_id': removed_sub_id})
    tc.flush()

    return remaining_subs
    # todo : make sure whole remove process is one api call -- for now leaving cuz its the only refresh


@app.route('/update', methods=['POST'])
@auth.login_required
def update_user_subscriptions():
    # todo: validate input for all. make sure billing date is in our string format

    cur_user_dict = get_json_by_id(user_cont, g.user_id)

    posted_fields_set = set(request.json)
    if ID not in posted_fields_set or len(posted_fields_set.intersection(LEGAL_USER_UPDATE_FIELDS)) + 1 < len(posted_fields_set):
        # so user entered field that does not exist in legal updateable fields, +1 is for id that is legal
        tc.track_exception('update_bad_fields_input', {'user_id': g.user_id, 'request': request.json})
        tc.flush()
        return "Bad fields input"

    posted_fields_set.remove(ID)
    sub_id = request.json.get(ID)
    public_sub = False
    if sub_id in cur_user_dict[PUBLIC_SUBSCRIPTIONS]:
        public_sub = True
        subs_dict = cur_user_dict[PUBLIC_SUBSCRIPTIONS][sub_id]
    else:
        subs_dict = cur_user_dict[CUSTOM_SUBSCRIPTIONS][sub_id]

    if BILLING_FREQ in posted_fields_set and BILLING_DATE not in posted_fields_set and BILLING_DATE not in subs_dict:
        # so user changed public sub frequency but didn't pull date, we do it for him otherwise azure function wont
        # update his next billing date by this requested frequency
        subs_dict[BILLING_DATE] = subs_cont.read_item(sub_id, sub_id)[BILLING_DATE]

    for field in posted_fields_set:
        if field == BILLING_DATE:
            subs_dict[field] = parse(request.json.get(field)).strftime(DATE_STRING_DEFAULT_FORMAT)
        else:
            subs_dict[field] = request.json.get(field)

    resp = user_cont.replace_item(g.user_id, cur_user_dict)

    if public_sub:
        ret = {field: resp[PUBLIC_SUBSCRIPTIONS][sub_id][field] for field in posted_fields_set}
    else:
        ret = {field: resp[CUSTOM_SUBSCRIPTIONS][sub_id][field] for field in posted_fields_set}
    tc.track_event('update', ret)
    tc.flush()
    return ret


@app.route('/subscriptions', methods=['GET'])
@auth.login_required
def get_subscriptions_home():
    return get_subscriptions(home_page=True)


@app.route('/store', methods=['GET'])
@auth.login_required
def get_subscriptions(home_page=False):
    cur_user_json = get_json_by_id(user_cont, g.user_id)
    public_subs_dict = cur_user_json[PUBLIC_SUBSCRIPTIONS]
    subs_list = get_subscriptions_from_sub_container(subs_cont, tuple(public_subs_dict), home_page)  # this gets us list
    # of subscriptions from subscription container that our user has as public subscriptions if home_page is true
    # otherwise it gets all subscriptions that our user does NOT have so he can see them in store
    # todo - run a test to see whats faster - cross query for subscriptions or just subs_cont.read_item for each one
    if home_page:
        # now i need to add to edit public ones that user has customized himself in some fields if home page
        for item in subs_list:
            for subscription_field in public_subs_dict[item[ID]]:
                # so now i iterate over all the keys of a public subscription that a user customized
                item[subscription_field] = public_subs_dict[item[ID]][subscription_field]

        # so also add all custom subscriptions that are in user_subs_dict as keys
        custom_subs_dict = cur_user_json[CUSTOM_SUBSCRIPTIONS]
        for sub_id in custom_subs_dict:
            subs_list.append(custom_subs_dict[sub_id])

    return json.dumps(subs_list)


@app.route('/history', methods=['GET'])
@auth.login_required
def get_payment_history():
    cur_user_json = get_json_by_id(user_cont, g.user_id)
    hist_dict = cur_user_json[PAYMENT_HISTORY]
    if len(hist_dict) == 0:
        ret = {'labels': ['No Previous Data'], 'data': [0], 'allData': {}}
        all_currencies = {curr: [0] for curr in SUPPORTED_CURRENCIES}
        ret.update(all_currencies)
        return jsonify(ret)

    # otherwise there is data, lets get it
    labels = []
    all_data = {}
    ret_dict = {data_currency: [] for data_currency in SUPPORTED_CURRENCIES}
    for month_name in sorted(hist_dict, key=sort_dates):
        labels.append(month_name)
        curr_map_month_sum = {k: 0 for k in SUPPORTED_CURRENCIES}
        # populate month sum:
        for sub_id in hist_dict[month_name]:
            single_payment_dict = hist_dict[month_name][sub_id]
            # add to all data
            if sub_id in all_data:  # so it was added prev month
                all_data[sub_id].append([month_name, single_payment_dict[VALUE], single_payment_dict[CURRENCY]])
            else:
                all_data[sub_id] = [[month_name, single_payment_dict[VALUE], single_payment_dict[CURRENCY]]]

            val = hist_dict[month_name][sub_id][VALUE]
            currency = hist_dict[month_name][sub_id][CURRENCY]
            curr_map_values = get_all_currency_values(val, currency, tc)
            for _curr in curr_map_month_sum:
                curr_map_month_sum[_curr] += round(curr_map_values[_curr], 2)
        # append it to ret_dict
        for cur_key in ret_dict:
            ret_dict[cur_key].append(curr_map_month_sum[cur_key])

    ret_dict.update({'labels': labels, 'allData': all_data})
    return jsonify(ret_dict)


@app.route('/custom', methods=['POST'])
@auth.login_required
def create_custom_subscription():
    cur_user_json = get_json_by_id(user_cont, g.user_id)
    posted_fields_set = set(request.json)
    categories = request.json.get(CATEGORIES)
    billing_date = request.json.get(BILLING_DATE)
    billing_freq = request.json.get(BILLING_FREQ)
    name = request.json.get(NAME)
    price = request.json.get(SUB_PRICE)
    icon = request.json.get(ICON)

    if billing_date is None or name is None or price is None or billing_freq is None:
        tc.track_exception('custom_subscription_bad_fields_input', {'user_id': g.user_id, 'request': request.json})
        tc.flush()
        return "Bad Input"

    if icon is None:
        icon = ''

    billing_date = parse(billing_date).strftime(DATE_STRING_DEFAULT_FORMAT)  # todo: convert to UTC to preserve TZ?

    # generate id that will be different than public subs id and different from personal custom ones too
    new_id = generate_new_cont_id(subs_cont)
    while new_id:
        if new_id not in cur_user_json[CUSTOM_SUBSCRIPTIONS]:
            break
        new_id = generate_new_cont_id(subs_cont)

    new_custom_sub = {new_id: {ID: new_id, NAME: name, BILLING_DATE: billing_date, BILLING_FREQ: billing_freq,
                               SUB_PRICE: price, ICON: icon, CATEGORIES: categories, STATUS: True}}

    cur_user_json[CUSTOM_SUBSCRIPTIONS].update(new_custom_sub)
    resp = user_cont.replace_item(g.user_id, cur_user_json)
    ret = {field: resp[CUSTOM_SUBSCRIPTIONS][new_id][field] for field in posted_fields_set if field in LEGAL_USER_UPDATE_FIELDS}
    ret.update({ID: new_id, STATUS: True})
    tc.track_event('created_custom_subscription', {'user_id': g.user_id, **ret})
    tc.flush()
    return ret


@app.route('/update_user', methods=['POST'])
@auth.login_required
def update_user_details():
    cur_user_dict = get_json_by_id(user_cont, g.user_id)
    ans = request.json
    if ans['type'] == EMAIL:
        cur_user_dict[EMAIL] = ans[EMAIL]
    elif ans['type'] == BIRTHDAY:
        cur_user_dict[BIRTHDAY] = ans[BIRTHDAY]
    elif ans['type'] == PROFILE_IMAGE:
        cur_user_dict[PROFILE_IMAGE] = ans[PROFILE_IMAGE]
    elif ans['type'] == FIRST_NAME:
        cur_user_dict[FIRST_NAME] = ans[FIRST_NAME]
    elif ans['type'] == ADDRESS:
        cur_user_dict[ADDRESS] = ans[ADDRESS]
    else:
        return {"response": "Failed - Bad Input"}

    resp = user_cont.replace_item(g.user_id, cur_user_dict)
    tc.track_event('updated_user_details', {'user_id': g.user_id, ans['type']: resp[ans['type']]})
    tc.flush()
    return jsonify({ans['type']: resp[ans['type']]})


@app.route('/get_user', methods=['GET'])
@auth.login_required
def get_user_details():
    cur_user_dict = get_json_by_id(user_cont, g.user_id)
    return jsonify({
        EMAIL: cur_user_dict[EMAIL],
        BIRTHDAY: cur_user_dict[BIRTHDAY],
        ADDRESS: cur_user_dict[ADDRESS],
        PROFILE_IMAGE: cur_user_dict[PROFILE_IMAGE],
        FIRST_NAME: cur_user_dict[FIRST_NAME],
        VISA_TOKEN: cur_user_dict[VISA_TOKEN]
    })


@app.route('/delete_history', methods=['POST'])
@auth.login_required
def delete_row_user_history():
    cur_user_dict = user_cont.read_item(g.user_id, g.user_id)
    month = request.json.get(MONTH)  # if code stays for a year, need to add years to payment history - prob do makeover
    year = request.json.get(YEAR)
    if len(year) > 2:
        year = year[2:]   # turn 2021 '21
    month = month + ' \'' + year
    sub_id = request.json.get(ID)
    del cur_user_dict[PAYMENT_HISTORY][month][sub_id]  # for now history is logged by months
    ret = user_cont.replace_item(g.user_id, cur_user_dict)
    tc.track_event('deleted_history', {'user_id': g.user_id, 'sub_id': sub_id})
    return jsonify(ret[PAYMENT_HISTORY][month])


@app.route('/add_history', methods=['POST'])
@auth.login_required
def add_row_user_history():
    cur_user_dict = user_cont.read_item(g.user_id, g.user_id)
    month = request.json.get(MONTH)  # if code stays for a year, need to add years to payment history - prob do makeover
    year = request.json.get(YEAR)
    sub_id = request.json.get(ID)
    sub_name = request.json.get(NAME)
    sub_price = request.json.get(SUB_PRICE)

    if len(year) > 2:
        year = year[2:]   # turn 2021 '21
    month = month + ' \'' + year

    if month not in cur_user_dict[PAYMENT_HISTORY]:
        cur_user_dict[PAYMENT_HISTORY][month] = {}
    cur_user_dict[PAYMENT_HISTORY][month][sub_id] = {NAME: sub_name, VALUE: sub_price[VALUE],
                                                     CURRENCY: sub_price[CURRENCY]}
    ret = user_cont.replace_item(g.user_id, cur_user_dict)
    tc.track_event('added_history', {'user_id': g.user_id, 'sub_id': sub_id, 'value': sub_price[VALUE]})
    return jsonify(ret[PAYMENT_HISTORY][month])


@app.route('/get_currency', methods=['GET'])
def get_currency_table():
    return jsonify(get_cur_table_for_client(tc))


# todo - this is cool maybe use something like this for logging?
# this example is for now cache
# # prevent cached responses
# if app.config["DEBUG"]:
#     @app.after_request
#     def after_request(response):
#         response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate, public, max-age=0"
#         response.headers["Expires"] = 0
#         response.headers["Pragma"] = "no-cache"
#         return response


if __name__ == '__main__':
    # this is never called if using gunicorn
    app.run(host='0.0.0.0', port=80)
