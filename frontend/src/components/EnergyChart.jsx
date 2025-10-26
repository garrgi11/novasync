import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const EnergyChart = () => {
  const [selectedOption, setSelectedOption] = useState('consumption');
  const [chartData, setChartData] = useState(null);

  // Dummy API-like data
  const mockApiData = {
    consumption: {
      labels: ['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'],
      datasets: [
        {
          label: 'Energy Consumption (kWh)',
          data: [2.1, 1.8, 1.5, 2.3, 3.2, 4.1, 4.5, 4.8, 5.1, 4.9, 4.2, 3.1],
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: 'rgb(59, 130, 246)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8
        }
      ]
    },
    marketRate: {
      labels: ['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'],
      datasets: [
        {
          label: 'Average Market Rate ($/kWh)',
          data: [0.12, 0.11, 0.10, 0.13, 0.15, 0.18, 0.20, 0.22, 0.25, 0.23, 0.19, 0.16],
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: 'rgb(34, 197, 94)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8
        }
      ]
    }
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#374151',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: ${value}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(156, 163, 175, 0.2)',
          drawBorder: false
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 12
          }
        }
      },
      y: {
        grid: {
          color: 'rgba(156, 163, 175, 0.2)',
          drawBorder: false
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 12
          }
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    }
  };

  // Simulate API call
  useEffect(() => {
    const fetchData = async () => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      setChartData(mockApiData[selectedOption]);
    };

    fetchData();
  }, [selectedOption]);

  const handleOptionChange = (option) => {
    setSelectedOption(option);
  };

  if (!chartData) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header with options */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-gray-800">
          Analytics
        </h3>
        <div className="flex space-x-2">
          <button
            onClick={() => handleOptionChange('consumption')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedOption === 'consumption'
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Energy Consumption
          </button>
          <button
            onClick={() => handleOptionChange('marketRate')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedOption === 'marketRate'
                ? 'bg-green-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Market Rate
          </button>
        </div>
      </div>

<div className="flex w-full">
      {/* Chart container */}
      <div className="h-80 w-[80%]">
        <Line data={chartData} options={chartOptions} />
      </div>

      {/* Summary stats */}
      <div className="w-[20%]">
        <div className="bg-gray-100 rounded-lg p-4  w-full mt-2">
          <div className="text-sm text-gray-600 font-medium ">
            {selectedOption === 'consumption' ? 'Total Consumption' : 'Average Rate'}
          </div>
          <div className="text-2xl font-bold text-gray-800">
            {selectedOption === 'consumption' 
              ? `${chartData.datasets[0].data.reduce((a, b) => a + b, 0).toFixed(1)} kWh`
              : `$${(chartData.datasets[0].data.reduce((a, b) => a + b, 0) / chartData.datasets[0].data.length).toFixed(2)}/kWh`
            }
          </div>
        </div>
        <div className="bg-gray-100 rounded-lg p-4 mt-2 w-full">
          <div className="text-sm text-gray-600 font-medium">
            {selectedOption === 'consumption' ? 'Peak Usage' : 'Peak Rate'}
          </div>
          <div className="text-2xl font-bold text-gray-800">
            {selectedOption === 'consumption'
              ? `${Math.max(...chartData.datasets[0].data)} kWh`
              : `$${Math.max(...chartData.datasets[0].data)}/kWh`
            }
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default EnergyChart; 