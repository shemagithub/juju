import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

type OverviewProps = {
  chartData?: { name: string; total: number }[]
  bookingsData?: { name: string; total: number }[]
}

function formatRwf(value: number) {
  return `${value.toLocaleString()} Rwf`
}

export function Overview({ chartData, bookingsData }: OverviewProps) {
  const hasRevenue = chartData && chartData.length > 0
  const hasBookings = bookingsData && bookingsData.length > 0

  if (!hasRevenue && !hasBookings) {
    return (
      <div className='text-muted-foreground flex h-[350px] flex-col items-center justify-center rounded-lg border border-dashed text-center text-sm'>
        <p>No revenue or booking history in the database yet.</p>
        <p className='mt-1 text-xs'>
          Charts populate automatically when you record bookings or payments.
        </p>
      </div>
    )
  }

  const data = hasRevenue ? chartData : bookingsData
  const dataKey = hasRevenue ? 'total' : 'total'
  const barLabel = hasRevenue ? 'Revenue' : 'Bookings'

  return (
    <ResponsiveContainer width='100%' height={350}>
      <BarChart data={data}>
        <XAxis
          dataKey='name'
          stroke='#888888'
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          direction='ltr'
          stroke='#888888'
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) =>
            hasRevenue
              ? typeof value === 'number'
                ? formatRwf(value)
                : String(value)
              : String(value)
          }
        />
        <Tooltip
          formatter={(value) => {
            const n = typeof value === 'number' ? value : Number(value ?? 0)
            return hasRevenue ? formatRwf(n) : `${n} bookings`
          }}
          labelFormatter={(label) => String(label)}
        />
        <Bar
          dataKey={dataKey}
          name={barLabel}
          fill='currentColor'
          radius={[4, 4, 0, 0]}
          className='fill-primary'
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
