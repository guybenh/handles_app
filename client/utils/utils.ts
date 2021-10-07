import {Colors} from 'react-native-ui-lib';
import {styles} from './styleSheet';

export const mainTabsImages = {
  home: require('../../assets/mainTabsIcons/home.png'),
  profile: require('../../assets/mainTabsIcons/user.png'),
  billing: require('../../assets/mainTabsIcons/receipt.png'),
  explore: require('../../assets/mainTabsIcons/telescope.png'),
};

// needed for billing screen
let currentColorIndex = 0;
export const getCurrentColorIndex = () => {
  return currentColorIndex;
};
export const setCurrentColorIndex = () => {
  currentColorIndex =
    currentColorIndex < graphicColor.length - 1 ? currentColorIndex + 1 : 0;
};
export const zeroColorIndex = () => {
  currentColorIndex = 0;
};
export const graphicColor = Colors.generateColorPalette(Colors.blue10)
  .concat(Colors.generateColorPalette(Colors.green10))
  .concat(Colors.generateColorPalette(Colors.red10));

export const BarChartConfig = {
  backgroundGradientFrom: styles.chartBackgroundGradiant.color,
  backgroundGradientTo: styles.chartBackgroundGradiant.color,
  decimalPlaces: 2,
  color: (opacity = 1) => `rgba(36, 147, 214, ${opacity})`, // our blue
  style: {
    borderRadius: 16,
  },
};

export const BarChartConfig2 = {
  backgroundGradientFrom: styles.chartBackgroundGradiant.color,
  backgroundGradientTo: styles.chartBackgroundGradiant.color,
  decimalPlaces: 2,
  color: (opacity = 1) => `rgba(237, 125, 49, ${opacity})`, // our orange
  style: {
    borderRadius: 30,
  },
};


// needed for navigation
let mainAppComponentId = '';
let signInComponentId = '';

export const setMainAppComponentId = (id: string) => {
  mainAppComponentId = id;
};
export const getMainAppComponentId = () => {
  return mainAppComponentId;
};
export const setSignInComponentId = (id: string) => {
  signInComponentId = id;
};
export const getSignInComponentId = () => {
  return signInComponentId;
};
//////////////////////////////

// for loading to be long enough
export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// for months and days
export function daysInThisMonth() {
  var now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
}

//icons for custom subscription screen
export const customSubscriptionIcons: Map<string, string> = new Map([
  [
    'Rent',
    'https://icons.iconarchive.com/icons/graphicloads/100-flat/256/home-icon.png',
  ],
  [
    'Gym',
    'https://icons.iconarchive.com/icons/sonya/swarm/256/gym-icon.png',
  ],
  [
    'Phone',
    'https://icons.iconarchive.com/icons/graphicloads/100-flat/256/phone-icon.png',
  ],
  [
    'Electricity',
    'https://icons-for-free.com/iconfiles/png/512/electricity+icon-1320087270769193842.png',
  ],
  [
    'Water',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/Circle-icons-water.svg/1024px-Circle-icons-water.svg.png',
  ],
  [
    'Food',
    'https://icons.iconarchive.com/icons/graphicloads/colorful-long-shadow/256/Restaurant-icon.png',
  ],
  [
    'Music',
    'https://icons.iconarchive.com/icons/wwalczyszyn/iwindows/512/Music-Library-icon.png',
  ],
  [
    'News',
    'https://icons.iconarchive.com/icons/paomedia/small-n-flat/1024/news-icon.png',
  ],
  [
    'Entertainment',
    'https://icons.iconarchive.com/icons/dtafalonso/android-lollipop/512/Play-Games-icon.png',
  ],
  [
    'Video',
    'https://icons.iconarchive.com/icons/martz90/circle/512/video-camera-icon.png',
  ],
  [
    'General',
    'https://icons.iconarchive.com/icons/graphicloads/seo-services/256/services-portfolio-icon.png',
  ],
  [
    'Other',
    'https://icons.iconarchive.com/icons/cornmanthe3rd/plex/512/Other-dropbox-icon.png',
  ],
]);

export const keysForCustomSubscriptionIcons = [
  ...customSubscriptionIcons.keys(),
];
/////////////////////////////////////////

export const CurrencyOptions = ['EUR', 'USD', 'ILS'];
export const FreqOptions : Map<string, string> = new Map([
  ['Daily', '1-0-0'],
  ['Weekly', '7-0-0'],
  ['Bi-Weekly', '14-0-0'],
  ['Monthly', '0-1-0'],
  ['Bi-Monthly', '0-2-0'],
  ['Yearly', '0-0-1'],
]);

export const invFreqOptions : Map<string, string> = new Map([  // todo in typescript way?
  ['1-0-0', 'Day'],
  ['7-0-0', 'Week'],
  ['14-0-0', 'Bi-Weekly'],
  ['0-1-0', 'Month'],
  ['0-2-0', 'Bi-Monthly'],
  ['0-0-1', 'Year', ],
]);

export const FreqOptionsKeys = [
  ...FreqOptions.keys(),
];

export const MonthOptions = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export const YearOptions = [
  '2020',
  '2019',
  '2018',
  '2017',
  '2016',
  '2015',
];

// for categoriesScreen
export const subscriptionCategories = [
  {
    name: 'Music',
    image:
      'https://9b16f79ca967fd0708d1-2713572fef44aa49ec323e813b06d2d9.ssl.cf2.rackcdn.com/1140x_a10-7_cTC/NS-WKMAG0730-1595944356.jpg',
  },
  {
    name: 'Food',
    image:
      'https://images.immediate.co.uk/production/volatile/sites/30/2020/08/chorizo-mozarella-gnocchi-bake-cropped-9ab73a3.jpg?quality=90&resize=700%2C636',
  },
  {
    name: 'Drinks',
    image:
      'https://cdn-prod.medicalnewstoday.com/content/images/articles/320/320669/whiskey-glass.jpg',
  },
  {
    name: 'Animals',
    image:
      'https://www.waltham.com/sites/g/files/jydpyr1046/files/2020-09/golden%20retriever%20mix%20dog%20walking%20in%20the%20forest.jpg',
  },
  {
    name: 'Flowers',
    image:
      'https://profoundponders.com/wp-content/uploads/2020/07/lotus-flower-828457262-5c6334b646e0fb0001dcd75a.jpg',
  },
  {
    name: 'Beuty',
    image:
      'https://amp.thenationalnews.com/image/policy:1.774477:1538030182/Lf26-SEP-Saudi-beauty.jpg?f=16x9&w=1200&$p$f$w=627d9b8',
  },
  {
    name: 'Kids',
    image:
      'https://cms-tc.pbskids.org/parents/articles/7-Ways-to-Get-Your-Kids-to-Eat-Fruit-and-Love-It.jpg?mtime=20181203085043',
  },
  {
    name: 'Fitness',
    image:
      'https://img.redbull.com/images/c_crop,x_0,y_0,h_2533,w_3800/c_fill,w_860,h_573/q_auto,f_auto/redbullcom/2018/05/15/36f524f6-9d50-4c9d-bbce-8555ed10c8c2/health-fitness-tips-weight',
  },
  {
    name: 'Games',
    image:
      'https://cdn.vox-cdn.com/thumbor/Xm1C9TWbMK55zAnuR09oD6XMyRI=/0x0:1024x1024/1200x800/filters:focal(444x567:606x729)/cdn.vox-cdn.com/uploads/chorus_image/image/65813576/mobile_MarioKartTour_screen_01.0.png',
  },
  {
    name: 'Shave',
    image: 'https://genco-uk.com/wp-content/uploads/2018/07/Shave-01.jpg',
  },
];


