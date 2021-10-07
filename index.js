import {Navigation} from 'react-native-navigation';
import {App} from './client/App';
import joinToSubscriptionScreen from './client/screens/JoinToSubscriptionScreen';
import joinToBoxScreen from './client/screens/JoinToBoxScreen';
import SignInScreen from './client/screens/loginScreens/SignInScreen';
import SignUpScreen from './client/screens/loginScreens/SignUpScreen';
import WebActionScreen from './client/screens/WebActionScreen';
import SubscriptionScreen from './client/screens/SubscriptionScreen';
import AddCustomSubscriptionScreen from './client/screens/AddCustomSubscriptionScreen';
import editProfileImageScreen from './client/screens/editProfileImageScreen';
import PushNotificationIOS from "@react-native-community/push-notification-ios";
import categoriesScreen from './client/screens/categoriesScreen';
export var PushNotification = require("react-native-push-notification");


// Must be outside of any component LifeCycle (such as `componentDidMount`).
PushNotification.configure({
  // (optional) Called when Token is generated (iOS and Android)
  onRegister: function (token) {
    console.log("PUSH MESSAGES TOKEN:", token); // TODO send this to server
  },

  // (required) Called when a remote is received or opened, or local notification is opened
  onNotification: function (notification) {
    console.log("WE RECIEVED A NOTIFICATION:!!!", notification);
    // process the notification

    // (required) Called when a remote is received or opened, or local notification is opened
    notification.finish(PushNotificationIOS.FetchResult.NoData);
  },

  // (optional) Called when Registered Action is pressed and invokeApp is false, if true onNotification will be called (Android)
  onAction: function (notification) {
    console.log("ACTION:", notification.action);
    console.log("NOTIFICATION:", notification);

    // process the action
  },

  // (optional) Called when the user fails to register for remote notifications. Typically occurs when APNS is having issues, or the device is a simulator. (iOS)
  onRegistrationError: function(err) {
    console.error(err.message, err);
  },

  // IOS ONLY (optional): default: all - Permissions to register.
  permissions: {
    alert: true,
    badge: true,
    sound: true,
  },

  // Should the initial notification be popped automatically
  // default: true
  popInitialNotification: true,

  /**
   * (optional) default: true
   * - Specified if permissions (ios) and token (android and ios) will requested or not,
   * - if not, you must call PushNotificationsHandler.requestPermissions() later
   * - if you are not using remote notification or do not have Firebase installed, use this:
   *     requestPermissions: Platform.OS === 'ios'
   */
  requestPermissions: true,
});
PushNotification.createChannel( // for android this is nessasary
  {
    channelId: "1", // (required)
    channelName: `Default channel`, // (required)
    channelDescription: "A default channel", // (optional) default: undefined.
    soundName: "default", // (optional) See `soundName` parameter of `localNotification` function
    importance: 4, // (optional) default: 4. Int value of the Android notification importance
    vibrate: true, // (optional) default: true. Creates the default vibration patten if true.
  },
  (created) => console.log(`createChannel '1' returned '${created}'`) // (optional) callback returns whether the channel was created, false means it already existed.
);


//register screens
Navigation.registerComponent('HANDLES', () => App);
Navigation.registerComponent('joinToSubscriptionScreen', () => joinToSubscriptionScreen);
Navigation.registerComponent('joinToBoxScreen', () => joinToBoxScreen);
Navigation.registerComponent('signInScreen', () => SignInScreen);
Navigation.registerComponent('signUpScreen', () => SignUpScreen);
Navigation.registerComponent('addCustomSubscriptionScreen', () => AddCustomSubscriptionScreen);
Navigation.registerComponent('webActionScreen', () => WebActionScreen);
Navigation.registerComponent('subscriptionScreen', () => SubscriptionScreen);
Navigation.registerComponent('editProfileImageScreen', () => editProfileImageScreen);
Navigation.registerComponent('categoriesScreen', () => categoriesScreen);

[App, SignInScreen, SignUpScreen, categoriesScreen].forEach(
  (screen) => (screen.options = {topBar: {visible: false}}),
);

Navigation.events().registerAppLaunchedListener(() => {
   Navigation.setRoot({
     root: {
       stack: {
         children: [
           {
             component: {
               name: 'HANDLES'
             },
           },
         ],
       },
     },
   });
});