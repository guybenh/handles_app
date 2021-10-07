import {ScrollView, Alert, TouchableOpacity, BackHandler} from 'react-native';
import {
  View,
  TextField,
  LoaderScreen,
  Keyboard,
  RadioButton,
  RadioGroup,
  Text,
  Colors,
  Picker,
  Image,
} from 'react-native-ui-lib';
import {styles} from '../utils/styleSheet';
import {Navigation} from 'react-native-navigation';
import { postCustomSubscription} from '../utils/serverApi';
import {itemsStore} from '../store/itemsStore';
import {userStore} from '../store/userStore';
import CalendarPicker from 'react-native-calendar-picker';
import React from 'react';
import LinearGradient from 'react-native-linear-gradient';
import {signInStyles} from './loginScreens/styleSheet';  // todo custom style
import {
  customSubscriptionIcons,
  keysForCustomSubscriptionIcons,
  CurrencyOptions,
  FreqOptions,
  FreqOptionsKeys,
} from '../utils/utils';


const KeyboardAwareInsetsView = Keyboard.KeyboardAwareInsetsView;

interface Props {
  componentId: string;
}

interface State {
  name: string;
  formattedPrice: {value: number, currency: string};
  categories: string[];
  billingFreq: string;
  billingDate: string;
  icon: string; //make server search for icon by title and set the url
  signInLoader: boolean;
}

