import React from 'react';
import {ScrollView, TouchableOpacity, BackHandler} from 'react-native';
import {
  View,
  StateScreen,
  Card,
  LoaderScreen,
  Button,
  Picker,
  TextField,
  Colors,
  Text
} from 'react-native-ui-lib';
import {styles} from '../utils/styleSheet';
import {Navigation} from 'react-native-navigation';
import {itemsStore} from '../store/itemsStore';
import CalendarPicker from 'react-native-calendar-picker';
import {ConfirmDialog} from 'react-native-simple-dialogs';
import {CurrencyOptions} from '../utils/utils';
import {Icon} from 'react-native-elements';
import LinearGradient from 'react-native-linear-gradient';
import {signInStyles} from './loginScreens/styleSheet';


interface Props {
  componentId: string;
  itemName: string;
  itemFormattedPrice: {value: number; currency: string};
  itemId: string;
  navigation: any;
}

interface State {
  onPressLoader: boolean;
  billingDate: string;
  price: {value: number; currency: string};
  showEditPriceDialog: boolean;
  tmpCurrency: string; //for presenting on dialog screen
  tmpPrice: number; //for presenting on dialog screen
  showCalnderPicker: boolean;
}

const remoteImageSource = {
  uri:
    'https://www.elegantthemes.com/blog/wp-content/uploads/2017/10/featuredimage-10.jpg',
};


class JoinToSubscriptionScreen extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      onPressLoader: false,
      showEditPriceDialog: false,
      billingDate: '',
      price: {
        value: this.props.itemFormattedPrice.value,
        currency: this.props.itemFormattedPrice.currency,
      },
      tmpCurrency: this.props.itemFormattedPrice.currency,
      tmpPrice: this.props.itemFormattedPrice.value,
      showCalnderPicker: false,
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

  handleSubscribePress = async () => {
    this.setState({onPressLoader: true});
    const billingDate = this.state.billingDate
      ? this.state.billingDate
      : new Date().toString();
    await itemsStore.subscribeItemFromExploreScreen(
      this.props.itemId,
      this.state.price,
      billingDate,
    );
    Navigation.pop(this.props.componentId);
    this.props.navigation.navigate('Home');
    this.setState({onPressLoader: false});
  };

  onDateChange = (date: any) => {
    this.setState({
      billingDate: date.toString(),
    });
  };

  renderPrice = () => {
    return (
      <Card
        row
        height={90}
        //style={{marginTop: '2%', marginBottom: '5%', backgroundColor: Colors.green30}}
        style={styles.cardStyle}
        onPress={() => this.setState({showEditPriceDialog: true})}
        accessibilityStates={false}>
        <Card.Section
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
          }}
          content={[
            {
              text: `${this.state.price.value}${itemsStore.getCurrencySymbol(
                this.state.price.currency,
              )}`,
              text40BO: true,
              color: '#6495ED',
            },
          ]}
        />
        <View style={{position: 'absolute', alignSelf: 'center', right: 0}}>
          <Button
            text90
            link
            iconSource={require('../../assets/profile/pencil.png')}
            iconStyle={{height: 15, width: 15}}
            style={{marginRight: 15}}
            onPress={() => this.setState({showEditPriceDialog: true})}
          />
        </View>
      </Card>
    );
  };

  renderDialog = () => {
    return (
      <ConfirmDialog
        visible={this.state.showEditPriceDialog}
        title="Edit Price"
        onTouchOutside={() => this.setState({showEditPriceDialog: false})}
        positiveButton={{
          title: 'OK',
          onPress: () => {
            this.setState({
              price: {
                currency: this.state.tmpCurrency,
                value: this.state.tmpPrice,
              },
              showEditPriceDialog: false,
            });
          },
        }}
        negativeButton={{
          title: 'Cancel',
          onPress: () => this.setState({showEditPriceDialog: false}),
        }}>
        <View>
          <TextField
            title="Enter Price"
            containerStyle={styles.input}
            placeholder="enter price"
            onChangeText={(val?: string) => {
              if (val && !isNaN(parseFloat(val))) {
                this.setState({tmpPrice: parseFloat(val)});
              }
            }}
          />
          <Picker
            title="Change currency"
            useNativePicker
            value={this.state.tmpCurrency}
            onChange={(currency: string) =>
              this.setState({tmpCurrency: currency})
            }
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
        </View>
      </ConfirmDialog>
    );
  };

  renderBillingDate = () => {
    const minDate = new Date(); // Today

    return (
      <View style={{alignItems: 'center'}}>
        <Text style={{marginBottom: '2%', color: Colors.grey40}}>
          Choose a payment date
        </Text>
        <Icon
          name={'today'}
          underlayColor="transparent"
          iconStyle={{color: Colors.grey20, fontSize: 30, marginBottom: '3%'}}
          onPress={() =>
            this.setState({showCalnderPicker: !this.state.showCalnderPicker})
          }
        />
        <View style={styles.backgroundContainer}>
          {this.state.showCalnderPicker ? (
            <CalendarPicker
              onDateChange={this.onDateChange}
              minDate={minDate}
              selectedDayColor="#ED7D31"
              selectedDayTextColor={Colors.white}
            />
          ) : null}
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
        onPress={this.handleSubscribePress}>
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
            ADD
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  render() {
    let subtitle: string;
    subtitle = 'Customize Price and Billing Date';
    return (
      <View style={styles.pageView}>
        {this.state.onPressLoader ? (
          <LoaderScreen message="Loading..." />
        ) : (
          <ScrollView>
            <StateScreen
              title={'Adding ' + this.props.itemName + ' to Home Page'}
              subtitle={[subtitle]}
              imageSource={remoteImageSource}
            />
            {this.renderDialog()}
            {this.renderPrice()}
            {this.renderBillingDate()}
            {this.renderAddButton()}
          </ScrollView>
        )}
      </View>
    );
  }
}

export default JoinToSubscriptionScreen;