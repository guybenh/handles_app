import React from 'react';
import {View, Text, Colors, Button} from 'react-native-ui-lib';
import {
  PieChart,
  LineChart,
  ProgressChart,
  ContributionGraph,
  StackedBarChart,
  BarChart,
} from 'react-native-chart-kit';
import {connect} from 'remx';
import {itemsStore} from '../../store/itemsStore';
import {Dimensions, ScrollView, Alert} from 'react-native';
import {styles} from '../../utils/styleSheet';
import {BarChartConfig, BarChartConfig2, delay} from '../../utils/utils';
import {userStore} from '../../store/userStore';

const screenWidth = Dimensions.get('window').width - 16;

interface Props {
  // totalPrice: number;  //@TO ADD
  // upcomingBillingDateData: {labels: string[]; data: number[]};
  expensesData: any[];
  nextBillData: {labels: string[]; data: number[]};
  expensesHistoryData: {
    allData: any[];
    labels: string[];
    data: number[];
    USD: number[];
    EUR: number[];
    ILS: number[];
  };
  barChartData: {labels: string[]; dataSets: [{data: number[]}]};
  contributionGraphData: [{}];
}

interface State {
  showMoreGraphs: boolean;
}

class BillingScreen extends React.PureComponent<Props, State> {
  scrollView : any;
  constructor(props: Props) {
    super(props);
    this.state = {
      showMoreGraphs: false
    }
  }

  renderCurrentBillDist = () => {
    return (
      <View>
        <Text style={{...styles.subTitle, paddingTop: '7%'}}>
          Monthly Expenses By Category
        </Text>
        <View center>
          <BarChart
            style={{
              marginVertical: 8,
              borderRadius: 16,
              borderColor: Colors.grey40,
              borderWidth: 1,
            }}
            data={this.props.barChartData}
            width={screenWidth}
            height={300}
            yAxisLabel={userStore.getUserCurrencySymbol()}
            chartConfig={BarChartConfig}
            verticalLabelRotation={30}
            fromZero={true}
          />
        </View>
      </View>
    );
  };

  renderOverView = () => {
    return (
      <View>
        <Text style={{...styles.subTitle, paddingTop: '7%'}}>Overview</Text>
        <View center>
          <LineChart
            data={this.props.expensesHistoryData}
            width={screenWidth}
            height={220}
            chartConfig={BarChartConfig2}
            fromZero={true}
            yAxisLabel={userStore.getUserCurrencySymbol()}
            //getDotColor={() => '#2493D6'}
            segments={4}
            style={{
              marginVertical: 8,
              borderRadius: 16,
              borderColor: Colors.grey40,
              borderWidth: 1,
            }}
          />
        </View>
      </View>
    );
  };

  renderNearesBillingPeriod = () => {
    return (
      <View>
        <Text style={{...styles.subTitle, paddingTop: '7%'}}>
          Nearest Billing Period
        </Text>
        <View center>
          <ProgressChart
            data={this.props.nextBillData}
            width={screenWidth}
            height={220}
            strokeWidth={16}
            radius={32}
            chartConfig={BarChartConfig2}
            hideLegend={false}
            style={{
              marginVertical: 8,
              borderRadius: 16,
              borderColor: Colors.grey40,
              borderWidth: 1,
            }}
          />
        </View>
      </View>
    );
  };

  // pie chart
  renderExpenses = () => {
    return (
      <View>
        <View center>
          <PieChart
            data={this.props.expensesData}
            width={screenWidth}
            height={220}
            chartConfig={BarChartConfig}
            style={{
              marginVertical: 8,
              borderRadius: 16,
              //backgroundColor: Colors.grey60,
              borderColor: Colors.grey40,
              borderWidth: 1,
            }}
            accessor="price"
            //backgroundColor="transparent"
            paddingLeft="10"
          />
        </View>
      </View>
    );
  };

  renderContributioGraph = () => {
    let today = new Date();
    let endDate = new Date(today.setMonth(today.getMonth() + 3));
    return (
      <View>
        <Text style={{...styles.subTitle, paddingTop: '7%'}}>Cool Chart 1</Text>
        <View center>
          <ContributionGraph
            onDayPress={(val: {count: number; date: Date}) =>
              Alert.alert(
                'pressed day: ' + val.count + 'day: ' + val.date.toString(),
              )
            }
            horizontal={true}
            values={this.props.contributionGraphData}
            //look for more attributes
            endDate={endDate} // month from today} // todo make todays date minimum
            numDays={105}
            width={screenWidth}
            height={220}
            chartConfig={BarChartConfig}
            style={{
              marginVertical: 8,
              borderRadius: 16,
              backgroundColor: Colors.grey60,
            }}
          />
        </View>
      </View>
    );
  };

  renderStackedBarChart = () => {
    const dataStackedBar = {
      labels: ['Test1', 'Test2'],
      legend: ['L1', 'L2', 'L3'],
      data: [
        [60, 60, 60],
        [30, 30, 60],
      ],
      barColors: ['#dfe4ea', '#ced6e0', '#a4b0be'],
    };
    return (
      <View>
        <Text style={{...styles.subTitle, paddingTop: '7%'}}>Cool Chart 2</Text>
        <View center>
          <StackedBarChart
            style={{
              marginVertical: 8,
              borderRadius: 16,
            }}
            data={dataStackedBar}
            width={screenWidth}
            height={220}
            chartConfig={BarChartConfig}
            fromZero={true}
          />
        </View>
      </View>
    );
  };

  renderLoadMoreGraphs = () => {
    return (
      <View>
        <Button
          style={{marginTop: 15, marginBottom: 15}}
          text90
          link
          label={this.state.showMoreGraphs ? 'Show Less' : 'Show More'}
          iconSource={require('../../../assets/billingScreen/diagram.png')}
          iconStyle={{height: 15, width: 15}}
          onPress={async () => {
            this.setState({showMoreGraphs: !this.state.showMoreGraphs});
          }}
        />
      </View>
    );
  };

  render() {
    return (
      <ScrollView
        ref={(view) => {this.scrollView = view;}}
        onContentSizeChange={() => this.scrollView.scrollToEnd({animated: true})}
        >
        {this.renderOverView()}
        {this.renderCurrentBillDist()}
        {this.renderLoadMoreGraphs()}
        {this.state.showMoreGraphs ?
        (<View>
          {this.renderExpenses()}
          {this.renderNearesBillingPeriod()}
          {/* {this.renderContributioGraph()} */}
          {/* {this.renderStackedBarChart()} */}
        </View>) : null}
      </ScrollView>
    );
  }
}

function mapStateToProps() {
  return {
    expensesData: itemsStore.getExpenses(),
    nextBillData: itemsStore.getNearBills(),
    // totalPrice: itemsStore.getTotalSubscriptionPrice(),
    expensesHistoryData: itemsStore.getHistoryExpenses(),
    barChartData: itemsStore.getBarChartData(),
    // contributionGraphData: itemsStore.getContributionGraphData(),
  };
}

export default connect(mapStateToProps)(BillingScreen);