class AddCustomSubscriptionScreen extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      name: '',
      formattedPrice: {value: 0, currency: userStore.getCurrency()},
      categories: [''],
      billingDate: new Date().toString(), // default bill date
      billingFreq: '0-1-0', // monthly default
      icon:
        'https://icons.iconarchive.com/icons/custom-icon-design/pretty-office-6/256/custom-reports-icon.png',
      signInLoader: false,
    };
  }

  componentDidMount() {
    BackHandler.addEventListener(
      'hardwareBackPress',
      this.handleBackButtonClick,
    );
  }

  componentWillUnmount() {
    BackHandler.removeEventListener(
      'hardwareBackPress',
      this.handleBackButtonClick,
    );
  }

  handleBackButtonClick = () => {
    Navigation.pop(this.props.componentId);
    return true;
  };

  setSignInLoader = (val: boolean) => {
    this.setState({
      signInLoader: val,
    });
  };

  onDateChange = (date: any) => {
    this.setState({
      billingDate: date.toString(),
    });
  };

  handleTitleChanged = (text: string) => {
    this.setState({name: text});
  };

  handlePriceChanged = (val: string) => {
    this.setState({
      formattedPrice: {...this.state.formattedPrice, value: parseFloat(val)},
    });
  };

  handleCurrencyChanged = (val: string) => {
    this.setState({
      formattedPrice: {...this.state.formattedPrice, currency: val},
    });
  };

  handleCategoryChanged = (text: string) => {
    this.setState({categories: [text]});
    this.setState({icon: String(customSubscriptionIcons.get(text))});
  };

  handleAddPress = async () => {
    this.setState({
      signInLoader: true,
    });

    if (
      this.state.name &&
      this.state.categories &&
      this.state.billingDate &&
      typeof this.state.name === 'string' &&
      //purposly took out check for category because it is object not string here
      !isNaN(parseFloat(this.state.formattedPrice.value.toString()))
    ) {
      let resp = await postCustomSubscription(this.state);
      if (resp === 'Bad Input') {
        console.error('bad input: ', resp);
      }

      itemsStore.setNewItemToHome(resp);
      // why does this set only work when we scroll on the screen???

      Navigation.pop(this.props.componentId);
    } else {
      this.setState({
        signInLoader: false,
      });
      Alert.alert(
        'Naughty boy! Looks like you did not fill in all the details correctly..',
      );
    }
  };

  renderRadioButton = (text: string) => {
    return (
      <View row centerV marginB-5 key={text}>
        <RadioButton
          value={text}
          label={text}
          labelStyle={styles.radioLabelStyle}
        />
      </View>
    );
  };

  render() {
    const {billingDate} = this.state;
    const startDate = billingDate ? billingDate.toString() : '\n';
    const minDate = new Date(); // Today
    let maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 1);
    return (
      <View flex style={styles.screenBackground}>
        <ScrollView>
          <View padding-s5 paddingT-60>
            <TextField
              title="Subscription name"
              style={styles.inputText}
              containerStyle={styles.input}
              placeholder="Enter subscription name"
              validate="required"
              errorMessage="This is a mandatory field "
              useTopErrors={true}
              onChangeText={(text: string) => this.handleTitleChanged(text)}
            />
            <View>
              <RadioGroup
                onValueChange={(val: any) => {
                  this.handleCategoryChanged(val);
                }}>
                <Text
                  style={{...styles.input, color: Colors.grey30, marginTop: 8}}>
                  Select category
                </Text>
                {keysForCustomSubscriptionIcons.map((category: string) =>
                  this.renderRadioButton(category),
                )}
              </RadioGroup>
              <View
                style={{
                  flex: 1,
                  right: 0,
                  position: 'absolute',
                  marginTop: '20%',
                  marginRight: '5%',
                }}>
                <Image
                  source={{
                    uri: this.state.icon,
                  }}
                  style={{
                    height: 120,
                    width: 120,
                    marginRight: '10%',
                  }}
                />
              </View>
            </View>
            <TextField
              style={styles.inputText}
              title="Price"
              containerStyle={styles.input}
              placeholder="Enter price per month"
              validate="price"
              errorMessage="Price is invalid"
              useTopErrors={true}
              onChangeText={(val: string) => this.handlePriceChanged(val)}
            />
            <Picker
              title="Change currency"
              style={styles.inputText}
              useNativePicker
              value={this.state.formattedPrice.currency}
              onChange={(currency: string) =>
                this.handleCurrencyChanged(currency)
              }
              containerStyle={{marginTop: 10}}
              wheelPickerProps={{
                style: {width: 200},
                color: Colors.violet30,
                labelStyle: {
                  fontSize: 32,
                  fontFamily: 'sans-serif-condensed-light',
                },
                itemHeight: 55,
              }}
              selectLabelStyle={{color: Colors.violet30}}
              cancelLabelStyle={{color: Colors.violet30}}>
              {CurrencyOptions.map((currency) => (
                <Picker.Item key={currency} value={currency} label={currency} />
              ))}
            </Picker>
            <Picker
              title="Change Frequency"
              style={styles.inputText}
              useNativePicker
              value={this.state.billingFreq}
              onChange={(newFreq: string) =>
                this.setState({billingFreq: newFreq})
              }
              containerStyle={{marginTop: 10}}
              wheelPickerProps={{
                style: {width: 200},
                color: Colors.violet30,
                labelStyle: {
                  fontSize: 32,
                  fontFamily: 'sans-serif-condensed-light',
                },
                itemHeight: 55,
              }}
              selectLabelStyle={{color: Colors.violet30}}
              cancelLabelStyle={{color: Colors.violet30}}>
              {FreqOptionsKeys.map((freqName) => (
                <Picker.Item
                  key={freqName}
                  value={FreqOptions.get(freqName)}
                  label={freqName}
                />
              ))}
            </Picker>
          </View>
          <View>
            <Text
              style={{...styles.subTitle, color: Colors.grey30, fontSize: 16}}>
              Next Billing Date: {startDate}
            </Text>
          </View>
          <View style={styles.backgroundContainer}>
            <CalendarPicker
              onDateChange={this.onDateChange}
              minDate={minDate}
              maxDate={maxDate}
              selectedDayColor="#ED7D31"
              selectedDayTextColor={Colors.white}
              //customDatesStyles={{color: Colors.white}}
            />
          </View>
          <TouchableOpacity
            style={{
              marginTop: 20,
              marginBottom: 20,
              width: '50%',
              alignSelf: 'center',
            }}
            onPress={this.handleAddPress}>
            <LinearGradient
              colors={['#ED7D31', '#ED7D31']}
              style={signInStyles.signIn}>
              {this.state.signInLoader ? (
                <LoaderScreen loaderColor={'black'} />
              ) : (
                <Text
                  style={[
                    signInStyles.textSign,
                    {
                      color: '#fff',
                    },
                  ]}>
                  ADD
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <KeyboardAwareInsetsView />
        </ScrollView>
      </View>
    );
  }
}

function delay(ms: number) {
  return new Promise( resolve => setTimeout(resolve, ms) );
}

export default AddCustomSubscriptionScreen;
