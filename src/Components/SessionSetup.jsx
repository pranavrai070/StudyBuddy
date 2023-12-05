import { Link, useLocation } from "wouter";
import SetTimer from "./SessionSetupComponents/SetTimer";
import SetBreaks from "./SessionSetupComponents/SetBreaks";
import SetMusic from "./SessionSetupComponents/SetMusic";
import SidePanel from "./SidePanel";
import Navbar from "./Navbar";
import { useState } from "react";
import { setSessionIntervals } from "./../redux/sessionIntervals";
import { setBreaks } from "./../redux/breakslice";
import { useDispatch, useSelector } from "react-redux";
import ConvertTimeToPixel from "./SessionSetupComponents/SetBreaksComponents/ConvertTimeToPixel";
// todo: create local states for redux states and update them whenver they are changed and dispatched.
function SessionSetup() {
  const [location, navigate] = useLocation();

  const [currentStep, setCurrentStep] = useState(0);
  const [sessionIntervalCompleted, setSessionIntervalCompleted] =
    useState(false);

  const addLastSessionInterval = async (newSessionIntervals) => {
    // total duration of all existing intervals
    const totalIntervalDuration = newSessionIntervals.reduce(
      (acc, interval) => {
        return {
          hours: acc.hours + parseInt(interval.hours),
          minutes: acc.minutes + parseInt(interval.minutes),
          seconds: acc.seconds + parseInt(interval.seconds),
        };
      },
      { hours: 0, minutes: 0, seconds: 0 }
    );

    // last interval duration = total Session Duration - total intervals duration
    const lastIntervalDuration = {
      hours: String(sessionDuration.hours - totalIntervalDuration.hours),
      minutes: String(sessionDuration.minutes - totalIntervalDuration.minutes),
      seconds: String(sessionDuration.seconds - totalIntervalDuration.seconds),
      type: "study",
    };
    return lastIntervalDuration;
  };

  const sortBreaks = async () => {
    // sorting on the basis of breakStartTime of each breakItem.
    // sorting from low to high : the lowest break start time will have index 0.
    try {
      const newSortedBreaks = [];

      for (let i = 0; i < breaks.length; i++) {
        const startTime =
          parseInt(breaks[i].breakStartTime.hours) * 60 +
          parseInt(breaks[i].breakStartTime.minutes);
        let insertIndex = 0;
        while (
          insertIndex < newSortedBreaks.length &&
          startTime >
            parseInt(newSortedBreaks[insertIndex].breakStartTime.hours) * 60 +
              parseInt(newSortedBreaks[insertIndex].breakStartTime.minutes)
        ) {
          insertIndex++;
        }

        // Insert the break at the correct position
        newSortedBreaks.splice(insertIndex, 0, breaks[i]);
      }

      dispatch(setBreaks(newSortedBreaks));
      return newSortedBreaks;
    } catch (error) {
      console.error("Error while sorting breaks:", error);
    }
  };

  const addSessionIntervals = async () => {
    try {
      const sortedBreaks = await sortBreaks();
      const newSessionIntervals = [];
      for (let index = 0; index < sortedBreaks.length; index++) {
        const breakItem = sortedBreaks[index];
        // create study interval
        const studyDuration = breakItem.breakStartTime;

        // total duration of all existing intervals
        const totalIntervalDuration = newSessionIntervals.reduce(
          (acc, interval) => {
            return {
              hours: acc.hours + parseInt(interval.hours),
              minutes: acc.minutes + parseInt(interval.minutes),
              seconds: acc.seconds + parseInt(interval.seconds),
            };
          },
          { hours: 0, minutes: 0, seconds: 0 }
        );
        const studyInterval = {
          hours: Math.abs(totalIntervalDuration.hours - studyDuration.hours),
          minutes: Math.abs(
            totalIntervalDuration.minutes - studyDuration.minutes
          ),
          seconds: Math.abs(
            totalIntervalDuration.seconds - studyDuration.seconds
          ),
          type: "study",
        };

        // create break interval
        const breakDuration = breakItem.breakDuration;
        const breakInterval = {
          hours: breakDuration.hours,
          minutes: breakDuration.minutes,
          seconds: "0",
          type: "break",
        };

        // add both the intervals to the sessionIntervals
        if (
          parseInt(studyInterval.hours) + parseInt(studyInterval.minutes) !=
          0
        ) {
          newSessionIntervals.push(studyInterval);
        }
        newSessionIntervals.push(breakInterval);
      }

      const lastInterval = await addLastSessionInterval(newSessionIntervals);
      if (ConvertTimeToPixel({ timeObject: lastInterval }) !== "0px") {
        newSessionIntervals.push(lastInterval);
      }

      dispatch(setSessionIntervals(newSessionIntervals));
    } catch (error) {
      console.error("Error adding session intervals:", error);
    }
  };

  const dispatch = useDispatch();
  const sessionIntervals = useSelector((state) => state.sessionIntervals);
  const sessionDuration = useSelector((state) => state.sessionDuration);
  const breaks = useSelector((state) => state.breaks);

  // console.log("Session intervals:", sessionIntervals);
  // console.log("Session Duration:", sessionDuration);

  // components for each step
  const steps = [<SetTimer />, <SetBreaks />, <SetMusic />];

  const handleNextClick = async () => {
    if (currentStep === 0) {
      // Check if both hours and minutes are zero in SetTimer component
      const { hours, minutes } = sessionDuration;
      if (parseInt(hours, 10) === 0 && parseInt(minutes, 10) === 0) {
        alert("Session duration cannot be zero!");
        return;
      } else {
        setCurrentStep((prevStep) => Math.min(prevStep + 1, steps.length - 1));
      }
    } else {
      setCurrentStep((prevStep) => Math.min(prevStep + 1, steps.length - 1));

      if (currentStep === steps.length - 1) {
        // Increment step index
        if (sessionIntervalCompleted) {
          navigate("/session");
          setSessionIntervalCompleted(false);
        }
      }

      // build sessionIntervals after setting all breaks and clicking next
      if (currentStep === 1) {
        await addSessionIntervals();
        setSessionIntervalCompleted(true);
      }
    }
  };

  const handlePreviousClick = () => {
    // Decrement step index
    setCurrentStep((prevStep) => Math.max(prevStep - 1, 0));
    if (currentStep === 0) {
      navigate("/");
    }
  };

  return (
    <div className="flex-1 font-mono bg-[#FFF3DA] p-0 min-h-screen">
      <Navbar />
      <div className="flex">
        <SidePanel />
        <div className="flex flex-col items-center justify-center h-screen">
          {/* Main Box in the Center */}
          <div className="bg-red-200 p-3 rounded-lg mb-8 w-4/5 h-6/7">
            {steps[currentStep]}
          </div>

          {/* Navigation Buttons */}
          <div className="flex space-x-4">
            <button
              className="bg-purple-500 text-white px-4 py-2 rounded"
              onClick={handlePreviousClick}
            >
              Previous
            </button>
            <button
              className="bg-purple-500 text-white px-4 py-2 rounded"
              onClick={handleNextClick}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SessionSetup;
