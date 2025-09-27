import { TVDisplay } from '../tv-display';

export default function TVDisplayExample() {
  // TODO: Remove mock functionality - replace with real data
  const mockCurrentCall = {
    id: "1",
    name: "Ahmad bin Ali",
    number: 15,
    windowName: "Bilik 1 - Dr. Sarah",
    status: "called"
  };

  const mockHistory = [
    { id: "2", name: null, number: 14, windowName: "Bilik 2 - Dr. Ahmad", status: "completed" },
    { id: "3", name: "Siti Nurhaliza", number: 13, windowName: "Bilik 1 - Dr. Sarah", status: "completed" },
    { id: "4", name: null, number: 12, windowName: "Bilik 3 - Nurse Linda", status: "completed" },
  ];

  return (
    <TVDisplay
      currentCall={mockCurrentCall}
      history={mockHistory}
      showPrayerTimes={true}
      showWeather={false}
      marqueeText="Selamat datang ke Klinik Kesihatan - Sila patuhi SOP yang ditetapkan"
      marqueeColor="#ffffff"
    />
  );
}