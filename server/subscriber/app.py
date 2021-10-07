# reference https://stackoverflow.com/questions/45323271/how-to-run-selenium-with-chrome-in-docker
import datetime
import time
from selenium import webdriver
from selenium.webdriver import DesiredCapabilities
from selenium.webdriver.common.keys import Keys

from flask import Flask, send_file, request
import glob
import os

# need to run in like 3 or 4 batched cuz facebook doesnt let what im doing. from 30% to stop and continue from there
app = Flask(__name__)

SCROLL_PAUSE_TIME = 2
PAUSE_TIME = 2


@app.route('/', methods=['GET'])
def test():
    return 'tested!!! 1.01'


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
    log = ''
    username = request.args.get('email')
    if not username:
        username = 'firstsaiuwgcvcassha@handlesio.com'  # todo this needs to change every time or it skips pages 2, 3
    name = request.args.get('name')
    if not name:
        name = 'testname'

    pic_filename = str(datetime.datetime.now()).replace(' ', '-').replace('.', '-').replace(':', '-') + '.png'
    password = 'ts8@2!adtnQuN6sdv'

    driver = webdriver.Remote('http://chrome.westeurope.azurecontainer.io:4444/wd/hub', DesiredCapabilities.CHROME)

    try:
        print('starting!')
        driver.get('http://www.netflix.com/')

        # authenticate to facebook account
        elem = driver.find_element_by_id("id_email_hero_fuji")
        elem.send_keys(username)
        log += 'page 1 \n'
        elem.send_keys(Keys.RETURN)

        time.sleep(2)
        elem = driver.find_elements_by_tag_name('button')[0]  # todo find it in better way or assert this
        print(elem)
        print('page 2')
        log += 'page 2 \n'
        elem.send_keys(Keys.RETURN)
        # elem = driver.find_element_by_class_name("submitBtnContainer") # maybe use this?
        # elem.click()
        #

        time.sleep(2)
        elem = driver.find_elements_by_tag_name('button')[0]  # todo find it in better way or assert this
        print('page 3')
        log += 'page 3 \n'
        elem.send_keys(Keys.RETURN)

        time.sleep(2)

        elem = driver.find_element_by_id("id_password")
        print('page 4')
        log += 'page 4 \n'
        elem.send_keys(password)
        elem.send_keys(Keys.RETURN)

        print('page 5')
        log += 'page 5 \n'

        time.sleep(PAUSE_TIME)

        elem = driver.find_element_by_class_name("submitBtnContainer")
        elem.click()
        print('page 6')
        log += 'page 6 \n'

        time.sleep(PAUSE_TIME)

        elem = driver.find_element_by_class_name("submitBtnContainer")
        elem.click()
        print('page 7')
        log += 'page 7 \n'

        time.sleep(PAUSE_TIME)

        elem = driver.find_element_by_class_name("mopNameAndLogos")
        elem.click()
        print('page 8')
        log += 'page 8 \n'

        # now fill in credit card info
        time.sleep(PAUSE_TIME)
        first_name_elem = driver.find_element_by_id("id_firstName")
        first_name_elem.send_keys(name)
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
            return 'got screen shot error: ' + str(e2) + ' while handling error: ' + str(e) + log
        driver.quit()
        if screenshot:
            return 'error: ' + str(e) + 'screenshot: ' + pic_filename + log
        else:
            return 'no screenshot, exception: ' + str(e) + log


    screenshot = driver.save_screenshot(pic_filename)

    driver.quit()
    if screenshot:
        return send_file(pic_filename, mimetype='image/png')
    else:
        return 'no screenshot' + log

# what i learned:
# 1. use time.sleep whenever something doesnt work.
# 2. get from <input ... id= > the id for texts to send


if __name__ == '__main__':
    # this is never called if using gunicorn
    app.run(host='0.0.0.0', port=80)
