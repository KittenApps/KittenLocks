import { memo } from 'react';
import Highcharts from 'highcharts/highstock';
import Exporting from 'highcharts/modules/exporting';
import OfflineExporting from 'highcharts/modules/offline-exporting';
import HighContrastDarkTheme from 'highcharts/themes/high-contrast-dark';
import HighchartsReact from 'highcharts-react-official';
// eslint-disable-next-line new-cap
HighContrastDarkTheme(Highcharts);
// eslint-disable-next-line new-cap
Exporting(Highcharts);
// eslint-disable-next-line new-cap
OfflineExporting(Highcharts);

function Chart({ unlockDate, remTime, timeChanges, pillory, freeze, timer, lock, hygiene, verification, games, tasks }){
  const options = {
    title: { text: 'added Time' },
    series: [ // eslint-disable-next-line react/no-this-in-sfc
      { name: 'unlock date', tooltip: { pointFormatter(){return `unlock date: ${new Date(this.y).toLocaleString()}`;} }, id: 'date', data: unlockDate },
      { name: 'remaining days', id: 'rdate', data: remTime, yAxis: 1 },
      { type: 'flags', name: 'time changes', shape: 'circlepin', onSeries: 'date', turboThreshold: 0, data: timeChanges },
      { type: 'flags', name: 'pillory', shape: 'circlepin', onSeries: 'date', turboThreshold: 0, data: pillory },
      { type: 'flags', name: 'freeze', shape: 'circlepin', onSeries: 'date', turboThreshold: 0, data: freeze },
      { type: 'flags', name: 'timer', shape: 'circlepin', onSeries: 'date', turboThreshold: 0, data: timer },
      { type: 'flags', name: 'lock', shape: 'circlepin', onSeries: 'date', turboThreshold: 0, data: lock },
      { type: 'flags', name: 'hygiene opening', shape: 'circlepin', onSeries: 'date', turboThreshold: 0, data: hygiene },
      { type: 'flags', name: 'verifications', shape: 'circlepin', onSeries: 'date', turboThreshold: 0, data: verification },
      { type: 'flags', name: 'games', shape: 'circlepin', onSeries: 'date', turboThreshold: 0, data: games },
      { type: 'flags', name: 'tasks', shape: 'circlepin', onSeries: 'date', turboThreshold: 0, data: tasks }
    ],
    xAxis: { type: 'datetime', ordinal: false },
    yAxis: [
      { title: { text: 'unlock date' }, type: 'datetime', crosshair: true, maxPadding: 0.2 },
      { title: { text: 'remaining days' } }
    ],
    legend: { enabled: true, align: 'center', verticalAlign: 'bottom' },
    exporting: {
      filename: 'lockChart', sourceWidth: 1800, sourceHeight: 600, fallbackToExportServer: false,
      buttons: { contextButton: { menuItems: ['downloadJSON', 'separator', 'viewFullscreen', 'printChart', 'separator', 'downloadPNG', 'downloadJPEG', 'downloadPDF', 'downloadSVG'] } },
      menuItemDefinitions: { downloadJSON: { text: 'Share as interactive Lock Chart', onclick: () => {
        const report = JSON.stringify({ unlockDate, remTime, timeChanges, pillory, freeze, timer, lock, hygiene, verification, games, tasks });
        const href = URL.createObjectURL(new Blob([report], { type: 'application/json' }));
        const a = document.createElement('a');
        a.setAttribute('download', 'lockChart.klc');
        a.setAttribute('href', href);
        a.click();
      } } }
    }
  };
  return <HighchartsReact highcharts={Highcharts} constructorType="stockChart" containerProps={{ style: { marginTop: 12 } }} options={options}/>;
}

export default memo(Chart);