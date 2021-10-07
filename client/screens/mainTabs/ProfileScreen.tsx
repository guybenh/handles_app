import React from 'react';
import {
  ImageBackground,
  FlatList,
  Alert,
  TouchableHighlight,
  Platform,
} from 'react-native';
import {Text, View, Button, Image, Colors, Card, TextField} from 'react-native-ui-lib';
import {Navigation} from 'react-native-navigation';
import {getSignInComponentId} from '../../utils/utils';
import {styles} from '../../utils/styleSheet';
import {Icon} from 'react-native-elements';
import {CardView, CreditCardInput, LiteCreditCardInput} from 'react-native-input-credit-card';
import {userStore, Address, CardValues} from '../../store/userStore';
import {updateUserProfile, sendCreditCardData} from '../../utils/serverApi';
import {getMainAppComponentId} from '../../utils/utils';
import {HandlesLoader} from '../../utils/HandlesLoader'
import {connect} from 'remx';
import prompt from 'react-native-prompt-android';
import DateTimePicker from '@react-native-community/datetimepicker';
import {ConfirmDialog} from 'react-native-simple-dialogs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  GoogleSignin,
} from '@react-native-community/google-signin';

interface Props {
  profileImage: string;
  address: Address;
  email: string;
  userName: string;
  firstName: string;
  birthday: string;
  cardValues: CardValues;
}

interface State {
  showBirthdayDialog: boolean;
  showInputCreditCard: boolean;
  apiLoader: boolean;
  addressApiLoader: boolean;
  editShippingdetails: boolean;
}

