import React from 'react';
import {View, Text, TouchableOpacity, TextInput, Alert} from 'react-native';
import * as Animatable from 'react-native-animatable';
import LinearGradient from 'react-native-linear-gradient';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Feather from 'react-native-vector-icons/Feather';
import {LoaderScreen} from 'react-native-ui-lib';
import {signInStyles, secondaryOrange} from './styleSheet';
import {Navigation} from 'react-native-navigation';
import {getToken, checkToken, forgotPassword} from '../../utils/serverApi';
import {userStore} from '../../store/userStore';
import {setSignInComponentId, delay} from '../../utils/utils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HandlesLoader } from '../../utils/HandlesLoader';
import {
  GoogleSignin,
  GoogleSigninButton,
  statusCodes,
} from '@react-native-community/google-signin';

interface Props {
    componentId: string;
}

interface UserInfo {
    idToken: string,
    serverAuthCode: string,
    scopes: Array<string>, // on iOS this is empty array if no additional scopes are defined
    user: {
      email: string,
      id: string,
      givenName: string,
      familyName: string,
      photo: string, // url
      name: string // full name
    }
}


const SignInScreen = (props: Props) => {
  const [data, setData] = React.useState({
    username: '',
    password: '',
    check_textInputChange: false,
    secureTextEntry: true,
    isValidUser: true,
    isValidPassword: true,
    enableForgotPassword: false,
  });

  const [signInLoader, setSignInLoader] = React.useState(false);
  // TODO - remove handles loader!!! only sign in loader here
  const [handlesLoader, setHandlesLoader] = React.useState(false);

  React.useEffect(() => {setSignInComponentId(props.componentId)}, [])
  
  // prepare sign in with google
  React.useEffect(() => {GoogleSignin.configure({
      webClientId: '14356285062-p8l4gfn3plhhmil2na3nql2a4i76ujkk.apps.googleusercontent.com',
      iosClientId: '14356285062-fkusf2ofd2gv2mkbbot2rtf7ic4ccq2q.apps.googleusercontent.com'})
    }, []
  );
  const signOut = async () => {
    try {
      await GoogleSignin.revokeAccess();
      await GoogleSignin.signOut();
     // this.setState({ user: null }); // Remember to remove the user from your app's state as well
    } catch (error) {
      console.error(error);
    }
  };
  
  // for google sign in
  const signIn = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfoRet = await GoogleSignin.signIn();
      console.log(userInfoRet);
      if (userInfoRet.idToken !== null) {
        setSignInLoader(true);
        const res = await checkToken(userInfoRet.idToken, 'google-login-token')
        console.log('res from check token is: ', res)
        if (res['response'] === 'success') {
          // set token        
          userStore.setToken(res['token']);
          try {  // TODO guy make sure this is optimal place to set token in async storage
            await AsyncStorage.setItem('signInToken', res['token']);
          } catch (e) {
            console.error(e);
          }
          Navigation.push(props.componentId, {component: {name: 'HANDLES'}});
          setSignInLoader(false);
          return true;
        }
        else {
          setSignInLoader(false);    
          Alert.alert('Error', 'We encounted a backend error: ' + res + ' please try alternative ways or contact support');
        }
      } // TODO : else find out why sometimes it is null and what to do!! also 
      // send token to server
      else{
        Alert.alert('Error', 'Google Token is null, try alternative sign up ways or contact support');
        signOut();
      }
    } catch (error) {
      setSignInLoader(false);
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('google sign in cancelled')
      } else if (error.code === statusCodes.IN_PROGRESS) {
        Alert.alert('Sign In is in progress already');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert('Play Services Not Available');
      } else {
        console.error(error.message);
        Alert.alert('Error', 'We encounted a front end error, please try alternative ways or contact support');
      }
    }
  };

  
  const handleTouchStart = async () => {
    try {
      const value = await AsyncStorage.getItem("username"); //'storage_Key = `username`
      if (value !== null) {
        setData({
          ...data,
          username: value,
          check_textInputChange: true,
          isValidUser: true,
        });
      }
      } catch (e) {
      console.error(e);
    }
  }

  const textInputChange = (val: string) => {
    if (val.trim().length >= 4) {
      setData({
        ...data,
        username: val,
        check_textInputChange: true,
        isValidUser: true,
      });
    } else {
      setData({
        ...data,
        username: val,
        check_textInputChange: false,
        isValidUser: false,
      });
    }
  };

  const handlePasswordChange = (val: string) => {
    if (val.trim().length >= 4) {
      setData({
        ...data,
        password: val,
        isValidPassword: true,
      });
    } else {
      setData({
        ...data,
        password: val,
        isValidPassword: false,
      });
    }
  };

  const handleForgotPassword = async () => {
    if (data.enableForgotPassword) {
      let email = data.username;
      if (!email) {
        Alert.alert('Enter Email');
        return;
      }
      
      setSignInLoader(true);
      const res = await forgotPassword(email);
      if (res === 'email_not_exists') {
        Alert.alert('Wrong Email', `Email ${email} is incorrect or is not an email of a user`);
      } else if (res === email) {
        Alert.alert('Success!', 'Password resetting Email has been sent to ' + email);
      } else {
        Alert.alert('Error', 'Sorry... you better remember your password better buddy');
      }
      setSignInLoader(false);
    }
  };

  const updateSecureTextEntry = () => {
    setData({
      ...data,
      secureTextEntry: !data.secureTextEntry,
    });
  };

  const saveAsyncUsername = async (username: string) => {
    try {
      await AsyncStorage.setItem(
        "username",
        username,
      ); //'storage_Key = `username`
    } catch (e) {
      console.error(e);
      }
  }

  const handleSignIn = async () => {
    setSignInLoader(true);
    if (data.username.length == 0 || data.password.length == 0 || !data.isValidPassword) {
      Alert.alert(
        'Wrong Input!',
        'Please correct Email or password',
        [{text: 'Okay'}],
        );
      setSignInLoader(false);
      return;
    }
    else {
      const res = await getToken(data.username, data.password);
      if(res) {
        userStore.setToken(res);
        userStore.setUserName(data.username);
        setSignInLoader(false);
        saveAsyncUsername(data.username);  // should only be done maybe if it was modified? or we do anyway if its cheap
        Navigation.push(props.componentId, {component: {name: 'HANDLES'}});
      }
      else {
        Alert.alert(
          'Unauthorized User!',
          'Please correct username or password',
          [{text: 'Okay'}],
        );
        setSignInLoader(false);
        return;
      }
    }
  };

  const renderSignInSocial = () => {
    return (<>
      {!data.enableForgotPassword ? 
      <View style={{marginHorizontal: 10, marginTop: 20, justifyContent: 'center', alignItems: 'center',}}>
        <GoogleSigninButton
          style={{ width: 200, height: 48 }}
          size={GoogleSigninButton.Size.Wide}
          color={GoogleSigninButton.Color.Dark}
          onPress={signIn}
          disabled={signInLoader}
          />       
      </View> : null}</>
    )
  }

  return (
    handlesLoader ? <HandlesLoader/> : 
    <View style={signInStyles.container}>
      <View style={signInStyles.header}>
        <Text style={signInStyles.text_header}>Welcome!</Text>
      </View>
      <Animatable.View
        animation="fadeInUpBig"
        style={[signInStyles.footer]}>
        <Text
          style={[signInStyles.text_footer, {
              color: 'black',
            }]}>
          Email
        </Text>
        <View style={signInStyles.action}>
          <FontAwesome name="user-o" color={'black'} size={20} />
          <TextInput
            value={data.username}
            placeholder={data.username ?  data.username : "Your Email"}
            onTouchStart={handleTouchStart}
            placeholderTextColor="#666666"
            style={[signInStyles.textInput, {
                color: 'black',
              }]}
            autoCapitalize="none"
            onChangeText={(val) => textInputChange(val)}
          />
          {data.check_textInputChange ? (
            <Animatable.View animation="bounceIn">
              <Feather name="check-circle" color="orange" size={20} />
            </Animatable.View>
          ) : null}
        </View>
        {data.isValidUser ? null : (
          <Animatable.View animation="fadeInLeft" duration={500}>
            <Text style={signInStyles.errorMsg}>
              Email must be 4 characters long.
            </Text>
          </Animatable.View>
        )}
        {!data.enableForgotPassword ? 
        (<View>
        <Text style={[signInStyles.text_footer, {
              color: 'black',
              marginTop: 35,
            }]}>
          Password
        </Text>
        <View style={signInStyles.action}>
          <Feather name="lock" color={'black'} size={20} />
          <TextInput
            placeholder="Your Password"
            placeholderTextColor="#666666"
            secureTextEntry={data.secureTextEntry ? true : false}
            style={[
              signInStyles.textInput,
              {
                color: 'black',
              },
            ]}
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
        {data.isValidPassword ? null : (
          <Animatable.View animation="fadeInLeft" duration={500}>
            <Text style={signInStyles.errorMsg}>
              Password must be 4 characters long.
            </Text>
          </Animatable.View>
        )}</View>) : null}
        <TouchableOpacity 
        onPress={() => setData({...data, enableForgotPassword: !data.enableForgotPassword})}>    
          <Text style={{color: 'black', marginTop: 15}}>
            {data.enableForgotPassword ? 'Enter recovery email' : 'Forgot password?'}
          </Text>
          {data.enableForgotPassword? 
          (<Animatable.View animation="fadeInLeft" duration={500}>
          
          <Text style={signInStyles.okMsg}>
              Press again to cancel
          </Text>
          </Animatable.View>) : null}
        </TouchableOpacity>
        {renderSignInSocial()}
        <View style={signInStyles.button}>
          <TouchableOpacity
            style={signInStyles.signIn}
            onPress={() => {data.enableForgotPassword? handleForgotPassword() : handleSignIn()}}
            >
            <LinearGradient
              colors={[secondaryOrange, secondaryOrange]}
              style={signInStyles.signIn}>
              {signInLoader ? <LoaderScreen loaderColor={'black'}/> :
                <Text
                  style={[
                    signInStyles.textSign
                  ]}>
                  {data.enableForgotPassword? 'Reset Password' : 'Sign In'}
                </Text>
              }
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => Navigation.push(props.componentId, {component: {name: 'signUpScreen'}})}
            style={{...signInStyles.signIn, borderColor: '#ED7D31', borderWidth: 1, marginTop: 15}}>
            <Text style={[signInStyles.textSign, {color: 'black'}]}>
              Sign Up
            </Text>
          </TouchableOpacity>
        </View>
      </Animatable.View>
    </View>
  );
};

export default SignInScreen;

