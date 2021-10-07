import {StyleSheet, Platform, Dimensions} from 'react-native';
import {
  ThemeManager,
  BorderRadiuses,
  Constants,
  Spacings,
  Colors,
} from 'react-native-ui-lib';
import {colors} from 'react-native-elements';
import {blue1} from '../screens/loginScreens/styleSheet';
import {Appearance} from 'react-native-appearance';

export const secondaryOrange = '#ED7D31';

const sharedStyles = StyleSheet.create({
  image: {
    width: 54,
    height: 54,
    borderRadius: BorderRadiuses.br20,
    marginHorizontal: 14,
    resizeMode:'contain',
  },
  subscriptionScreenIcon: {
    width: 20,
    height: 20,
  },
  separator: {
    borderWidth: 0.8,
    flex: 8,
    flexDirection: 'row',
  },
  userNameText: {
    color: blue1,
    fontSize: 22,
    fontWeight: 'bold',
    paddingBottom: 8,
    textAlign: 'center',
  },
  userCityText: {
    color: blue1,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  userImage: {
    padding: 5,
    borderColor: Colors.black,
    borderRadius: 85,
    borderWidth: 3,
    height: 170,
    marginBottom: 15,
    width: 170,
  },
  subscriptionImage: {
    height: 120,
    marginBottom: 15,
    width: 120,
    borderRadius: BorderRadiuses.br30,
  },
  headerColumn: {
    backgroundColor: 'transparent',
    ...Platform.select({
      ios: {
        alignItems: 'center',
        elevation: 1,
        marginTop: -1,
      },
      android: {
        alignItems: 'center',
      },
    }),
  },
  textFieldContainer: {
    marginBottom: Spacings.s2,
  },
  footer: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingVertical: 50,
    paddingHorizontal: 30,
  },
  signIn: {
    width: 150,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 50,
    flexDirection: 'row',
  },
  title: {
    marginLeft: '5%',
    fontWeight: 'bold',
    marginBottom: '3%',
    fontSize: 20,
  },
  userName: {
    marginLeft: '5%',
    fontSize: 20,
    color: '#6495ED',
  },
  subTitle: {
    marginLeft: '5%',
    marginBottom: '3%',
    color: '#A9A9A9',
  },
  listItemMainContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 25,
  },
  listItemCenterContainer: {
    flex: 6,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  listItemCenterTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 5,
  },
  secureEyeContainer: {
    position: 'absolute',
    alignSelf: 'center',
    right: 0,
    marginRight: 20,
  },
  frequencyPicker: {
    alignSelf: 'center',
  },
  triggerReminderButton: {
    marginTop: 20,
    marginBottom: 20,
    width: '50%',
    alignSelf: 'center',
  },
  categoriesScreenContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoriesScreenItem: {
    width: Dimensions.get('window').width * 0.5,
    aspectRatio: 1,
    borderWidth: 1,
    borderColor: 'lightgray',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoriesScreenItemBackground: {
    flex: 1,
    aspectRatio: 1,
    resizeMode: 'cover',
    justifyContent: 'flex-end',
  },
  categoriesScreenItemTitle: {
    color: Colors.grey50,
    fontSize: 35,
    fontWeight: 'bold',
    textAlign: 'center',
    backgroundColor: '#000000a0',
    marginBottom: '5%'
  },
});

const stylesLight = StyleSheet.create({
  border: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: ThemeManager.dividerColor,
    backgroundColor: Colors.white,
  },
  pageView: {
    backgroundColor: Colors.white,
    width: Constants.screenWidth,
    height: Constants.screenHeight,
    flex: 1,
  },
  input: {
    color: Colors.black,
    marginBottom: Spacings.s2,
  },
  inputText: {
    color: Colors.black,
  },
  profileListItem: {
    paddingTop: 30,
    backgroundColor: Colors.white,
  },
  profileListItemSubScreen: {
    paddingTop: 30,
    backgroundColor: Colors.white,
  },
  listContainer: {
    backgroundColor: Colors.white,
  },
  listItemText: {
    flex: 1,
    marginRight: 10,
    color: Colors.black,
  },
  listItemSubText: {
    marginTop: 2,
    color: Colors.black,
  },
  backgroundContainer: {
    backgroundColor: Colors.white,
  },
  screenBackground: {
    backgroundColor: Colors.white,
  },
  historyListItemtext: {
    alignSelf: 'center',
    color: Colors.black,
  },
  userDetailsStyle: {
    backgroundColor: Colors.white,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 25,
  },
  userDetailsText: {
    fontSize: 16,
    color: Colors.black,
  },
  detailsIcon: {
    color: secondaryOrange,
    fontSize: 30,
  },
  cardStyle: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  radioLabelStyle: {
    color: Colors.black,
  },
  activeBackgroundColor: {
    color: Colors.dark10,
  },
  chartBackgroundGradiant: {
    color: Colors.grey60,
  },
});

////////  DARK  /////////////////  DARK  /////////

const stylesDark = StyleSheet.create({
  border: {
    // DARK
    borderBottomWidth: 1,
    borderColor: Colors.black,
    backgroundColor: '#444444',
  },
  pageView: {
    // DARK
    backgroundColor: Colors.black,
    width: Constants.screenWidth,
    height: Constants.screenHeight,
    flex: 1,
  },
  input: {
    // DARK
    color: Colors.white,
    marginBottom: Spacings.s2,
  },
  inputText: {
    // DARK
    color: Colors.white,
  },
  profileListItem: {
    // DARK
    paddingTop: 30,
    backgroundColor: '#444444',
  },
  profileListItemSubScreen: {
    // DARK
    paddingTop: 30,
    backgroundColor: Colors.black,
  },
  listContainer: {
    // DARK
    backgroundColor: '#bebebe',
  },
  listItemText: {
    // DARK
    flex: 1,
    marginRight: 10,
    color: Colors.white,
  },
  listItemSubText: {
    // DARK
    marginTop: 2,
    color: Colors.white,
  },
  backgroundContainer: {
    // DARK
    backgroundColor: '#444444',
  },
  screenBackground: {
    // DARK
    backgroundColor: Colors.black,
  },
  historyListItemtext: {
    // DARK
    alignSelf: 'center',
    color: Colors.white,
  },
  userDetailsStyle: {
    // DARK
    backgroundColor: Colors.black,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 25,
  },
  userDetailsText: {
    // DARK
    fontSize: 16,
    color: Colors.white,
  },
  detailsIcon: {
    color: secondaryOrange,
    fontSize: 30,
  },
  cardStyle: {
    // DARK
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(20, 20, 20, 0.7)',
  },
  radioLabelStyle: {
    // DARK
    color: Colors.white,
  },
  activeBackgroundColor: {
    // DARK
    color: Colors.white,
  },
  chartBackgroundGradiant: {
    // DARK
    color: '#444444',
  },
});

export const styles =
  Appearance.getColorScheme() === 'dark'
    ? {...stylesDark, ...sharedStyles}
    : {...stylesLight, ...sharedStyles}; // todo guy: is this the correct way to merge?