class ProfileScreen extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      showBirthdayDialog: false,
      showInputCreditCard: userStore.getVisaToken() ? false : true,
      apiLoader: false,
      editShippingdetails: false,
      addressApiLoader: false,
    };
  }

  renderLogOutButton = () => {
    return (
      <Button
        label="Log Out"
        outlineWidth={2}
        outlineColor={'black'}
        outline
        style={{
          marginBottom: 20,
          marginTop: 45,
          bottom: 15,
          position: 'relative',
          width: '40%',
          alignSelf: 'center',
        }}
        iconSource={require('../../../assets/profile/logout.png')}
        iconStyle={{height: 20, width: 20}}
        onPress={this.handlePress}
      />
    );
  };
  
  signOut = async () => {
    const isSignedIn = await GoogleSignin.isSignedIn();
    if (isSignedIn){
      try {
        await GoogleSignin.revokeAccess();
        await GoogleSignin.signOut();
       // this.setState({ user: null }); // Remember to remove the user from your app's state as well
      } catch (error) {
        console.error(error);
      }
    }
  };

  handlePress = async () => {
    this.signOut();
    userStore.setToken('expired')
    try {
      await AsyncStorage.setItem('signInToken', 'expired');
    } catch (e) {
      console.error(e);
    }
    //Navigation.popTo(getSignInComponentId());
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
  };

  handleEditDetailsPressed = (itemName: string) => {
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
          onPress: async (newVal?: string) => {
            switch (itemName) {
              case 'firstName':
                if (newVal && newVal.length > 0) {
                  const res = await updateUserProfile({
                    type: itemName,
                    firstName: newVal,
                  });
                  if (res['firstName'] === newVal) {
                    userStore.setFirstName(newVal);
                  }
                } else {
                  Alert.alert('Name is not valid..');
                }
                break;
              case 'email':
                if (newVal && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newVal)) {
                  const res = await updateUserProfile({
                    type: itemName,
                    email: newVal,
                  });
                  if (res['email'] === newVal) {
                    userStore.setEmail(newVal);
                  }
                } else {
                  Alert.alert('Email address is not valid..');
                }
                break;
              default:
                null;
            }
          },
        },
      ],
      'plain-text',
    );
  };

  editBirthdayDialog = () => {
    return (
      <View>
        {Platform.OS == 'ios' ? (
          <ConfirmDialog
            visible={this.state.showBirthdayDialog}
            title="Edit Birthday"
            onTouchOutside={() => this.setState({showBirthdayDialog: false})}
            positiveButton={{
              title: 'OK',
              onPress: () => {
                this.setState({showBirthdayDialog: false});
              },
            }}>
            <DateTimePicker
              textColor={Colors.black}
              value={new Date(this.props.birthday ? this.props.birthday : '1/1/2000')}
              onChange={this.onDateChange}
            />
          </ConfirmDialog>
        ) : (
          <View>
            {this.state.showBirthdayDialog ? (
              <DateTimePicker
                value={new Date(this.props.birthday)}
                onChange={this.onDateChange}
              />
            ) : null}
          </View>
        )}
      </View>
    );
  };

  onDateChange = async (event: any, selectedDate: any) => {
    const currentDate = selectedDate || new Date(this.props.birthday);
    if (Platform.OS === 'android') {
      this.setState({showBirthdayDialog: false});
    }
    const res = await updateUserProfile({
      type: 'birthday',
      birthday: currentDate.toDateString(),
    });
    if (res['birthday'] === currentDate.toDateString()) {
      userStore.setBirthday(currentDate.toDateString());
    }
  };

  handleEditLocationPressed = () => {
    Alert.alert('Not supported yet...');
  };

  handleEditImagePressed = () => {
    Navigation.push(getMainAppComponentId(), {
      component: {
        name: 'editProfileImageScreen',
        options: {
          topBar: {
            title: {
              text: 'Choose Profile Image',
            },
          },
        },
      },
    });
  };

  renderHeader = () => {
    return (
      <View style={{marginBottom: 20}}>
        {/* <ImageBackground
          style={{paddingBottom: 20, paddingTop: 45}}
          source={{
            uri:
              'https://www.klaviyo.com/wp-content/uploads/2016/09/abstract-background-1024x273.jpg',
          }}> */}
        <View style={styles.headerColumn}>
          <TouchableHighlight onPress={this.handleEditImagePressed}>
            <Image
              style={styles.userImage}
              source={{
                uri: this.props.profileImage
                  ? this.props.profileImage
                  : 'https://encrypted-tbn0.gstatic.com/images?q=tbn%3AANd9GcQDy76vSeG7-IW2N2HF_HOiphfX6fQOrNa63w&usqp=CAU',
              }}
            />
          </TouchableHighlight>
          {/* this whole things needs to come back working.. TODO */}
          {/* <Text style={styles.userNameText}>{userStore.getfirstName()}</Text> */}
          {/* <View style={{alignItems: 'center', flexDirection: 'row'}}>
              <View>
                <Icon
                  name="place"
                  underlayColor="transparent"
                  iconStyle={{color: 'white', fontSize: 26}}
                />
              </View>
              <View style={{backgroundColor: 'transparent'}}>
                <Text style={styles.userCityText}>
                  {this.props.address.city}, {this.props.address.country}
                  <Icon
                    name={'edit'}
                    size={15}
                    iconStyle={{color: Colors.white, marginLeft: 15}}
                    onPress={() => {
                      this.handleEditLocationPressed();
                    }}
                  />
                </Text>
              </View>
            </View> */}
        </View>
        {/* </ImageBackground> */}
      </View>
    );
  };

  renderUserDetails = (item: string, index: number) => {
    return (
      <View style={styles.listItemMainContainer}>
        <View style={{flex: 2, justifyContent: 'center'}}>
          <Icon
            name={index === 0 ? 'face' : index === 1 ? 'email' : 'today'}
            underlayColor="transparent"
            iconStyle={styles.detailsIcon}
            onPress={() => {}}
          />
        </View>
        <View style={styles.listItemCenterContainer}>
          <View style={styles.listItemCenterTitleContainer}>
            <Text style={styles.userDetailsText}>{item}</Text>
          </View>
          <View style={{flexDirection: 'row', justifyContent: 'flex-start'}}>
            <Text style={{color: 'gray', fontSize: 14, fontWeight: '200'}}>
              {index === 0 ? 'First Name' : index === 1 ? 'Email' : 'Birthday'}
            </Text>
          </View>
        </View>
        <Icon
          name={'edit'}
          iconStyle={{marginRight: 10, color: '#ED7D31'}}
          onPress={() => {
            index === 2 //edit birhday date case
              ? this.setState({
                  showBirthdayDialog: !this.state.showBirthdayDialog,
                })
              : this.handleEditDetailsPressed(
                  index === 0 ? 'firstName' : 'email',
                );
          }}
        />
      </View>
    );
  };

  separator = (flexSixe: number, color: string) => (
    <View style={{flexDirection: 'row'}}>
      <View
        style={{flex: flexSixe, flexDirection: 'row', borderColor: color}}
      />
      <View style={{...styles.separator, borderColor: color}} />
    </View>
  );

  cardValueChanged = async (data: any) => {
    if (data.valid) {
      Alert.alert('Handles would like to handle your payments', 'allow Handles to use card for payment and cancellation?', 
      [
        {
          text: 'Ok',
          onPress: async () => {
            this.setState({apiLoader: true});
            const res = await sendCreditCardData(data);
            if (res.number !== data.values.number) {
              Alert.alert('Server Error', 'error while storing card, please contact support')
            }
            userStore.setVisaToken(res);
            this.setState({apiLoader: false, showInputCreditCard: false});
          },
          style: 'default',
        },
        {
          text: 'Cancel',
          onPress: () => {},
          style: 'cancel',
        },
      ])
    }
  }

  renderVisa = () => {
    return (
      <View style={{marginTop: 25, alignSelf: 'center'}}>
        <Button
          text90
          link
          label={this.state.showInputCreditCard ? 'Return' : 'Edit card'}
          iconSource={this.state.showInputCreditCard ? require('../../../assets/profile/back_arrow.png') : 
            require('../../../assets/profile/pencil.png')}
          iconStyle={{height: 15, width: 15}} 
          onPress={() => {
            this.setState({showInputCreditCard: !this.state.showInputCreditCard})
          }}
        />
        <View style={{marginTop: 20}}>
          {this.state.showInputCreditCard ? 
          <CreditCardInput // Seems like this library is abandoned or something, not worth investing in it
            allowScroll={true}
            onChange={this.cardValueChanged}
            requiresName={true}
            //cardImageFront={require('../../../assets/profileScreen/card_background.jpg')} //TODO find good backround, round corners
          /> : <CardView
          name={this.props.cardValues.name}
          brand={this.props.cardValues.type}
          number={this.props.cardValues.number}
          expiry={this.props.cardValues.expiry}
          cvc={this.props.cardValues.cvc}
        />}
        </View>
      </View>
    );
  };

  renderShippingLine = () => {
      return (
        this.state.editShippingdetails ? 
        <View style={{marginHorizontal: 10, marginBottom: 10, marginTop: 30}}>
            <TextField
              style={styles.inputText}
              placeholder={'Country'}
              value={this.props.address.country}
              floatingPlaceholder={true}
              floatOnFocus={true} 
              onChangeText={(val: string) => {this.props.address.country = val}}
            />
            <TextField
              value={this.props.address.city}
              floatingPlaceholder={true}
              style={styles.inputText}
              placeholder={'City'}
              floatOnFocus={true}
              onChangeText={(val: string) => {this.props.address.city = val}}
            />
            <TextField
              value={this.props.address.street}
              floatingPlaceholder={true}
              style={styles.inputText}
              placeholder={'Street'}
              floatOnFocus={true}
              onChangeText={(val: string) => {this.props.address.street = val}}
            />
            <TextField
              value={this.props.address.number}
              style={styles.inputText}
              floatingPlaceholder={true}
              placeholder={'Number'}
              floatOnFocus={true}
              onChangeText={(val: string) => {this.props.address.number = val}}
            />
            <Button
              text90
              link
              label={'Done'}
              iconSource={require('../../../assets/profile/check_big.png')}
              iconStyle={{height: 15, width: 15}} 
              onPress={async () => {
                this.setState({editShippingdetails: false, addressApiLoader: true})
                const res = await updateUserProfile({
                  type: 'address',
                  address: this.props.address,
                });
                if (res['address']['city'] === this.props.address.city) {
                  // enough to assume there was no server error. TODO check entire return (low priority)
                }
               else {
                Alert.alert('Server Error', 'We encountered a server error while trying to post the data');
              }
              this.setState({addressApiLoader: false})
              }}
            />
          </View> :
        <Card
        row
        height={130}
        //style={{marginTop: '2%', marginBottom: '5%', backgroundColor: Colors.green30}}
        style={{...styles.cardStyle, backgroundColor: Colors.grey50, marginHorizontal: 10, marginBottom: 10, marginTop: 10}}
        onPress={() => this.setState({editShippingdetails: !this.state.editShippingdetails})}
        accessibilityStates={false}>
          <View style={{position: 'absolute', alignSelf: 'center', left: 20}}>
          <Button
            text90
            link
            iconSource={require('../../../assets/joinToSubscription/shoppingCart.png')}
            iconStyle={{height: 30, width: 30}}
            style={{marginRight: 15}}
           
          />
        </View>
        <Card.Section
          style={{
            flex: 1,
            left: 70,
            // justifyContent: 'center',
            // alignItems: 'center',
            marginHorizontal: 10,
          }}
          content={[
            {
              text: 'Shipping Address',
              text70BO: true,
              color: '#6495ED',
            },
            {
              marginT: true,
              text: this.props.address.country && this.props.address.city &&  this.props.address.street && this.props.address.number? 
              this.props.address.country + ', ' + this.props.address.city + ' \n' + this.props.address.street + ', ' + this.props.address.number
              : 'Click to complete shipping address'
              // text40BO: true,
              // color: '#6495ED',
            },
          ]}
        />
        
      </Card>
      )
  }

  render() {
    return (
      
      <FlatList
        contentContainerStyle={styles.profileListItem}
        data={[this.props.firstName, this.props.email, this.props.birthday]}
        //data={[this.props.firstName, this.props.email]} // TODO fix the bug with birthday
        keyExtractor={(item, index) => item + index}
        renderItem={({item, index}) => this.renderUserDetails(item, index)}
        ListHeaderComponent={this.renderHeader()}
        ListFooterComponent={
          <View>         
            {this.editBirthdayDialog()}
            {this.separator(0, Colors.grey40)}
            {this.separator(0, Colors.cyan20)}          
            {!this.state.addressApiLoader ?
            this.renderShippingLine() :  
            <View>
              <HandlesLoader 
                  children={'rgb(200, 200, 200)'}
              />
            </View>
            }           
            {this.separator(0, Colors.grey40)}
            {this.separator(0, Colors.cyan20)}
            
            {!this.state.apiLoader ?
            this.renderVisa() :  
            <View>
              <HandlesLoader 
                children={'rgb(200, 200, 200)'}
              />
            </View>            
            }
            {this.renderLogOutButton()}
          </View>
        }
      />
    );
  }
}

function mapStateToProps() {
  return {
    profileImage: userStore.getProfileImage(),
    address: userStore.getAddress(),
    email: userStore.getEmail(),
    userName: userStore.getUserName(),
    firstName: userStore.getfirstName(),
    birthday: userStore.getBirthday(),
    cardValues: userStore.getVisaToken(),
  };
}

export default connect(mapStateToProps)(ProfileScreen);
