import React from 'react';
import {FlatList, Alert, TouchableOpacity, Platform, BackHandler} from 'react-native';
import {
  Text,
  View,
  Button,
  Image,
  Colors,
  TextField,
  Picker,
  LoaderScreen,
  Drawer,
  ListItem,
} from 'react-native-ui-lib';
import {styles} from '../utils/styleSheet';
import {Icon} from 'react-native-elements';
import CalendarPicker from 'react-native-calendar-picker';
import {
  getHomeDataFromApi,
  updateHomeDataToApi,
  deleteSubscriptionHistoryItem,
  getHistoryExpensesData,
  addSubscriptionHistoryItem,
} from '../utils/serverApi';
import {itemsStore, Item} from '../store/itemsStore';
import {TextInput} from 'react-native-gesture-handler';
import Feather from 'react-native-vector-icons/Feather';
import {ConfirmDialog} from 'react-native-simple-dialogs';
import LinearGradient from 'react-native-linear-gradient';
import {
  CurrencyOptions,
  MonthOptions,
  YearOptions,
  FreqOptions,
  invFreqOptions,
  FreqOptionsKeys,
} from '../utils/utils';
import {PushNotification} from '../../index.js';
import {signInStyles} from './loginScreens/styleSheet'; // todo custom style
import AsyncStorage from '@react-native-async-storage/async-storage';
import prompt from 'react-native-prompt-android';
import {gestureHandlerRootHOC} from 'react-native-gesture-handler';
import NotifService from "../utils/NotifService";
import {Navigation} from 'react-native-navigation';


interface renderdItem {
  key: number;
  value?: string;
  currency?: string;
}

interface State {
  subscriptionUserName: renderdItem;
  subscriptionPassword: renderdItem;
  subscriptionFormattedPrice: renderdItem;
  subscriptionBillingDate: renderdItem;
  subscriptionBillingFreq: renderdItem;
  tmpPriceForDialogs: {value: number; currency: string};
  tmpDateForDialogs: {month: string, year: string};
  itemPaymentsHistory: any[];
  editPriceLoader: boolean;
  showEditPriceDialog: boolean;
  showFrequencyPicker: boolean;
  showHistory: boolean;
  addHistoryDialogFlag: boolean;
  deleteHistoryItemLoader: boolean;
  secureTextEntry: boolean;
  showCalander: boolean;
}

interface Props {
  componentId: string;
  id: string;
}

const wheelPickerProps = {
    style: {width: 200},
    color: Colors.violet30,
    labelStyle: {
      fontSize: 32,
      fontFamily: 'sans-serif-condensed-light',
    },
    itemHeight: 55,
  }

class SubscriptionScreen extends React.PureComponent<Props, State> {
  currSubscription: Item;
  flatList: any; // todo what type is it?
  constructor(props: Props) {
    super(props);
    this.state = {
      subscriptionUserName: {key: 1, value: ''},
      subscriptionPassword: {key: 2, value: ''},
      subscriptionFormattedPrice: {key: 3, value: '', currency: ''},
      subscriptionBillingDate: {key: 4, value: ''},
      subscriptionBillingFreq: {key: 5, value: ''},
      tmpPriceForDialogs: {value: 0, currency: ''},
      tmpDateForDialogs: {month: MonthOptions[0], year: YearOptions[0]},
      itemPaymentsHistory: [],
      editPriceLoader: false,
      showEditPriceDialog: false,
      showFrequencyPicker: false,
      showHistory: false,
      addHistoryDialogFlag: false,
      deleteHistoryItemLoader: false,
      secureTextEntry: true,
      showCalander: false,
    };
    this.currSubscription = itemsStore.getHomeScreenItem(this.props.id);
  }


