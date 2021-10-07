import React from 'react';
import {ScrollView, TouchableHighlight, Alert, BackHandler} from 'react-native';
import {Image, LoaderScreen} from 'react-native-ui-lib';
import {styles} from '../utils/styleSheet';
import {userStore} from '../store/userStore';
import {Navigation} from 'react-native-navigation';
import {updateUserProfile} from '../utils/serverApi';

interface Props {
  componentId: string;
}

const editProfileImageScreen = (props: Props) => {

    const [loader, setLoader] = React.useState(false);

    React.useEffect(()=>{
      BackHandler.addEventListener(
        'hardwareBackPress',
        handleBackButtonClick,
      );
      return ()=> {
        BackHandler.removeEventListener(
          'hardwareBackPress',
          handleBackButtonClick,
        );
      }
    },[]);

    const handleBackButtonClick = () => {
      Navigation.pop(props.componentId);
      return true;
    };

    const handleImagePress = async (imageAddress: string) => {
      setLoader(true);
      const res = await updateUserProfile({
        type: 'profile_image',
        profile_image: imageAddress,
      });
      if (res['profile_image'] === imageAddress) {
        userStore.setProfileImage(imageAddress);
        Navigation.pop(props.componentId);
      }
      else {
        Alert.alert('failed to update profile Image');
      }
      setLoader(false);
    }

    const renderImage = (imageAddress: string) => {
      return (
        <TouchableHighlight onPress={() => handleImagePress(imageAddress)}>
          <Image
            style={{...styles.userImage, marginTop: 20}}
            source={{uri: imageAddress}}
          />
        </TouchableHighlight>
      );
    }

    return (
      loader ?
      <LoaderScreen /> : (
      <ScrollView
        contentContainerStyle={{...styles.backgroundContainer, alignItems: 'center'}}>
        {renderImage(
          'https://encrypted-tbn0.gstatic.com/images?q=tbn%3AANd9GcQDy76vSeG7-IW2N2HF_HOiphfX6fQOrNa63w&usqp=CAU',
        )}
        {renderImage(
          'https://encrypted-tbn0.gstatic.com/images?q=tbn%3AANd9GcTELL-HQ24rtxpDqz6MqqjPCfGmP8pYh_aSrQ&usqp=CAU',
          )}
        {renderImage(
          'https://images.freeimages.com/images/premium/previews/6300/6300983-pirate-girl.jpg',
          )}
        {renderImage(
          'https://image.freepik.com/free-vector/pirate-girl-kid-costume-halloween-hand-drawn-cartoon-style_42349-166.jpg',
          )}
        {renderImage(
          'http://www.pngall.com/wp-content/uploads/2016/06/Pirate-Free-PNG-Image.png',
        )}
      </ScrollView>
      )
    );
}
export default editProfileImageScreen;