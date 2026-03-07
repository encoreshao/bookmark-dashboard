import { useState, useEffect } from 'react';
import { useSettings } from '@/context/SettingsContext';
import { getGreeting } from '@/utils/i18n';
import { formatClock } from '@/utils/time';

function Hero() {
  const { settings } = useSettings();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const { time, dateStr } = formatClock(now, settings.language);
  const greeting = `${getGreeting(settings.language, now.getHours())}, ${settings.userName}!`;

  return (
    <section className="hero">
      <h1 className="greeting">{greeting}</h1>
      <div className="clock">
        <span className="clock-time">{time}</span>
        <span className="clock-date">{dateStr}</span>
      </div>
    </section>
  );
}

export default Hero;
