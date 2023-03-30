import { useCallback } from "react"
import { AreaStack, Line, Bar } from "@visx/shape"
import { scaleLinear, scaleOrdinal } from "@visx/scale"
import { AxisBottom, AxisLeft, Axis } from "@visx/axis"
import { min, max, format } from "d3"
import { LegendOrdinal, LegendLabel, LegendItem } from "@visx/legend"
import { localPoint } from "@visx/event"
import { useTooltip, TooltipWithBounds, defaultStyles } from "@visx/tooltip"
import { motion } from "framer-motion"
import { useState } from "react"
import { demographics } from "./demographics"
import { ParentSize } from "@visx/responsive"

let keys = demographics.map((row) => row.country)
keys = [...new Set(keys)]

export default function AreaChartWrapper() {
  const [active, setActive] = useState("Japan")

  return (
    <div style={{ marginBottom: 80, width: "100%" }}>
      <h2 className='text-lg'>Share of population by age group</h2>
      <p style={{ margin: "10px 0px" }}>Select a country</p>
      <div className='flex gap-1 flex-wrap'>
        {keys.map((key) => (
          <button
            className='px-2 py-1 border border-white'
            key={key}
            onClick={() => setActive(key)}
          >
            {key}
          </button>
        ))}
      </div>
      <div className='h-[500px] w-full relative'>
        <ParentSize>
          {({ width, height }) => (
            <AreaChart
              data={demographics.filter((row) => row.country === active)}
              width={width}
              height={height}
            />
          )}
        </ParentSize>
      </div>
    </div>
  )
}

const tooltipStyles = {
  ...defaultStyles,
  border: "1px solid #a7a9be",
  color: "black",
  fontSize: "1rem",
  margin: 0,
  padding: "0 0.5rem 0.5rem 0.5rem",
}

const AreaChart = ({
  data,
  width,
  height,
  margin = { top: 40, bottom: 30, left: 50, right: 20 },
}: any) => {
  // create dimensions
  const innerWidth = width - margin.left - margin.right
  const innerHeight = height - margin.top - margin.bottom
  const legendGlyphSize = 10

  // create accessor functions
  const x = (d: any) => d.year
  const y0 = (d: any) => d[0]
  const y1 = (d: any) => d[1]

  const keys = Object.keys(data[0]).filter(
    (k) => k !== "iso2c" && k !== "country" && k !== "year"
  )

  // create scales
  const xScale = scaleLinear({
    range: [margin.left, innerWidth + margin.left],
    //@ts-ignore
    domain: [min(data, x), max(data, x)],
  })

  const yScale = scaleLinear({
    range: [innerHeight + margin.top, margin.top],
  })

  const fillScale = scaleOrdinal({
    domain: keys,
    range: ["#045A8D", "#2B8CBE", "#74A9CF", "#BDC9E1", "#F1EEF6"],
  })

  const {
    showTooltip,
    hideTooltip,
    tooltipData,
    tooltipTop = 0,
    tooltipLeft = 0,
  } = useTooltip()

  // event handler
  const handleTooltip = useCallback(
    (event: any) => {
      const { x } = localPoint(event) || { x: 0 }
      let x0 = xScale.invert(x)
      x0 = Math.round(x0)

      // for mobile, prevents tooltip from crashing the app
      if (x0 > 2020) x0 = 2020
      if (x0 < 1960) x0 = 1960

      const d = data.filter((d: any) => d.year === x0)
      const { y } = localPoint(event) || { y: 0 }

      showTooltip({
        tooltipData: d,
        tooltipLeft: xScale(x0),
        tooltipTop: y,
      })
    },
    [data, showTooltip, xScale]
  )

  return (
    <>
      <LegendOrdinal scale={fillScale}>
        {(labels) => (
          <>
            <p className='mt-1'>Age group</p>
            <div className='grid grid-cols-5 text-sm'>
              {labels.map((label, i) => (
                <LegendItem key={`${label}-${i}`}>
                  <svg width={legendGlyphSize} height={legendGlyphSize}>
                    <rect
                      fill={label.value}
                      width={legendGlyphSize}
                      height={legendGlyphSize}
                    />
                  </svg>
                  <LegendLabel style={{ margin: `0 0 0 2px` }} align='left'>
                    {label.text}
                  </LegendLabel>
                </LegendItem>
              ))}
            </div>
          </>
        )}
      </LegendOrdinal>
      <svg height={height} width={width}>
        <AreaStack
          top={margin.top}
          left={margin.left}
          data={data}
          keys={keys}
          x={(d) => xScale(x(d.data))}
          y0={(d) => yScale(y0(d))}
          y1={(d) => yScale(y1(d))}
        >
          {({ stacks, path }) =>
            stacks.map((stack) => (
              <motion.path
                initial={false}
                //@ts-ignore
                animate={{ d: path(stack) }}
                key={`stack-${stack.key}`}
                stroke={fillScale(stack.key)}
                strokeWidth={0.5}
                fill={fillScale(stack.key)}
              />
            ))
          }
        </AreaStack>
        <AxisLeft
          scale={yScale}
          left={margin.left}
          tickStroke='#a7a9be'
          stroke='#a7a9be'
          tickFormat={format(".0%")}
        />
        <Axis
          orientation='top'
          scale={xScale}
          top={margin.top}
          tickFormat={format("d")}
          tickStroke='#a7a9be'
          stroke='#a7a9be'
          numTicks={innerWidth > 500 ? 10 : 5}
        />
        <AxisBottom
          scale={xScale}
          top={innerHeight + margin.top}
          tickFormat={format("d")}
          tickStroke='#a7a9be'
          stroke='#a7a9be'
          numTicks={innerWidth > 500 ? 10 : 5}
        />
        <Bar
          x={margin.left}
          y={margin.top}
          width={innerWidth}
          height={innerHeight}
          fill='transparent'
          rx={14}
          onTouchStart={handleTooltip}
          onTouchMove={handleTooltip}
          onMouseMove={handleTooltip}
          onMouseLeave={() => hideTooltip()}
        />
        {tooltipData && (
          <g>
            <Line
              from={{ x: tooltipLeft, y: margin.top }}
              to={{ x: tooltipLeft, y: innerHeight + margin.top }}
              stroke='black'
              opacity={0.5}
              strokeWidth={1}
              pointerEvents='none'
            />
          </g>
        )}
      </svg>
      {tooltipData && (
        <TooltipWithBounds
          key={Math.random()}
          top={tooltipTop - 12}
          left={tooltipLeft + 12}
          style={tooltipStyles}
        >
          <div>
            {/* @ts-ignore  */}
            <p>{tooltipData[0].year}</p>
            {[...keys].reverse().map((key, i) => (
              <div
                className='grid grid-cols-3 items-center text-xs'
                key={`tooltip${i}`}
              >
                <div
                  className='rounded-full'
                  style={{
                    width: "15px",
                    height: "15px",
                    background: fillScale(key),
                  }}
                />
                <div>{key}</div>
                <div className='text-right'>
                  {/* @ts-ignore  */}
                  {format(".0%")(tooltipData[0][key])}
                </div>
              </div>
            ))}
          </div>
        </TooltipWithBounds>
      )}
    </>
  )
}
