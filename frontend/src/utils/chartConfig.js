export const getDefaultChartOptions = (title, chartType = 'line') => {
  const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            weight: '500'
          }
        }
      },
      title: {
        display: true,
        text: title,
        font: {
          size: 16,
          weight: 'bold'
        },
        color: '#1E293B',
        padding: {
          bottom: 20
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#319795',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context) {
            if (context.datasetIndex === 0) {
              return `Response Time: ${context.parsed.y}ms`;
            } else if (context.datasetIndex === 1) {
              return `Status: ${context.parsed.y === 1 ? 'UP' : 'DOWN'}`;
            }
            return context.label;
          }
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    }
  };

  if (chartType === 'doughnut') {
    return {
      ...baseOptions,
      plugins: {
        ...baseOptions.plugins,
        legend: {
          position: 'bottom',
          labels: {
            usePointStyle: true,
            padding: 20,
            font: {
              size: 14,
              weight: '500'
            }
          }
        }
      }
    };
  }

  return {
    ...baseOptions,
    scales: {
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          drawBorder: false
        },
        ticks: {
          color: '#64748B',
          font: {
            size: 11
          }
        }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Response Time (ms)',
          color: '#64748B',
          font: {
            size: 12,
            weight: '500'
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          drawBorder: false
        },
        ticks: {
          color: '#64748B',
          font: {
            size: 11
          }
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Status',
          color: '#64748B',
          font: {
            size: 12,
            weight: '500'
          }
        },
        grid: {
          drawOnChartArea: false,
        },
        min: 0,
        max: 1,
        ticks: {
          stepSize: 1,
          color: '#64748B',
          font: {
            size: 11
          },
          callback: function(value) {
            return value === 1 ? 'UP' : 'DOWN';
          }
        }
      }
    }
  };
};

export const prepareResponseTimeChartData = (checks, timeFilter) => {
  if (!checks || checks.length === 0) return null;

  const sortedChecks = [...checks].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  
  const labels = sortedChecks.map(check => {
    const date = new Date(check.created_at);
    if (timeFilter === '1-hour') {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (timeFilter === '24-hours') {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  });

  const responseTimeData = sortedChecks.map(check => check.response_time);
  const statusData = sortedChecks.map(check => check.status === 'UP' ? 1 : 0);

  return {
    labels,
    datasets: [
      {
        label: 'Response Time (ms)',
        data: responseTimeData,
        borderColor: '#319795',
        backgroundColor: 'rgba(49, 151, 149, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#319795',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Status',
        data: statusData,
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 2,
        fill: false,
        yAxisID: 'y1',
        pointBackgroundColor: '#10B981',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      }
    ]
  };
};

export const prepareStatusDistributionData = (checks) => {
  if (!checks || checks.length === 0) return null;

  const upCount = checks.filter(check => check.status === 'UP').length;
  const downCount = checks.filter(check => check.status === 'DOWN').length;

  return {
    labels: ['UP', 'DOWN'],
    datasets: [
      {
        data: [upCount, downCount],
        backgroundColor: ['#10B981', '#EF4444'],
        borderColor: ['#059669', '#DC2626'],
        borderWidth: 2,
        hoverBackgroundColor: ['#059669', '#DC2626'],
        hoverBorderWidth: 3,
      }
    ]
  };
};
