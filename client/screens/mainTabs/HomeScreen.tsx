import React from 'react';
import {FlatList, Platform, Alert, LogBox } from 'react-native';
import * as Animatable from 'react-native-animatable';
import {
  Colors,
  ListItem,
  Text,
  View,
  Switch,
  Card,
  LoaderScreen,
  Drawer,
  Button,
  FeatureHighlight,
  Typography,
} from 'react-native-ui-lib';
import {connect} from 'remx';
import {
  itemsStore,
  Item,
  unSubscribeItemFromHomeScreen,
} from '../../store/itemsStore';
import {styles} from '../../utils/styleSheet';
import {userStore} from '../../store/userStore';
import {gestureHandlerRootHOC} from 'react-native-gesture-handler';
import {Navigation} from 'react-native-navigation';
import {getMainAppComponentId, delay, invFreqOptions} from '../../utils/utils';
import {ConfirmDialog} from 'react-native-simple-dialogs';
import Toggle from '../../utils/Toggle'



interface Props {
  data: Item[];
  totalPrice: number;
}

interface State {
  onDeleteSubscrptionLoader: boolean;
  onAddCustomSubLoader: boolean;
  showTotalPriceDialog: boolean;
  showFTE: boolean,
  currentTargetIndex: number
}

class HomeScreen extends React.PureComponent<Props, State> {
  targets: any;
  constructor(props: Props) {
    super(props);
    this.state = {
      onDeleteSubscrptionLoader: false,
      onAddCustomSubLoader: false,
      showTotalPriceDialog: false,
      showFTE: false,
      currentTargetIndex: 0
    };
    this.targets = {};
  }

  componentDidMount() {
    //LogBox.ignoreLogs(['Animated: `useNativeDriver`']);  // TODO - this is so annoying for now i just turn it off because there
    // doesnt seem to be a fix: https://stackoverflow.com/questions/61014661/animated-usenativedriver-was-not-specified-issue-of-reactnativebase-input
    // setting timeout to allow Android's transition animation to complete
    // if (itemsStore.getHomeScreenItems().length > 0 && itemsStore.getHomeScreenItems()[0].id === 'EXAMPLE1') {
    //   setTimeout(() => {
    //     this.showHighlight();
    //   }, 1000);
    // }
    
  }

  onValueChange = (newVal: boolean, id: number) => {
    itemsStore.setHomeScreenItemStatus(id, newVal);
  };

  handleDeleteSubscription = async (item: Item) => {
    this.setState({onDeleteSubscrptionLoader: true});
    if(item.status) {
      Alert.alert('for swiping out you need to unsuscribe first...')
      this.setState({onDeleteSubscrptionLoader: false});
    }
    else {
      const res = await unSubscribeItemFromHomeScreen(item.id.toString());
      if(res) {
        this.setState({onDeleteSubscrptionLoader: false});
      } else {
        await delay(2500); // in case loader has not finshed
      }
    }
  };

  getSymbol = (currency: string) => {
    let currencySymbol = '$';
    if (currency === 'EUR') {
      currencySymbol = '€';
    } else if (currency === 'ILS') {
      currencySymbol = '₪';
    }
    return currencySymbol;
  };

  renderRow(item: Item, id: number) {
    const itemPrice = item.formattedPrice.value;
    const itemSymbol = this.getSymbol(item.formattedPrice.currency);

    return (
      <Animatable.View      
        style={{backgroundColor: 'black'}}
        animation="fadeInRight"
        duration={500}
        easing="ease-out-expo"
        useNativeDriver>
        <Drawer
          leftItem={{
            text: 'delete',
            background: Colors.red30,
            onPress: () => this.handleDeleteSubscription(item),
          }}
          rightItems={
            //  we can pu this back one day
            // !item.status  
            item.signUpUrl ?
              // ? 
              [
                  {
                    text: 'Go to Website',
                    background: Colors.green30,
                    onPress: () => this.handleSubWebPress(item.id),
                  },
                ] : []
              // : [
              //     {
              //       text: 'Unsubscribe coming soon..',
              //       background: Colors.red30,
              //       onPress: () => {},
              //     },
              //   ]
          }>
          <ListItem
            activeBackgroundColor={styles.activeBackgroundColor.color}
            activeOpacity={0.3}
            height={77.5}
            onPress={() => this.handleSubPress(item.id)}
            onLongPress={() => this.handleSubWebPress(item.id)}>
            <ListItem.Part left containerStyle={styles.backgroundContainer}>
              <Animatable.Image
                source={{uri: item.icon}}
                style={styles.image}
              />
            </ListItem.Part>
            <ListItem.Part middle
              containerStyle={[styles.border, {paddingRight: 17}]}>
              <ListItem.Part column containerStyle={{marginTop: 17}}>
                <Text
                  // ref={(r: any) => (this.addTarget(r, '0'))}
                  dark10
                  text70
                  style={styles.listItemText}
                  numberOfLines={1}>
                  {item.name}
                </Text>
                <Text
                  style={{flex: 1, marginRight: 10}}
                  text90
                  dark40
                  numberOfLines={1}>{`${itemPrice}${itemSymbol}/${invFreqOptions.get(item.billingFreq)}`}</Text>
              </ListItem.Part>
              <ListItem.Part right>
                {/* <View ref={(r: any) => (Platform.OS == 'ios' ? this.addTarget(r, '3') : null)}>  */}
                <View>
              <Toggle
                onPress={()=>{itemsStore.setHomeScreenItemStatus(id, !item.status);}}
                initialState={item.status}
                />
                </View>
              </ListItem.Part>
            </ListItem.Part>
          </ListItem>
        </Drawer>
      </Animatable.View>
    );
  }

