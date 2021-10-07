import React from 'react';
import {
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  Dimensions,
  useWindowDimensions,
  BackHandler,
} from 'react-native';
import {
  View,
  StateScreen,
  Card,
  LoaderScreen,
  Button,
  Picker,
  TextField,
  Colors,
  Text,
  Image,
  Modal
} from 'react-native-ui-lib';
import {styles} from '../utils/styleSheet';
import {Navigation} from 'react-native-navigation';
import {itemsStore} from '../store/itemsStore';
import {userStore} from '../store/userStore';
import CalendarPicker from 'react-native-calendar-picker';
import {ConfirmDialog} from 'react-native-simple-dialogs';
import {CurrencyOptions} from '../utils/utils';
import {Icon} from 'react-native-elements';
import LinearGradient from 'react-native-linear-gradient';
import {signInStyles} from './loginScreens/styleSheet';
import { requestOneTimePayment, requestBillingAgreement } from 'react-native-paypal';
import { WebView } from 'react-native-webview';
import {sendNonce, endpoint, getBrainTreeToken} from '../utils/serverApi'


interface Props {
  componentId: string;
  itemName: string;
  itemFormattedPrice: {value: number; currency: string};
  itemId: string;
  navigation: any;
  about: string;
  icon: string;
  packages: any[];
  choices: any[];
  signUpUrl: string;
  shippingInfo: string[];
  webInfo: string[];
  billingDate: string;
  gallery: string[];
}

interface State {
  onPressLoader: boolean;
  selectedPackageIdx: number;
  chosenOptions: number[];
  showModal: boolean;
}

const shippingIcon = require('../../assets/joinToSubscription/shoppingCart.png');
const webIcon = require('../../assets/joinToSubscription/web.png');

