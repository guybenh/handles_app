import React from 'react';
import {
  TouchableOpacity,
  ScrollView,
  ImageBackground
} from 'react-native';
import {View, Text} from 'react-native-ui-lib';
import {subscriptionCategories} from '../utils/utils';
import {styles} from '../utils/styleSheet';

interface Props {
  componentId: string;
}

const categoriesScreen = (props: Props) => {
  return (
    <ScrollView>
      <View style={styles.categoriesScreenContainer}>
        {subscriptionCategories.map((category, index) => {
          return (
            <TouchableOpacity
              key={index}
              style={styles.categoriesScreenItem}
              onPress={() => {}}>
              <ImageBackground
                style={styles.categoriesScreenItemBackground}
                source={{uri: category.image}}>
                <Text style={styles.categoriesScreenItemTitle}>
                  {category.name}
                </Text>
              </ImageBackground>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
};

export default categoriesScreen;