  handleSubPress = (itemId: string) => {
    this.setState({onAddCustomSubLoader: true});
    Navigation.push(getMainAppComponentId(), {
      component: {
        name: 'subscriptionScreen',
        passProps: {id: itemId},
        options: {
          topBar: {
            title: {
              text: 'Subscriptions',
            },
          },
        },
      },
    });
    this.setState({onAddCustomSubLoader: false});
  };

  handleSubWebPress = (itemId: string) => {
    // todo -> add like green right swipe or something in order
    this.setState({onAddCustomSubLoader: true});
    Navigation.push(getMainAppComponentId(), {
      component: {
        name: 'webActionScreen',
        passProps: {itemId: itemId},
        options: {
          topBar: {
            title: {
              text: 'Subscriptions',
            },
          },
        },
      },
    });
    this.setState({onAddCustomSubLoader: false});
  };

  handleAddCustomSubPress = () => {
    this.setState({onAddCustomSubLoader: true});
    Navigation.push(getMainAppComponentId(), {
      component: {
        name: 'addCustomSubscriptionScreen',
        options: {
          topBar: {
            title: {
              text: 'Add Subscription',
            },
          },
        },
      },
    });
    this.setState({onAddCustomSubLoader: false});
  };

  calcTotalPriceRates = () => {
    const totalPrice = this.props.totalPrice;
    const currencyRates = itemsStore.getCurrencyRates();
    const currentCurrency = userStore.getCurrency();
    const priceInILS =
      Math.round(
        (currencyRates[currentCurrency]['ILS'] * totalPrice + Number.EPSILON) *
          100,
      ) / 100;
    const priceInUSD =
      Math.round(
        (currencyRates[currentCurrency]['USD'] * totalPrice + Number.EPSILON) *
          100,
      ) / 100;
    const priceInEUR =
      Math.round(
        (currencyRates[currentCurrency]['EUR'] * totalPrice + Number.EPSILON) *
          100,
      ) / 100;
    return {priceInILS, priceInUSD, priceInEUR};
  };

  renderAddCustomButton = () => {
    return this.state.onAddCustomSubLoader ? (
      <LoaderScreen />
    ) : (
      <Button
        // ref={(r: any) => (this.addTarget(r, '1'))}
        style={{
          marginBottom: 15,
          marginTop: 15,
          width: '60%',
          alignSelf: 'center',
          backgroundColor: '#ED7D31',
        }}
        outlineColor={'white'}
        outlineWidth={1}
        outline
        iconSource={require('../../../assets/homeScreenIcons/plus.png')}
        label="Add Custom Billing"
        onPress={this.handleAddCustomSubPress}
      />
    );
  };

  renderTotalPriceDialog = () => {
    const {priceInILS, priceInUSD, priceInEUR} = this.calcTotalPriceRates();
    const message = `${priceInUSD}${itemsStore.getCurrencySymbol(
      'USD',
    )}\n${priceInEUR}${itemsStore.getCurrencySymbol(
      'EUR',
    )}\n${priceInILS}${itemsStore.getCurrencySymbol('ILS')}`;
    return (
      <ConfirmDialog
        titleStyle={{fontSize: 14}}
        title="Monthly Forecasted Rate By Currency"
        visible={this.state.showTotalPriceDialog}
        message= {message}
        onTouchOutside={() => this.setState({showTotalPriceDialog: false})}
        positiveButton={{
          title: 'OK',
          onPress: () => this.setState({showTotalPriceDialog: false})
        }}/>
    );
  }

