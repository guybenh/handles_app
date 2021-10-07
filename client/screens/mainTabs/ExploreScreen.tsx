import React from 'react';
import {Platform, FlatList} from 'react-native';
import {Text, View, ListItem, Button} from 'react-native-ui-lib';
import {connect} from 'remx';
import {itemsStore, Item} from '../../store/itemsStore';
import * as Animatable from 'react-native-animatable';
import {styles} from '../../utils/styleSheet';
import {SearchBar} from 'react-native-elements';
import {Navigation} from 'react-native-navigation';
import {getMainAppComponentId, invFreqOptions} from '../../utils/utils';


interface Props {
  data: Item[];
  navigation: any;
}

interface State {
  search: string;
  data: Item[];
  isSearch: boolean;
}

class ExploreScreen extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      search: '',
      data: this.props.data,
      isSearch: false,
    };
  }

  SearchFilterFunction = (text: string) => {
    this.setState({isSearch: true});
    const filteredData =
      this.props.data !== undefined
        ? this.props.data.filter((item) =>
            item.name.toUpperCase().includes(text.toUpperCase()) || item.categories[0].toUpperCase().includes(text.toUpperCase()),
          )
        : [];
    this.setState({search: text, data: filteredData});
  };

  showPrice = (formattedPrice: {value: number, currency: string}) => {
    let currencySymbol = '$';
    if(formattedPrice.currency === 'EUR') {
      currencySymbol = '€';
    }
    else if(formattedPrice.currency === 'ILS') {
      currencySymbol = '₪';
    }
    return `${currencySymbol}${formattedPrice.value}`;
  }

  handleItemPress = (item: Item) => {
    let nextScreen: string = 'joinToSubscriptionScreen'
    if (item.type === 'box') {
      nextScreen = 'joinToBoxScreen'
      Navigation.push(getMainAppComponentId(), {
        component: {
          name: nextScreen,
          passProps: {
            itemName: item.name,
            itemFormattedPrice: item.formattedPrice,
            itemId: item.id,
            about: item.about,
            choices: item.choices,
            billingDate: item.billingDate,
            icon: item.icon,
            webInfo: item.moreInfoOnWeb,
            packages: item.packages,
            signUpUrl: item.signUpUrl,
            shippingInfo: item.shipping,
            gallery: item.gallery,
            navigation: this.props.navigation,
          },
          options: {
            topBar: {
              title: {
                text: 'Subscription Page',
              },
            },
          },
        },
      });
    }
    else {
      Navigation.push(getMainAppComponentId(), {
        component: {
          name: nextScreen,
          passProps: {
            itemName: item.name,
            itemFormattedPrice: item.formattedPrice,
            itemId: item.id,
            navigation: this.props.navigation,
          },
          options: {
            topBar: {
              title: {
                text: 'Subscription Page',
              },
            },
          },
        },
      });
    }
  };

  renderRow(item: Item, id: number) {
    return (
      <Animatable.View animation="fadeInRight" duration={500} easing='ease-out-expo' useNativeDriver>
        <ListItem        
          activeBackgroundColor={styles.activeBackgroundColor.color} // dont think it works anyway
          activeOpacity={0.3}
          height={77.5}
          onPress={() => this.handleItemPress(item)}>
          <ListItem.Part left containerStyle={styles.backgroundContainer}>
            <Animatable.Image source={{uri: item.icon}} style={styles.image} />
          </ListItem.Part>
          <ListItem.Part
            middle
            column
            containerStyle={[styles.border, {paddingRight: 17}]}>
            <ListItem.Part right row containerStyle={{marginBottom: 3}}>
              <Text
                dark10
                text70
                style={styles.listItemText}
                numberOfLines={1}>
                {item.name}
              </Text>
              <Text
                dark10
                text70
                style={{...styles.listItemSubText, marginRight: 20}}>{`${this.showPrice(item.formattedPrice)}/${invFreqOptions.get(item.billingFreq)}`}</Text>
            <View>
            <Button
                text90
                link
                iconSource={require('../../../assets/joinToSubscription/arrow.png')}
                iconStyle={{height: 30, width: 30}}
                style={{marginRight: 5}}
                onPress={() => this.handleItemPress(item)}
              />
                </View>
            </ListItem.Part>
            
          </ListItem.Part>
        </ListItem>
      </Animatable.View>
    );
  }

  render() {
    return (
      <View style={{flex: 1, marginTop: Platform.OS === 'ios' ? '20%' : '10%'}}>
        <SearchBar
          containerStyle={Platform.OS === 'android' ? {backgroundColor: 'rgb(230,230,230)', borderRadius: 20} : styles.backgroundContainer}
          selectionColor='#bebebe'
          searchIcon={{size: 24}}
          placeholder="Enter Name or Category..."
          onChangeText={(text) => this.SearchFilterFunction(text)}
          onClear={() => this.setState({isSearch: false})}
          value={this.state.search}
          platform={Platform.OS === 'ios' ? 'ios' : 'android'}
        />
        <Text style={{...styles.subTitle, marginTop: '5%'}}>Explore</Text>
        <FlatList
          style={styles.backgroundContainer}
          data={this.state.isSearch ? this.state.data : this.props.data}
          renderItem={({item, index}) => this.renderRow(item, index)}
          keyExtractor={(item) => item.name}
        />
      </View>
    );
  }
}

function mapStateToProps() {
  return {
    data: itemsStore.getStoreItems(),
  };
}

export default connect(mapStateToProps)(ExploreScreen);

