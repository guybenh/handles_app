from html.parser import HTMLParser
import re
import time
from selenium import webdriver
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.keys import Keys
import os
from tqdm import tqdm
import pickle
import getpass

# need to run in like 3 or 4 batched cuz facebook doesnt let what im doing. from 30% to stop and continue from there

SCROLL_PAUSE_TIME = 2


def run():
    username = 'asherguedalia10@handles.com'
    #password = getpass.getpass('Password:')
    password = 'ts8@2!tnQuN6bU#'

    PAUSE_TIME = 0.75
    chrome_options = webdriver.ChromeOptions()
    prefs = {"profile.default_content_setting_values.notifications" : 2}
    chrome_options.add_experimental_option("prefs",prefs)
    #driver = webdriver.Chrome(options=chrome_options)
    driver = webdriver.Chrome(ChromeDriverManager().install())

    driver.get('http://www.netflix.com/')

    # authenticate to facebook account
    elem = driver.find_element_by_id("id_email_hero_fuji")
    elem.send_keys(username)
    elem.send_keys(Keys.RETURN)

    time.sleep(PAUSE_TIME)  # these seem to be very important

    elem = driver.find_element_by_class_name("submitBtnContainer")
    elem.click()

    time.sleep(1)

    elem = driver.find_element_by_id("id_password")
    elem.send_keys(password)
    elem.send_keys(Keys.RETURN)

    time.sleep(PAUSE_TIME)

    elem = driver.find_element_by_class_name("submitBtnContainer")
    elem.click()

    time.sleep(PAUSE_TIME)

    elem = driver.find_element_by_class_name("submitBtnContainer")
    elem.click()

    time.sleep(PAUSE_TIME)

    elem = driver.find_element_by_class_name("mopNameAndLogos")
    elem.click()

    # now fill in credit card info
    time.sleep(PAUSE_TIME)
    first_name_elem = driver.find_element_by_id("id_firstName")
    first_name_elem.send_keys('Ash')
    last_name_elem = driver.find_element_by_id("id_lastName")
    last_name_elem.send_keys('G')
    card_number_elem = driver.find_element_by_id("id_creditCardNumber")
    card_number_elem.send_keys('1234567813571234')
    expiration_date_elem = driver.find_element_by_id("id_creditExpirationMonth")
    expiration_date_elem.send_keys('12/24')
    sec_card_code_elem = driver.find_element_by_id("id_creditCardSecurityCode")
    sec_card_code_elem.send_keys('456')


    sec_card_code_elem.send_keys(Keys.RETURN)

    time.sleep(10)
    driver.quit()

# what i learned:
# 1. use time.sleep whenever something doesnt work.
# 2. get from <input ... id= > the id for texts to send


run()

def get_fb_page(url):
    time.sleep(2)
    driver.get(url)

    # Get scroll height
    last_height = driver.execute_script("return document.body.scrollHeight")

    while True:
        # Scroll down to bottom
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")

        # Wait to load page
        time.sleep(SCROLL_PAUSE_TIME)

        # Calculate new scroll height and compare with last scroll height
        new_height = driver.execute_script("return document.body.scrollHeight")
        if new_height == last_height:
            break
        last_height = new_height
    html_source = driver.page_source
    return html_source


def find_friend_from_url(url):
    if re.search('com\/profile.php\?id=\d+\&', url) is not None:
        m = re.search('com\/profile.php\?id=(\d+)\&', url)
        friend = m.group(1)
    else:
        m = re.search('com\/(.*)\?', url)
        friend = m.group(1)
    return friend


class MyHTMLParser(HTMLParser):
    urls = []

    def error(self, message):
        pass

    def handle_starttag(self, tag, attrs):
        # Only parse the 'anchor' tag.
        if tag == "a":
            # Check the list of defined attributes.
            for name, value in attrs:
                # If href is defined, print it.
                if name == "href":
                    if re.search('\?href|&href|hc_loca|\?fref', value) is not None:
                        if re.search('.com/pages', value) is None:
                            self.urls.append(value)



"""
my_url = 'http://www.facebook.com/' + username + '/friends'

UNIQ_FILENAME = 'uniq_urls.pickle'
if os.path.isfile(UNIQ_FILENAME):
    print('here0')
    with open(UNIQ_FILENAME, 'rb') as f:
        uniq_urls = pickle.load(f)
        print('uniq urls: ', uniq_urls)
    print('We loaded {} uniq friends'.format(len(uniq_urls)))
else:
    friends_page = get_fb_page(my_url)
    parser = MyHTMLParser()
    parser.feed(friends_page)
    uniq_urls = set(parser.urls)

    print('We found {} friends, saving it'.format(len(uniq_urls)))

    with open(UNIQ_FILENAME, 'wb') as f:
        pickle.dump(uniq_urls, f)

friend_graph = {}
GRAPH_FILENAME = 'friend_graph.pickle'

if os.path.isfile(GRAPH_FILENAME):
    print('here1')
    with open(GRAPH_FILENAME, 'rb') as f:
        friend_graph = pickle.load(f)
    print('Loaded existing graph, found {} keys'.format(len(friend_graph.keys())))



for url in tqdm(uniq_urls):
    # here i go through each friend

    friend_username = find_friend_from_url(url)
    if friend_username in friend_graph.keys():
        continue


    friend_graph[friend_username] = [username]
    mutual_url = 'https://www.facebook.com/{}/friends_mutual'.format(friend_username)
    mutual_page = get_fb_page(mutual_url)

    parser = MyHTMLParser()
    parser.urls = []
    parser.feed(mutual_page)
    mutual_friends_urls = set(parser.urls)
    print('Found {} urls'.format(len(mutual_friends_urls)))

    for mutual_url in mutual_friends_urls:
        mutual_friend = find_friend_from_url(mutual_url)
        friend_graph[friend_username].append(mutual_friend)

    with open(GRAPH_FILENAME, 'wb') as f:
        pickle.dump(friend_graph, f)


"""