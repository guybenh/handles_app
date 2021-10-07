import React from 'react';
import {View, ViewStyle, StatusBar} from 'react-native';
import {Appearance} from 'react-native-appearance';
import * as Animatable from 'react-native-animatable';


export const HandlesLoader: React.FC<{}> = (props) => {
    const {children} = props;

    return (
        <>
            <StatusBar animated barStyle={Appearance.getColorScheme() === 'dark' ? "light-content" : "dark-content"}/>
                
                <View style={{flex: 1, backgroundColor: !children ? '#2493D6' : children.toString()}}>
                    <View style={{flex: 2, justifyContent: 'center', alignItems: 'center'}}>
                        <Animatable.Image
                        animation='rotate'
                        // duration='4000' this works, but for some reason on ios has warning so maybe its only android
                        // more here https://github.com/oblador/react-native-animatable
                        iterationCount='infinite'
                        easing="ease-out"
                        source={require('../../assets/mainLogo/logo.png')}
                        resizeMode='stretch'
                        />
                    </View>

                </View>
        </>
    );
}