# here i will try using a remote chrome driver, it is sitting in my ACI.
# specifying the port 4444 in the url made it work
# every so often i should repull the image and update the container in the ACI

from selenium import webdriver
from selenium.webdriver import DesiredCapabilities

#driver = webdriver.Remote('http://localhost:4444/wd/hub', DesiredCapabilities.CHROME)
driver = webdriver.Remote('http://chrome.westeurope.azurecontainer.io:4444/wd/hub', DesiredCapabilities.CHROME)

driver.set_window_size(1280, 1024)
driver.get('https://www.google.com')
driver.save_screenshot('test.png')
driver.quit()

# todo
# upload to acr and test again