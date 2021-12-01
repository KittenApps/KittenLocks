import { useEffect, useState } from 'react';
import Highcharts from 'highcharts/highstock';
import Exporting from 'highcharts/modules/exporting';
import HighContrastDarkTheme from 'highcharts/themes/high-contrast-dark';
import HighchartsReact from 'highcharts-react-official';
// eslint-disable-next-line new-cap
HighContrastDarkTheme(Highcharts);
// eslint-disable-next-line new-cap
Exporting(Highcharts);

export default function LockChart({ history, startTime }){
  // eslint-disable-next-line complexity
  const [options, setOptions] = useState(() => {
    const data = [];
    const timeChanges = [];
    const pillory = [];
    const freeze = [];
    const timer = [];
    const lock = [];
    const hygiene = [];
    const verification = [];
    const games = [];
    const tasks = [];
    let lastFreeze = 0;
    let time = startTime;
    let date;
    for (let i = history.length - 1; i >= 0; i--){
      const d = history[i];
      // eslint-disable-next-line no-console
      if (d.updatedAt !== d.createdAt) console.warn(d);
      switch (d.type){
        case 'locked':
          date = Date.parse(d.updatedAt);
          lock.push({ x: date, title: 'L⬆', text: 'You started a new lock! 🥳' });
          data.push([date, time]);
          break;
        case 'time_changed':
          date = Date.parse(d.updatedAt);
          timeChanges.push({ x: date, title: '⏱', text: `Your duration was modified by ${(d.payload.duration / (60 * 60)).toFixed(2)}h by ${d.role === 'extension' ? d.extension : 'your keyholder'}!` });
          if (lastFreeze > 0){
            time += date - lastFreeze;
            lastFreeze = date;
          }
          data.push([date - 1, time]);
          time += d.payload.duration * 1000;
          data.push([date, time]);
          break;
        case 'link_time_changed':
          date = Date.parse(d.updatedAt);
          timeChanges.push({ x: date, title: '🗳', text: `A shared link vote modified your time by ${(d.payload.duration / (60 * 60)).toFixed(2)}h!` });
          if (lastFreeze > 0){
            time += date - lastFreeze;
            lastFreeze = date;
          }
          data.push([date - 1, time]);
          time += d.payload.duration * 1000;
          data.push([date, time]);
          break;
        case 'pillory_in':
          pillory.push({ x: Date.parse(d.updatedAt), title: 'P⬆', text: `You were put into the pillory for ${(d.payload.duration / (60 * 60)).toFixed(2)}h by ${d.role === 'extension' ? d.extension : 'your keyholder'} with the reason: ${d.payload.reason}` });
          break;
        case 'pillory_out':
          date = Date.parse(d.updatedAt);
          pillory.push({ x: date, title: 'P⬇', text: `While in pillory you got a total of ${(d.payload.timeAdded / (60 * 60)).toFixed(2)}h added!` });
          if (lastFreeze > 0){
            time += date - lastFreeze;
            lastFreeze = date;
          }
          data.push([date - 1, time]);
          time += d.payload.timeAdded * 1000;
          data.push([date, time]);
          break;
        case 'temporary_opening_opened':
          hygiene.push({ x: Date.parse(d.updatedAt), title: 'O⬆', text: `The lock was temporary opened for cleaning${d.role === 'keyholder' ? ' by your keyholder' : ''}!` });
          break;
        case 'temporary_opening_locked':
          hygiene.push({ x: Date.parse(d.updatedAt), title: 'O⬆', text: `You finished your cleaning opening after ${(d.payload.unlockedTime / 60).toFixed(2)}min in time!` });
          break;
        case 'temporary_opening_locked_late':
          date = Date.parse(d.updatedAt);
          hygiene.push({ x: date, title: 'O⬆', text: `You closed your lock after cleaning ${(d.payload.unlockedTime / 60).toFixed(2)}min late and got ${(d.payload.penaltyTime / (60 * 60)).toFixed(2)}h added as a penalty!` });
          if (lastFreeze > 0){
            time += date - lastFreeze;
            lastFreeze = date;
          }
          data.push([date - 1, time]);
          time += d.payload.penaltyTime * 1000;
          data.push([date, time]);
          break;
        case 'lock_frozen':
          date = Date.parse(d.updatedAt);
          freeze.push({ x: date, title: '🧊⬆', text: `Your lock was frozen by ${d.role === 'extension' ? d.extension : 'your keyholder'}!` });
          data.push([date, time]);
          lastFreeze = date;
          break;
        case 'lock_unfrozen':
          date = Date.parse(d.updatedAt);
          freeze.push({ x: date, title: '🧊⬇', text: `Your lock was unfrozen by ${d.role === 'extension' ? d.extension : 'your keyholder'}!` });
          time += date - lastFreeze;
          lastFreeze = 0;
          data.push([date, time]);
          break;
        case 'unlocked':
          date = Date.parse(d.updatedAt);
          lock.push({ x: date, title: 'L⬇', text: 'You unlocked your lock! 🥳' });
          if (lastFreeze > 0){
            time += date - lastFreeze;
            lastFreeze = date;
          }
          data.push([date, time]);
          break;
        case 'deserted':
          date = Date.parse(d.updatedAt);
          lock.push({ x: date, title: 'L❌', text: 'You deserted your lock! 😦' });
          if (lastFreeze > 0){
            time += date - lastFreeze;
            lastFreeze = date;
          }
          data.push([date, time]);
          break;
        case 'wheel_of_fortune_turned':
          date = Date.parse(d.updatedAt);
          switch (d.payload.segment.type){
            case 'add-time':
              games.push({ x: Date.parse(d.updatedAt), title: '🎡+', text: `Your Wheel of Fortune landed on: adding ${(d.payload.segment.duration / (60 * 60)).toFixed(2)}h!` });
              break;
            case 'remove-time':
              games.push({ x: Date.parse(d.updatedAt), title: '🎡-', text: `Your Wheel of Fortune landed on: removing ${(-d.payload.segment.duration / (60 * 60)).toFixed(2)}h!` });
              break;
            case 'add-remove-time':
              games.push({ x: Date.parse(d.updatedAt), title: '🎡±', text: `Your Wheel of Fortune landed on: add or remove ${(d.payload.segment.duration / (60 * 60)).toFixed(2)}h!` });
              break;
            case 'pillory':
              games.push({ x: Date.parse(d.updatedAt), title: '🎡P', text: `Your Wheel of Fortune landed on: pillory for ${(d.payload.segment.duration / (60 * 60)).toFixed(2)}h!` });
              break;
            case 'text':
              games.push({ x: Date.parse(d.updatedAt), title: '🎡P', text: `Your Wheel of Fortune landed on a text field: ${d.payload.segment.text}!` });
              break;
            case 'set-unfreeze':
              games.push({ x: Date.parse(d.updatedAt), title: '🎡🧊⬇', text: 'Your Wheel of Fortune landed on: unfreeze!' });
              break;
            case 'set-freeze':
              games.push({ x: Date.parse(d.updatedAt), title: '🎡🧊⬆', text: 'Your Wheel of Fortune landed on: freeze!' });
              break;
            case 'freeze':
              games.push({ x: Date.parse(d.updatedAt), title: '🎡🧊', text: `Your Wheel of Fortune ${d.payload.isFrozen ? 'froze' : 'unfroze'} your lock!` });
              break;
            default:
              console.warn(d.payload);
          }
          break;
        case 'dice_rolled':
          games.push({ x: Date.parse(d.updatedAt), title: '🎲', text: `You rolled the dice with result: ${d.payload.playerDice} (you) vs. ${d.payload.adminDice} (bot)!` });
          break;
        case 'verification_picture_submitted':
          verification.push({ x: Date.parse(d.updatedAt), title: '🖼', text: `You submitted a new verification picture with code ${d.payload.verificationCode}!` });
          break;
        case 'timer_hidden':
          timer.push({ x: Date.parse(d.updatedAt), title: '🕑🚫', text: `Your timer was hidden by ${d.role === 'extension' ? d.extension : 'your keyholder'}!` });
          break;
        case 'timer_revealed':
          timer.push({ x: Date.parse(d.updatedAt), title: '🕑👁', text: `Your timer was revealed by ${d.role === 'extension' ? d.extension : 'your keyholder'}!` });
          break;
        case 'tasks_task_assigned':
          tasks.push({ x: Date.parse(d.updatedAt), title: '🗒+', text: `${d.role === 'keyholder' ? 'Your keyholder' : 'Yourself'} assigned you a new task: ${d.payload.task.task}${d.payload.task.points ? ` (for ${d.payload.task.points} points)` : ''}!` });
          break;
        case 'tasks_vote_ended':
          tasks.push({ x: Date.parse(d.updatedAt), title: '🗒🗳', text: `A tasks vote ended and voted for: ${d.payload.task.task}${d.payload.task.points ? ` (for ${d.payload.task.points} points)` : ''}!` });
          break;
        case 'tasks_task_completed':
          tasks.push({ x: Date.parse(d.updatedAt), title: '🗒✓', text: `You successfully completed the task: ${d.payload.task.task}${d.payload.task.points ? ` (for ${d.payload.task.points} points)` : ''}!` });
          break;
        case 'tasks_task_failed':
          tasks.push({ x: Date.parse(d.updatedAt), title: '🗒❌', text: `You failed to complete the task: ${d.payload.task.task}${d.payload.task.points ? ` (for ${d.payload.task.points} points)` : ''}!` });
          break;
        case 'session_offer_accepted':
          lock.push({ x: Date.parse(d.updatedAt), title: 'K⬆', text: `Your session offer was accepted and ${d.user.username} is now your keyholder! 🥳` });
          break;
        case 'max_limit_date_increased':
          lock.push({ x: Date.parse(d.updatedAt), title: '🔒⬆', text: `You increased your maximum lock time limi to ${new Date(d.payload.date).toLocaleString()}! 🥳` });
          break;
        case 'max_limit_date_removed':
          lock.push({ x: Date.parse(d.updatedAt), title: '🔒∞', text: 'You removed your maximum lock time limit, have fun! 🥳' });
          break;
        case 'timer_guessed':
          lock.push({ x: Date.parse(d.updatedAt), title: 'L✓', text: 'You correctly guessed that your time was over! 🥳' });
          break;
        default:
          // eslint-disable-next-line no-console
          console.warn(d);
      }
    }
    return {
      title: { text: 'added Time' },
      series: [ // eslint-disable-next-line react/no-this-in-sfc
        { name: 'unlock date', tooltip: { pointFormatter(){return `unlock date: ${new Date(this.y).toLocaleString()}`;} }, id: 'date', data },
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
      yAxis: { title: { text: 'unlock date' }, type: 'datetime', crosshair: true, maxPadding: 0.2 },
      legend: { enabled: true, align: 'center', verticalAlign: 'bottom' }
    };
  });

  useEffect(() => {
    setOptions(history);
  }, [history]);

  return <HighchartsReact highcharts={Highcharts} constructorType="stockChart" containerProps={{ style: { marginTop: 12 } }} options={options}/>;
}