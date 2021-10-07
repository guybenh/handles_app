import axios from 'axios';
import {decode, encode} from 'base-64';
import {Navigation} from 'react-native-navigation';
import {getSignInComponentId, delay} from './utils';
import {userStore} from '../store/userStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Alert } from 'react-native';

// TODO_FAST here : all navigation pops should become retries or something
// or check token or something. this is usefull code : 
// const res = await checkToken(value, 'handles-token');
//   if (res === 'expired_token') {
//     Alert.alert('Token Expired', 'Please sign in again');
//   } else if (res === 'bad_token') {
//     Alert.alert('Token Not Valid', 'Please sign in again');
//   } else if (res === 'valid_token') {
//     userStore.setToken(value);         
//     return true;
//   } 
//   else {
//     Alert.alert('Network Error', 'you better check yourself');   
//   }

const globalAny: any = global;
if (!globalAny.btoa) {
  globalAny.btoa = encode;
}

if (!globalAny.atob) {
  globalAny.atob = decode;
}

// export const endpoint = 'http://0.0.0.0:80/';   //run locally
export const endpoint = 'https://handles.azurewebsites.net/';

export const createNewUser = async (username: string, password: string) => {
  try {
    const response = await axios.post(endpoint + 'create_user', {
      username: username,
      password: password,
    });
    console.log('POST create new user ' + response.data['response']);
    return response.data['username'];
  } catch (error) {
    console.error(error + ' from create new user');
    return false;
  }
};

export const checkToken = async (token: string, tokenType: string) => {
  try {
    const response = await axios.post(endpoint + 'check_token?type=' + tokenType, {
      token: token,
      platform: Platform.OS,
    });
    console.log('POST checkToken ' + response.data['response']);
    return response.data;
  } catch (error) {
    console.error(error + ' from create Token');
    return 'network_error';
  }
};

export const forgotPassword = async (email: string) => {
  try {
    const response = await axios.post(endpoint + 'forgot_password', {
      email: email,
    });
    console.log('POST create new user ' + response.data['response']);
    return response.data;
  } catch (error) {
    console.error(error + ' from forgotPassword');
    return false;
  }
};

export const sendPhone = async (phoneNumber: string, username: string, password: string) => {
  try {
    const response = await axios.post(endpoint + 'activate_phone', {
      phoneNumber: phoneNumber,
      username: username,
      password: password,
    });
    console.log('POST create new user ' + response.data['response']);
    return response.data['response'];
  } catch (error) {
    console.error(error + ' from send phone');
    return false;
  }
};

export const getToken = async (username: string, password: string) => {
  console.log('trying to get token for ' + username)
  try {
    const response = await axios.get(endpoint + 'get_token', {
      auth: {
        username: username,
        password: password,
      },
    });
    //console.log('GET token... ' + response.data['token']);//TODO  secrets shouldnd be logged
    try {  // TODO guy make sure this is optimal place to set token in async storage
      await AsyncStorage.setItem('signInToken', response.data['token']);
    } catch (e) {
      console.error(e);
    }
    return response.data['token'];
  } catch (error) {
    console.error(error + ' from get token');
    return false;
  }
};

export const getHomeDataFromApi = async () => {
  try {
    //console.log('get home data ' + userStore.getToken())  todo why was this--> seems like probelm with simulator???
    const response = await axios.get(endpoint + 'subscriptions', {
      headers: {
        'Cache-Control': 'no-cache',
      },
      auth: {
        username: userStore.getToken(),
        password: '',
      },
    });
    console.log('GET home screen data...' + response.data);
    return response.data;
  } catch (error) {
    console.error(error + ' from GET home screen data...');
    // Navigation.popTo(getSignInComponentId());
    await sendToSignIn();
  }
};


export const getBrainTreeToken = async () => {
  try {
    //console.log('get home data ' + userStore.getToken())  todo why was this--> seems like probelm with simulator???
    const response = await axios.get(endpoint + 'braintreeToken', {
      headers: {
        'Cache-Control': 'no-cache',
      },
      auth: {
        username: userStore.getToken(),
        password: '',
      },
    });
    //console.log('GET home screen data...' + response);
    return response.data;
  } catch (error) {
    console.error(error + ' from GET home screen data...');
    // Navigation.popTo(getSignInComponentId());
    await sendToSignIn();
  }
};

export const updateHomeDataToApi = async (newPost: any) => {
  try {
    const response = await axios.post(endpoint + 'update', newPost, {
      auth: {
        username: userStore.getToken(),
        password: '',
      },
    });
    console.log('POST home screen data...' + response.data);
    return response.data;
  } catch (error) {
    console.error(error) + ' from POST updateHomeDataToApi...';
    // Navigation.popTo(getSignInComponentId());
    await sendToSignIn();
  }
};

export const getExploreDataFromApi = async (token: string) => {
  try {
    const response = await axios.get(endpoint + 'store', {
      headers: {
        'Cache-Control': 'no-cache',
      },
      auth: {
        username: token,
        password: '',
      },
    });
    console.log('GET explore screen data...' + response.data);
    return response.data;
  } catch (error) {
    console.error(error);
    // Navigation.popTo(getSignInComponentId());
    await sendToSignIn()
    return 'expired'
  }
};

