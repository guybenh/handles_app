import * as remx from 'remx';
import {getUserProfileDetails} from '../utils/serverApi';
import axios from 'axios';

export interface Address {
  country: string;
  city: string;
  street: string;
  number: string;
  isEdited: boolean;
}

export interface CardValues {
  number: string;
  expiry: string;
  cvc: string;
  type: string;
  name: string;
}

const initialState = {
    token: '',
    userName: '',
    firstName: '',
    email: '',
    birthday: '',
    address: {country: '', city: '', street: '', number: '', isEdited: false},
    profileImage: '',
    visaToken: {number: '', expiry: '', cvc: '', type: '', name: ''},
    currency: ''
};

const state = remx.state(initialState);

const getters = remx.getters({
  getToken() {
    return state.token;
  },
  getUserName() {
    return state.userName.split('@')[0];
  },
  getEmail() {
    return state.email;
  },
  getfirstName() {
    return state.firstName;
  },
  getBirthday() {
    return state.birthday;
  },
  getAddress() {
    return state.address;
  },
  getProfileImage() {
    return state.profileImage;
  },
  getVisaToken() {
    return state.visaToken;
  },
  getCurrency() {
    return state.currency;
  },
  getUserCurrencySymbol() {
    let currencySymbol = '$';
    if (state.currency === 'EUR') {
      currencySymbol = '€';
    } else if (state.currency === 'ILS') {
      currencySymbol = '₪';
    }
    return currencySymbol;
  }
});

const setters = remx.setters({
  setToken(token: string) {
    state.token = token;
  },
  setUserName(name: string) {
    state.userName = name;
  },
  setEmail(email: string) {
    state.email = email;
  },
  setFirstName(firstName: string) {
    state.firstName = firstName;
  },
  setBirthday(birthday: string) {
    state.birthday = birthday;
  },
  setAddress(address: Address) {
    state.address = address;
  },
  setProfileImage(profileImage: string) {
    state.profileImage = profileImage;
  },
  setVisaToken(visa: CardValues) {
    // goal: if someone has access to client memory but not DB or vice versa that is not enough
    // so scenerio would be: client loggs in, now in order to use card he needs to request it from db and decrypt it
    // meaning when client inputs it for the first and last time, it is sent encrypted to DB
    // now if someone breaks into DB + client storage they have it, which is why we can add another encryption at server before sending
    // to DB with a key that is saved in azure keyvault.
    state.visaToken = visa;
  },
  setCurrency(currency: string) {
    state.currency = currency;
  },

  async initialUserProfileData(token: string) {
    const res = await getUserProfileDetails(token);
    if (res.email) {
      setters.setEmail(res.email);
    }
    if (res.birthday) {
      setters.setBirthday(res.birthday);
    }
    if (res.address) {
      setters.setAddress(res.address);
    }
    if (res.profile_image) {
      setters.setProfileImage(res.profile_image);
    }
    if (res.firstName) {
      setters.setFirstName(res.firstName);
    }
    if (res.visaToken) {
      setters.setVisaToken(res.visaToken);
    }

  },

  // set user locale data when signing in
  async setUserLocale() {
    try {
      const userIpstack = await axios.get(
        'http://api.ipstack.com/check?access_key=40f6097cf13b4c8a8c1ec44cd46e89ea',
      );
      if (userIpstack.data) {
        if (userIpstack.data.continent_code === 'EU') {
          userStore.setCurrency('EUR');
        } else if (userIpstack.data.country_code === 'IL') {
          userStore.setCurrency('ILS');
        } else {
          // case "US" or other
          userStore.setCurrency('USD');
        }
        if(!state.address.isEdited) {
          //console.warn("setting address: " + userIpstack.data.continent_name + " " + userIpstack.data.capital);
          // todo very wierd some fields dont work some do
          // todo this whole things needs fixing
          userStore.setAddress({
            country: userIpstack.data.continent_name,
            city: userIpstack.data.country_code,
            street: '', //@TODO
            number: '', //@TODO
            isEdited: false
          });
        }
      }
    } catch (error) {
      userStore.setCurrency('USD')
      userStore.setAddress({
        country: 'Planet Earth',
        city: 'Somewhere',
        street: '', //@TODO
        number: '', //@TODO
        isEdited: false,
      });
      console.error(error + ' from ipstack..');
    }
  }
});

export const userStore = {...getters, ...setters};