class JoinToBoxScreen extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      showModal: false,
      chosenOptions: [],
      onPressLoader: false,
      selectedPackageIdx: 0,
    };
  }

  componentDidMount() {
    BackHandler.addEventListener(
      'hardwareBackPress',
      this.handleBackButtonClick,
    );
    this.setState({
      chosenOptions: [...Array(this.props.choices.length).fill(0)],
    });
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

  handleSubscribePress = async () => {
    this.setState({onPressLoader: true});
    const billingDate = this.props.billingDate
      ? this.props.billingDate
      : new Date().toString();
    await itemsStore.subscribeItemFromExploreScreen(
      this.props.itemId,
      this.props.itemFormattedPrice,
      billingDate,
    );
    Navigation.pop(this.props.componentId);
    this.props.navigation.navigate('Home');
    this.setState({onPressLoader: false});
  };

  //   onDateChange = (date: any) => {
  //     this.setState({
  //       billingDate: date.toString(),
  //     });
  //   };

  renderSubImage = () => {
    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Card
          row
          // height={30}
          // width={300}
          //style={{marginTop: '2%', marginBottom: '5%', backgroundColor: Colors.green30}}
          style={{
            ...styles.cardStyle,
            backgroundColor: Colors.grey50,
            marginHorizontal: 10,
            marginBottom: 10,
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            display: 'flex',
          }}
          accessibilityStates={false}>
          <Image
            source={{
              uri: this.props.packages[this.state.selectedPackageIdx].picture,
            }}
            style={{
              height: 260,
              width: 350,
              marginVertical: 10,
              marginHorizontal: 10,
              alignContent: 'center',
              borderRadius: 10,
            }}
          />
        </Card>
      </View>
      // TODO try Card.Image maybe better!
    );
  };

  renderGallery = () => {
    return (
      <ScrollView horizontal={true}>
        {this.props.gallery.map((pic, index) => {
          return (
            <View
              key={index}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Card
                row
                key={-index}
                // height={30}
                // width={300}
                //style={{marginTop: '2%', marginBottom: '5%', backgroundColor: Colors.green30}}
                style={{
                  ...styles.cardStyle,
                  backgroundColor: Colors.grey50,
                  marginHorizontal: 10,
                  marginBottom: 10,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: 1,
                  display: 'flex',
                }}
                accessibilityStates={false}>
                <Image
                  source={{
                    uri: pic,
                  }}
                  style={{
                    height: 260,
                    width: 350,
                    marginVertical: 10,
                    marginHorizontal: 10,
                    alignContent: 'center',
                    borderRadius: 10,
                  }}
                />
              </Card>
            </View>
          );
        })}
      </ScrollView>

      // TODO try Card.Image maybe better!
    );
  };

  renderAbout = () => {
    return (
      <Card
        row
        height={Math.max((this.props.about.length * 2) / 3, 100)}
        //style={{marginTop: '2%', marginBottom: '5%', backgroundColor: Colors.green30}}
        style={{
          ...styles.cardStyle,
          backgroundColor: Colors.grey50,
          marginHorizontal: 10,
          marginBottom: 10,
        }}
        accessibilityStates={false}>
        <Card.Section
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            marginHorizontal: 30,
          }}
          content={[
            {
              style: {textAlign: 'center'},
              text: 'About',
              text70BO: true,
              color: '#6495ED',
            },
            {
              marginT: true,
              text: this.props.about,
              // text40BO: true,
              // color: '#6495ED',
            },
          ]}
        />
      </Card>
    );
  };

  renderShippingAddress = () => {
    let address = userStore.getAddress();
    return (
      <Card
        row
        height={200}
        //style={{marginTop: '2%', marginBottom: '5%', backgroundColor: Colors.green30}}
        style={{
          ...styles.cardStyle,
          backgroundColor: Colors.grey50,
          marginHorizontal: 10,
          marginVertical: 10,
        }}
        accessibilityStates={false}>
        <Card.Section
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            marginHorizontal: 10,
          }}
          content={[
            {
              style: {textAlign: 'center'},
              text:
                address.country &&
                address.city &&
                address.street &&
                address.number
                  ? 'Shipping Address'
                  : 'Please Complete in Profile:',
              text70BO: true,
              color: '#6495ED',
            },
            {
              marginT: true,
              text: address.country ? address.country : '...Missing Country',
            },
            {
              marginT: true,
              text: address.city ? address.city : '...Missing City',
            },
            {
              marginT: true,
              text: address.street ? address.street : '...Missing Street',
            },
            {
              marginT: true,
              text: address.number ? address.number : '...Missing Number',
            },
          ]}
        />
      </Card>
    );
  };

  renderDetailsCard = (
    details: string[],
    title: string,
    icon: any,
    onPress?: any,
  ) => {
    return (
      <Card
        height={70 + 10 * details.length}
        //style={{marginTop: '2%', marginBottom: '5%', backgroundColor: Colors.green30}}
        style={{
          ...styles.cardStyle,
          backgroundColor: Colors.grey50,
          marginHorizontal: 10,
          marginBottom: 10,
        }}
        accessibilityStates={false}>
        <Card.Section
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            marginLeft: 30,
            marginRight: 50, // need extra 15 for icon!! good catch
          }}
          content={[
            {
              text: title,
              text70BO: true,
              color: '#6495ED',
            },
          ]}
        />
        {details.map((ele, index) => {
          return (
            <Text
              style={{
                marginLeft: 30,
                marginRight: 50,
                marginBottom: index === details.length - 1 ? 10 : 0,
              }}
              key={index}>
              {ele}
            </Text>
          );
        })}
        <View style={{position: 'absolute', alignSelf: 'center', right: 0}}>
          <Button
            link
            iconSource={icon}
            iconStyle={{height: 30, width: 30}}
            style={{marginRight: 15}}
            onPress={onPress ? onPress : null}
          />
        </View>
      </Card>
    );
  };
  openWebsite = () => {
    Linking.openURL(this.props.signUpUrl).catch((err: any) =>
      console.error("Couldn't load page", err),
    );
  };

  goToPaypalExternal = () => {
    Linking.openURL('http://0.0.0.0/pay_button').catch((err: any) =>
      console.error("Couldn't load page", err),
    );
  };

  showShippingDetails = () => {
    this.setState({showModal: true});
  };

  renderChoices = () => {
    return (
      // can i remove this return? TODO
      this.props.choices.map((choice, index) => {
        return (
          <View key={index}>
            <Text
              key={choice.name + index.toString()}
              style={{textAlign: 'center', marginBottom: 10}}>
              {choice.name}
            </Text>
            <ScrollView
              horizontal={true}
              key={index}
              contentContainerStyle={choice.length < 4 ? {flex: 1} : {}}>
              {choice.options.map((ele: any, opIndex: number) => {
                return (
                  <Card
                    key={opIndex.toString() + index.toString()}
                    row
                    height={90}
                    width={140}
                    //style={{marginTop: '2%', marginBottom: '5%', backgroundColor: Colors.green30}}
                    style={{
                      ...styles.cardStyle,
                      backgroundColor:
                        this.state.chosenOptions[index] === opIndex
                          ? Colors.grey30
                          : Colors.grey50,
                      marginHorizontal: 5,
                      marginBottom: 10,
                    }}
                    onPress={() => {
                      this.setState((oldState) => {
                        const newList = [...oldState.chosenOptions];
                        newList[index] = opIndex;
                        return {chosenOptions: newList};
                      });
                    }}
                    accessibilityStates={false}>
                    <Card.Section
                      style={{
                        flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                      content={[
                        {
                          style: {textAlign: 'center'},
                          text: ele, // TODO : make this dollar dynamic
                          text60BO: true,
                          color:
                            this.state.chosenOptions[index] === opIndex
                              ? '#ED7D31'
                              : '#6495ED',
                        },
                      ]}
                    />
                  </Card>
                );
              })}
            </ScrollView>
          </View>
        );
      })
    );
  };

  renderPackageAbout = () => {
    return (
      <Card
        row
        height={130}
        //style={{marginTop: '2%', marginBottom: '5%', backgroundColor: Colors.green30}}
        style={{
          ...styles.cardStyle,
          backgroundColor: Colors.grey50,
          marginHorizontal: 10,
          marginBottom: 10,
        }}
        accessibilityStates={false}>
        <Card.Section
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            marginHorizontal: 40,
          }}
          content={[
            {
              style: {textAlign: 'center'},
              text: this.props.packages[this.state.selectedPackageIdx].name,
              text70BO: true,
              color: '#6495ED',
            },
            {
              marginT: true,
              text: this.props.packages[this.state.selectedPackageIdx].about,
              // text40BO: true,
              // color: '#6495ED',
            },
          ]}
        />
      </Card>
    );
  };

  renderPackages = () => {
    return (
      <View>
        <ScrollView
          horizontal={true}
          contentContainerStyle={
            this.props.packages.length < 4 ? {flex: 1} : {}
          }
          // style={{flexDirection:'row',
          // alignItems:'center',
          // justifyContent:'center'}}
        >
          {this.props.packages.map((item, index) => {
            return (
              <Card
                key={item.name}
                row
                height={90}
                width={150}
                //style={{marginTop: '2%', marginBottom: '5%', backgroundColor: Colors.green30}}
                style={{
                  ...styles.cardStyle,
                  backgroundColor:
                    this.state.selectedPackageIdx === index
                      ? Colors.grey30
                      : Colors.grey50,
                  marginHorizontal: 5,
                  marginBottom: 10,
                  justifyContent: 'center',
                }}
                onPress={() => this.setState({selectedPackageIdx: index})}
                accessibilityStates={false}>
                <Card.Section
                  style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                  content={[
                    {
                      text: item.name,
                    },
                    {
                      style: {textAlign: 'center'},
                      text: '$' + item.price, // TODO : make this dollar dynamic
                      text60BO: true,
                      color:
                        this.state.selectedPackageIdx === index
                          ? '#ED7D31'
                          : '#6495ED',
                    },
                  ]}
                />
              </Card>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  renderBillingDate = () => {
    const minDate = new Date(); // Today
    const bDate = new Date(this.props.billingDate);
    return (
      <View style={{alignItems: 'center'}}>
        {/* <Text style={{marginBottom: '2%', color: Colors.grey40}}>Choose a payment date</Text> */}
        {/* <Icon
          name={'today'}
          underlayColor="transparent"
          iconStyle={{color: Colors.grey20, fontSize: 30, marginBottom: '3%'}}
          onPress={() =>
            this.setState({showCalnderPicker: !this.state.showCalnderPicker})
          }
        /> */}
        <View style={styles.backgroundContainer}>
          <Text
            style={{...styles.input, textAlign: 'center', marginVertical: 10}}>
            Next Billing Date
          </Text>

          <CalendarPicker
            enableDateChange={false}
            selectedStartDate={bDate}
            initialDate={bDate}
            //minDate={minDate}
            selectedDayColor="#ED7D31"
            todayBackgroundColor={styles.backgroundContainer.backgroundColor} //so it is ivisible  maybe better way to do it.. look in docs
            todayTextStyle={{color: 'black'}} // so it is visible invisible,
            selectedDayTextColor={Colors.white}
          />
        </View>
      </View>
    );
  };

  renderAddButton = () => {
    return (
      <TouchableOpacity
        style={{
          marginTop: 20,
          marginBottom: 20,
          width: '50%',
          alignSelf: 'center',
        }}
        onPress={this.handlePayPalPress}>
        {/* // onPress={this.goToPaypalExternal}> */}
        {/* //onPress={this.handleSubscribePress}> */}
        <LinearGradient
          colors={['#ED7D31', '#ED7D31']}
          style={signInStyles.signIn}>
          <Text
            style={[
              signInStyles.textSign,
              {
                color: '#fff',
              },
            ]}>
            Begin Subscription
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  };
  handlePayPalPress = async () => {
    //library:
    //https://www.npmjs.com/package/react-native-paypal
    this.setState({onPressLoader: true});
    const dynamicToken = await getBrainTreeToken();
    //# use here .then like in medium doc??
    //console.warn(dynamicToken);
    const {
      nonce,
      payerId,
      email,
      firstName,
      lastName,
      phone,
    } = await requestOneTimePayment(
      // this will become requestrecurring
      dynamicToken,
      {
        amount: '5', // required
        // any PayPal supported currency (see here: https://developer.paypal.com/docs/integration/direct/rest/currency-codes/#paypal-account-payments)
        currency: 'USD',
        // any PayPal supported locale (see here: https://braintree.github.io/braintree_ios/Classes/BTPayPalRequest.html#/c:objc(cs)BTPayPalRequest(py)localeCode)
        localeCode: 'en_GB',
        shippingAddressRequired: false,
        userAction: 'commit', // display 'Pay Now' on the PayPal review page
        // one of 'authorize', 'sale', 'order'. defaults to 'authorize'. see details here: https://developer.paypal.com/docs/api/payments/v1/#payment-create-request-body
        intent: 'authorize',
      },
    );
    const res = await sendNonce(nonce);
    console.warn(res);
    if (res === 'susccess') {
      Alert.alert('Payed!');
    }
    this.setState({onPressLoader: false});
    console.log(nonce, payerId, email, firstName, lastName, phone);
  };
  render() {
    return (
      <View style={{...styles.pageView, backgroundColor: '#bebebe'}}>
        {this.state.onPressLoader ? (
          <LoaderScreen message="Loading..." />
        ) : (
          <ScrollView style={{flex: 1}}>
            <Text
              style={{
                alignContent: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                fontSize: 30,
                marginVertical: 20,
              }}>
              {this.props.itemName}
            </Text>
            {this.props.gallery.length > 0 ? this.renderGallery() : null}
            {this.renderAbout()}
            {this.props.choices.length > 0 ? this.renderChoices() : null}
            {this.renderSubImage()}
            {this.renderPackages()}
            {this.renderPackageAbout()}
            {this.props.shippingInfo.length > 0
              ? this.renderDetailsCard(
                  this.props.shippingInfo,
                  'Shipping Info',
                  shippingIcon,
                  this.showShippingDetails,
                )
              : null}
            {this.props.webInfo.length > 0
              ? this.renderDetailsCard(
                  this.props.webInfo,
                  'More On Website',
                  webIcon,
                  this.openWebsite,
                )
              : null}
            {this.renderBillingDate()}
            {/* <WebView
                  source={{uri: 'http://0.0.0.0/pay_button'}}
                  style={{height: 500, width: Dimensions.get('window').width}}
                  scrollEnabled={false}
                  sharedCookiesEnabled={true}
                  thirdPartyCookiesEnabled={true}
                /> */}

            {this.renderAddButton()}
            <Modal
              statusBarTranslucent={true}
              enableModalBlur={true} // only works on ios
              transparent={true}
              visible={this.state.showModal}
              onBackgroundPress={() => {
                this.setState({showModal: false});
              }}>
              {/* <Modal.TopBar               
                //includeStatusBar={true}
                cancelLabel={'Cancel'}
                doneLabel={'Done'}
                onCancel={() => this.setState({showModal: false})}
                onDone={() => Alert.alert('done')}               
                title={'Shipping Address'}>
                </Modal.TopBar> */}
              <View
                style={{
                  backgroundColor: 'white',
                  width: 200,
                  height: 200,
                  alignSelf: 'center',
                  top: Dimensions.get('window').height / 2 - 200,
                  borderRadius: 10,
                  alignItems: 'center',
                }}>
                {this.renderShippingAddress()}
              </View>
            </Modal>
          </ScrollView>
        )}
      </View>
    );
  }
}
export default JoinToBoxScreen;