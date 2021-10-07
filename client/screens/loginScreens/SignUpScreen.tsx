import React from 'react';
import {View, Text, TouchableOpacity, TextInput, ScrollView, Alert} from 'react-native';
import * as Animatable from 'react-native-animatable';
import LinearGradient from 'react-native-linear-gradient';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Feather from 'react-native-vector-icons/Feather';
import {signInStyles, primaryColor} from './styleSheet';
import {Navigation} from 'react-native-navigation';
import {createNewUser, sendPhone} from '../../utils/serverApi';

const mediumRegex = new RegExp("^(((?=.*[a-z])(?=.*[A-Z]))|((?=.*[a-z])(?=.*[0-9]))|((?=.*[A-Z])(?=.*[0-9])))(?=.{6,})");
const strongRegex = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})");

interface Props {
    componentId: string;
}

const SignUpScreen = (props: Props) => {
  const [data, setData] = React.useState({
    username: '',
    password: '',
    confirm_password: '',
    check_textInputChange: false,
    secureTextEntry: true,
    confirm_secureTextEntry: true,
  });

  const textInputChange = (val: string) => {
    if (val.length !== 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      setData({
        ...data,
        username: val,
        check_textInputChange: true,
      });
    } else {
      setData({
        ...data,
        username: val,
        check_textInputChange: false,
      });
    }
  };

  const handlePasswordChange = (val: string) => {
    setData({
      ...data,
      password: val,
    });
  };

  const handleConfirmPasswordChange = (val: string) => {
    setData({
      ...data,
      confirm_password: val,
    });
  };

  const updateSecureTextEntry = () => {
    setData({
      ...data,
      secureTextEntry: !data.secureTextEntry,
    });
  };

  const updateConfirmSecureTextEntry = () => {
    setData({
      ...data,
      confirm_secureTextEntry: !data.confirm_secureTextEntry,
    });
  };

  const handleSignUp = async () => {
    
    if (!mediumRegex.test(data.password)) {
      Alert.alert("Do you want to be weak like your password?!")
      return;
    }
    if (!data.check_textInputChange) {
      Alert.alert("Email is not valid");
      return;
    }
    if (data.username.length == 0 || data.password.length == 0 || data.password !== data.confirm_password) {
        Alert.alert('Wrong Input!', 'Please correct username or password', [
            {text: 'Okay'},
        ]);
        return;
    } else {
        const res = await createNewUser(data.username, data.password);
        if (res === data.username) {
          Alert.alert('Success!', 'please check your email to activate your account');
          Navigation.push(props.componentId, {component: {name: 'signInScreen'}});
        } 
        else if (res === 'error'){
          Alert.alert('So so sorry', 'Weve encountered an error trying to send an Activation Email, I am speachless');
          return;
        }
        else if (res === 'activate_in_cell') {
          Alert.prompt(
            'Unable to send email',
            'Please enter phone number for verification',
            [
              {
                text: 'Cancel',
                onPress: () => {},
                style: 'cancel',
              },
              {
                text: 'OK',
                onPress: async (newVal?: string) => {
                  if (newVal){
                    const res2 = await sendPhone(newVal, data.username, data.password);
                    if (res2 === newVal) {
                      Alert.alert('Success!', 'please check your phone to activate your account');                      
                    } 
                    else {
                      Alert.alert('Server responded like an idiot...')
                    }
                    
                  } 
                }
              }
            ])
          return;
        }
        else if (res === 'username_exists') {
          Alert.alert('Email Allready Exists');
          return;
        }
    }
  }

  return (
    <View style={signInStyles.container}>
      <View style={signInStyles.header}>
        <Text style={signInStyles.text_header}>Register Now!</Text>
      </View>
      <Animatable.View animation="fadeInUpBig" style={signInStyles.footer}>
        <ScrollView>
          <Text style={signInStyles.text_footer}>Email</Text>
          <View style={signInStyles.action}>
            <FontAwesome name="user-o" color="#05375a" size={20} />
            <TextInput
              placeholder="Your Email"
              style={signInStyles.textInput}
              autoCapitalize="none"
              onChangeText={(val) => textInputChange(val)}
            />
            {data.check_textInputChange ? (
              <Animatable.View animation="bounceIn">
                <Feather name="check-circle" color="orange" size={20} />
              </Animatable.View>
            ) : null}
          </View>

          <Text
            style={[
              signInStyles.text_footer,
              {
                marginTop: 35,
              },
            ]}>
            Password
          </Text>
          <View style={signInStyles.action}>
            <Feather name="lock" color="#05375a" size={20} />
            <TextInput
              placeholder="Your Password"
              secureTextEntry={data.secureTextEntry ? true : false}
              style={signInStyles.textInput}
              autoCapitalize="none"
              onChangeText={(val) => handlePasswordChange(val)}
            />
            <TouchableOpacity onPress={updateSecureTextEntry}>
              {data.secureTextEntry ? (
                <Feather name="eye-off" color="grey" size={20} />
              ) : (
                <Feather name="eye" color="grey" size={20} />
              )}
            </TouchableOpacity>
          </View>
          {strongRegex.test(data.password) ?
          (<Animatable.View animation="fadeInLeft" duration={500}>
          <Text style={signInStyles.goodMsg}>
            Password strength is strong
          </Text>
        </Animatable.View>)
           : (mediumRegex.test(data.password) ? (
          <Animatable.View animation="fadeInLeft" duration={500}>
            <Text style={signInStyles.okMsg}>
              Password strength is medium
            </Text>
          </Animatable.View>
        ) : 
        (data.password.length > 0 ? (<Animatable.View animation="fadeInLeft" duration={500}>
            <Text style={signInStyles.errorMsg}>
              Password strength is weak
            </Text>
          </Animatable.View>) : null))
        }

          <Text
            style={[
              signInStyles.text_footer,
              {
                marginTop: 35,
              },
            ]}>
            Confirm Password
          </Text>
          <View style={signInStyles.action}>
            <Feather name="lock" color="#05375a" size={20} />
            <TextInput
              placeholder="Confirm Your Password"
              secureTextEntry={data.confirm_secureTextEntry ? true : false}
              style={signInStyles.textInput}
              autoCapitalize="none"
              onChangeText={(val) => handleConfirmPasswordChange(val)}
            />
            <TouchableOpacity onPress={updateConfirmSecureTextEntry}>
              {data.secureTextEntry ? (
                <Feather name="eye-off" color="grey" size={20} />
              ) : (
                <Feather name="eye" color="grey" size={20} />
              )}
            </TouchableOpacity>
          </View>
          <View style={signInStyles.textPrivate}>
            <Text style={signInStyles.color_textPrivate}>
              By signing up you agree to our
            </Text>
            <Text
              style={[signInStyles.color_textPrivate, {fontWeight: 'bold'}]}>
              {' '}
              Terms of service
            </Text>
            <Text style={signInStyles.color_textPrivate}> and</Text>
            <Text
              style={[signInStyles.color_textPrivate, {fontWeight: 'bold'}]}>
              {' '}
              Privacy policy
            </Text>
          </View>
          <View style={{...signInStyles.button}}>
            <TouchableOpacity style={{...signInStyles.signIn}}
              onPress={() => {handleSignUp()}}>
              <LinearGradient
                colors={['#ED7D31', '#ED7D31']}
                style={signInStyles.signIn}>
                <Text
                  style={signInStyles.textSign}>
                  Sign Up
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => Navigation.pop(props.componentId)}
              style={[
                signInStyles.signIn,
                {
                  borderColor: '#ED7D31',
                  borderWidth: 1,
                  marginTop: 15,
                },
              ]}>
              <Text
                style={[
                  signInStyles.textSign,
                  {
                    color: primaryColor,
                  },
                ]}>
                Go Back
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Animatable.View>
    </View>
  );
};

export default SignUpScreen;


