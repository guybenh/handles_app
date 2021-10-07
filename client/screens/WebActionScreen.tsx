import React from 'react';
import {WebView} from 'react-native-webview';
import {itemsStore, Item} from '../store/itemsStore';
import {userStore} from '../store/userStore';
import { Alert, Platform } from 'react-native';
import { HandlesLoader } from '../utils/HandlesLoader';
import { delay } from '../utils/utils';
import { View } from 'react-native-ui-lib';

interface State {
  curUrl: string;
  loading: boolean;
}

interface Props {
  componentId: string;
  itemId: string;

}

class WebActionScreen extends React.PureComponent<Props, State> {
  pageNumber: number;
  script: string[][];
  joinedScript: string[];
  curItem: Item;
  constructor(props: Props) {
    super(props);
    this.curItem = itemsStore.getHomeScreenItem(props.itemId);
    this.state = {
      curUrl: this.curItem.signUpUrl,
      loading: false,
    };
    this.pageNumber = 0;
    if (Platform.OS === 'ios') {
      if (typeof this.curItem.jsScript === 'undefined' || this.curItem.jsScript === null) {
        Alert.alert('Not available for this subscription')
        // pop back or exit or something?
        this.script = [[]];
        this.joinedScript = [];
      }
      else {
        this.script = this.curItem.jsScript;
        this.joinedScript = new Array(this.script.length)
        // first concat the strings and add a newline in between
        for (let i in this.script) {
            this.joinedScript[i] = this.formatScript(this.script[i].join('\n'));
        }
      }
    }   
  }

  formatScript = (scr: string) => {
    scr = scr.replace('{{formattedPrice}}', String(this.curItem.formattedPrice.value));
    scr = scr.replace('{{email}}', userStore.getEmail());
    return scr; // todo think how to put it in the json
  }

  render() {
    if (Platform.OS === 'ios') { 
      if (typeof this.curItem.jsScript !== 'undefined' || this.curItem.jsScript !== null) {
        this.joinedScript[this.pageNumber] = this.joinedScript[this.pageNumber].replace('{{pageNumber}}', String(this.pageNumber+1));
        //console.warn(this.joinedScript[this.pageNumber]);
      }
    }


    return (
      <WebView
        source={{
          uri: this.state.curUrl,
        }}
        javaScriptCanOpenWindowsAutomatically={true} // was this the issue? I WONDER WHAT DIFF THIS MAKES
        //onLoad={() => Alert.alert('loading')}  // todo: loader for android!!
        // onLoadStart={() => this.setState({loading: true})}
        // onLoad={() => this.setState({loading: false})}
        scrollEnabled={true}
        onMessage={async (event) => {
          // if i am blocked by clicking on a url i can reads its value and then reload by web view with it:
          //console.warn(event.nativeEvent.data);
          //await delay(4000);
          //this.setState({curUrl: 'https://www.nba.com/'});  --> example for how you can use this
          this.pageNumber = parseInt(event.nativeEvent.data);
        }}
        automaticallyAdjustContentInsets={true}
        javaScriptEnabled={true}
        injectedJavaScript={Platform.OS === 'ios' ? this.joinedScript[this.pageNumber] : ``}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        style={{flex: 1}}
      />
    );
  }
}

export default WebActionScreen;