  renderTotalPrice = () => {
    return (
      // <View  ref={r => (Platform.OS == 'ios' ? this.addTarget(r, '2') : null)}>
      <View>
      <Card
      style={{...styles.cardStyle, backgroundColor: Colors.grey50, marginHorizontal: 10, borderRadius: 10}}
        row
        height={90}
        onPress={() => {
          this.setState({showTotalPriceDialog: true})
        }}
        accessibilityStates={false}>
        <Card.Section        
          content={[
            {
              text: `Total: ${
                this.props.totalPrice
              }${userStore.getUserCurrencySymbol()}`,
              text40BO: true,
              color: '#6495ED',
            },
          ]}
        />
      </Card>
      </View>
    );
  };

//   addTarget(ref: any, id: any) {
//     if (ref && !this.targets[id]) {
//       this.targets[id] = ref;
//     }
//   }

//   moveToPage(index: number) {
//     if ((Platform.OS === 'android' && index < 2) ||  (Platform.OS === 'ios' && index < titles.length)) {
//       this.setState({currentTargetIndex: index});
//     } else {
//       this.closeHighlight();
//     }
//   }

//   closeHighlight = () => {
//     this.setState({showFTE: false});
//     this.handleDeleteSubscription(itemsStore.getHomeScreenItems()[0])
//   }

//   showHighlight = () => {
//     this.setState({showFTE: true});
//   }

//   getPageControlProps() {
//     return {
//       numOfPages: Platform.OS === 'ios' ? titles.length : 2, 
//       currentPage: this.state.currentTargetIndex, 
//       onPagePress: this.onPagePress,
//       color: Colors.dark30,
//       inactiveColor: Colors.dark80,
//       size: 8
//     };
//   }

//   onPagePress = (index: number) => {
//     this.moveToPage(index);
//   }

//   moveNext = () => {
//     const {currentTargetIndex} = this.state;
//     const newTargetIndex = currentTargetIndex + 1;
//     this.moveToPage(newTargetIndex);
//   }

//   renderHighlighterOverlay() {
//     const {showFTE, currentTargetIndex} = this.state;
//     return (
//       <FeatureHighlight
//         visible={showFTE}
//         title={titles[currentTargetIndex]}
//         message={messages[currentTargetIndex]}
//         // titleStyle={{...Typography.text70}}
//         // messageStyle={{...Typography.text60, fontWeight: '900', lineHeight: 28}}
//         confirmButtonProps={{label: 'Got It', onPress: this.moveNext}}
//         onBackgroundPress={this.closeHighlight}
//         getTarget={() => this.targets[currentTargetIndex]}
//         // todo : this can be used also for tabs and stuff
//         //highlightFrame={{x: Dimensions.get('screen').width / 10 , y: Dimensions.get('window').height - 80, width: 60, height: 70}}
//         borderRadius={currentTargetIndex === 2 ? 10 : undefined}
//         pageControlProps={this.getPageControlProps()}
//       />
//     );
//   }

  render() {
    let curHour = new Date().getHours();
    return (
      <View style={{flex: 1, marginTop: Platform.OS === 'ios' ? '20%' : '10%'}}>
        <View row>
        <Text style={styles.title}>{curHour > 15 ? 'Good Evening' : (curHour > 11 ? 'Good Afternoon' : 'Good Morning')}</Text>
          <Text style={{...styles.userName, marginLeft: 5}}>{userStore.getfirstName()}</Text>        
        </View>
        <Text style={styles.subTitle}>My subscriptions</Text>
        {this.state.onDeleteSubscrptionLoader ? (
          <LoaderScreen message="Loading..." />
        ) : (
          <FlatList
            data={this.props.data}
            renderItem={({item, index}) => this.renderRow(item, index)}
            keyExtractor={(item) => item.name}
            contentContainerStyle={styles.profileListItem}
            ListFooterComponent={
              <View>
                {this.renderAddCustomButton()}
                {this.renderTotalPrice()}
                {this.renderTotalPriceDialog()}
              </View>
              
            }
          />
        )}
        {/* {this.renderHighlighterOverlay()} */}
      </View>
    );
  }
}

function mapStateToProps() {
  return {
    data: itemsStore.getHomeScreenItems(),
    totalPrice: itemsStore.getTotalSubscriptionPrice(),
  };
}

const titles = [
  'Click, Swipe left, Swipe right',
  'Add your own subscriptions',
  'Monthly Forecast',
  'Cancel a subscription and reactivate it, all with a single switch',
];

const messages = [
  'Click on subscription to go to its details page, set billing reminders, swipe right for delete if inactive, swipe left for website',
  'you can add your own subscriptions to track if they dont yet appear under the Explore tab',
  'Click to see monthly payment forecast. converted each time to a different single currency',
  'while this switch is active, you are subscribed. to cancel, just switch. never been more simple',
];

export default connect(mapStateToProps)(gestureHandlerRootHOC(HomeScreen));