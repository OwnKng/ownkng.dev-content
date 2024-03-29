---
url: data-viz-react
title: Data visualisation in React
published: 2021-01-04
description: Getting started with visx, a data visualisation library from Airbnb
img: https://res.cloudinary.com/dqrv3tasx/image/upload/v1679512337/DataViz_u4jtqv.png
editLink: https://github.com/OwnKng/ownkng.dev-content/blob/main/articles/data-viz-react/data-viz-react.md
tags:
  - Data viz
---

<iframe src='https://components.ownkng.dev/scatterplot'></iframe>

Powerful visualisation libraries in JavaScript are surprisingly few in number. While popular charting libraries like [Chart.js](https://www.chartjs.org/) and [Plotly](https://plotly.com/graphing-libraries/) offer good functionality, they're relatively limited in the types of visualisations they support and the extent to which they can be customised.

[D3](https://d3js.org/) is often the tool of choice for anyone creating more intricate and crafted data visualisations for the web. However, D3 is a notoriously challenging library to master and, because much of its functionality is centered on manipulating the DOM, it's difficult to integrate D3 into a React application.

### visx: an expressive visualisation library from Airbnb

Enter [visx](https://airbnb.io/visx/), a collection of low-level visualisation primitives for React developed by Airbnb. Though much of visx is built on D3, the library delegates DOM management to React and uses D3 only for mathematical calculations.

Visx isn't a charting library. It doesn't provide any chart components to simply supply data to. Instead, it offers a collections of geometry components, like lines, bars or arcs, that can be used to construct visualisations. Consequently, visx has a very declarative syntax that will be familiar to any React developer.

Visx does, however, provide several high level components and functions to handle things like tooltips, legends or making charts responsive - all of which are very time-consuming to code manually.

The upshot of this is that visx is highly expressive. It allows developers to combine arbitrary collections of geometries and scales to create any visualisation they can imagine, while also being much easier to learn than D3.

# Creating a scatter plot with visx

To show this in practice, we'll create a scatter plot, based on the fantastic [Gapminder chart](https://s3-eu-west-1.amazonaws.com/static.gapminder.org/GapminderMedia/wp-uploads/20161215212516/countries_health_wealth_2016_v151.pdf) of GDP per capita and life expectancy. The data we're going to use comes from the [WorldBank Open Data](https://data.worldbank.org/) portal. The completed visualisation, code and data are all available [here](https://codesandbox.io/s/objective-snow-txbsr?file=/src/App.js).

There are a few things to note about this chart before we start writing any code. First, the x axis is a logarithmic scale. This is necessary to discern the significant variation in GDP per capita (particularly at the lower ends of the scale), which would be lost using an arithmetic scale. For readability, the x axis labels are repeated on both the bottom and top of the chart.

Each point represents a country. The radius of the point is proportional to the country's population and the color shows which world region it is located in. We have a tooltip, which snaps to the closest country to the cursor or touch position. The chart is also responsive and will rescale when we adjust the size of the browser window.

### Installing the visx packages

Let's create a new React application. Run `npx create-react-app visx-scatterplot` to get started.

Airbnb have released visx as several different packages, which can be used together depending on your use case. We'll be using quite a few of these packages for our visualisation. We can either run the following command to install each one of these packages

```bash
npm install @visx/scale @visx/legend @visx/group @visx/shape @visx/axis @visx/grid @visx/tooltip @visx/event @visx/voronoi
```

or we can install all the visx packages by running

```bash
npm install @visx/visx
```

We're also going to be using a couple functions from D3 too, so we'll also need to run the following command:

```bash
npm install d3
```

After these libraries have been installed, create a new file called _ScatterPlot.js_ in the _/src_ folder.

## Creating a visx visualisation in four steps

When designing a chart with visx, I've found it helpful to divide the process into four fundamental stages that we repeat for all our projects: setting the chart dimensions; creating accessor functions to select our data; creating scales to translate our data into coordinates; and then returning the visualisation.

After we've been through these stages, we can then work on any elements that are more specific to a particular visualisation, like adding a tooltip or applying specific stylings.

### Step 1: Set chart dimensions

We're going to write a [function component](https://reactjs.org/docs/components-and-props.html) to return our scatter plot. This component will take three props to help set the dimensions of our visualisation - width, height and margin. We'll provide sensible defaults in our component.

We'll then create two new variables - `innerWidth` and `innerHeight` - which we'll use in our scales and to the dimensions of our chart's plot area.

```jsx
import React from "react"
import { wbData } from "./worldBankData.js"

const ScatterPlot = ({
  data = wbData,
  width = 800,
  height = 500,
  margin = { top: 30, left: 60, right: 40, bottom: 40 },
}) => {
  const innerWidth = width - margin.left - margin.right
  const innerHeight = height - margin.top - margin.bottom

  return <svg width={width} height={height}></svg>
}

export default ScatterPlot
```

### Step 2: Create accessor functions

We'll now want to create some accessor functions to allow us to access the variables in our data that we want to visualise. Our chart will have GDP per capita on the x axis, and life expectancy on the y axis.

Our data is an array of objects with keys for 'gdpPerCap' and 'lifeExpectancy'. Our accessor functions will extract the values for these keys when we provide them with an array.

Let's create our accessor functions for our x and y variables.

```jsx
const x = (d) => d.gdpPerCap
const y = (d) => d.lifeExpectancy
```

We'll also create two additional accessor functions to scale the radius of our points, and to color them according to world region.

```jsx
const radius = (d) => d.population
const color = (d) => d.region
```

### Step 3: Create scales

We're going to use several different scales in our visualisation - a logarithmic scale for our x axis; a linear scale for our y axis; a square root scale for our radius; and an ordinal scale for our colors.

The `@visx/scale` package provides functions to create each of these scales.[^1] We simply provide these functions with the _range_ of the scale in pixels and the data we want to scale, referred to as the _domain_. We'll also use [`extent()`](https://observablehq.com/@d3/d3-extent) function from D3, which extracts the minimum and maximum value from our data.

Let's first add the following import statements to the top of the _ScatterPlot.js_ file.

```jsx
import { scaleLinear, scaleLog, scaleSqrt, scaleOrdinal } from "@visx/scale"
import { extent } from "d3"
```

We can now use these functions to create our scales.

```jsx
const xScale = scaleLog({
  range: [margin.left, innerWidth + margin.left],
  domain: extent(data, x),
})

const yScale = scaleLinear({
  range: [innerHeight + margin.top, margin.top],
  domain: extent(data, y),
  nice: true,
})

const colorScale = scaleOrdinal({
  range: ["#ff8906", "#3da9fc", "#ef4565", "#7f5af0", "#2cb67d"],
  domain: [...new Set(data.map(color))],
})

const rScale = scaleSqrt({
  range: [3, 30],
  domain: extent(data, radius),
})
```

### Step 4: Return the visualisation

With a scatter plot, the geometry we're mapping our data to are points. Visx provides a `<Circle />` component, which we'll need to import. We'll also import the `<Group />` component, which will act as a single container for all of our points.

```jsx
import { Circle } from "@visx/shape"
import { Group } from "@visx/group"
```

We can now add a map method inside our `<svg>` element to return a circle for every item in our array (i.e. each country).

```jsx
return (
  <svg width={innerWidth} height={innerHeight}>
    <Group pointerEvents='none'>
      {data.map((point, i) => (
        <Circle
          key={i}
          cx={xScale(x(point))}
          cy={yScale(y(point))}
          r={rScale(radius(point))}
          fill={colorScale(color(point))}
          fillOpacity={0.8}
        />
      ))}
    </Group>
  </svg>
)
```

### Add axes

Our scatter plot component now returns a set of points mapped to our data. However, we can't yet read the values of the points because our visualisation has no axes. We can fix this using the `<Axis />` components that visx provides.

Let's add the following import statements to the top of the _ScatterPlot.js_ file.

```jsx
import { Axis, AxisLeft } from "@visx/axis"
```

We'll also want to import the [`format()`](https://observablehq.com/@d3/d3-format) function from D3 to make our axis labels more readable.

```jsx
import { extent, format } from "d3"
```

Now we can add our axes to our return statement.

```jsx
return (
  <svg width={width} height={height}>
    <AxisLeft scale={yScale} left={margin.left} label='Life expectancy' />
    <Axis
      orientation='top'
      scale={xScale}
      top={margin.top}
      tickFormat={format("$~s")}
      numTicks={2}
      tickStroke='transparent'
      stroke='transparent'
    />
    <Axis
      orientation='bottom'
      scale={xScale}
      top={innerHeight + margin.top}
      tickFormat={format("$~s")}
      numTicks={2}
      label='GDP per cap'
    />
    ...
  </svg>
)
```

### Add grid lines

To make the chart more readable, we'll also want to add some grid lines along the x axis. As before, we'll import the desired component from the visx library and modify our return statement.

```jsx
import { GridColumns } from "@visx/grid"
```

We'll add these `<GridColumns />` to our return statement.

```jsx
return (
  <svg width={width} height={height}>
    ...
    <GridColumns
      top={margin.top}
      scale={xScale}
      height={innerHeight}
      strokeOpacity={0.3}
      pointerEvents='none'
      numTicks={2}
    />
    ...
  </svg>
)
```

### Add the legend\*\*

We're still missing the legend to match the color of our points to regions. To do this, we'll import the `<LegendOrdinal>` components from the `@visx/legend` library.

```jsx
import { LegendOrdinal } from "@visx/legend"
```

We'll can then modify our return statement to include the legend. Note that the legend is separate to the `<svg>` element where are visualisation is contained. This means we'll need to wrap our whole component in a React fragment.

```jsx
return (
  <>
  <LegendOrdinal
    scale={colorScale}
    direction="row"
    shape="circle"
    style={{
      display: "flex",
      justifyContent: "space-around"
      }}
    />
    <svg width={width} height={height}>
    ...
  </>
);
```

We now have a reasonably good visualisation. However, looking closely at the points, we can see that countries with large populations like India and China are partially obscuring countries with smaller populations, but similar life expectancies and GDP per capita figures.

To resolve this, we need to plot our data in a specific order - placing the countries with the bigger populations at the back, and those with the smallest populations at the front. We can do this simply using the `sort()` method on our data array before we return our our visualisation.

```jsx
data = data.sort((a, b) => b.population - a.population);

return (
  ...
)
```

This will rearrange our data by population, so the more populous nations are the first to be plotted.

## Making the chart responsive

At the moment, the dimensions of our scatter plot are fixed. We want to ensure that the chart scales to different screen sizes.

Again, this is easy to accomplish with visx. We simply need to wrap our ScatterPlot component in a `<ParentSize />` component.

Let's import the `<ParentSize />` component with the following statement.

```jsx
import ParentSize from "@visx/responsive/lib/components/ParentSize"
```

Now, underneath our ScatterPlot component, let's create a new function component called `ScatterPlotWrapper`.

```jsx
const ScatterPlotWrapper = () => (
  <ParentSize>
    {({ width, height }) => <ScatterPlot width={width} height={height} />}
  </ParentSize>
)
```

Let's also change our default export statement to export our wrapper, rather than our ScatterPlot.

```jsx
export default ScatterPlotWrapper
```

In our _App.js_ file, we can now provide dimensions to the containing div. Here, we've set the width to 100% - so the chart will fill the width of the reader's screen - while fixing the height at 600px.

Note that we've added `position: "relative"` here because it's necessary for the tooltip which we'll add shortly.

```jsx
export default function App() {
  return (
    <div
      style={{
        height: "600px",
        width: "100%",
        position: "relative",
      }}
    >
      <ScatterPlot />
    </div>
  )
}
```

## Creating a tooltip

Finally, let's add a tooltip to the chart to show users each country's GDP per capita, life expectancy and population when hovered over or touched.

Visx provides several utilities for adding tooltips to visualisations. To use these, we'll need to add the following import statements at the top of our _ScatterPlot.js_ file.

```jsx
import { useTooltip, TooltipWithBounds, defaultStyles } from "@visx/tooltip"
import { localPoint } from "@visx/event"
import { voronoi } from "@visx/voronoi"
```

We're also going to use several React hooks in our tooltip event handlers, and so will need to import these too.

```jsx
import { useRef, useMemo, useCallback } from "react"
```

`@visx/tooltip` provides a custom React hook, `useTooltip()`, which returns an object with several properties that we'll use to manage our tooltip's data, position and visibility.

Our tooltip will also rely on tracking the state of our SVG directly, so we'll create a ref using the `useRef()` hook, which we'll add to our return statement later.

```jsx
const {
  showTooltip,
  hideTooltip,
  tooltipData,
  tooltipOpen,
  tooltipTop = 0,
  tooltipLeft = 0,
} = useTooltip()

const svgRef = useRef(null)
```

Our tooltip will rely on a [Voronoi](https://en.wikipedia.org/wiki/Voronoi_diagram) partition of the chart area, which allows us to find the closest point to hover position. A Voronoi partition is are a way of separating a plane into a series of regions defined by the location of a set of points. In a Voronoi diagram, every point is surrounded by a region that covers the area of the plane that is closer to that point than any other.

Let's create our Voronoi diagram by adding the following code inside our `<ScatterPlot />` component.

```jsx
const voronoiLayout = useMemo(
  () =>
    voronoi({
      x: (d) => xScale(x(d)) ?? 0,
      y: (d) => yScale(y(d)) ?? 0,
      width,
      height,
    })(data),
  [data, width, height, xScale, yScale]
)
```

When a user moves their cursor over the plot area of our chart, we want our component to return the Voronoi zone that defines the closest point.

To do this, we'll use the `localPoint()` function from the `@visx/event` package, which returns an object with the coordinates of the cursor position. We'll then use these coordinates in the `find()` method of our `voronoiLayout`. This method returns the data of the closest point to the cursor position, which we provide to `showTooltip()` function.

We'll also create a `tooltipTimeout` variable, which we'll use to display the tooltip only for a second or so after the user moves their cursor position off the chart area.

All of this is wrapped in a `useCallback()` hook. As our event handler is computationally expensive, wrapping it in `useCallback()` prevents unnecessary re-rendering when our `voronoiLayout` or tooltip haven't changed.

```jsx
let tooltipTimeout

const handleMouseMove = useCallback(
  (event) => {
    if (tooltipTimeout) clearTimeout(tooltipTimeout)
    if (!svgRef.current) return

    const point = localPoint(svgRef.current, event)
    if (!point) return
    const neighborRadius = 100
    const closest = voronoiLayout.find(point.x, point.y, neighborRadius)
    if (closest) {
      showTooltip({
        tooltipLeft: xScale(x(closest.data)),
        tooltipTop: yScale(y(closest.data)),
        tooltipData: closest.data,
      })
    }
  },
  [xScale, yScale, showTooltip, voronoiLayout, tooltipTimeout]
)
```

We'll also need an event handler for when the cursor position leaves the plot area. This function simply sets our `tooltipTimeout` variable to 1500ms and calls the `hideTooltip()` function.

```jsx
const handleMouseLeave = useCallback(() => {
  tooltipTimeout = window.setTimeout(() => {
    hideTooltip()
  }, 1500)
}, [hideTooltip])
```

### Adding our tooltip to our chart

To add our tooltip to our chart, we need to add our `svgRef` to our `<svg>` tag

```jsx
return (
  <svg width={width} height={height} ref={svgRef}>
  ...
)

```

and place a `<rect>` inside the `<svg>`. This `<rect>` fills the dimensions of the plot area and will detect when a mouse enters or leaves the chart.

```jsx
return (
  <svg width={width} height={height} ref={svgRef}>
    <rect
    x={margin.left}
    y={margin.top}
    width={innerWidth}
    height={innerHeight}
    fill="transparent"
    onMouseMove={handleMouseMove}
    onMouseLeave={handleMouseLeave}
    onTouchMove={handleMouseMove}
    onTouchEnd={handleMouseLeave}
  />
  ...
)
```

Below our closing `svg` tag, we now need to add the tooltip using the `<TooltipWithBounds />` component. This component also allows us to wrap any data we want to show and apply any arbitrary styles.

```jsx
{
  tooltipOpen && tooltipData && tooltipLeft != null && tooltipTop != null && (
    <TooltipWithBounds
      left={tooltipLeft + 10}
      top={tooltipTop + 10}
      style={defaultStyles}
    >
      <h3
        style={{
          color: colorScale(color(tooltipData)),
          paddding: 0,
          margin: 0,
        }}
      >
        {tooltipData.country}
      </h3>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gridTemplateRows: "1fr",
        }}
      >
        <div>GDP per cap</div>
        <div style={{ textAlign: "right" }}>{`${format("$.2~s")(
          x(tooltipData)
        )}`}</div>
        <div>Life Expectancy</div>
        <div style={{ textAlign: "right" }}>{Math.round(y(tooltipData))}</div>
        <div>Population</div>
        <div style={{ textAlign: "right" }}>{`${Math.round(
          radius(tooltipData)
        )}m`}</div>
      </div>
    </TooltipWithBounds>
  )
}
```

We'll also amend our `<Cicle />` components by applying a highlight effect to the point that that's returned by our tooltip. We can do this by adding some simple logic to the `stroke` attribute.

```jsx
<Circle
  key={i}
  cx={xScale(x(point))}
  cy={yScale(y(point))}
  r={rScale(radius(point))}
  fill={colorScale(color(point))}
  fillOpacity={0.8}
  stroke={tooltipData === point ? "black" : colorScale(color(point))}
/>
```

## Wrap up

The full code for our visualisation is available [here](https://codesandbox.io/s/objective-snow-txbsr?file=/src/App.js).

This may seem like a lot of code to produce a scatter plot. However, it's important to consider that many of the features of our chart (logarithmic scales, duplicated axes, custom tooltip behaviours) aren't well supported by other visualisation libraries.

The version of the chart that appears on this page also features text annotations (easily added with [@visx/text](https://airbnb.io/visx/docs/text)) and some custom styling. Again, these are features which are often difficult to achieve with other JavaScript libraries.

In theory, we could have built this visualisation using D3 - though not using a typical D3 workflow of selecting and appending data, because these methods aren't compatible with React's model of DOM manipulation. Moreover, constructing legends or positioning tooltips is often an agonisingly frustrating process in D3.

This really is where visx shines: visx is modular enough to create highly expressive data visualisations, but abstracts away much of the drudgery of things like responsiveness, legends or interaction. I'll certainly be using visx a lot in my own projects.

[^1]: visx's scale functions are actually wrappers around [D3's scale functions](https://observablehq.com/@d3/introduction-to-d3s-scales), but the syntax is a little cleaner.
