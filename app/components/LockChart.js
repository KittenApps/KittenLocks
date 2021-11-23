import { useEffect, useState } from 'react';
import Highcharts from 'highcharts/highstock';
import Exporting from 'highcharts/modules/exporting';
import HighContrastDarkTheme from 'highcharts/themes/high-contrast-dark';
import HighchartsReact from 'highcharts-react-official';
// eslint-disable-next-line new-cap
HighContrastDarkTheme(Highcharts);
// eslint-disable-next-line new-cap
Exporting(Highcharts);

export default function LockChart(props){
  const [options, setOptions] = useState({
    title: { text: 'My stock chart' },
    series: [{ data: [1, 2, 3] }]
  });

  useEffect(() => {
    setOptions(props.data);
  }, [props.data]);

  return <HighchartsReact highcharts={Highcharts} constructorType="stockChart" containerProps={{ style: { marginTop: 12 } }} options={options}/>;
}