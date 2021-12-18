import { Suspense, lazy, memo, useEffect, useState } from 'react';
import { Skeleton } from '@mui/material';
const Chart = lazy(() => import(/* webpackChunkName: "lock_chart" */ './Chart'));

function LockChart({ history, startTime, startRem }){
  const [options, setOptions] = useState(null);
  // eslint-disable-next-line complexity
  useEffect(() => {
    const unlockDate = [];
    const remTime = [];
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
    let lastRem = 0;
    let time = startTime;
    let rem = startRem / (1000 * 60 * 60 * 24);

    const handleaddTime = (add, edate) => {
      if (lastFreeze > 0){
        time += edate - lastFreeze;
        lastFreeze = edate;
      } else {
        rem -= (edate - lastRem) / (1000 * 60 * 60 * 24);
        lastRem = edate;
      }
      if (add !== 0){
        unlockDate.push([edate - 1, time]);
        remTime.push([edate - 1, rem]);
        time += add * 1000;
        rem += add / (60 * 60 * 24);
      }
      unlockDate.push([edate, time]);
      remTime.push([edate, rem]);
    };

    for (let i = history.length - 1; i >= 0; i--){
      const d = history[i];
      const x = d.createdAt.getTime();
      if (d.updatedAt.getTime() !== d.createdAt.getTime()) console.warn(d);
      switch (d.type){
        case 'locked':
          lock.push({ x, title: 'L⬆', text: 'You started a new lock! 🥳' });
          unlockDate.push([x, time]);
          lastRem = x;
          remTime.push([x, rem]);
          break;
        case 'time_changed':
          timeChanges.push({ x, title: '⏱', text: `Your duration was modified by ${(d.payload.duration / (60 * 60)).toFixed(2)}h by ${d.role === 'extension' ? d.extension : 'your keyholder'}!` });
          handleaddTime(d.payload.duration, x);
          break;
        case 'link_time_changed':
          timeChanges.push({ x, title: '🗳', text: `A shared link vote modified your time by ${(d.payload.duration / (60 * 60)).toFixed(2)}h!` });
          handleaddTime(d.payload.duration, x);
          break;
        case 'pillory_in':
          pillory.push({ x, title: 'P⬆', text: `You were put into the pillory for ${(d.payload.duration / (60 * 60)).toFixed(2)}h by ${d.role === 'extension' ? d.extension : 'your keyholder'} with the reason: ${d.payload.reason}` });
          break;
        case 'pillory_out':
          pillory.push({ x, title: 'P⬇', text: `While in pillory you got a total of ${(d.payload.timeAdded / (60 * 60)).toFixed(2)}h added!` });
          handleaddTime(d.payload.timeAdded, x);
          break;
        case 'temporary_opening_opened':
          hygiene.push({ x, title: 'O⬆', text: `The lock was temporary opened for cleaning${d.role === 'keyholder' ? ' by your keyholder' : ''}!` });
          break;
        case 'temporary_opening_locked':
          hygiene.push({ x, title: 'O⬆', text: `You finished your cleaning opening after ${(d.payload.unlockedTime / 60).toFixed(2)}min in time!` });
          break;
        case 'temporary_opening_locked_late':
          hygiene.push({ x, title: 'O⬆', text: `You closed your lock after cleaning ${(d.payload.unlockedTime / 60).toFixed(2)}min late and got ${(d.payload.penaltyTime / (60 * 60)).toFixed(2)}h added as a penalty!` });
          handleaddTime(d.payload.penaltyTime, x);
          break;
        case 'lock_frozen':
          freeze.push({ x, title: '🧊⬆', text: `Your lock was frozen by ${d.role === 'extension' ? d.extension : 'your keyholder'}!` });
          rem -= (x - lastRem) / (1000 * 60 * 60 * 24);
          lastFreeze = x;
          lastRem = 0;
          unlockDate.push([x, time]);
          remTime.push([x, rem]);
          break;
        case 'lock_unfrozen':
          freeze.push({ x, title: '🧊⬇', text: `Your lock was unfrozen by ${d.role === 'extension' ? d.extension : 'your keyholder'}!` });
          time += x - lastFreeze;
          lastFreeze = 0;
          lastRem = x;
          unlockDate.push([x, time]);
          remTime.push([x, rem]);
          break;
        case 'unlocked':
          lock.push({ x, title: 'L⬇', text: 'You unlocked your lock! 🥳' });
          handleaddTime(0, x);
          break;
        case 'deserted':
          lock.push({ x, title: 'L❌', text: 'You deserted your lock! 😦' });
          handleaddTime(0, x);
          break;
        case 'wheel_of_fortune_turned':
          switch (d.payload.segment.type){
            case 'add-time':
              games.push({ x, title: '🎡+', text: `Your Wheel of Fortune landed on: adding ${(d.payload.segment.duration / (60 * 60)).toFixed(2)}h!` });
              break;
            case 'remove-time':
              games.push({ x, title: '🎡-', text: `Your Wheel of Fortune landed on: removing ${(-d.payload.segment.duration / (60 * 60)).toFixed(2)}h!` });
              break;
            case 'add-remove-time':
              games.push({ x, title: '🎡±', text: `Your Wheel of Fortune landed on: add or remove ${(d.payload.segment.duration / (60 * 60)).toFixed(2)}h!` });
              break;
            case 'pillory':
              games.push({ x, title: '🎡P', text: `Your Wheel of Fortune landed on: pillory for ${(d.payload.segment.duration / (60 * 60)).toFixed(2)}h!` });
              break;
            case 'text':
              games.push({ x, title: '🎡P', text: `Your Wheel of Fortune landed on a text field: ${d.payload.segment.text}!` });
              break;
            case 'set-unfreeze':
              games.push({ x, title: '🎡🧊⬇', text: 'Your Wheel of Fortune landed on: unfreeze!' });
              break;
            case 'set-freeze':
              games.push({ x, title: '🎡🧊⬆', text: 'Your Wheel of Fortune landed on: freeze!' });
              break;
            case 'freeze':
              games.push({ x, title: '🎡🧊', text: `Your Wheel of Fortune ${d.payload.isFrozen ? 'froze' : 'unfroze'} your lock!` });
              break;
            default:
              console.warn(d.payload);
          }
          break;
        case 'dice_rolled':
          games.push({ x, title: '🎲', text: `You rolled the dice with result: ${d.payload.playerDice} (you) vs. ${d.payload.adminDice} (bot)!` });
          break;
        case 'verification_picture_submitted':
          verification.push({ x, title: '🖼', text: `You submitted a new verification picture with code ${d.payload.verificationCode}!` });
          break;
        case 'timer_hidden':
          timer.push({ x, title: '🕑🚫', text: `Your timer was hidden by ${d.role === 'extension' ? d.extension : 'your keyholder'}!` });
          break;
        case 'timer_revealed':
          timer.push({ x, title: '🕑👁', text: `Your timer was revealed by ${d.role === 'extension' ? d.extension : 'your keyholder'}!` });
          break;
        case 'tasks_task_assigned':
          tasks.push({ x, title: '🗒+', text: `${d.role === 'keyholder' ? 'Your keyholder' : 'Yourself'} assigned you a new task: ${d.payload.task.task}${d.payload.task.points ? ` (for ${d.payload.task.points} points)` : ''}!` });
          break;
        case 'tasks_vote_ended':
          tasks.push({ x, title: '🗒🗳', text: `A tasks vote ended and voted for: ${d.payload.task.task}${d.payload.task.points ? ` (for ${d.payload.task.points} points)` : ''}!` });
          break;
        case 'tasks_task_completed':
          tasks.push({ x, title: '🗒✓', text: `You successfully completed the task: ${d.payload.task.task}${d.payload.task.points ? ` (for ${d.payload.task.points} points)` : ''}!` });
          break;
        case 'tasks_task_failed':
          tasks.push({ x, title: '🗒❌', text: `You failed to complete the task: ${d.payload.task.task}${d.payload.task.points ? ` (for ${d.payload.task.points} points)` : ''}!` });
          break;
        case 'session_offer_accepted':
          lock.push({ x, title: 'K⬆', text: `Your session offer was accepted and ${d.user.username} is now your keyholder! 🥳` });
          break;
        case 'max_limit_date_increased':
          lock.push({ x, title: '🔒⬆', text: `You increased your maximum lock time limit to ${new Date(d.payload.date).toLocaleString()}! 🥳` });
          break;
        case 'max_limit_date_removed':
          lock.push({ x, title: '🔒∞', text: 'You removed your maximum lock time limit, have fun! 🥳' });
          break;
        case 'timer_guessed':
          lock.push({ x, title: 'L✓', text: 'You correctly guessed that your time was over! 🥳' });
          break;
        default:
          console.warn(d);
      }
    }
    setOptions({ unlockDate, remTime, timeChanges, pillory, freeze, timer, lock, hygiene, verification, games, tasks });
  }, [history, startRem, startTime]);

  if (!options) return <Skeleton variant="rectangular" width="100%" height={300}/>;
  return <Suspense fallback={<Skeleton variant="rectangular" width="100%" height={300}/>}><Chart {...options}/></Suspense>;
}

export default memo(LockChart);