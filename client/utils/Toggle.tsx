import React from 'react';
import { Animated, TouchableWithoutFeedback, ViewStyle, TextStyle, Text, ImageStyle ,LayoutChangeEvent, StyleSheet, Easing} from "react-native";
import { Colors } from 'react-native/Libraries/NewAppScreen';
import { colors } from 'react-native-elements';



interface Props {
    onPress: any;  // put real type
    initialState: boolean;
}

const Toggle = ({ onPress, initialState }: Props) => {


    const animation = React.useRef(new Animated.Value(initialState ? 1 : 0)).current;
    const [toggled, setToggled] = React.useState(initialState);
    const [containerWidth, setContainerWidth] = React.useState(0);
    const [marked, setMarked] = React.useState(0);

    return (
    <TouchableWithoutFeedback
        onPress={() => {
            setToggled(!toggled);
            // okay easing is cool, we give it a function to map the values from input to output
            // so if our range is [0,1] the function has to be a map from [0,1] to [0,1] so sigmoid, gaus: (val) => 1/((2*Math.PI)**(0.5))*(Math.E**(0.5*(val-1)**2)) is no good cuz it doesnt end at 1
            Animated.timing(animation, {toValue: toggled ? 0 : 1, duration: 1000, useNativeDriver: false, easing: (val) => Math.sin(val*(Math.PI/2))}).start();
            onPress(); 
            }}>
        <Animated.View
            onLayout={({
                    nativeEvent: {
                    layout: { width },
                    },
                }: LayoutChangeEvent) => setContainerWidth(width)}
            style={dynamicStyles.container(animation)}>
            {/* </Animated.View>/<Animated.Text style={[fonts.P1, dynamicStyles.text(true, animation)]}> */}
            <Animated.Text style={[dynamicStyles.text(true, animation)]}> 
              {' Activate'}
            </Animated.Text>
            <Animated.Text
            style={[
                dynamicStyles.text(false, animation),
                //styles.texttoggled,
            ]}
            >
            Active
            </Animated.Text>
            <Animated.View
                style={[
                    {transform: [
                        {
                        translateX: animation.interpolate({
                            inputRange: [0, 1],
                            outputRange: [-containerWidth/2 + 17, containerWidth/2 - 17],
                        }),
                        // translateY: animation.interpolate({
                        //     inputRange: [0, 1],
                        //     outputRange: [-containerWidth/2 + 17, containerWidth/2 - 17],
                        // }), // needs to be 3D obkect to add Y also for transformation ... for othe components maybe learn this
                        },
                    ],
                    } as any,
                    ]}>
                    <Animated.Image 
                        source={require('../../assets/customIcons/cancel_big.png')} 
                        style={[dynamicStyles.image(true, animation)]}/>
                    <Animated.Image 
                        source={require('../../assets/customIcons/check_big.png')} 
                        style={[dynamicStyles.image(false, animation)]}/>                       
            </Animated.View>
        </Animated.View>
        

    </TouchableWithoutFeedback>
    )

}

const dynamicStyles = {
    container: (animation: Animated.Value): ViewStyle => ({
      alignItems: 'center',
      backgroundColor: animation.interpolate({
        inputRange: [0, 1],
        outputRange: ['rgb(170, 170, 170)', 'rgb(51, 133, 255)']
      }) as any,
      borderRadius: 25,
      height: 34,
      justifyContent: 'center',
      paddingHorizontal: 30,
    }),
    text: (
        inverted: boolean,
        animation: Animated.Value,
      ): TextStyle => ({
        opacity: animation.interpolate({
          inputRange: [0, 1],
          outputRange: inverted ? [1, 0] : [0, 1],
        }) as any,
        transform: [{ translateY: inverted ? 36 : 19 }],
        //fontFamily: 'arial'  TODO needs to be comfortaa
        color: inverted ? 'black' : 'white'
      }),

    image: (
        inverted: boolean,
        animation: Animated.Value,
      ): ImageStyle => ({
        opacity: animation.interpolate({
          inputRange: [0, 1],
          outputRange: inverted ? [1, 0] : [0, 1],
        }) as any,
        transform: [{ translateY: inverted ? -3 : -32 }],
      
      borderRadius: 40, height: 28, width: 28, shadowOpacity: 0, shadowRadius: 10, shadowColor: 'rgb(0,0,0)',
    }),

  };

const styles = StyleSheet.create({
    knob: {
        marginBottom: 20,
        borderRadius: 50,
        backgroundColor: 'rgb(0,200,0)',
    },
    // texttoggled: 
    // {
    //     marginTop: 20,
    //     borderRadius: 50,
    //     //backgroundColor: 'rgb(0,200,0)',
    // },
});
export default Toggle;