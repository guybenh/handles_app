import {StyleSheet} from 'react-native';
import {Platform} from 'react-native';
import { Colors } from 'react-native/Libraries/NewAppScreen';

export const promaryColorWhite = '#fbf7eb'
export const primaryColor = '#202219'
export const secondaryColor = '#82E430'
export const secondaryColor2 = '#518F21'
export const secondaryOrange = '#ED7D31'
export const mainFontBold = 'Comfortaa bold'
export const mainFont = 'Comfortaa'  // todo need to import
export const blue1 = '#2493D6'
const purpleblue = '#ccccff'

export const signInStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: blue1,
  },
  header: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 50,
  },
  footer: {
    flex: 3,
    // backgroundColor: '#fff',
    backgroundColor: Colors.white,  // TODO for dark mode change this?
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  text_header: {
    // color: '#fff',
    color: promaryColorWhite,
    fontWeight: 'bold',
    fontSize: 30,
    // fontFamily: mainFont, // need to put font
  },
  text_footer: {
    // color: '#05375a',
    color: Colors.black,
    fontSize: 18,
  },
  action: {
    flexDirection: 'row',
    marginTop: 10,
    borderBottomWidth: 1,
    //borderBottomColor: '#f2f2f2',
    borderBottomColor: secondaryOrange,
    paddingBottom: 5,
  },
  actionError: {
    flexDirection: 'row',
    marginTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#FF0000',
    paddingBottom: 5,
  },
  textInput: {
    flex: 1,
    marginTop: Platform.OS === 'ios' ? 0 : -12,
    paddingLeft: 10,
    // color: '#05375a',
    color: Colors.black,
  },
  errorMsg: {
    color: '#FF0000',
    fontSize: 14,
  },
  goodMsg: {
    color: blue1,
    fontSize: 14,
  },
  okMsg: {
    color: secondaryOrange,
    fontSize: 14,
  },
  button: {
    alignItems: 'center',
    marginTop: 40,
  },
  signIn: {
    width: '100%',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  textSign: {
    fontSize: 18,
    fontWeight: 'bold',
    //color: promaryColorWhite,
  },
  textPrivate: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 20,
  },
  color_textPrivate: {
    color: 'grey',
  },
});