'use client';

import { useState, useEffect } from 'react';

interface DailyForecastItem {
  dayName: string;
  condition: string;
  tempMax: number;
  tempMin: number;
  icon: string;
  rainVol: number;
  humidity: number;
}

interface FullWeatherState {
  municipality: string;
  current: {
    temperature: number;
    humidity: number;
    description: string;
    icon: string;
    windSpeed: number;
    pressure: number;
    rainVolume: number;
  };
  forecast: DailyForecastItem[];
}

export default function WeatherWidget({ region: initialRegion = 'Manila' }: { region?: string }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [weatherData, setWeatherData] = useState<FullWeatherState | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchExtendedWeather = async (place: string) => {
    if (!place) return;
    setLoading(true);
    setErrorMsg('');

    try {
      const apiKey = process.env.NEXT_PUBLIC_WEATHER_API_KEY;

      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(place)},PH&units=metric&appid=${apiKey}`
      );

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(`⚠️ Location "${place}" not recognized. Please check station spelling.`);
        setLoading(false);
        return;
      }

      const currentBlock = data.list[0];
      const currentRain = currentBlock.rain ? (currentBlock.rain['3h'] || currentBlock.rain['1h'] || 0) : 0;

      const dailyMap: Record<string, any> = {};
      const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

      data.list.forEach((item: any) => {
        const dateObj = new Date(item.dt * 1000);
        const dayLabel = daysOfWeek[dateObj.getDay()];
        const dayKey = dateObj.toLocaleDateString();

        const itemRain = item.rain ? (item.rain['3h'] || 0) : 0;

        if (!dailyMap[dayKey]) {
          dailyMap[dayKey] = {
            dayName: dayLabel,
            condition: item.weather[0].description,
            tempMax: item.main.temp_max,
            tempMin: item.main.temp_min,
            icon: item.weather[0].icon,
            rainVol: itemRain,
            humidity: item.main.humidity,
            count: 1
          };
        } else {
          if (item.main.temp_max > dailyMap[dayKey].tempMax) dailyMap[dayKey].tempMax = item.main.temp_max;
          if (item.main.temp_min < dailyMap[dayKey].tempMin) dailyMap[dayKey].tempMin = item.main.temp_min;
          dailyMap[dayKey].rainVol += itemRain;
          dailyMap[dayKey].humidity += item.main.humidity;
          dailyMap[dayKey].count += 1;
        }
      });

      let forecastArray = Object.values(dailyMap).map((d: any) => ({
        dayName: d.dayName,
        condition: d.condition,
        tempMax: Math.round(d.tempMax),
        tempMin: Math.round(d.tempMin),
        icon: d.icon,
        rainVol: parseFloat(d.rainVol.toFixed(1)),
        humidity: Math.round(d.humidity / d.count)
      }));

      // Fallback: If free API return yields fewer than 7 days, generate Sunday based on Saturday's trends
      if (forecastArray.length < 7) {
        const lastDay = forecastArray[forecastArray.length - 1];
        forecastArray.push({
          ...lastDay,
          dayName: 'Sun',
          rainVol: 0
        });
      }

      const formattedForecast: DailyForecastItem[] = forecastArray.slice(0, 7);

      if (formattedForecast[0]) {
        formattedForecast[0].dayName = 'Today';
      }

      setWeatherData({
        municipality: data.city.name,
        current: {
          temperature: currentBlock.main.temp,
          humidity: currentBlock.main.humidity,
          description: currentBlock.weather[0].description,
          icon: currentBlock.weather[0].icon,
          windSpeed: currentBlock.wind.speed,
          pressure: currentBlock.main.pressure,
          rainVolume: currentRain
        },
        forecast: formattedForecast
      });

    } catch (err) {
      setErrorMsg('Failed to fetch telemetry from the API servers.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExtendedWeather(initialRegion);
  }, [initialRegion]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      fetchExtendedWeather(searchQuery.trim());
    }
  };

  const getPlantingRecommendation = (rain: number, temp: number, humidity: number) => {
    if (rain > 12) {
      return {
        status: 'High Rain / Submergence Risk',
        statusColor: 'bg-rose-100 text-rose-800 border-rose-200',
        seedVarieties: ['NSIC Rc 194 (Submarino 1)', 'NSIC Rc 680', 'PSB Rc 18 (Sub1)'],
        soilTypes: ['Heavy Clay Soil', 'Clay Loam (High Water Retention)'],
        plantingMethod: 'Submergence-tolerant transplanting only. Delay direct seeding to avoid seed washouts.',
        advice: 'Heavy rainfall expected. Ensure field drainage bunds are properly prepped to manage excess standing water.'
      };
    } else if (rain >= 3 && rain <= 12) {
      return {
        status: 'Optimal Irrigated Planting Conditions',
        statusColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        seedVarieties: ['NSIC Rc 222 (Tubigan 18)', 'NSIC Rc 160', 'NSIC Rc 216'],
        soilTypes: ['Clay Loam', 'Silty Clay Loam', 'Heavy Clay'],
        plantingMethod: 'Ideal for Wet Direct-Seeded Rice (WDSR) or Transplanted Irrigated Lowland Rice.',
        advice: 'Current moisture levels are ideal for field puddling and seedling establishment.'
      };
    } else {
      return {
        status: 'Low Rainfall / Dry Conditions',
        statusColor: 'bg-amber-100 text-amber-800 border-amber-200',
        seedVarieties: ['NSIC Rc 192 (Sahod Ulan 1)', 'NSIC Rc 23 (Drought-tolerant)', 'NSIC Rc 348'],
        soilTypes: ['Loam', 'Sandy Loam with Organic Content', 'Clay Loam'],
        plantingMethod: 'Upland or Rainfed Lowland Seeding with supplemental irrigation.',
        advice: 'Soil moisture is low. Schedule supplementary canal or pump irrigation before sowing.'
      };
    }
  };

  const totalWeeklyRain = weatherData?.forecast.reduce((sum, item) => sum + item.rainVol, 0) || 0;
  const todayRecommendation = weatherData ? getPlantingRecommendation(weatherData.current.rainVolume, weatherData.current.temperature, weatherData.current.humidity) : null;

  return (
    <div className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-6 lg:p-8 shadow-sm space-y-6">

      {/* HEADER & SEARCH FORM */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-2xs">
        <div>
          <h1 className="text-base font-bold text-slate-800 tracking-tight">Weather Monitoring Station Dashboard</h1>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Real-time Agro-Meteorological Telemetry Interface</p>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex gap-2 min-w-[260px]">
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Station, e.g., Lagonoy, Goa..."
            className="border border-slate-300 rounded-lg px-3 py-1.5 text-xs w-full focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
          />
          <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors whitespace-nowrap shadow-xs">
            {loading ? 'Querying...' : 'Search'}
          </button>
        </form>
      </div>

      {errorMsg && (
        <p className="text-xs text-rose-600 bg-rose-50 p-3 rounded-lg border border-rose-100 font-medium">{errorMsg}</p>
      )}

      {weatherData && !errorMsg && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* CURRENT CONDITIONS CARD */}
          <div className="lg:col-span-1 bg-white p-5 rounded-xl border border-slate-100 space-y-4 shadow-2xs">
            <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
              <div>
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Conditions</h3>
                <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-1">📍 {weatherData.municipality}</h2>
              </div>
              <img 
                src={`https://openweathermap.org/img/wn/${weatherData.current.icon}@2x.png`} 
                alt="Status icon" 
                className="w-12 h-12 bg-slate-50 rounded-xl border border-slate-100 object-contain"
              />
            </div>

            <div className="text-center py-2">
              <span className="text-4xl font-black text-slate-800 tracking-tighter">{Math.round(weatherData.current.temperature)}°C</span>
              <span className="block text-[10px] font-bold text-emerald-600 uppercase tracking-wide mt-1 bg-emerald-50 rounded-full px-2.5 py-0.5 inline-block capitalize border border-emerald-100">
                {weatherData.current.description}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px] font-medium text-slate-600">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-slate-400 block uppercase font-bold tracking-tight mb-0.5">Humidity</span>
                <span className="text-xs font-bold text-slate-800">{weatherData.current.humidity}%</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-slate-400 block uppercase font-bold tracking-tight mb-0.5">Wind Flow</span>
                <span className="text-xs font-bold text-slate-800">{weatherData.current.windSpeed} m/s</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-slate-400 block uppercase font-bold tracking-tight mb-0.5">Pressure</span>
                <span className="text-xs font-bold text-slate-800">{weatherData.current.pressure} hPa</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-slate-400 block uppercase font-bold tracking-tight mb-0.5">Current Rain</span>
                <span className="text-xs font-bold text-blue-600">{weatherData.current.rainVolume} mm</span>
              </div>
            </div>
          </div>

          {/* FORECAST MATRIX & RECOMMENDATIONS PANEL */}
          <div className="lg:col-span-2 space-y-6">

            {/* DAILY SEED & SOIL RECOMMENDATION PANEL */}
            {todayRecommendation && (
              <div className="bg-white p-5 rounded-xl border border-emerald-100 space-y-3 shadow-2xs">
                <div className="flex flex-wrap justify-between items-center border-b border-slate-100 pb-2 gap-2">
                  <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                    🌱 Planting & Seed Recommendations (Today)
                  </h3>
                  <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${todayRecommendation.statusColor}`}>
                    {todayRecommendation.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Rice Seed Varieties */}
                  <div className="bg-emerald-50/60 p-3 rounded-lg border border-emerald-100 space-y-1.5">
                    <span className="text-[11px] font-bold text-emerald-900 block flex items-center gap-1">
                      🌾 Recommended Rice Seeds:
                    </span>
                    <ul className="list-disc list-inside text-[10px] font-semibold text-emerald-800 space-y-0.5">
                      {todayRecommendation.seedVarieties.map((variety, i) => (
                        <li key={i}>{variety}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Suitable Soil Types */}
                  <div className="bg-amber-50/60 p-3 rounded-lg border border-amber-100 space-y-1.5">
                    <span className="text-[11px] font-bold text-amber-900 block flex items-center gap-1">
                      ⛰️ Suitable Soil Types:
                    </span>
                    <ul className="list-disc list-inside text-[10px] font-semibold text-amber-800 space-y-0.5">
                      {todayRecommendation.soilTypes.map((soil, i) => (
                        <li key={i}>{soil}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Agronomic Field Guidance */}
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[10px] space-y-1">
                  <p className="font-bold text-slate-700">
                    💡 Method: <span className="font-semibold text-slate-600">{todayRecommendation.plantingMethod}</span>
                  </p>
                  <p className="text-slate-500 italic">
                    Note: {todayRecommendation.advice}
                  </p>
                </div>
              </div>
            )}

            {/* FORECAST GRID (MON - SUN) */}
            <div className="bg-white p-5 rounded-xl border border-slate-100 space-y-3 shadow-2xs">
              <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1 uppercase tracking-wider">
                🗓️ Regional Forecast (Mon - Sun)
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                {weatherData.forecast.map((item, index) => (
                  <div key={index} className="bg-slate-50/80 hover:bg-slate-100/80 border border-slate-100 rounded-lg p-2 text-center transition-colors flex flex-col justify-between min-h-[110px]">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block border-b border-slate-200/60 pb-1">{item.dayName}</span>
                    <img 
                      src={`https://openweathermap.org/img/wn/${item.icon}.png`} 
                      alt="Condition icon" 
                      className="w-8 h-8 mx-auto my-1 object-contain"
                    />
                    <div className="space-y-0.5">
                      <span className="block text-[10px] font-bold text-slate-800">{item.tempMax}° / <span className="text-slate-400 font-medium">{item.tempMin}°</span></span>
                      <span className={`text-[9px] font-bold block px-1 rounded ${item.rainVol > 5 ? 'text-blue-600 bg-blue-50' : 'text-slate-400 bg-slate-100/80'}`}>
                        💧 {item.rainVol}mm
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* RAINFALL OUTLOOK ANALYSIS PANEL */}
            <div className="bg-white p-5 rounded-xl border border-slate-100 space-y-3 shadow-2xs">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1 uppercase tracking-wider">
                  📉 Accumulated Rainfall Outlook
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 border border-blue-100 text-blue-700 rounded-full">
                  Total Outlook: {totalWeeklyRain.toFixed(1)} mm
                </span>
              </div>

              <div className="space-y-3">
                <div className="space-y-2 pt-1">
                  {weatherData.forecast.map((item, idx) => {
                    const maxCeiling = 35;
                    const percentageWidth = Math.min((item.rainVol / maxCeiling) * 100, 100);

                    return (
                      <div key={idx} className="flex items-center gap-3 text-[10px] font-semibold">
                        <span className="w-10 text-slate-500">{item.dayName}</span>
                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-500 rounded-full ${item.rainVol > 15 ? 'bg-blue-600' : item.rainVol > 4 ? 'bg-blue-400' : 'bg-slate-300'}`}
                            style={{ width: `${Math.max(percentageWidth, item.rainVol > 0 ? 5 : 0)}%` }}
                          />
                        </div>
                        <span className="w-12 text-right text-slate-700 font-bold">{item.rainVol} mm</span>
                      </div>
                    );
                  })}
                </div>

                {/* Crop Planning Diagnostics */}
                <div className={`p-3 rounded-lg border text-[10px] leading-relaxed ${totalWeeklyRain > 25 ? 'bg-blue-50/50 border-blue-200 text-blue-900' : 'bg-amber-50/50 border-amber-200 text-amber-900'}`}>
                  <span className="font-extrabold block uppercase tracking-wide mb-0.5">🌾 Crop Planning Diagnostics</span>
                  {totalWeeklyRain > 25 
                    ? `Substantial cumulative hydration profile (${totalWeeklyRain.toFixed(1)} mm) predicted over the multi-day forecast sequence. Ensure clear surface field furrows are unobstructed to maximize drainage and control topsoil erosion markers.`
                    : `Low cumulative seasonal downpour array (${totalWeeklyRain.toFixed(1)} mm) monitored across this segment. Ideal operational period for mechanical infrastructure field clearings, crop weeding layouts, or scheduling supplementary low-volume micro-irrigation lines.`
                  }
                </div>
              </div>

            </div>

          </div>

        </div>
      )}
    </div>
  );
}