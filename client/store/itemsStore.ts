import * as remx from 'remx';
import {
  updateHomeDataToApi,
  subscribeItemApi,
  getHomeDataFromApi,
  getExploreDataFromApi,
  unSubscribeItemApi,
} from '../utils/serverApi';
import {
  graphicColor,
  getCurrentColorIndex,
  setCurrentColorIndex,
  zeroColorIndex,
  daysInThisMonth,
} from '../utils/utils';
import {userStore} from './userStore';

export interface Item {
  id: string,
  type: string,
  name: string;
  formattedPrice: {value: number, currency: string};
  icon: string;
  signUpUrl: string;
  status: boolean;
  billingDate: string;
  billingFreq: string;
  categories: string[];
  subPassword?: string;
  subUsername?: string;
  jsScript?: string[][];
  about?: string; // from here adding for box
  packages?: any[];
  choices?: any[];
  shipping?: string[];
  moreInfoOnWeb?: string[];
  gallery?: string[];
}

interface singleRate {
  EUR: number;
  USD: number;
  ILS: number;
}

interface currencyRates {
  EUR: singleRate;
  USD: singleRate;
  ILS: singleRate;
}

interface ExpensesHistoryData {
  // allData: {'1' : [['Oct' ,17.86', USD], ['Nov', '15', 'ILS]]}
  allData: {[key: string]: any[]};
  labels: string[];
  data: number[];
  USD: number[];
  EUR: number[];
  ILS: number[];
}


/* TODO: nbig reshape? i think we should have a set and a get for specific items in home screen by key=id, 
this way all the updates should make 1 api cal for update, get result, and then set only the changed item 
instead of everytime resetting the entire home screen. same for add and remove item*/

const initialState = {
  homeScreenItems: <Item[]>[],  // todo:? shouldnt this be a map so we can access any item by its id?
  storeItems: <Item[]>[],
  expensesHistoryData: <ExpensesHistoryData>{},
  currencyRates: <currencyRates>{},
};

const state = remx.state(initialState);

const getters = remx.getters({
  getHomeScreenItems() {
    return state.homeScreenItems;
  },

  getStoreItems() {
    return state.storeItems;
  },

  getExpensesHistoryData() {
    return state.expensesHistoryData;
  },

  getCurrencyRates() {
    return state.currencyRates;
  },

  getTotalSubscriptionPrice() {
    const currency = userStore.getCurrency() ? userStore.getCurrency() : 'USD';
    if (state.homeScreenItems) {
      return +state.homeScreenItems
        .reduce(
          (acc, item: Item) =>
            +acc + +(item.status === true ? getRelativeMonthlyPrice(formatPrice(item.formattedPrice, currency), item.billingFreq)  : 0),
          0,
        )
        .toFixed(2);
    } else return 0;
  },

  getHomeScreenItemURL(id: number) {
    return state.homeScreenItems[id].signUpUrl; // todo switch to id not index? or fine
  },

  getHomeScreenItem(id: string) {
    for (let item of state.homeScreenItems) {
      if (item.id === id) {
        return item;
      }
    }
    console.error(id + ' --> bad id');
    return state.homeScreenItems[0]; // put this here cuz otherwise it tells me that function may not return value.. must be better way
  },

  getExpenses() {
    let data: any[] = [];
    state.homeScreenItems.forEach((item) => {
      item.status
        ? data.push({
            name: item.name,
            price: getRelativeMonthlyPrice(formatPrice(item.formattedPrice, 'USD'), item.billingFreq),
            color: graphicColor[getCurrentColorIndex()],
            legendFontColor: graphicColor[getCurrentColorIndex()],
            legendFontSize: 15,
          })
        : null;
      setCurrentColorIndex();
    });
    zeroColorIndex();
    return data;
  },

  getHistoryExpenses() {
    let data = [];
    const currency = userStore.getCurrency();
    currency === 'ILS'
      ? (data = [...state.expensesHistoryData.ILS])
      : currency === 'EUR'
      ? (data = [...state.expensesHistoryData.EUR])
      : (data = [...state.expensesHistoryData.USD]);
    return {
      labels: state.expensesHistoryData.labels,
      datasets: [
        {
          data: data,
          color: (opacity = 1) => `rgba(237, 125, 49, ${opacity})`, // optional
          strokeWidth: 2, // optional
        },
      ],
      legend: ['Expenses '], // optional
    };
  },

  getBarChartData() {
    const currency = userStore.getCurrency() ? userStore.getCurrency() : 'USD';
    let cats = Array.from(getCategories());
    let data = [];
    for (var cat of cats) {
      let sum = 0;
      for (var item of state.homeScreenItems) {
        if (item.status && item.categories[0] == cat) {  // todo: what about many categories?
          sum += getRelativeMonthlyPrice(formatPrice(item.formattedPrice, currency), item.billingFreq);
        }
      }
      data.push(sum);
    }
    const dataBar = {
      labels: cats,
      datasets: [
        {
          data: data
        },
      ]
    };
    return dataBar;
  },

  // getContributionGraphData() { // i was thinkng maybe this can be good for one time payments or wierd kind of reoccurences, yearly?
  //   let data = [];
  //   let pushedDates = new Set();
  //   for (var item of state.homeScreenItems) {
  //     if (item.status && item.billingDate.length > 2) {  // so its not just the date of the month
  //       if (!pushedDates.has(item.billingDate)){
  //         data.push({ date: item.billingDate, count: 1});
  //       } // todo - make it darker or bright for more items by doing with count
  //       // check wierd bug when dates are only day of month does calender click be wierd or its ok?
  //       pushedDates.add(item.billingDate);
  //     }
  //   }
  //   return data;
  // },

  getNearBills() {
    let labels: string[] = [];
    let data: number[] = [];
    for (var item of state.homeScreenItems) {
      let perc = getPercentageOfBillingCompleteness(item);
      if (item.status) {
        if (item.billingFreq === '1-0-0' || perc < 0 || perc > 1) {
          continue; // becasue than percentage is by hour. we dont look at the YET
        }
        data.push(perc);
        labels.push(item.name.split(' ')[0]); // put abbreviation of long word?
      }
    }
    var zipped = data.map(function (e, i) {
      return [e, labels[i]];
    });
    zipped.sort((one, two) => (one[0] < two[0] ? -1 : 1));
    for (let i = 0; i < zipped.length; i++) {
      data[i] = +zipped[i][0];
      labels[i] = zipped[i][1].toString();
    }
    return {labels, data}; // todo: return only top 6
  },

  getCurrencySymbol(currency: string) {
    let currencySymbol = '$';
    if (currency === 'EUR') {
      currencySymbol = '€';
    } else if (currency === 'ILS') {
      currencySymbol = '₪';
    }
    return currencySymbol;
  }
});



