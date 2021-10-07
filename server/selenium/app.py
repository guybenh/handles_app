# reference https://stackoverflow.com/questions/45323271/how-to-run-selenium-with-chrome-in-docker
import datetime
import time
from selenium import webdriver
from selenium.webdriver.common.keys import Keys

from flask import Flask, send_file
import glob
import os

# import chromedriver_binary # todo only if running with our driver

# need to run in like 3 or 4 batched cuz facebook doesnt let what im doing. from 30% to stop and continue from there
app = Flask(__name__)

SCROLL_PAUSE_TIME = 2


@app.route('/', methods=['GET'])
def test():
    return 'tested! 1.3'


@app.route('/latest', methods=['GET'])
def get_latest():
    try:
        list_of_files = glob.glob('*')  # * means all if need specific format then *.csv
        latest_file = max(list_of_files, key=os.path.getctime)
        return send_file(latest_file, mimetype='image/png')
    except Exception as e:
        return 'Error: ' + str(e)


@app.route('/run', methods=['GET'])
def run():
    pic_filename = str(datetime.datetime.now()).replace(' ', '-').replace('.', '-').replace(':', '-') + '.png'
    username = 'ashhgee@handles.com'
    #password = getpass.getpass('Password:')
    password = 'ts8@2!adtnQuN6sdv'

    PAUSE_TIME = 0.75
    #chrome_options = webdriver.ChromeOptions()
    #prefs = {"profile.default_content_setting_values.notifications" : 2}
    #chrome_options.add_experimental_option("prefs",prefs)
    #driver = webdriver.Chrome(options=chrome_options)
    chrome_options = webdriver.ChromeOptions()
    # todo: getting error on web they say error maybe has something to do with this?
    # todo : it someitmes works, but maybe there is a better overall option
    chrome_options.add_argument("--headless") #maybe doesnt work so well? todo!!
    # todo:
    # try another option of running containerized selenium: https://stackoverflow.com/questions/53657215/running-selenium-with-headless-chrome-webdriver
    # this seems better, probably they put the best version there and all we need to do is use it.

    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("window-size=1400,2100")
    chrome_options.add_argument('--disable-gpu')

    driver = webdriver.Chrome(chrome_options=chrome_options)
    #driver = webdriver.Chrome(ChromeDriverManager().install())

    try:
        print('starting!')
        driver.get('http://www.netflix.com/')

        # authenticate to facebook account
        elem = driver.find_element_by_id("id_email_hero_fuji")
        elem.send_keys(username)
        elem.send_keys(Keys.RETURN)

        time.sleep(PAUSE_TIME)  # these seem to be very important

        # elem = driver.find_element_by_class_name("submitBtnContainer")
        # elem.click()
        #
        time.sleep(2)

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
        first_name_elem.send_keys('Ashaaa')
        last_name_elem = driver.find_element_by_id("id_lastName")
        last_name_elem.send_keys('G')
        card_number_elem = driver.find_element_by_id("id_creditCardNumber")
        card_number_elem.send_keys('1234567813571234')
        expiration_date_elem = driver.find_element_by_id("id_creditExpirationMonth")
        expiration_date_elem.send_keys('12/24')
        sec_card_code_elem = driver.find_element_by_id("id_creditCardSecurityCode")
        sec_card_code_elem.send_keys('456')
        #sec_card_code_elem.send_keys(Keys.RETURN)

    except Exception as e:
        try:
            screenshot = driver.save_screenshot(pic_filename)
        except Exception as e2:
            driver.quit()
            return 'got screen shot error: ' + str(e2) + ' while handling error: ' + str(e)
        driver.quit()
        if screenshot:
            return 'error: ' + str(e) + 'screenshot: ' + pic_filename
        else:
            return 'no screenshot, exception: ' + str(e)


    screenshot = driver.save_screenshot(pic_filename)

    driver.quit()
    if screenshot:
        return send_file(pic_filename, mimetype='image/png')
    else:
        return 'no screenshot'

# what i learned:
# 1. use time.sleep whenever something doesnt work.
# 2. get from <input ... id= > the id for texts to send


if __name__ == '__main__':
    # this is never called if using gunicorn
    app.run(host='0.0.0.0', port=80)