export const subscribeItemApi = async (itemId: any) => {
  try {
    const response = await axios.post(endpoint + 'add', itemId, {
      auth: {
        username: userStore.getToken(),
        password: '',
      },
    });
    console.log('POST add item from explore to home screen...' + response.data);
  } catch (error) {
    console.error(error) + ' from POST subscribeItemApi...';
    // Navigation.popTo(getSignInComponentId());
    await sendToSignIn();
  }
};

export const sendNonce = async (nonce: string) => {
  try {
    const response = await axios.post(endpoint + 'sendNonce', {
      nonce: nonce,
    }, {
      auth: {
        username: userStore.getToken(),
        password: '',
      },
    });

    console.log('POST sent nonce..' + response.data);
    return response.data;
  } catch (error) {
    console.error(error) + ' from POST subscribeItemApi...';
    // Navigation.popTo(getSignInComponentId());
    await sendToSignIn();
  }
};

export const unSubscribeItemApi = async (itemId: any) => {
  try {
    const response = await axios.post(endpoint + 'remove', itemId, {
      auth: {
        username: userStore.getToken(),
        password: '',
      },
    });
    console.log('POST add item from explore to home screen...' + response.data);
  } catch (error) {
    console.error(error) + ' from POST unSubscribeItemApi...';
    // Navigation.popTo(getSignInComponentId());
    await sendToSignIn();
  }
};

export const getHistoryExpensesData = async () => {
  try {
    const response = await axios.get(endpoint + 'history', {
      headers: {
        'Cache-Control': 'no-cache',
      },
      auth: {
        username: userStore.getToken(),
        password: '',
      },
    });
    console.log('GET explore screen data...' + response.data);
    return response.data;
  } catch (error) {
    console.error(error) + ' from Get getHistoryExpensesData...';
    // Navigation.popTo(getSignInComponentId());
    await sendToSignIn();
  }
};

export const postCustomSubscription = async (newPost: any) => {
  try {
    const response = await axios.post(endpoint + 'custom', newPost, {
      auth: {
        username: userStore.getToken(),
        password: '',
      },
    });
    console.log('POST custom subscription...' + response.data);
    return response.data;
  } catch (error) {
    console.error(error) + ' from POST custom  subscription...';
    // Navigation.popTo(getSignInComponentId());
    await sendToSignIn();
  }
};

export const updateUserProfile = async (toUpdate: any) => {
  try {
    const response = await axios.post(endpoint + 'update_user', toUpdate, {
      auth: {
        username: userStore.getToken(),
        password: '',
      },
    });
    console.log('POST profile screen data...' + response.data);
    return response.data;
  } catch (error) {
    console.error(error) + ' from POST profile update...';
    // Navigation.popTo(getSignInComponentId());
    await sendToSignIn();
  }
};

export const sendCreditCardData = async (data: any) => {
  try {
    const response = await axios.post(endpoint + 'send_card', data, {
      auth: {
        username: userStore.getToken(),
        password: '',
      },
    });
    console.log('POST Credit Card data...' + response.data);
    return response.data;
  } catch (error) {
    console.error(error) + ' From Send Credit Card Data';
    // Navigation.popTo(getSignInComponentId());
    await sendToSignIn();
  }
};

export const getUserProfileDetails = async (token: string) => {
  try {
    const response = await axios.get(endpoint + 'get_user', {
      headers: {
        'Cache-Control': 'no-cache',
      },
      auth: {
        username: token,
        password: '',
      },
    });
    console.log('GET profile screen data...' + response.data);
    return response.data;
  } catch (error) {
    console.error(error) + ' from Get getUserProfileDetails...';
    // Navigation.popTo(getSignInComponentId());
    await sendToSignIn();
  }
};

export const getCurrencyRates = async () => {
  try {
    const response = await axios.get(endpoint + 'get_currency', {
      headers: {
        'Cache-Control': 'no-cache',
      },
      auth: {
        username: userStore.getToken(),
        password: '',
      },
    });
    console.log('GET getCurrencyRates...' + response.data);
    return response.data;
  } catch (error) {
    console.error(error + ' from GET getCurrencyRates...');
    // Navigation.popTo(getSignInComponentId());
    await sendToSignIn();
  }
};

export const deleteSubscriptionHistoryItem = async (toDelete: {
  id: string;
  month: string;
  year: string;
}) => {
  try {
    const response = await axios.post(endpoint + 'delete_history', toDelete, {
      auth: {
        username: userStore.getToken(),
        password: '',
      },
    });
    console.log('POST deleteSubscriptionHistoryItem...' + response.data);
    return response.data;
  } catch (error) {
    console.error(error) + ' from POST deleteSubscriptionHistoryItem...';
    // Navigation.popTo(getSignInComponentId());
    await sendToSignIn();
  }
};

export const addSubscriptionHistoryItem = async (toAdd: {
  id: string;
  month: string;
  year: string;
  name: string;
  formattedPrice: {value: number, currency: string}
}) => {
  try {
    const response = await axios.post(endpoint + 'add_history', toAdd, {
      auth: {
        username: userStore.getToken(),
        password: '',
      },
    });
    console.log('POST addSubscriptionHistoryItem...' + response.data);
    return response.data;
  } catch (error) {
    console.error(error) + ' from POST addSubscriptionHistoryItem...';
    // Navigation.popTo(getSignInComponentId());
    await sendToSignIn();
  }
};

const sendToSignIn = async () => {
  // todo - this is ony good if one api call has error, if two have one after the other it will bounce twice in.
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
}