const setters = remx.setters({
  setHomeScreenItems(items: Item[]) {
    state.homeScreenItems = items;
  },

  setNewItemToHome(item: Item) {
    state.homeScreenItems.push(item);
  },

  setStoreItems(items: Item[]) {
    state.storeItems = items;
  },

  setExpensesHistoryData(data: Object) {
    Object.assign(state.expensesHistoryData, data);
  },

  setCurrencyRates(rates: currencyRates) {
    state.currencyRates = rates;
  },

  async setHomeScreenItemStatus(index: number, newStatus: boolean) {
    state.homeScreenItems[index].status = newStatus;
    try {
      const res = await updateHomeDataToApi({
        id: state.homeScreenItems[index].id,
        status: newStatus,
      });
      if (state.homeScreenItems[index].status !== res.status) {
        state.homeScreenItems[index].status = !newStatus;
      }
    } catch (err) {
      console.error(err);
    }
  },

  async subscribeItemFromExploreScreen(
    id: string,
    formattedPrice: {value: number; currency: string},
    billingDate: string,
  ) {
    await subscribeItemApi({id, formattedPrice, billingDate});
    const homeScreenItems = await getHomeDataFromApi();
    itemsStore.setHomeScreenItems(homeScreenItems);
    const storeItems = await getExploreDataFromApi(userStore.getToken());
    itemsStore.setStoreItems(storeItems);
  },
});

export const unSubscribeItemFromHomeScreen = async (itemId: string) => {
  await unSubscribeItemApi({id: itemId});
  const storeItems = await getExploreDataFromApi(userStore.getToken());
  itemsStore.setStoreItems(storeItems);
  const homeScreenItems = await getHomeDataFromApi();
  itemsStore.setHomeScreenItems(homeScreenItems);
  return true; // to know its done
};

// aux for calc total price
export const formatPrice = (formattedPrice: {value: number; currency: string}, currency: string) => {
  if (state.currencyRates) {
    const innerDict = state.currencyRates[formattedPrice.currency];
    return formattedPrice.value * innerDict[currency];
  }
  return formattedPrice.value;
};

const getCategories = () => {
  let categories = new Set();
  state.homeScreenItems.forEach(item => {
    item.categories.forEach(cat => {
        categories.add(cat);
    });
  });
  return categories;
};

const getRelativeMonthlyPrice = (price: number, billingFreq: string) => {
  let monthDaysCount = daysInThisMonth();
  switch (billingFreq) {
    case '1-0-0':
      return price * monthDaysCount;
    case '7-0-0':
      return price * (monthDaysCount / 7);
    case '14-0-0':
      return price * (monthDaysCount / 14);
    case '0-1-0':
      return price;
    case '0-2-0':
      return price/2;
    case '0-0-1':
      return price/12;
  }
  return price;
};

const getPercentageOfBillingCompleteness = (item: Item) => {
  let nowDate = new Date();
  let nextDate = new Date(item.billingDate);
  let differenceInTime = nextDate.getTime() - nowDate.getTime();
  let differenceInDays = differenceInTime / (1000 * 3600 * 24);
  let monthDaysCount = daysInThisMonth();
  switch (item.billingFreq) {
    case '1-0-0':
      return 1 - differenceInDays; 
    case '7-0-0':
      return 1 - (differenceInDays / 7);
    case '14-0-0':
      return 1 - (differenceInDays / 14);
    case '0-1-0':
      return 1 - (differenceInDays / monthDaysCount);
    case '0-2-0':
      return 1 - (differenceInDays / 61); // number of days in 2 months
    case '0-0-1':
      return 1 - (differenceInDays / 365);
  }
  return 0;
};

// todo - should we just finally make a class called item and have all methods that operate on item in it?

export const itemsStore = {...getters,...setters};
