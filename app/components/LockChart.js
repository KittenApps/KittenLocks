import { useEffect, useState } from 'react';
import Highcharts from 'highcharts/highstock';
import Exporting from 'highcharts/modules/exporting';
import HighContrastDarkTheme from 'highcharts/themes/high-contrast-dark';
import HighchartsReact from 'highcharts-react-official';
// eslint-disable-next-line new-cap
HighContrastDarkTheme(Highcharts);
// eslint-disable-next-line new-cap
Exporting(Highcharts);

export default function LockChart({ history }){
  // eslint-disable-next-line complexity
  const [options, setOptions] = useState(() => {
    const data = [];
    let lastFreeze = 0;
    let time = 0;
    let date;
    for (let i = history.length - 1; i >= 0; i--){
      const d = history[i];
      // eslint-disable-next-line no-console
      if (d.updatedAt !== d.createdAt) console.warn(d);
      switch (d.type){
        case 'locked':
          data.push([new Date(d.updatedAt).getTime(), time]);
          break;
        case 'time_changed':
        case 'link_time_changed':
          date = new Date(d.updatedAt).getTime();
          if (lastFreeze > 0){
            time += (date / 1000 - lastFreeze) / (60 * 60 * 24);
            lastFreeze = date / 1000;
          }
          data.push([date - 1, time]);
          time += d.payload.duration / (60 * 60 * 24);
          data.push([date, time]);
          break;
        case 'pillory_out':
          date = new Date(d.updatedAt).getTime();
          if (lastFreeze > 0){
            time += (date / 1000 - lastFreeze) / (60 * 60 * 24);
            lastFreeze = date / 1000;
          }
          data.push([date - 1, time]);
          time += d.payload.timeAdded / (60 * 60 * 24);
          data.push([date, time]);
          break;
        case 'temporary_opening_locked_late':
          date = new Date(d.updatedAt).getTime();
          if (lastFreeze > 0){
            time += (date / 1000 - lastFreeze) / (60 * 60 * 24);
            lastFreeze = date / 1000;
          }
          data.push([date - 1, time]);
          time += d.payload.penaltyTime / (60 * 60 * 24);
          data.push([date, time]);
          break;
        case 'lock_frozen':
          date = new Date(d.updatedAt).getTime();
          data.push([date, time]);
          lastFreeze = date / 1000;
          break;
        case 'lock_unfrozen':
          date = new Date(d.updatedAt).getTime();
          time += (date / 1000 - lastFreeze) / (60 * 60 * 24);
          lastFreeze = 0;
          data.push([date, time]);
          break;
        case 'unlocked':
        case 'deserted':
          date = new Date(d.updatedAt).getTime();
          if (lastFreeze > 0){
            time += (date / 1000 - lastFreeze) / (60 * 60 * 24);
            lastFreeze = date / 1000;
          }
          data.push([date, time]);
          break;
        case 'wheel_of_fortune_turned':
        case 'dice_rolled':
        case 'verification_picture_submitted':
        case 'pillory_in':
        case 'timer_hidden':
        case 'timer_revealed':
        case 'temporary_opening_opened':
        case 'temporary_opening_locked':
        case 'tasks_task_assigned':
        case 'tasks_vote_ended':
        case 'tasks_task_completed':
        case 'tasks_task_failed':
        case 'session_offer_accepted':
        case 'timer_guessed':
          break;
        default:
          // eslint-disable-next-line no-console
          console.warn(d);
      }
    }
    return { title: { text: 'added Time' }, series: [{ data }] };
  });

  useEffect(() => {
    setOptions(history);
  }, [history]);

  return <HighchartsReact highcharts={Highcharts} constructorType="stockChart" containerProps={{ style: { marginTop: 12 } }} options={options}/>;
}