  componentDidMount() {
    BackHandler.addEventListener(
      'hardwareBackPress',
      this.handleBackButtonClick,
    );
    this.initialUserDetails();
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


  initialUserDetails = async () => {
    const {value, currency} = this.currSubscription.formattedPrice;
    this.setState({
      itemPaymentsHistory: itemsStore.getExpensesHistoryData().allData[
        this.props.id
      ],
      subscriptionUserName: {
        ...this.state.subscriptionUserName,
        value: this.currSubscription.subUsername
          ? this.currSubscription.subUsername
          : '',
      },
      subscriptionFormattedPrice: {
        ...this.state.subscriptionFormattedPrice,
        value: value.toString(),
        currency,
      },
      tmpPriceForDialogs: {value, currency},
      subscriptionBillingDate: {
        ...this.state.subscriptionBillingDate,
        value: this.currSubscription.billingDate,
      },
      subscriptionBillingFreq: {
        ...this.state.subscriptionBillingFreq,
        value: invFreqOptions.get(this.currSubscription.billingFreq),
      },
    });
    // ***** get curSub password from async storage *****
    try {
      const value = await AsyncStorage.getItem(
        `${this.currSubscription.name}@password`,
      ); //'storage_Key = `${this.curSub.name}@password`
      if (value !== null) {
        this.setState({
          subscriptionPassword: {...this.state.subscriptionPassword, value},
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  setAllItemsWithApi = async () => {
    const homeScreenItems = await getHomeDataFromApi();
    itemsStore.setHomeScreenItems(homeScreenItems);
  };

  onConfirmEditPrice = async () => {
    this.setState({editPriceLoader: true});
    const {value, currency} = this.state.tmpPriceForDialogs;
    const res = await updateHomeDataToApi({
      id: this.currSubscription.id,
      formattedPrice: {value, currency},
    });
    if (res.formattedPrice) {
      await this.setAllItemsWithApi();
      this.setState({
        subscriptionFormattedPrice: {
          ...this.state.subscriptionFormattedPrice,
          value: value.toString(),
          currency,
        },
        showEditPriceDialog: false,
        editPriceLoader: false,
      });
    } else {
      Alert.alert('update failed..');
    }
  };

  handleChangeFreqPress = async (newFreq: string) => {
    if (!newFreq) {
      newFreq = '0-1-0';
    }
    this.setState({
      subscriptionBillingFreq: {
        ...this.state.subscriptionBillingFreq,
        value: invFreqOptions.get(newFreq),
      },
    });
    const res = await updateHomeDataToApi({
      id: this.currSubscription.id,
      billingFreq: newFreq,
    });
    if (res['billingFreq'] === newFreq) {
      await this.setAllItemsWithApi();
    } else {
      Alert.alert(
        'Update Not Successful, Server Error, returned: ' + res['billingFreq'],
      );
    }
  };

  renderHeader = () => {
    return (
      <View style={{marginBottom: 20}}>
        <View style={styles.headerColumn}>
          <Image
            style={styles.subscriptionImage}
            source={{
              uri: this.currSubscription?.icon,
            }}
          />
          <Text style={styles.userNameText}>{this.currSubscription?.name}</Text>
          <View style={{alignItems: 'center', flexDirection: 'row'}}></View>
        </View>
      </View>
    );
  };

  getItemDetails = (index: number) => {
    switch (index) {
      case 1:
        return {title: 'Username', icon: 'face'};
      case 2:
        return {title: 'Password', icon: 'lock'};
      case 3:
        return {title: 'Price', icon: 'money'};
      case 4:
        return {title: 'Nearest Billing Date', icon: 'today'};
      default:
        return {title: 'Billing Frequency', icon: 'timer'};
    }
  };

  renderSecureEye = (itemKey: number) => {
    return (
      <View>
        {itemKey === 2 ? (
          <TouchableOpacity
            onPress={() =>
              this.setState({
                secureTextEntry: !this.state.secureTextEntry,
              })
            }>
            {this.state.secureTextEntry ? (
              <Feather name="eye-off" color="grey" size={20} />
            ) : (
              <Feather name="eye" color="grey" size={20} />
            )}
          </TouchableOpacity>
        ) : null}
      </View>
    );
  };

  editUserName = async (newVal: string) => {
    const res = await updateHomeDataToApi({
      id: this.currSubscription.id,
      subUsername: newVal,
    });
    if (res['subUsername'] === newVal) {
      this.setState({
        subscriptionUserName: {
          ...this.state.subscriptionUserName,
          value: newVal,
        },
      });
      await this.setAllItemsWithApi();
    } else {
      this.setState({
        subscriptionUserName: {
          ...this.state.subscriptionUserName,
          value: 'Error',
        },
      });
    }
  };

  editUserPassword = async (newVal: string) => {
    // ***** moving passwords to local storage *******
    try {
      await AsyncStorage.setItem(
        `${this.currSubscription.name}@password`,
        newVal,
      ); //'storage_Key = `${this.curSub.name}@password`
      this.setState({
        subscriptionPassword: {
          ...this.state.subscriptionPassword,
          value: newVal,
        },
      });
    } catch (e) {
      console.error(e);
      this.setState({
        subscriptionPassword: {
          ...this.state.subscriptionPassword,
          value: 'Error',
        },
      });
    }
  };

  showEditPrompt = (itemKey: number, itemName: string) => {
    prompt(
      `Enter ${itemName}`,
      '',
      [
        {
          text: 'Cancel',
          onPress: () => {},
          style: 'cancel',
        },
        {
          text: 'OK',
          onPress: (newVal) => {
            itemKey === 1
              ? this.editUserName(newVal)
              : this.editUserPassword(newVal);
          },
        },
      ],
      {
        type: itemKey === 1 ? 'plain-text' : 'secure-text',
      },
    );
  };

  renderFrequencyPicker = () => {
    return (
      <Picker
        placeholder="Tap to change frequency"
        useNativePicker
        value={this.state.subscriptionBillingFreq.value}
        onChange={(newFreq: string) => {
          this.handleChangeFreqPress(newFreq);
        }}
        wheelPickerProps={wheelPickerProps}
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
    );
  };

  onEditItemPress = (itemKey: number, itemName: string) => {
    switch (itemKey) {
      case 3:
        this.setState({
          showEditPriceDialog: !this.state.showEditPriceDialog,
          addHistoryDialogFlag: false,
        });
        break;
      case 4:
        Alert.alert('Not Yet Supported');
        //this.setState({showCalander: !this.state.showCalander});
        break;
      case 5:
        this.setState({showFrequencyPicker: !this.state.showFrequencyPicker});
        break;
      default:
        this.showEditPrompt(itemKey, itemName);
        break;
    }
  };

  renderItem = (item: renderdItem) => {
    const {title, icon} = this.getItemDetails(item.key);
    const value =
      item.key === 3 && item.currency
        ? item.value + itemsStore.getCurrencySymbol(item.currency)
        : item.value;
    return (
      <View style={styles.listItemMainContainer}>
        <View style={{flex: 2, justifyContent: 'center'}}>
          <Icon
            name={icon}
            underlayColor="transparent"
            iconStyle={styles.detailsIcon}
          />
        </View>
        <View style={styles.listItemCenterContainer}>
          <View style={styles.listItemCenterTitleContainer}>
            <TextInput
              style={styles.userDetailsText}
              value={value}
              secureTextEntry={
                item.key === 2 ? this.state.secureTextEntry : false
              }
              editable={false}
            />
            <View style={styles.secureEyeContainer}>
              {this.renderSecureEye(item.key)}
            </View>
          </View>
          <View style={{flexDirection: 'row', justifyContent: 'flex-start'}}>
            <Text style={{color: 'gray', fontSize: 14, fontWeight: '200'}}>
              {title}
            </Text>
          </View>
          {this.state.showFrequencyPicker && item.key === 5
            ? this.renderFrequencyPicker()
            : null}
        </View>
        <Icon
          name={'edit'}
          iconStyle={{marginRight: 10, color: '#ED7D31'}}
          onPress={() => {
            this.onEditItemPress(item.key, title);
          }}
        />
      </View>
    );
  };

  refreshHistoryData = async () => {
    const historyExpensesData = await getHistoryExpensesData();
    itemsStore.setExpensesHistoryData(historyExpensesData);
    this.setState({
      itemPaymentsHistory: itemsStore.getExpensesHistoryData().allData[
        this.props.id
      ],
    });
    this.setState({deleteHistoryItemLoader: false});
  };

  handleDeleteHistoryItem = async (date: string) => {
    this.setState({deleteHistoryItemLoader: true});
    const month = date.split(' ')[0];
    const year = date.split(' ')[1].slice(1);
    await deleteSubscriptionHistoryItem({id: this.props.id, month, year});
    this.refreshHistoryData();
  };

  handleAddHistoryItem = async () => {
    this.setState({deleteHistoryItemLoader: true});
    this.setState({showEditPriceDialog: false});
    const {tmpDateForDialogs, tmpPriceForDialogs} = this.state;
    await addSubscriptionHistoryItem({
      id: this.props.id,
      month: tmpDateForDialogs.month,
      year: tmpDateForDialogs.year,
      name: this.currSubscription?.name,
      formattedPrice: {
        value: tmpPriceForDialogs.value,
        currency: tmpPriceForDialogs.currency,
      },
    });
    this.refreshHistoryData();
  };

  renderEditPriceDialog = () => {
    const {addHistoryDialogFlag} = this.state;
    return (
      <ConfirmDialog
        visible={this.state.showEditPriceDialog}
        title="Edit Price"
        onTouchOutside={() => this.setState({showEditPriceDialog: false})}
        positiveButton={{
          title: 'OK',
          onPress: async () => {
            addHistoryDialogFlag
              ? this.handleAddHistoryItem()
              : this.onConfirmEditPrice();
          },
        }}
        negativeButton={{
          title: 'Cancel',
          onPress: () => this.setState({showEditPriceDialog: false}),
        }}>
        <View>
          <TextField
            title="Enter Price"
            containerStyle={styles.textFieldContainer}
            placeholder="enter price"
            keyboardType={'number-pad'}
            onChangeText={(value: string) => {
              this.setState({
                tmpPriceForDialogs: {
                  ...this.state.tmpPriceForDialogs,
                  value: parseFloat(value),
                },
              });
            }}
          />
          <Picker
            title="Change currency"
            useNativePicker
            value={this.state.tmpPriceForDialogs.currency}
            onChange={(currency: string) =>
              this.setState({
                tmpPriceForDialogs: {
                  ...this.state.tmpPriceForDialogs,
                  currency,
                },
              })
            }
            wheelPickerProps={wheelPickerProps}
            selectLabelStyle={{color: Colors.violet30}}
            cancelLabelStyle={{color: Colors.violet30}}>
            {CurrencyOptions.map((currency) => (
              <Picker.Item key={currency} value={currency} label={currency} />
            ))}
          </Picker>
          {addHistoryDialogFlag ? this.renderMonthYearPickers() : null}
        </View>
      </ConfirmDialog>
    );
  };

  renderMonthYearPickers = () => {
    const {tmpDateForDialogs} = this.state;
    return (
      <View>
        <Picker
          title="Choose month"
          useNativePicker
          value={tmpDateForDialogs.month}
          onChange={(month: string) =>
            this.setState({
              tmpDateForDialogs: {...tmpDateForDialogs, month},
            })
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
          {MonthOptions.map((month) => (
            <Picker.Item key={month} value={month} label={month} />
          ))}
        </Picker>
        <Picker
          title="Choose year"
          useNativePicker
          value={tmpDateForDialogs.year}
          onChange={(year: string) =>
            this.setState({tmpDateForDialogs: {...tmpDateForDialogs, year}})
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
          {YearOptions.map((year) => (
            <Picker.Item key={year} value={year} label={year} />
          ))}
        </Picker>
      </View>
    );
  };

  rederCalender = () => {
    if (this.state.showCalander) {
      return (
        <View style={styles.backgroundContainer}>
          <CalendarPicker
            onDateChange={(date: any) => {
              this.setState({
                subscriptionBillingDate: {
                  ...this.state.subscriptionBillingDate,
                  value: date.toString(),
                },
              });
            }}
            minDate={new Date()}
            selectedDayColor="#ED7D31"
            selectedDayTextColor={Colors.white}
          />
        </View>
      );
    } else {
      return <View></View>;
    }
  };

  renderHistory = () => {
    const {showHistory} = this.state;
    return (
      <View>
        {this.state.deleteHistoryItemLoader ? (
          <LoaderScreen />
        ) : this.state.itemPaymentsHistory ? (
          <View>
            <Button
              style={{marginTop: 15, marginBottom: 15}}
              text90
              link
              label={showHistory ? 'Close' : 'Show History'}
              iconSource={require('../../assets/subscriptionScreen/history-clock-button.png')}
              iconStyle={{height: 15, width: 15}}
              onPress={() => {
                this.setState({showHistory: !showHistory});
              }}
            />
            {showHistory ? (
              // allData: {'1' : [['Oct' ,17.86', USD], ['Nov', '15', 'ILS]]}
              <FlatList
                data={this.state.itemPaymentsHistory}
                keyExtractor={({item, index}) =>
                  item ? item[0].toString() : index?.toString()
                } //todo - unique key warning
                renderItem={({item}) => this.renderHistoryItem(item)}
                ListFooterComponent={
                  <View>
                    {Platform.OS === 'ios' ? ( //todo - fix for android
                      <Button
                        style={{marginTop: 10}}
                        text100
                        link
                        linkColor="#ED7D31"
                        label={'add history item'}
                        iconSource={require('../../assets/homeScreenIcons/plus.png')}
                        iconStyle={{height: 15, width: 15}}
                        onPress={() =>
                          this.setState({
                            showEditPriceDialog: true,
                            addHistoryDialogFlag: true,
                          })
                        }
                      />
                    ) : null}
                  </View>
                }
              />
            ) : null}
          </View>
        ) : null}
      </View>
    );
  };

  renderHistoryItem = (item: string[]) => {
    return (
      <Drawer
        leftItem={{
          text: 'delete',
          background: Colors.red30,
          onPress: () => this.handleDeleteHistoryItem(item[0]),
        }}>
        <ListItem height={75}>
          <ListItem.Part middle column containerStyle={[styles.border]}>
            <Text
              dark10
              text70
              style={styles.historyListItemtext}
              numberOfLines={1}>
              {`${item[0]}:   ${
                Math.round(parseInt(item[1]) * 100) / 100
              }${itemsStore.getCurrencySymbol(item[2])}`}
            </Text>
          </ListItem.Part>
        </ListItem>
      </Drawer>
    );
  };

  handleReminderTriggered = async () => {
    // const x = new NotifService();
    // x.createDefaultChannels();
    // x.requestPermissions();

    console.log(this.currSubscription?.billingDate);
    console.log(this.state.subscriptionBillingDate.value);
    let dayBefore = new Date(this.currSubscription?.billingDate);
    dayBefore.setHours(16); // needs an hour also so just random hour
    dayBefore.setDate(dayBefore.getDate() - 1);
    dayBefore.setUTCHours(12); // right now it just bills at 12 UTC on day before// maybe dont need this after i set hour
    console.log(dayBefore);
    PushNotification.localNotificationSchedule({
      //... You can use all the options from localNotifications
      message: this.currSubscription?.name + ' Is Billed Tomorrow', //TODO make it remind a day before
      date: dayBefore,
      allowWhileIdle: true, // (optional) set notification to work while on doze, default: false
      channelId: '1',
      vibration: 300,
    });
    // PushNotification.localNotification({
    //   //... You can use all the options from localNotifications
    //   message: this.currSubscription?.name + ' Is Billed Tomorrow', //TODO make it remind a day before
    //   date: dayBefore,
    //   allowWhileIdle: true, // (optional) set notification to work while on doze, default: false
    //   channelId: "1",
    //   actions: "Yes",
    //   vibration: 300,
    // });
    Alert.alert('Notification set for: ' + dayBefore.toDateString());
  };

  rederReminderButton = () => {
    return (
      <View>
        {/* {Platform.OS === 'ios' ? ( */}
        <TouchableOpacity
          style={styles.triggerReminderButton}
          onPress={this.handleReminderTriggered}>
          <LinearGradient
            colors={['#ED7D31', '#ED7D31']}
            style={signInStyles.signIn}>
            <Text
              style={[
                signInStyles.textSign,
                {
                  fontSize: 16,
                  color: '#fff',
                },
              ]}>
              Trigger Reminder
            </Text>
          </LinearGradient>
        </TouchableOpacity>
        {/* ) : null} */}
      </View>
    );
  };

  render() {
    const {
      subscriptionUserName,
      subscriptionPassword,
      subscriptionBillingDate,
      subscriptionFormattedPrice,
      subscriptionBillingFreq,
    } = this.state;
    return (
      <View flex style={styles.screenBackground}>
        {this.state.editPriceLoader ? (
          <LoaderScreen />
        ) : (
          <FlatList
            ref={(ref) => (this.flatList = ref)}
            onContentSizeChange={() =>
              this.flatList.scrollToEnd({animated: true})
            }
            //onLayout={() => this.flatList.scrollToEnd({animated: true})} // use this if we want to scroll down when keyboard pops up
            contentContainerStyle={styles.profileListItemSubScreen}
            data={[
              subscriptionUserName,
              subscriptionPassword,
              subscriptionFormattedPrice,
              subscriptionBillingDate,
              subscriptionBillingFreq,
            ]}
            keyExtractor={(item) => item.key.toString()}
            renderItem={({item}) => this.renderItem(item)}
            ListHeaderComponent={this.renderHeader()}
            ListFooterComponent={
              <View>
                {this.renderEditPriceDialog()}
                {this.rederCalender()}
                {this.renderHistory()}
                {this.rederReminderButton()}
              </View>
            }
          />
        )}
      </View>
    );
  }
}

export default gestureHandlerRootHOC(SubscriptionScreen);
