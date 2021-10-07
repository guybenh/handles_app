import React from 'react';
import {BackHandler} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {NavigationContainer} from '@react-navigation/native';
import {Image} from 'react-native-ui-lib';
import BillingScreen from './screens/mainTabs/BillingScreen';
import ProfileScreen from './screens/mainTabs/ProfileScreen';
import ExploreScreen from './screens/mainTabs/ExploreScreen';
import HomeScreen from './screens/mainTabs/HomeScreen';
import {mainTabsImages, setMainAppComponentId, delay} from './utils/utils';
import {itemsStore} from './store/itemsStore';
import {userStore} from './store/userStore';
import {styles} from './utils/styleSheet'
import {
  getHomeDataFromApi,
  getExploreDataFromApi,
  getHistoryExpensesData,
  getCurrencyRates,
} from './utils/serverApi';
import { HandlesLoader } from './utils/HandlesLoader';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Navigation} from 'react-native-navigation';

const Tab = createBottomTabNavigator();

interface State {
  dataLoader: boolean
}

interface Props {
  componentId: string;
}

export class App extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      dataLoader: true,
    };
    userStore.setUserLocale();
  }

  loadToken = async () => {
    try {
      const value = await AsyncStorage.getItem("signInToken");
      if (value !== null && value !== 'expired') {
        return value;
      }
      else {
        return 'no_token';
      }
    } catch (e) {
      console.error(e);
      return 'no_token'
    }
  }

  sendToSignIn = () => {
    Navigation.setRoot({
      root: {
        stack: {
          children: [
            {
              component: {
                name: 'signInScreen'
              },
            },
          ],
        },
      },
    });
  }

  // loads all relevant data before launching the app
  async componentDidMount() {
    const token = await this.loadToken();
    if (token === 'no_token') {
      await delay(1000); // TODO - this is here so we dont have flashing white screens when user enters for the first time or when token expires
      this.sendToSignIn();
      return;
    } 
    userStore.setToken(token);  // https://stackoverflow.com/questions/41446560/react-setstate-not-updating-state - look at this! we need to add a callback to know when satte finished cuz its async
    const currencyRates = await getCurrencyRates();
    itemsStore.setCurrencyRates(currencyRates);
    const storeItems = await getExploreDataFromApi(token);
    if (storeItems === 'expired'){ // this is first api call needing authorization. if it returns expired it means there was an error
      return;
    }
    itemsStore.setStoreItems(storeItems);
    userStore.initialUserProfileData(token);
    const historyExpensesData = await getHistoryExpensesData();
    itemsStore.setExpensesHistoryData(historyExpensesData);
    setMainAppComponentId(this.props.componentId);
    const homeScreenItems = await getHomeDataFromApi();
    itemsStore.setHomeScreenItems(homeScreenItems);
    this.setState({dataLoader: false});
  }

  handleBackButton = () => {
    BackHandler.exitApp();
     return true;
  }

  renderTab = (screen: any, componentName: string, icon: any) => {
    return (
      <Tab.Screen
        name={componentName}
        component={screen}
        listeners={{
          focus: () =>
            BackHandler.addEventListener('hardwareBackPress', this.handleBackButton),
          blur: () =>
            BackHandler.removeEventListener(
              'hardwareBackPress',
              this.handleBackButton,
            ),
        }}
        options={{
          tabBarIcon: () => (
            <Image source={icon} style={{height: 22, width: 22}} />
          ),
        }}
      />
    );
  };

  MyTabs = () => {
    return (
      <Tab.Navigator
        sceneContainerStyle={styles.backgroundContainer}
        initialRouteName="Home"
        backBehavior={'history'}
        tabBarOptions={{
          activeBackgroundColor: styles.backgroundContainer.backgroundColor,
          inactiveBackgroundColor: styles.backgroundContainer.backgroundColor,
          activeTintColor: '#2493D6',
        }}>
        {/* {this.renderTab(BillingScreen, 'Analysis', mainTabsImages.billing)} */}
        {this.renderTab(ProfileScreen, 'Profile', mainTabsImages.profile)}
        {this.renderTab(ExploreScreen, 'Explore', mainTabsImages.explore)}
        {this.renderTab(HomeScreen, 'Home', mainTabsImages.home)}
      </Tab.Navigator>
    );
  };

  render() {
    return (
        <NavigationContainer>
            {this.state.dataLoader ? (
              <HandlesLoader/>
            ) : (
              <this.MyTabs />
            )}
        </NavigationContainer>
    );
  }
}